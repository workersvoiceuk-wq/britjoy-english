// «Inglés para el día a día» · checkout por oferta con el handler REAL (vidaDiariaCheckout, el mismo que usa
// billing-checkout) y dobles sin red: un Stripe que respeta claves de idempotencia y estados de sesión, y una fila de
// course_checkout con bloqueo por alumno. Reproduce el hallazgo de ChatGPT (sesión abierta de una oferta devuelta para
// la otra) y cubre los dos sentidos, la misma oferta repetida, el cambio explícito, la concurrencia y los reintentos.
import { describe, expect, it } from 'vitest';
import { vidaDiariaCheckout, type BeginRow, type VdCheckoutDeps } from '../supabase/functions/_shared/vida-diaria-checkout';
import { planCheckout, type CheckoutState, type VdOffer } from '../supabase/functions/_shared/vida-diaria';

const P12 = 'price_test_vd_curso_12', P8 = 'price_test_vd_orientacion_8';
const ENV: Record<string, string> = {
  STRIPE_SECRET_KEY: 'sk_test_double_only', STRIPE_PRICE_VIDA_DIARIA: P12, STRIPE_PRICE_VIDA_DIARIA_ORIENTACION: P8, VIDA_DIARIA_ORIENTACION: 'on',
};
const PRICE = (id: string, amount: number) => ({ id, active: true, type: 'recurring', currency: 'gbp', unit_amount: amount, tax_behavior: 'inclusive', recurring: { interval: 'month', interval_count: 1, usage_type: 'licensed' } });

interface Session { id: string; url: string; status: 'open' | 'expired' | 'complete'; expires_at: number; lines: string[]; key: string }

interface WorldOptions {
  /** Number of record_course_checkout writes that fail (the RPC returns an error without throwing). */
  failRecord?: number;
  /** Number of expire calls that fail (network error). */
  failExpire?: number;
  /** When set, the first createSession waits until gate.release() is called (a provider that answers late). */
  gate?: { promise: Promise<void>; release: () => void };
  /** Number of createSession calls that fail before reaching Stripe (provider error). */
  failCreate?: number;
  /** Seed of the deterministic latency generator. */
  seed?: number;
}
const gate = () => { let release!: () => void; const promise = new Promise<void>((r) => (release = r)); return { promise, release }; };

