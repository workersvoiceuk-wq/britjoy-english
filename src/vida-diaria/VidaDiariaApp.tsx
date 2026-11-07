// «Inglés para el día a día» (catálogo dia-a-dia, nivel DIA): página propia del curso en /britjoy-english/vida-diaria/.
// Entrada directa solo a este curso: inicio con los 12 módulos → módulo (objetivo, animación subtitulada,
// transcripción) → práctica (un ejercicio por pantalla, feedback por opción, pista gradual, repaso de fallos) →
// resultado. El avance se guarda con el mismo store (britjoy-english-progress-v1, nivel DIA, mismos IDs).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ExerciseResponse, Lesson, Unit } from '../types';
import { ExerciseView } from '../components/exercises';
import { checkAnswer } from '../logic/answer';
import { lessonStars, lessonXp } from '../logic/gamification';
import { copyFor, instructionFor } from '../lib/copy';
import { useProgressStore } from '../store/useProgressStore';
import { backendConfigured, sendLoginCode, signOut, verifyLoginCode } from '../lib/backend';
import { OUTLINE_MODULES, type OutlineModule } from '../data/vida-diaria/outline';
import media from '../data/vida-diaria/media.json';
import { T, type Strings, type Ui } from './i18n';
import { gradualHint, isPractice, lessonPhrases, optionFeedback, practicePlan } from './practice';
import {
  SAMPLE_MODULE_ID, clearModuleCache, loadAccess, loadMedia, loadModule, manageSubscription, startCheckout,
  type AccessView,
} from './api';

const LEVEL = 'DIA';
const ACCENT = '#C8102E';
type Route = { name: 'home' } | { name: 'module'; id: string } | { name: 'practice'; id: string };

function parseRoute(hash: string): Route {
  const m = /^#\/modulo\/([0-9a-z-]+)(\/practica)?$/.exec(hash);
  if (m && OUTLINE_MODULES.some((x) => x.id === m[1])) return m[2] ? { name: 'practice', id: m[1] } : { name: 'module', id: m[1] };
  return { name: 'home' };
}

function useUi(): [Ui, (u: Ui) => void] {
  const uiLang = useProgressStore((s) => s.uiLang);
  const setUiLang = useProgressStore((s) => s.setUiLang);
  const ui: Ui = (uiLang ?? 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
  return [ui, (u) => setUiLang(u)];
}

const fmtDate = (iso: string, ui: Ui) => new Date(iso).toLocaleDateString(ui === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export default function VidaDiariaApp() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  const [ui, setUi] = useUi();
  const t = T[ui];
  const [access, setAccess] = useState<AccessView | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const next = await loadAccess().catch(() => ({ kind: 'error' }) as AccessView);
    setAccess((prev) => {
      if (prev?.kind === 'status' && prev.active && !(next.kind === 'status' && next.active)) clearModuleCache();
      return next;
    });
    return next;
  }, []);

  useEffect(() => {
    const onHash = () => {
      setRoute(parseRoute(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.documentElement.lang = ui;
    document.title = `${t.product} · BritJoy English`;
  }, [ui, t.product]);

  // Return from Stripe Checkout: the webhook may take a moment, so the server is asked a few times.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pago = params.get('pago');
    if (pago) {
      params.delete('pago');
      const rest = params.toString();
      window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : '') + window.location.hash);
    }
    let tries = 0;
    let timer = 0;
    const poll = async () => {
      const a = await refresh();
      const waiting = pago === 'ok' || (a.kind === 'status' && a.status === 'pending');
      if (waiting && !(a.kind === 'status' && a.active) && ++tries < 10) timer = window.setTimeout(poll, 2000);
      else if (pago === 'ok') setNotice(null);
    };
    if (pago === 'ok') setNotice(T[ui].paid);
    if (pago === 'cancelado') setNotice(T[ui].canceledPay);
    void poll();
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  const active = access?.kind === 'status' && access.active;
  const canOpen = (id: string) => id === SAMPLE_MODULE_ID || active;

  return (
    <div className="paper min-h-screen" style={{ ['--accent' as string]: ACCENT }} data-vida-diaria-app="">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:font-bold">
        {t.skip}
      </a>
      {route.name !== 'practice' && (
        <header className="bg-navy text-white">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
            <a href="#/" className="min-w-0 flex-1">
              <span className="block text-xs font-black uppercase tracking-wider text-white/80">{t.brand}</span>
              <span className="block truncate text-lg font-black">{t.product}</span>
            </a>
            <button
              type="button"
              onClick={() => setUi(ui === 'es' ? 'en' : 'es')}
              className="min-h-[44px] rounded-full border-2 border-white/40 px-4 text-sm font-black"
              lang={ui === 'es' ? 'en' : 'es'}
            >
              {t.langSwitch}
            </button>
          </div>
          <div className="bunting" aria-hidden />
        </header>
      )}
      <main id="contenido" tabIndex={-1} className="outline-none">
        {notice && (
          <p role="status" className="mx-auto mt-4 max-w-5xl rounded-2xl bg-brand-light px-4 py-3 font-bold text-brand-dark">
            {notice}
          </p>
        )}
        {route.name === 'home' && <Home t={t} ui={ui} access={access} canOpen={canOpen} onAccessChange={refresh} setNotice={setNotice} />}
        {route.name === 'module' && <ModulePage key={route.id} id={route.id} t={t} ui={ui} access={access} canOpen={canOpen(route.id)} />}
        {route.name === 'practice' && <PracticeRoute key={route.id} id={route.id} t={t} ui={ui} canOpen={canOpen(route.id)} />}
      </main>
    </div>
  );
}

