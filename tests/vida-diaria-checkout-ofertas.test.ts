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

function world(start = 1_794_000_000_000) {
  let clock = start;
  const sessions: Session[] = [];
  const byKey = new Map<string, Session>();
  const rows = new Map<string, CheckoutState>();
  let lock: Promise<void> = Promise.resolve();
  const serialised = async <T>(fn: () => T): Promise<T> => {
    let release!: () => void; const prev = lock; lock = new Promise((r) => (release = r)); await prev;
    try { return fn(); } finally { release(); }
  };
  const latency = () => new Promise((r) => setTimeout(r, Math.random() * 4));
  const deps = (user: string): VdCheckoutDeps => ({
    env: (n) => ENV[n],
    user: { id: user, email: `${user}@example.com` },
    returnUrl: 'https://vozunidamundo.test/britjoy-english/vida-diaria/',
    automaticTax: false,
    stripe: {
      retrievePrice: async (id) => (id === P12 ? PRICE(P12, 1200) : PRICE(P8, 800)),
      createSession: async (params, key) => {
        await latency();
        const hit = byKey.get(key);
        if (hit) return { id: hit.id, url: hit.url, expires_at: hit.expires_at };
        const lines = (params.line_items as Array<{ price: string }>).map((l) => l.price);
        const s: Session = { id: `cs_test_${sessions.length + 1}`, url: `https://checkout.stripe.test/${sessions.length + 1}/${lines.length === 2 ? '20' : '12'}`, status: 'open', expires_at: Math.floor(clock / 1000) + 3600, lines, key };
        sessions.push(s); byKey.set(key, s);
        return { id: s.id, url: s.url, expires_at: s.expires_at };
      },
      expireSession: async (id) => {
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
        const row = rows.get(user);
        if (row && row.attempt === attempt && (row.offer ?? 'curso') === offer) rows.set(user, { ...row, session_id: s.id, url: s.url, expires_at: s.expires, updated_at: new Date(clock).toISOString() });
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
    open: () => sessions.filter((s) => s.status === 'open' && s.expires_at * 1000 > clock),
  };
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
      const w = world();
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

  it('una creación de otra oferta que nunca se registró deja de bloquear a los 2 minutos', async () => {
    const w = world();
    w.rows.set('ana', { attempt: 1, session_id: null, url: null, expires_at: null, offer: 'curso', updated_at: new Date(1_794_000_000_000).toISOString() });
    expect(await w.post('ana', 'curso_orientacion')).toEqual({ status: 409, body: { error: 'checkout_in_progress', offer: 'curso' } });
    w.advance(2 * 60_000 + 1);
    expect((await w.post('ana', 'curso_orientacion')).status).toBe(200);
  });

  it('otra cuenta no se ve afectada por la sesión abierta de Ana', async () => {
    const w = world();
    await w.post('ana', 'curso');
    expect((await w.post('bea', 'curso_orientacion')).status).toBe(200);
  });
});