function world(start = 1_794_000_000_000, opts: WorldOptions = {}) {
  let clock = start;
  let failRecord = opts.failRecord ?? 0, failExpire = opts.failExpire ?? 0, failCreate = opts.failCreate ?? 0, gated = Boolean(opts.gate);
  let seed = opts.seed ?? 1; // deterministic latency (LCG): the same seed always gives the same interleaving
  const rand = () => ((seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648) / 2_147_483_648);
  const sessions: Session[] = [];
  const byKey = new Map<string, Session>();
  const rows = new Map<string, CheckoutState>();
  let lock: Promise<void> = Promise.resolve();
  const serialised = async <T>(fn: () => T): Promise<T> => {
    let release!: () => void; const prev = lock; lock = new Promise((r) => (release = r)); await prev;
    try { return fn(); } finally { release(); }
  };
  const latency = () => new Promise((r) => setTimeout(r, rand() * 4));
  const deps = (user: string): VdCheckoutDeps => ({
    env: (n) => ENV[n],
    user: { id: user, email: `${user}@example.com` },
    returnUrl: 'https://vozunidamundo.test/britjoy-english/vida-diaria/',
    automaticTax: false,
    stripe: {
      retrievePrice: async (id) => (id === P12 ? PRICE(P12, 1200) : PRICE(P8, 800)),
      // Like Stripe: the same idempotency key replays the ORIGINAL response (status 'open' even if it expired since).
      createSession: async (params, key) => {
        await latency();
        if (failCreate > 0) { failCreate--; throw new Error('provider error'); }
        let hit = byKey.get(key);
        if (!hit) {
          const lines = (params.line_items as Array<{ price: string }>).map((l) => l.price);
          hit = { id: `cs_test_${sessions.length + 1}`, url: `https://checkout.stripe.test/${sessions.length + 1}/${lines.length === 2 ? '20' : '12'}`, status: 'open', expires_at: Math.floor(clock / 1000) + 3600, lines, key };
          sessions.push(hit); byKey.set(key, hit);
        }
        if (gated) { gated = false; await opts.gate!.promise; }
        return { id: hit.id, url: hit.url, expires_at: hit.expires_at, status: 'open' };
      },
      retrieveSession: async (id) => {
        const s = sessions.find((x) => x.id === id)!;
        if (s.status === 'open' && s.expires_at * 1000 <= clock) s.status = 'expired';
        return { id: s.id, url: s.url, expires_at: s.expires_at, status: s.status };
      },
      expireSession: async (id) => {
        if (failExpire > 0) { failExpire--; throw new Error('network'); }
        const s = sessions.find((x) => x.id === id)!;
        if (s.status === 'open') s.status = 'expired';
        return { status: s.status };
      },
    },
    db: {
      access: async () => ({ row: null }),
      // Same rule as SQL begin_course_checkout, with the row lock.
      begin: (offer) => serialised(() => {
        const state = rows.get(user) ?? null;
        const plan = planCheckout(user, state, offer, clock);
        const held = (state?.offer ?? (state ? 'curso' : offer)) as VdOffer;
        if (plan.action === 'conflict') return { row: { action: 'conflict', attempt: state!.attempt, url: null, offer: plan.offer, session_id: plan.session, reason: plan.reason } as BeginRow };
        if (plan.action === 'reuse') return { row: { action: 'reuse', attempt: state!.attempt, url: plan.url, offer: held, session_id: state!.session_id, reason: null } as BeginRow };
        const fresh = !state || state.attempt !== plan.attempt;
        rows.set(user, fresh
          ? { attempt: plan.attempt, session_id: null, url: null, expires_at: null, offer, updated_at: new Date(clock).toISOString() }
          : { ...state!, offer, updated_at: state!.offer === offer ? state!.updated_at : new Date(clock).toISOString() });
        return { row: { action: 'create', attempt: plan.attempt, url: null, offer, session_id: null, reason: null } as BeginRow };
      }),
      record: (attempt, offer, s) => serialised(() => {
        if (failRecord > 0) { failRecord--; return false; } // RPC error: nothing written
        const row = rows.get(user);
        if (!row || row.attempt !== attempt || (row.offer ?? 'curso') !== offer) return false;
        rows.set(user, { ...row, session_id: s.id, url: s.url, expires_at: s.expires, updated_at: new Date(clock).toISOString() });
        return true;
      }),
      release: (session) => serialised(() => {
        const row = rows.get(user);
        if (row && row.session_id === session) rows.set(user, { ...row, expires_at: new Date(clock - 1000).toISOString() });
      }),
    },
  });
  return {
    sessions, rows,
    post: (user: string, offer: VdOffer | undefined, replace?: boolean) => vidaDiariaCheckout({ offer, ...(replace ? { replace: true } : {}) }, deps(user)),
    advance: (ms: number) => { clock += ms; },
    /** Sessions a learner could still pay. */
    open: () => sessions.filter((s) => s.status === 'open' && s.expires_at * 1000 > clock),
  };
}

/** The invariant: at most one payable session, and any URL handed out is that session and is recorded in the row. */
function expectSinglePayable(w: ReturnType<typeof world>, user: string, handed?: unknown) {
  expect(w.open().length).toBeLessThanOrEqual(1);
  if (handed !== undefined) {
    const open = w.open();
    expect(open.map((s) => s.url)).toContain(handed);
    expect(w.rows.get(user)!.url).toBe(handed);
  }
}