const NONE: Record<string, unknown> = {};
function useCompleted() {
  // A stable empty object: a new {} on every read would re-render forever.
  return useProgressStore((s) => s.levels[LEVEL]?.completedLessons ?? NONE);
}

function Home({ t, ui, access, canOpen, onAccessChange, setNotice }: {
  t: Strings; ui: Ui; access: AccessView | null; canOpen: (id: string) => boolean;
  onAccessChange: () => Promise<AccessView>; setNotice: (s: string | null) => void;
}) {
  const completed = useCompleted();
  const done = OUTLINE_MODULES.filter((m) => m.lessons.every((l) => l.id in completed)).length;
  const next = OUTLINE_MODULES.find((m) => !m.lessons.every((l) => l.id in completed) && canOpen(m.id));
  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-5">
      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-ink-line sm:p-8" aria-labelledby="vd-title">
        <p className="text-sm font-black uppercase tracking-wider" style={{ color: ACCENT }}>🏙️ A1 → B1 · 12 {t.modules.toLowerCase()}</p>
        <h1 id="vd-title" className="mt-1 text-3xl font-black text-navy sm:text-4xl">{t.product}</h1>
        <p className="mt-3 text-lg font-semibold text-ink">{t.tagline}</p>
        <p className="mt-2 text-sm font-bold text-ink-soft">{t.separate}</p>
        <div className="mt-5">
          <div className="flex items-center justify-between text-sm font-black text-navy">
            <span>{t.progress(done, OUTLINE_MODULES.length)}</span>
            <span aria-hidden>{Math.round((done / OUTLINE_MODULES.length) * 100)}%</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-navy/10" role="progressbar" aria-label={t.progress(done, OUTLINE_MODULES.length)} aria-valuemin={0} aria-valuemax={OUTLINE_MODULES.length} aria-valuenow={done}>
            <div className="h-full rounded-full" style={{ width: `${(done / OUTLINE_MODULES.length) * 100}%`, background: ACCENT }} />
          </div>
        </div>
        {next && (
          <a href={`#/modulo/${next.id}`} className="press mt-5 inline-flex min-h-[48px] items-center rounded-2xl px-5 font-black text-white" style={{ background: ACCENT }}>
            {next.unit} · {next.title} →
          </a>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section aria-labelledby="vd-modules">
          <h2 id="vd-modules" className="mb-3 text-xl font-black text-navy">{t.modules}</h2>
          <ol className="grid gap-3 sm:grid-cols-2" data-vd-modules="">
            {OUTLINE_MODULES.map((m) => (
              <ModuleCard key={m.id} m={m} t={t} completed={m.lessons.every((l) => l.id in completed)} open={canOpen(m.id)} />
            ))}
          </ol>
        </section>
        <aside className="space-y-4">
          <AccessPanel t={t} ui={ui} access={access} onAccessChange={onAccessChange} setNotice={setNotice} />
          <details className="rounded-2xl bg-white p-4 ring-1 ring-ink-line" data-vd-guide="">
            <summary className="cursor-pointer text-lg font-black text-navy">{t.guideTitle}</summary>
            <ol className="mt-3 list-decimal space-y-2 pl-5 font-semibold text-ink">
              {t.guide.map((g) => <li key={g}>{g}</li>)}
            </ol>
            <p className="mt-3 text-sm font-semibold text-ink-soft">
              <a className="underline" href="../resources/guia-vida-diaria-es-en.md" download>{ui === 'es' ? 'Descargar la guía (ES/EN)' : 'Download the guide (ES/EN)'}</a>
            </p>
          </details>
        </aside>
      </div>
    </div>
  );
}

function mediaOf(id: string) {
  return (media.modules as Array<{ module: string; video: { estado: string } }>).find((m) => m.module === id);
}

function ModuleCard({ m, t, completed, open }: { m: OutlineModule; t: Strings; completed: boolean; open: boolean }) {
  const status = completed ? t.done : m.sample ? t.sample : open ? t.included : t.locked;
  return (
    <li>
      <a
        href={`#/modulo/${m.id}`}
        data-vd-module={m.id}
        data-vd-state={completed ? 'completed' : m.sample ? 'sample' : open ? 'open' : 'locked'}
        className="press flex h-full min-h-[88px] items-start gap-3 rounded-2xl border-2 border-b-4 bg-white p-4 text-left"
        style={{ borderColor: completed ? '#398401' : open ? ACCENT : '#E5E5E5' }}
      >
        <span className="text-3xl" aria-hidden>{m.icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-black uppercase tracking-wider text-ink-soft">{m.unit}</span>
          <span className="block text-lg font-black text-navy">{m.title}</span>
          <span className="block text-sm font-semibold text-ink-soft">{m.lessons[0]?.objective}</span>
          <span className="mt-2 inline-block rounded-full bg-navy/5 px-2 py-0.5 text-xs font-black text-navy">
            {completed ? '✓ ' : !open ? '🔒 ' : ''}{status}
          </span>
        </span>
      </a>
    </li>
  );
}

function AccessPanel({ t, ui, access, onAccessChange, setNotice }: {
  t: Strings; ui: Ui; access: AccessView | null; onAccessChange: () => Promise<AccessView>; setNotice: (s: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const price = access?.kind === 'status' ? access.price.display : '£19.99';
  const subscribe = async () => {
    setBusy(true);
    const r = await startCheckout().catch(() => 'error' as const);
    setBusy(false);
    if (r === 'already_active') await onAccessChange();
    else if (r === 'live_disabled' || r === 'not_configured') setNotice(t.liveOff);
    else if (r === 'error') setNotice(t.error);
  };
  return (
    <section className="rounded-2xl bg-white p-4 ring-2" style={{ ['--tw-ring-color' as string]: ACCENT }} aria-labelledby="vd-offer" data-vd-access={access?.kind === 'status' ? (access.active ? 'active' : access.status) : access?.kind ?? 'loading'}>
      <h2 id="vd-offer" className="text-lg font-black text-navy">{t.offerTitle}</h2>
      <p className="mt-1 text-2xl font-black" style={{ color: ACCENT }}>{t.price(price)}</p>
      <p className="mt-1 text-sm font-semibold text-ink-soft">{t.priceNote}</p>
      <p className="mt-2 text-sm font-bold text-brand-dark">{t.sampleFree}</p>
      <div className="mt-3">
        {access === null && <p className="font-semibold text-ink-soft">{t.loading}</p>}
        {access?.kind === 'offline' && <p className="font-semibold text-ink">{t.offline}</p>}
        {access?.kind === 'error' && <p className="font-semibold text-bad-dark">{t.error}</p>}
        {access?.kind === 'signed-out' && <SignIn t={t} onDone={onAccessChange} />}
        {access?.kind === 'status' && (
          <div className="space-y-3">
            {access.active ? (
              <p className="font-bold text-brand-dark" role="status">
                {access.cancelAtPeriodEnd && access.until ? t.endsOn(fmtDate(access.until, ui)) : access.until ? t.activeUntil(fmtDate(access.until, ui)) : ''}
              </p>
            ) : (
              access.status === 'pending' ? <p className="font-bold text-brand-dark" role="status">{t.paid}</p> : access.status !== 'none' && <p className="font-bold text-ink">{t.expired}</p>
            )}
            {!access.active && access.status !== 'pending' && (
              <button type="button" disabled={busy} onClick={subscribe} className="press min-h-[48px] w-full rounded-2xl px-4 font-black text-white disabled:opacity-60" style={{ background: ACCENT }}>
                {t.subscribe} · {t.price(price)}
              </button>
            )}
            {access.active && (
              <button type="button" onClick={() => void manageSubscription().catch(() => setNotice(t.error))} className="press min-h-[44px] w-full rounded-2xl border-2 border-navy/20 px-4 font-black text-navy">
                {t.manage}
              </button>
            )}
            <button type="button" onClick={async () => { await signOut(); clearModuleCache(); await onAccessChange(); }} className="text-sm font-bold text-ink-soft underline">
              {t.signOut}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function SignIn({ t, onDone }: { t: Strings; onDone: () => Promise<AccessView> }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);
  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(false);
        try {
          if (!sent) {
            await sendLoginCode(email);
            setSent(true);
          } else {
            await verifyLoginCode(email, code);
            await onDone();
          }
        } catch {
          setError(true);
        }
      }}
    >
      <p className="text-sm font-bold text-ink">{t.signInTitle}</p>
      <label className="block text-sm font-bold text-navy">
        {t.email}
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block min-h-[44px] w-full rounded-xl border-2 border-ink-line px-3" />
      </label>
      {sent && (
        <label className="block text-sm font-bold text-navy">
          {t.code}
          <input inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={(e) => setCode(e.target.value)} className="mt-1 block min-h-[44px] w-full rounded-xl border-2 border-ink-line px-3" />
        </label>
      )}
      {error && <p role="alert" className="text-sm font-bold text-bad-dark">{t.error}</p>}
      <button type="submit" className="press min-h-[44px] w-full rounded-2xl bg-navy px-4 font-black text-white" disabled={!backendConfigured}>
        {sent ? t.verify : t.sendCode}
      </button>
    </form>
  );
}

function ModuleNav({ id, t }: { id: string; t: Strings }) {
  const i = OUTLINE_MODULES.findIndex((m) => m.id === id);
  const prev = OUTLINE_MODULES[i - 1];
  const next = OUTLINE_MODULES[i + 1];
  return (
    <nav aria-label={t.modules} className="flex flex-wrap items-center gap-2 text-sm font-black">
      <a href="#/" className="min-h-[44px] rounded-full bg-white px-4 py-3 text-navy ring-1 ring-ink-line">← {t.allModules}</a>
      {prev && <a href={`#/modulo/${prev.id}`} className="min-h-[44px] rounded-full bg-white px-4 py-3 text-navy ring-1 ring-ink-line" aria-label={`${t.prev}: ${prev.title}`}>‹ {prev.unit}</a>}
      {next && <a href={`#/modulo/${next.id}`} className="min-h-[44px] rounded-full bg-white px-4 py-3 text-navy ring-1 ring-ink-line" aria-label={`${t.next}: ${next.title}`}>{next.unit} ›</a>}
    </nav>
  );
}

function ModulePage({ id, t, ui, access, canOpen }: { id: string; t: Strings; ui: Ui; access: AccessView | null; canOpen: boolean }) {
  const m = OUTLINE_MODULES.find((x) => x.id === id)!;
  const lesson = m.lessons[0];
  const completed = useCompleted();
  const md = mediaOf(id);
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-5">
      <ModuleNav id={id} t={t} />
      <article className="mt-4 rounded-3xl bg-white p-5 ring-1 ring-ink-line sm:p-8" aria-labelledby="vd-module-title">
        <p className="text-sm font-black uppercase tracking-wider" style={{ color: ACCENT }}>{m.unit} · {m.sample ? t.sample : canOpen ? t.included : t.locked}</p>
        <h1 id="vd-module-title" className="mt-1 text-3xl font-black text-navy">{m.icon} {m.title}</h1>
        <p className="mt-1 text-lg font-bold text-ink">{lesson.title}</p>
        <div className="mt-4 rounded-2xl bg-navy/5 p-4" data-vd-objective="">
          <p className="text-xs font-black uppercase tracking-wider text-ink-soft">{t.objective}</p>
          <p className="mt-1 text-lg font-bold text-navy">{lesson.objective}</p>
        </div>
        {canOpen ? (
          <ModuleMedia id={id} t={t} ui={ui} />
        ) : (
          <div className="mt-5 rounded-2xl border-2 border-dashed p-4" style={{ borderColor: ACCENT }} data-vd-paywall="">
            <p className="font-black text-navy">🔒 {t.lockedModule}</p>
            <p className="mt-1 text-sm font-semibold text-ink-soft">{t.sampleFree}</p>
            {access?.kind !== 'status' && <a href="#/" className="mt-2 inline-block font-black underline" style={{ color: ACCENT }}>{t.offerTitle} →</a>}
          </div>
        )}
        <p className="mt-4 text-sm font-semibold text-ink-soft" data-vd-video-state={md?.video.estado}>
          {md?.video.estado === 'listo-sin-voz' ? t.videoReady : md?.video.estado === 'en-flow-pendiente-revision' ? t.videoFlow : t.videoPending}
        </p>
        {canOpen && (
          <a href={`#/modulo/${id}/practica`} className="press mt-5 inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl px-5 text-lg font-black text-white sm:w-auto" style={{ background: ACCENT }}>
            {lesson.id in completed ? t.review : t.start} →
          </a>
        )}
      </article>
    </div>
  );
}

interface Cue { start: string; text: string }
function parseVtt(vtt: string): Cue[] {
  return vtt.split(/\r?\n\r?\n/).flatMap((block) => {
    const lines = block.split(/\r?\n/);
    const i = lines.findIndex((l) => l.includes('-->'));
    if (i < 0) return [];
    return [{ start: lines[i].split('-->')[0].trim().replace(/\.\d+$/, ''), text: lines.slice(i + 1).join(' ').trim() }];
  });
}

/** Animation with keyboard-accessible native controls, ES/EN caption switch and a transcript. */
function ModuleMedia({ id, t, ui }: { id: string; t: Strings; ui: Ui }) {
  type Media = { estado: string; archivo: string | null; subtitulos?: { es: string; en: string }; acceso?: string };
  const item = (media.modules as unknown as Array<{ module: string; animacion: Media; video: Media }>).find((m) => m.module === id);
  // The realistic Flow clip replaces the chapter animation once it has been imported and validated.
  const flow = item?.video.estado === 'listo-sin-voz' && item.video.archivo ? item.video : null;
  const entry = flow ?? item?.animacion;
  const source: 'flow' | 'animacion' = flow ? 'flow' : 'animacion';
  const [src, setSrc] = useState<{ video: string; es: string; en: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const [lang, setLang] = useState<'es' | 'en' | 'off'>(ui);
  const [cues, setCues] = useState<Cue[]>([]);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!entry) return;
      if (entry.acceso === 'publico') {
        const base = `../videos/vida-diaria/`;
        setSrc({ video: base + entry.archivo, es: base + entry.subtitulos!.es, en: base + entry.subtitulos!.en });
        return;
      }
      const [v, es, en] = await Promise.all([loadMedia(id, 'video', source), loadMedia(id, 'es', source), loadMedia(id, 'en', source)]);
      if (cancelled) return;
      if (v && es && en) setSrc({ video: v, es, en });
      else setFailed(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, entry, source]);

  useEffect(() => {
    if (!src || lang === 'off') return setCues([]);
    let cancelled = false;
    void fetch(lang === 'es' ? src.es : src.en).then((r) => r.text()).then((txt) => !cancelled && setCues(parseVtt(txt))).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [src, lang]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    for (const track of Array.from(v.textTracks)) track.mode = track.language === lang ? 'showing' : 'disabled';
  }, [lang, src]);

  if (!entry) return null;
  return (
    <section className="mt-5" aria-labelledby="vd-media-title" data-vd-media={id} data-vd-media-source={source}>
      <h2 id="vd-media-title" className="text-lg font-black text-navy">{flow ? t.video : t.animation}</h2>
      <p className="text-sm font-semibold text-ink-soft">{flow ? t.videoNote : t.animationNote}</p>
      {failed && <p role="alert" className="mt-2 font-bold text-bad-dark">{t.error}</p>}
      {!src && !failed && <p className="mt-2 font-semibold text-ink-soft">{t.loading}</p>}
      {src && (
        <>
          <video ref={video} className={`mt-3 rounded-2xl bg-navy ${flow ? 'mx-auto block aspect-[9/16] max-h-[70vh] w-auto max-w-full' : 'aspect-video w-full'}`} controls playsInline preload="metadata" src={src.video} crossOrigin="anonymous">
            <track kind="subtitles" srcLang="es" label="Español" src={src.es} default={lang === 'es'} />
            <track kind="subtitles" srcLang="en" label="English" src={src.en} default={lang === 'en'} />
          </video>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t.captions}>
            {(['es', 'en', 'off'] as const).map((l) => (
              <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={`min-h-[44px] rounded-full px-4 text-sm font-black ${lang === l ? 'bg-navy text-white' : 'bg-navy/5 text-navy'}`}>
                {l === 'es' ? 'ES' : l === 'en' ? 'EN' : t.off}
              </button>
            ))}
          </div>
          <details className="mt-3 rounded-2xl bg-navy/5 p-3" data-vd-transcript="">
            <summary className="cursor-pointer font-black text-navy">{t.transcript}</summary>
            <ol className="mt-2 space-y-2">
              {cues.map((c, i) => (
                <li key={i} className="text-sm font-semibold text-ink">
                  <button type="button" className="mr-2 font-black text-royal underline" onClick={() => { const v = video.current; if (v) { const [h, mm, s] = c.start.split(':').map(Number); v.currentTime = h * 3600 + mm * 60 + s; } }}>
                    {c.start.replace(/^00:/, '')}
                  </button>
                  {c.text}
                </li>
              ))}
            </ol>
          </details>
        </>
      )}
    </section>
  );
}

function PracticeRoute({ id, t, ui, canOpen }: { id: string; t: Strings; ui: Ui; canOpen: boolean }) {
  const [unit, setUnit] = useState<Unit | null>(null);
  const [state, setState] = useState<'loading' | 'locked' | 'error' | 'ok'>('loading');
  useEffect(() => {
    if (!canOpen && id !== SAMPLE_MODULE_ID) return setState('locked');
    let cancelled = false;
    void loadModule(id).then((r) => {
      if (cancelled) return;
      if (r.kind === 'ok') {
        setUnit(r.unit);
        setState('ok');
      } else setState(r.kind === 'error' ? 'error' : 'locked');
    });
    return () => {
      cancelled = true;
    };
  }, [id, canOpen]);
  if (state === 'loading') return <p className="p-6 font-bold" role="status">{t.loading}</p>;
  if (state !== 'ok' || !unit)
    return (
      <div className="mx-auto max-w-3xl px-4 pt-5">
        <ModuleNav id={id} t={t} />
        <p className="mt-4 rounded-2xl bg-white p-4 font-bold text-navy" data-vd-paywall="">🔒 {state === 'error' ? t.error : t.lockedModule}</p>
      </div>
    );
  return <Practice lesson={unit.lessons[0]} moduleId={id} t={t} ui={ui} />;
}

const NATIVE_ENTER = new Set(['BUTTON', 'A', 'SUMMARY', 'SELECT', 'VIDEO', 'AUDIO', 'TEXTAREA']);

function Practice({ lesson, moduleId, t, ui }: { lesson: Lesson; moduleId: string; t: Strings; ui: Ui }) {
  const copy = useMemo(() => copyFor('es', 'en'), []);
  const phrases = useMemo(() => lessonPhrases(lesson), [lesson]);
  const completeLesson = useProgressStore((s) => s.completeLesson);
  const [missed, setMissed] = useState<number[]>([]);
  const plan = useMemo(() => practicePlan(lesson, missed), [lesson, missed]);
  const [pos, setPos] = useState(0);
  const [attempt, setAttempt] = useState(0); // tries on the current screen
  const [round, setRound] = useState(0); // remounts the exercise for a retry
  const [response, setResponse] = useState<ExerciseResponse | null>(null);
  const [result, setResult] = useState<null | { correct: boolean; final: boolean; feedback?: string; answer?: string }>(null);
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2>(0);
  const [firstTry, setFirstTry] = useState(0);
  const [finished, setFinished] = useState(false);
  const status = useRef<HTMLDivElement>(null);

  const item = plan[pos];
  const exercise = lesson.exercises[item?.index ?? 0];
  const practice = exercise && isPractice(exercise);
  const total = plan.length;

  const advance = useCallback(() => {
    if (pos + 1 >= plan.length) {
      const mistakes = new Set(missed).size;
      completeLesson({ level: LEVEL, lessonId: lesson.id, xp: lessonXp(firstTry, mistakes), stars: lessonStars(mistakes) });
      setFinished(true);
      return;
    }
    setPos(pos + 1);
    setAttempt(0);
    setRound((r) => r + 1);
    setResponse(null);
    setResult(null);
    setHintLevel(0);
  }, [pos, plan.length, missed, completeLesson, lesson.id, firstTry]);

  const check = useCallback(() => {
    if (!practice || !response || result) return;
    if (response.kind === 'speech' && response.skipped) return advance();
    const r = checkAnswer(exercise, response);
    if (r.correct) {
      if (attempt === 0 && !item.review) setFirstTry((n) => n + 1);
      setResult({ correct: true, final: true });
    } else if (attempt === 0 && !item.review) {
      setResult({ correct: false, final: false, feedback: optionFeedback(exercise, response, phrases, ui) });
      setHintLevel((h) => (h < 1 ? 1 : h));
    } else {
      if (!item.review) setMissed((m) => [...m, item.index]);
      setResult({ correct: false, final: true, answer: r.correctAnswer, feedback: optionFeedback(exercise, response, phrases, ui) });
    }
    window.setTimeout(() => status.current?.focus(), 0);
  }, [practice, response, result, exercise, attempt, item, phrases, ui, advance]);

  const retry = () => {
    setAttempt((a) => a + 1);
    setRound((r) => r + 1);
    setResponse(null);
    setResult(null);
    setHintLevel(2);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || finished) return;
      const el = e.target as HTMLElement | null;
      if (el && (NATIVE_ENTER.has(el.tagName) || el.isContentEditable)) return;
      if (!practice || result?.final) advance();
      else if (!result) check();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [practice, result, advance, check, finished]);

  if (finished) {
    const practiceCount = lesson.exercises.filter(isPractice).length;
    const i = OUTLINE_MODULES.findIndex((m) => m.id === moduleId);
    const next = OUTLINE_MODULES[i + 1];
    return (
      <div className="mx-auto max-w-2xl px-4 pt-10 text-center" data-vd-result="">
        <p className="text-6xl" aria-hidden>🎉</p>
        <h1 className="mt-3 text-3xl font-black text-navy">{t.resultTitle}</h1>
        <p className="mt-2 text-lg font-bold text-ink">{t.resultBody(firstTry, practiceCount, new Set(missed).size)}</p>
        <p className="mt-1 font-semibold text-brand-dark" role="status">{t.saved}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {next && <a href={`#/modulo/${next.id}`} className="press min-h-[48px] rounded-2xl px-5 py-3 font-black text-white" style={{ background: ACCENT }}>{next.unit} · {next.title} →</a>}
          <a href="#/" className="press min-h-[48px] rounded-2xl bg-white px-5 py-3 font-black text-navy ring-1 ring-ink-line">{t.backToModules}</a>
        </div>
      </div>
    );
  }

  const hint = hintLevel ? gradualHint(exercise, hintLevel === 2 ? 2 : 1, ui, response && response.kind === 'text' ? response.value : null) : '';
  return (
    <div className="paper flex min-h-screen flex-col" data-vd-practice={lesson.id}>
      <header className="bg-navy">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3">
          <a href={`#/modulo/${moduleId}`} className="flex min-h-[44px] min-w-[44px] items-center justify-center text-2xl font-black text-white/80" aria-label={t.exit}>✕</a>
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-label={t.step(pos + 1, total)} aria-valuemin={0} aria-valuemax={total} aria-valuenow={pos + (result?.final || !practice ? 1 : 0)}>
            <div className="h-full rounded-full transition-all" style={{ width: `${((pos + (result?.final || !practice ? 1 : 0)) / total) * 100}%`, background: ACCENT }} />
          </div>
          <span className="text-sm font-black text-white" aria-hidden>{pos + 1}/{total}</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-56 pt-4">
        {item.review && <p className="mb-2 inline-block rounded-full bg-accent-light px-3 py-1 text-xs font-black uppercase tracking-wider" style={{ color: ACCENT }} data-vd-review="">{t.reviewPhase}</p>}
        <p className="mb-3 text-lg font-black text-navy">{exercise.type === 'explain' ? exercise.title : instructionFor(exercise, copy)}</p>
        <ExerciseView key={`${lesson.id}-${pos}-${round}`} exercise={exercise} locked={result !== null} correct={result ? result.correct : null} copy={copy} onResponse={setResponse} />
        {practice && !result && (
          <div className="mt-4">
            {hintLevel > 0 ? (
              <p className="rounded-2xl bg-navy/5 p-3 font-semibold text-navy" data-vd-hint={hintLevel}>💡 {hint}</p>
            ) : (
              <button type="button" onClick={() => setHintLevel(1)} className="min-h-[44px] rounded-full bg-navy/5 px-4 text-sm font-black text-navy">💡 {t.hint}</button>
            )}
          </div>
        )}
        {exercise.type === 'speak' && !result && (
          <button type="button" onClick={advance} className="mt-3 min-h-[44px] text-sm font-black text-ink-soft underline">{t.skipSpeak}</button>
        )}
      </main>
      <footer className={`fixed inset-x-0 bottom-0 border-t-2 pb-[env(safe-area-inset-bottom)] ${result ? (result.correct ? 'border-transparent bg-brand-light' : 'border-transparent bg-bad-light') : 'border-navy/10 bg-white'}`}>
        <div className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          {result && (
            <div ref={status} tabIndex={-1} role="status" className={`outline-none ${result.correct ? 'text-brand-dark' : 'text-bad-dark'}`} data-vd-feedback={result.correct ? 'right' : result.final ? 'answer' : 'retry'}>
              <p className="text-xl font-black">{result.correct ? t.correct : t.notYet}</p>
              {!result.correct && result.feedback && <p className="font-bold" data-vd-option-feedback="">{result.feedback}</p>}
              {!result.correct && !result.final && <p className="text-sm font-semibold">💡 {gradualHint(exercise, 1, ui)}</p>}
              {!result.correct && result.final && result.answer && (
                <p className="font-bold">{t.answerWas} <span lang="en">{result.answer}</span>{item.review ? '' : ` · ${t.toReview}`}</p>
              )}
            </div>
          )}
          {!practice ? (
            <button type="button" onClick={advance} className="press min-h-[52px] rounded-2xl px-6 font-black text-white sm:ml-auto sm:min-w-[10rem]" style={{ background: ACCENT }}>{t.continue}</button>
          ) : !result ? (
            <button type="button" disabled={!response} onClick={check} className="press min-h-[52px] rounded-2xl px-6 font-black text-white disabled:opacity-50 sm:ml-auto sm:min-w-[10rem]" style={{ background: ACCENT }}>{t.check}</button>
          ) : result.final ? (
            <button type="button" onClick={advance} className={`press min-h-[52px] rounded-2xl px-6 font-black text-white sm:min-w-[10rem] ${result.correct ? 'bg-brand' : 'bg-bad'}`}>{t.continue}</button>
          ) : (
            <button type="button" onClick={retry} data-vd-retry="" className="press min-h-[52px] rounded-2xl bg-bad px-6 font-black text-white sm:min-w-[10rem]">{t.retry}</button>
          )}
        </div>
      </footer>
    </div>
  );
}