describe('Vida Diaria · una sola sesión pagable por alumno, y solo para su oferta', () => {
  it('controles: cada oferta en limpio da su propio precio; repetir la misma oferta reutiliza la sesión', async () => {
    const w = world();
    const a = await w.post('ana', 'curso');
    expect(a).toMatchObject({ status: 200, body: { offer: 'curso' } });
    expect(String(a.body.url)).toMatch(/\/12$/);
    expect(await w.post('ana', 'curso')).toMatchObject({ status: 200, body: { url: a.body.url, reused: true } });
    const b = await w.post('bea', 'curso_orientacion');
    expect(String(b.body.url)).toMatch(/\/20$/);
    expect(w.sessions.find((s) => s.url === b.body.url)!.lines).toEqual([P12, P8]);
    expect(w.sessions).toHaveLength(2);
  });

  it('curso abierto y luego curso_orientacion: 409 checkout_open, nunca la URL de £12', async () => {
    const w = world();
    const a = await w.post('ana', 'curso');
    const b = await w.post('ana', 'curso_orientacion');
    expect(b).toEqual({ status: 409, body: { error: 'checkout_open', offer: 'curso' } });
    expect(b.body.url).toBeUndefined();
    expect(w.sessions).toHaveLength(1);
    expect(await w.post('ana', 'curso')).toMatchObject({ status: 200, body: { url: a.body.url } });
  });

  it('orden inverso: curso_orientacion abierto y luego curso: 409, nunca la URL de £20', async () => {
    const w = world();
    await w.post('ana', 'curso_orientacion');
    expect(await w.post('ana', 'curso')).toEqual({ status: 409, body: { error: 'checkout_open', offer: 'curso_orientacion' } });
    expect(w.sessions).toHaveLength(1);
  });

  it('cambio explícito (replace): caduca la sesión anterior en Stripe y crea la nueva; sigue habiendo una sola abierta', async () => {
    const w = world();
    const a = await w.post('ana', 'curso');
    const b = await w.post('ana', 'curso_orientacion', true);
    expect(b.status).toBe(200);
    expect(String(b.body.url)).toMatch(/\/20$/);
    expect(w.sessions.find((s) => s.url === a.body.url)!.status).toBe('expired');
    expect(w.open()).toHaveLength(1);
    // Y volver al curso también exige el cambio explícito.
    expect(await w.post('ana', 'curso')).toEqual({ status: 409, body: { error: 'checkout_open', offer: 'curso_orientacion' } });
    const c = await w.post('ana', 'curso', true);
    expect(String(c.body.url)).toMatch(/\/12$/);
    expect(w.open()).toHaveLength(1);
  });

  it('cambio explícito cuando la sesión anterior ya se está pagando: 409 checkout_completing, sin sesión nueva', async () => {
    const w = world();
    await w.post('ana', 'curso');
    w.sessions[0].status = 'complete';
    expect(await w.post('ana', 'curso_orientacion', true)).toEqual({ status: 409, body: { error: 'checkout_completing', offer: 'curso' } });
    expect(w.sessions).toHaveLength(1);
  });

  it('concurrencia: 8 peticiones simultáneas mezclando ofertas → una sola sesión; nadie recibe la URL de la otra oferta', async () => {
    for (let round = 0; round < 25; round++) {
      const w = world(undefined, { seed: round + 1 });
      const offers: VdOffer[] = ['curso', 'curso_orientacion', 'curso', 'curso_orientacion', 'curso', 'curso', 'curso_orientacion', 'curso'];
      const results = await Promise.all(offers.map((o) => w.post('ana', o)));
      expect(w.sessions).toHaveLength(1);
      const winner = w.sessions[0];
      const winnerOffer = winner.lines.length === 2 ? 'curso_orientacion' : 'curso';
      results.forEach((r, i) => {
        if (offers[i] === winnerOffer) expect(r).toMatchObject({ status: 200, body: { url: winner.url } });
        else expect(r.status).toBe(409);
      });
    }
  });

  it('reintentos: la misma oferta repetida en paralelo y después recibe siempre la misma sesión', async () => {
    const w = world();
    const urls = await Promise.all(Array.from({ length: 6 }, () => w.post('ana', 'curso_orientacion')));
    expect(new Set(urls.map((u) => u.body.url)).size).toBe(1);
    expect(w.sessions).toHaveLength(1);
  });

  it('sesión caducada por Stripe: la otra oferta crea un intento nuevo sin conflicto', async () => {
    const w = world();
    await w.post('ana', 'curso');
    w.advance(3600_000 + 1000);
    const b = await w.post('ana', 'curso_orientacion');
    expect(b.status).toBe(200);
    expect(w.rows.get('ana')!.attempt).toBe(2);
  });

  it('una creación de otra oferta sin registrar: en curso durante 2 minutos; después se recupera, nunca se ignora', async () => {
    const w = world();
    w.rows.set('ana', { attempt: 1, session_id: null, url: null, expires_at: null, offer: 'curso', updated_at: new Date(1_794_000_000_000).toISOString() });
    expect(await w.post('ana', 'curso_orientacion')).toEqual({ status: 409, body: { error: 'checkout_in_progress', offer: 'curso' } });
    w.advance(2 * 60_000 + 1);
    // Nunca llegó a Stripe: la recuperación con su clave crea la sesión de «curso», se registra y la otra oferta espera.
    expect(await w.post('ana', 'curso_orientacion')).toEqual({ status: 409, body: { error: 'checkout_open', offer: 'curso' } });
    expectSinglePayable(w, 'ana');
    const c = await w.post('ana', 'curso_orientacion', true);
    expect(c.status).toBe(200);
    expectSinglePayable(w, 'ana', c.body.url);
  });

  it('otra cuenta no se ve afectada por la sesión abierta de Ana', async () => {
    const w = world();
    await w.post('ana', 'curso');
    expect((await w.post('bea', 'curso_orientacion')).status).toBe(200);
  });
});

describe('Vida Diaria · registro fallido, proveedor tardío y reintentos: nunca dos sesiones pagables (#issuecomment-6760045844)', () => {
  it('reproducción de ChatGPT: falla el primer registro, pasan 120001 ms y se pide la otra oferta', async () => {
    const w = world(undefined, { failRecord: 1 });
    const a = await w.post('ana', 'curso');
    expect(a).toEqual({ status: 503, body: { error: 'retry', detail: 'record' } }); // sin URL
    expect(w.rows.get('ana')!.session_id).toBeNull();
    expectSinglePayable(w, 'ana');
    expect(w.open()).toHaveLength(0); // la sesión no registrada se caducó
    w.advance(120_001);
    const b = await w.post('ana', 'curso_orientacion');
    expect(b.status).toBe(200);
    expect(String(b.body.url)).toMatch(/\/20$/);
    expectSinglePayable(w, 'ana', b.body.url);
  });

  it('falla el registro Y la caducidad: la otra oferta no se habilita; se recupera la sesión y se exige el cambio explícito', async () => {
    const w = world(undefined, { failRecord: 1, failExpire: 1 });
    expect((await w.post('ana', 'curso')).status).toBe(503);
    expect(w.open()).toHaveLength(1); // quedó abierta en Stripe, pero sin URL entregada
    w.advance(120_001);
    expect(await w.post('ana', 'curso_orientacion')).toEqual({ status: 409, body: { error: 'checkout_open', offer: 'curso' } });
    expect(w.rows.get('ana')!.session_id).toBe(w.sessions[0].id); // recuperada con su clave y registrada
    expectSinglePayable(w, 'ana');
    const c = await w.post('ana', 'curso_orientacion', true);
    expect(c.status).toBe(200);
    expectSinglePayable(w, 'ana', c.body.url);
    expect(w.sessions[0].status).toBe('expired');
  });

  it('dentro de los 2 minutos, la otra oferta espera (checkout_in_progress) y no crea nada', async () => {
    const w = world(undefined, { failRecord: 1, failExpire: 1 });
    await w.post('ana', 'curso');
    w.advance(60_000);
    expect(await w.post('ana', 'curso_orientacion')).toEqual({ status: 409, body: { error: 'checkout_in_progress', offer: 'curso' } });
    expect(w.sessions).toHaveLength(1);
  });

  it('reintento de la misma oferta tras un registro fallido: la sesión caducada no se reutiliza; se abre un intento nuevo', async () => {
    const w = world(undefined, { failRecord: 1 });
    expect((await w.post('ana', 'curso')).status).toBe(503);
    const again = await w.post('ana', 'curso');
    expect(again.status).toBe(200);
    expect(w.rows.get('ana')!.attempt).toBe(2);
    expectSinglePayable(w, 'ana', again.body.url);
    expect(again.body.url).not.toBe(w.sessions[0].url);
  });

  it('reintento de la misma oferta tras un registro fallido sin caducidad confirmada: recupera la MISMA sesión', async () => {
    const w = world(undefined, { failRecord: 1, failExpire: 1 });
    expect((await w.post('ana', 'curso')).status).toBe(503);
    const again = await w.post('ana', 'curso');
    expect(again).toMatchObject({ status: 200, body: { url: w.sessions[0].url } });
    expect(w.sessions).toHaveLength(1);
    expectSinglePayable(w, 'ana', again.body.url);
  });

  it('proveedor tardío: la otra oferta llega a los 2 minutos, recupera la sesión pendiente y espera; luego la primera termina bien', async () => {
    const g = gate();
    const w = world(undefined, { gate: g });
    const first = w.post('ana', 'curso'); // se queda esperando la respuesta del proveedor
    await new Promise((r) => setTimeout(r, 10));
    w.advance(120_001);
    expect(await w.post('ana', 'curso_orientacion')).toEqual({ status: 409, body: { error: 'checkout_open', offer: 'curso' } });
    g.release();
    const a = await first;
    expect(a.status).toBe(200);
    expect(w.sessions).toHaveLength(1);
    expectSinglePayable(w, 'ana', a.body.url);
  });

  it('proveedor tardío con cambio explícito: la primera petición ya no entrega su URL caducada', async () => {
    const g = gate();
    const w = world(undefined, { gate: g });
    const first = w.post('ana', 'curso');
    await new Promise((r) => setTimeout(r, 10));
    w.advance(120_001);
    const b = await w.post('ana', 'curso_orientacion', true);
    expect(b.status).toBe(200);
    g.release();
    const a = await first;
    expect(a.status).toBe(503); // su intento ya no es el de la fila: no se entrega
    expect(a.body.url).toBeUndefined();
    expectSinglePayable(w, 'ana', b.body.url);
  });

  it('error del proveedor al crear: 503 sin URL ni sesión; el siguiente intento recupera con la misma clave', async () => {
    const w = world(undefined, { failCreate: 1 });
    expect(await w.post('ana', 'curso')).toEqual({ status: 503, body: { error: 'retry', detail: 'provider' } });
    expect(w.sessions).toHaveLength(0);
    const again = await w.post('ana', 'curso');
    expect(again.status).toBe(200);
    expect(w.rows.get('ana')!.attempt).toBe(1);
    expectSinglePayable(w, 'ana', again.body.url);
  });

  it('25 rondas: dos ofertas simultáneas con el primer registro fallando; nunca dos sesiones pagables', async () => {
    for (let round = 0; round < 25; round++) {
      const w = world(undefined, { failRecord: 1, seed: round + 1 });
      const offers: VdOffer[] = ['curso', 'curso_orientacion', 'curso', 'curso_orientacion'];
      const results = await Promise.all(offers.map((o) => w.post('ana', o)));
      expectSinglePayable(w, 'ana');
      for (const r of results) if (r.status === 200) expectSinglePayable(w, 'ana', r.body.url);
      w.advance(120_001);
      const late = await Promise.all(offers.map((o) => w.post('ana', o)));
      expectSinglePayable(w, 'ana');
      for (const r of late) if (r.status === 200) expectSinglePayable(w, 'ana', r.body.url);
    }
  });
});
