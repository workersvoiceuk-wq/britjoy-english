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
import { T, moduleText, type Strings, type Ui } from './i18n';
import { gradualHint, isPractice, lessonPhraseList, optionFeedback, phraseMap, practicePlan } from './practice';
import {
  LEVELS, buildChallenge, currentLevel, guideFor, levelDef, levelOf, levelProgress, lessonIdOf, moduleAccess, nextActivity,
  type Activity, type LevelNo, type ModuleAccess, type NextInput,
} from './levels';
import { challengeDone, markChallengeDone } from './challenges';
import { say } from '../lib/speech';
import { hush } from '../lib/narrator';
import { sfx } from '../lib/sound';
import { sampleExerciseInEnglish } from './sampleEnglish';
import {
  SAMPLE_MODULE_ID, clearModuleCache, loadAccess, loadMedia, loadModule, manageSubscription, startCheckout,
  type AccessView,
} from './api';

const LEVEL = 'DIA';
const sitePreview = import.meta.env.VITE_VIDA_DIARIA_SITE_PREVIEW === '1';
const publicMediaPath = sitePreview ? './videos/vida-diaria/' : '../videos/vida-diaria/';
const ACCENT = '#C8102E';
type Route =
  | { name: 'home' }
  | { name: 'access' }
  | { name: 'module'; id: string }
  | { name: 'practice'; id: string }
  | { name: 'challenge'; level: LevelNo };

function parseRoute(hash: string): Route {
  const m = /^#\/modulo\/([0-9a-z-]+)(\/practica)?$/.exec(hash);
  if (m && OUTLINE_MODULES.some((x) => x.id === m[1])) return m[2] ? { name: 'practice', id: m[1] } : { name: 'module', id: m[1] };
  const c = /^#\/nivel\/([123])\/reto$/.exec(hash);
  if (c) return { name: 'challenge', level: Number(c[1]) as LevelNo };
  if (hash === '#/acceso') return { name: 'access' };
  return { name: 'home' };
}

function useUi(): [Ui, (u: Ui) => void] {
  const uiLang = useProgressStore((s) => s.uiLang);
  const setUiLang = useProgressStore((s) => s.setUiLang);
  const url = new URL(window.location.href);
  const requested = url.searchParams.get('lang');
  const ui: Ui = requested === 'es' || requested === 'en' ? requested : (uiLang ?? 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
  return [ui, (u) => {
    if (requested) {
      url.searchParams.delete('lang');
      window.history.replaceState(null, '', url);
    }
    hush();
    setUiLang(u);
  }];
}

const fmtDate = (iso: string, ui: Ui) => new Date(iso).toLocaleDateString(ui === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export default function VidaDiariaApp() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  const [ui, setUi] = useUi();
  const t = T[ui];
  const [access, setAccess] = useState<AccessView | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const next = sitePreview ? { kind: 'offline' } as const : await loadAccess().catch(() => ({ kind: 'error' }) as AccessView);
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

  const accessOf = useCallback((id: string): ModuleAccess => moduleAccess(id, SAMPLE_MODULE_ID, access), [access]);

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
        {(route.name === 'home' || route.name === 'access') && (
          <Home t={t} ui={ui} access={access} accessOf={accessOf} focusAccess={route.name === 'access'} onAccessChange={refresh} setNotice={setNotice} />
        )}
        {route.name === 'module' && <ModulePage key={route.id} id={route.id} t={t} ui={ui} accessOf={accessOf} />}
        {route.name === 'practice' && <PracticeRoute key={route.id} id={route.id} t={t} ui={ui} setUi={setUi} accessOf={accessOf} />}
        {route.name === 'challenge' && <ChallengeRoute key={route.level} level={route.level} t={t} ui={ui} setUi={setUi} accessOf={accessOf} />}
      </main>
    </div>
  );
}

const NONE: Record<string, unknown> = {};
function useCompleted() {
  // A stable empty object: a new {} on every read would re-render forever.
  return useProgressStore((s) => s.levels[LEVEL]?.completedLessons ?? NONE);
}

function useNextInput(accessOf: (id: string) => ModuleAccess): NextInput {
  const completed = useCompleted();
  return { isDone: (id) => lessonIdOf(id) in completed, accessOf, challengeDone };
}

const moduleById = (id: string) => OUTLINE_MODULES.find((m) => m.id === id)!;
/** Reasons the learner can act on from the access panel (sign in, subscribe, pay, resubscribe). */
const actionable = (r: string) => r === 'signed-out' || r === 'no-access' || r === 'expired' || r === 'payment-due';

/** The next real step: open module, closing challenge, or the exact reason it is blocked. */
function ActivityCta({ act, t, ui, primary }: { act: Activity; t: Strings; ui: Ui; primary?: boolean }) {
  const cls = `press inline-flex min-h-[48px] items-center rounded-2xl px-5 py-2 font-black ${primary ? 'text-white' : 'text-navy ring-2 ring-navy/20'}`;
  const style = primary ? { background: ACCENT } : undefined;
  if (act.kind === 'module')
    return <a href={`#/modulo/${act.id}`} data-vd-continue="module" data-vd-continue-target={act.id} className={cls} style={style}>{t.continueWith(moduleText(moduleById(act.id), ui).title)} →</a>;
  if (act.kind === 'challenge')
    return <a href={`#/nivel/${act.level}/reto`} data-vd-continue="challenge" className={cls} style={style}>{t.continueChallenge} →</a>;
  if (act.kind === 'blocked')
    return (
      <div data-vd-continue="blocked" data-vd-reason={act.reason} className="rounded-2xl bg-navy/5 p-3">
        <p className="font-black text-navy">🔒 {t.continueBlocked} · {moduleText(moduleById(act.id), ui).title}</p>
        <p className="mt-1 text-sm font-semibold text-ink">{t.reasonLong[act.reason]}</p>
        {actionable(act.reason) && <a href="#/acceso" className="mt-2 inline-block min-h-[44px] py-2 font-black underline" style={{ color: ACCENT }}>{t.howToAccess} →</a>}
      </div>
    );
  return <p className="font-black text-brand-dark" role="status">✓ {t.levelComplete}</p>;
}

function Home({ t, ui, access, accessOf, focusAccess, onAccessChange, setNotice }: {
  t: Strings; ui: Ui; access: AccessView | null; accessOf: (id: string) => ModuleAccess; focusAccess: boolean;
  onAccessChange: () => Promise<AccessView>; setNotice: (s: string | null) => void;
}) {
  const completed = useCompleted();
  const input = useNextInput(accessOf);
  const done = OUTLINE_MODULES.filter((m) => m.lessons.every((l) => l.id in completed)).length;
  const cur = currentLevel(input);
  const nextAct = cur ? nextActivity(cur, input) : null;
  useEffect(() => {
    if (!focusAccess) return;
    const el = document.getElementById('vd-offer');
    el?.scrollIntoView?.({ block: 'start' });
    el?.focus({ preventScroll: true });
  }, [focusAccess, access]);
  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-5">
      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-ink-line sm:p-8" aria-labelledby="vd-title">
        <p className="text-sm font-black uppercase tracking-wider" style={{ color: ACCENT }}>🏙️ {ui === 'en' ? '3 levels' : '3 niveles'} · 12 {t.modules.toLowerCase()}</p>
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
        {sitePreview && (
          <nav className="mt-5 flex flex-wrap gap-4 font-black text-navy" aria-label={ui === 'en' ? 'Free sample' : 'Muestra gratuita'}>
            <a className="underline" href={`#/modulo/${SAMPLE_MODULE_ID}`}>{ui === 'en' ? 'Watch the free lesson' : 'Ver la lección gratis'}</a>
            <a className="underline" href={`#/modulo/${SAMPLE_MODULE_ID}/practica`}>{ui === 'en' ? 'Practise for free' : 'Practicar gratis'}</a>
          </nav>
        )}
        {nextAct && <div className="mt-5" data-vd-next=""><ActivityCta act={nextAct} t={t} ui={ui} primary /></div>}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section aria-labelledby="vd-levels">
          <h2 id="vd-levels" className="mb-3 text-xl font-black text-navy">{t.levelsTitle}</h2>
          <div className="space-y-4">
            {LEVELS.map((l) => (
              <LevelSection key={l.no} no={l.no} t={t} ui={ui} input={input} current={cur === l.no} />
            ))}
          </div>
        </section>
        <aside className="space-y-4">
          <AccessPanel t={t} ui={ui} access={access} onAccessChange={onAccessChange} setNotice={setNotice} />
          <details className="rounded-2xl bg-white p-4 ring-1 ring-ink-line" data-vd-guide="">
            <summary className="cursor-pointer text-lg font-black text-navy">{t.guideTitle}</summary>
            <ol className="mt-3 list-decimal space-y-2 pl-5 font-semibold text-ink">
              {t.guide.map((g) => <li key={g}>{g}</li>)}
            </ol>
            <p className="mt-3 text-sm font-semibold text-ink-soft">
              <a className="underline" href={`${sitePreview ? "." : ".."}/resources/guia-vida-diaria-es-en.md`} download>{ui === 'es' ? 'Descargar la guía (ES/EN)' : 'Download the guide (ES/EN)'}</a>
            </p>
          </details>
        </aside>
      </div>
    </div>
  );
}

function LevelSection({ no, t, ui, input, current }: { no: LevelNo; t: Strings; ui: Ui; input: NextInput; current: boolean }) {
  const prog = levelProgress(no, input.isDone);
  const act = nextActivity(no, input);
  const chDone = input.challengeDone(no);
  const state = act.kind === 'level-complete' ? 'complete' : current ? 'current' : 'upcoming';
  const label = t.levelProgress(prog.done, prog.total);
  return (
    <section
      className="rounded-3xl bg-white p-4 ring-1 sm:p-6"
      style={{ ['--tw-ring-color' as string]: state === 'current' ? ACCENT : '#E5E5E5' }}
      aria-labelledby={`vd-level-${no}`}
      data-vd-level={no}
      data-vd-level-state={state}
    >
      <p className="text-xs font-black uppercase tracking-wider" style={{ color: ACCENT }}>
        {t.level(no)}{state === 'current' ? ` · ${t.levelCurrent}` : state === 'complete' ? ` · ✓ ${t.levelComplete}` : ''}
      </p>
      <h3 id={`vd-level-${no}`} className="mt-1 text-xl font-black text-navy">{t.levelNames[no - 1]}</h3>
      <p className="mt-1 font-semibold text-ink" data-vd-level-goal="">{t.levelGoals[no - 1]}</p>
      <p className="mt-1 text-sm font-semibold text-ink-soft">{t.levelPractice[no - 1]}</p>
      <div className="mt-3">
        <div className="flex items-center justify-between text-sm font-black text-navy">
          <span>{label}</span>
          <span aria-hidden>{prog.percent}%</span>
        </div>
        <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-navy/10" role="progressbar" aria-label={`${t.level(no)}: ${label}`} aria-valuemin={0} aria-valuemax={prog.total} aria-valuenow={prog.done} data-vd-level-progress={no}>
          <div className="h-full rounded-full" style={{ width: `${prog.percent}%`, background: ACCENT }} />
        </div>
      </div>
      <div className="mt-3"><ActivityCta act={act} t={t} ui={ui} primary={current} /></div>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2" data-vd-modules={no}>
        {levelDef(no).modules.map((id) => {
          const m = moduleById(id);
          return <ModuleCard key={id} m={m} t={t} ui={ui} completed={input.isDone(id)} access={input.accessOf(id)} />;
        })}
      </ol>
      <div className="mt-4 rounded-2xl border-2 border-dashed border-navy/20 p-3" data-vd-challenge={no} data-vd-challenge-state={chDone ? 'done' : prog.complete ? 'open' : 'locked'}>
        <p className="font-black text-navy">🏁 {t.challenge}{chDone ? ` · ✓ ${t.challengeDone}` : ''}</p>
        <p className="mt-1 text-sm font-semibold text-ink">{t.challengeGoals[no - 1]}</p>
        {prog.complete ? (
          <a href={`#/nivel/${no}/reto`} className="press mt-2 inline-flex min-h-[44px] items-center rounded-2xl bg-navy px-4 font-black text-white">{chDone ? t.challengeRepeat : t.challengeOpen} →</a>
        ) : (
          <p className="mt-1 text-sm font-bold text-ink-soft">🔒 {t.challengeLocked}</p>
        )}
      </div>
    </section>
  );
}

function mediaOf(id: string) {
  return (media.modules as Array<{ module: string; video: { estado: string } }>).find((m) => m.module === id);
}

function ModuleCard({ m, t, ui, completed, access }: { m: OutlineModule; t: Strings; ui: Ui; completed: boolean; access: ModuleAccess }) {
  const txt = moduleText(m, ui);
  const state = completed ? 'completed' : access.reason === 'sample' ? 'sample' : access.open ? 'open' : 'locked';
  return (
    <li>
      <a
        href={`#/modulo/${m.id}`}
        data-vd-module={m.id}
        data-vd-state={state}
        data-vd-reason={access.reason}
        className="press flex h-full min-h-[88px] items-start gap-3 rounded-2xl border-2 border-b-4 bg-white p-4 text-left"
        style={{ borderColor: completed ? '#398401' : access.open ? ACCENT : '#E5E5E5' }}
      >
        <span className="text-3xl" aria-hidden>{m.icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-black uppercase tracking-wider text-ink-soft">{txt.unit}</span>
          <span className="block text-lg font-black text-navy">{txt.title}</span>
          <span className="block text-sm font-semibold text-ink-soft">{txt.objective}</span>
          <span className="mt-2 inline-block rounded-full bg-navy/5 px-2 py-0.5 text-xs font-black text-navy">
            {completed ? `✓ ${t.done}` : `${access.open ? '' : '🔒 '}${t.reasonShort[access.reason]}`}
          </span>
        </span>
      </a>
    </li>
  );
}

function AccessPanel({ t, ui, access, onAccessChange, setNotice }: {
  t: Strings; ui: Ui; access: AccessView | null; onAccessChange: () => Promise<AccessView>; setNotice: (s: string | null) => void;
}) {
  if (sitePreview) {
    return (
      <section className="rounded-2xl bg-white p-4 ring-1 ring-ink-line" aria-labelledby="vd-offer" data-vd-access="offline">
        <h2 id="vd-offer" tabIndex={-1} className="text-lg font-black text-navy">{ui === 'en' ? 'Course access' : 'Acceso al curso'}</h2>
        <p className="mt-2 font-semibold text-ink">{ui === 'en' ? 'Enrolment for modules 2–12 is closed for now.' : 'Las inscripciones a los módulos 2–12 están cerradas por ahora.'}</p>
        <p className="mt-2 font-bold text-brand-dark">{t.sampleFree}</p>
        <a href="/mi-vum/" className="mt-3 inline-flex min-h-[44px] items-center font-black text-navy underline">{ui === 'en' ? 'My VUM account' : 'Mi cuenta VUM'}</a>
      </section>
    );
  }
  return <CommercialAccessPanel t={t} ui={ui} access={access} onAccessChange={onAccessChange} setNotice={setNotice} />;
}

function CommercialAccessPanel({ t, ui, access, onAccessChange, setNotice }: Parameters<typeof AccessPanel>[0]) {
  const [busy, setBusy] = useState(false);
  const price = access?.kind === 'status' ? access.price.display : '£12';
  const paymentDue = access?.kind === 'status' && !access.active && access.status === 'past_due';
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
      <h2 id="vd-offer" tabIndex={-1} className="text-lg font-black text-navy outline-none">{t.offerTitle}</h2>
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
              access.status === 'pending' ? <p className="font-bold text-brand-dark" role="status">{t.paid}</p> : access.status !== 'none' && <p className="font-bold text-ink">{paymentDue ? t.paymentDue : t.expired}</p>
            )}
            {!access.active && !paymentDue && access.status !== 'pending' && (
              <button type="button" disabled={busy} onClick={subscribe} className="press min-h-[48px] w-full rounded-2xl px-4 font-black text-white disabled:opacity-60" style={{ background: ACCENT }}>
                {t.subscribe} · {t.price(price)}
              </button>
            )}
            {(access.active || paymentDue) && (
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

function ModuleNav({ id, t, ui }: { id: string; t: Strings; ui: Ui }) {
  const i = OUTLINE_MODULES.findIndex((m) => m.id === id);
  const prev = OUTLINE_MODULES[i - 1];
  const next = OUTLINE_MODULES[i + 1];
  return (
    <nav aria-label={t.modules} className="flex flex-wrap items-center gap-2 text-sm font-black">
      <a href="#/" className="min-h-[44px] rounded-full bg-white px-4 py-3 text-navy ring-1 ring-ink-line">← {t.allModules}</a>
      {prev && <a href={`#/modulo/${prev.id}`} className="min-h-[44px] rounded-full bg-white px-4 py-3 text-navy ring-1 ring-ink-line" aria-label={`${t.prev}: ${moduleText(prev, ui).title}`}>‹ {moduleText(prev, ui).unit}</a>}
      {next && <a href={`#/modulo/${next.id}`} className="min-h-[44px] rounded-full bg-white px-4 py-3 text-navy ring-1 ring-ink-line" aria-label={`${t.next}: ${moduleText(next, ui).title}`}>{moduleText(next, ui).unit} ›</a>}
    </nav>
  );
}

function ModulePage({ id, t, ui, accessOf }: { id: string; t: Strings; ui: Ui; accessOf: (id: string) => ModuleAccess }) {
  const m = OUTLINE_MODULES.find((x) => x.id === id)!;
  const lesson = m.lessons[0];
  const txt = moduleText(m, ui);
  const acc = accessOf(id);
  const canOpen = acc.open;
  const completed = useCompleted();
  const md = mediaOf(id);
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-5">
      <ModuleNav id={id} t={t} ui={ui} />
      <article className="mt-4 rounded-3xl bg-white p-5 ring-1 ring-ink-line sm:p-8" aria-labelledby="vd-module-title">
        <p className="text-sm font-black uppercase tracking-wider" style={{ color: ACCENT }}>{txt.unit} · {t.reasonShort[acc.reason]}</p>
        <h1 id="vd-module-title" className="mt-1 text-3xl font-black text-navy">{m.icon} {txt.title}</h1>
        <p className="mt-1 text-lg font-bold text-ink">{txt.lesson}</p>
        <div className="mt-4 rounded-2xl bg-navy/5 p-4" data-vd-objective="">
          <p className="text-xs font-black uppercase tracking-wider text-ink-soft">{t.objective}</p>
          <p className="mt-1 text-lg font-bold text-navy">{txt.objective}</p>
        </div>
        {canOpen ? (
          <ModuleMedia id={id} t={t} ui={ui} />
        ) : (
          <div className="mt-5 rounded-2xl border-2 border-dashed p-4" style={{ borderColor: ACCENT }} data-vd-paywall="" data-vd-reason={acc.reason}>
            <p className="font-black text-navy">🔒 {t.reasonShort[acc.reason]}</p>
            <p className="mt-1 font-semibold text-ink">{t.reasonLong[acc.reason]}</p>
            <p className="mt-1 text-sm font-semibold text-ink-soft">{t.sampleFree}</p>
            {actionable(acc.reason) && <a href="#/acceso" className="mt-2 inline-block min-h-[44px] py-2 font-black underline" style={{ color: ACCENT }}>{t.howToAccess} →</a>}
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
  const [watchChapter, setWatchChapter] = useState(false);
  const source = flow && !watchChapter ? 'flow' : 'animacion';
  const entry = source === 'flow' ? flow : item?.animacion;
  const [loaded, setLoaded] = useState<{ entry: Media; urls: { video: string; es: string; en: string } | null } | null>(null);
  const src = loaded && loaded.entry === entry ? loaded.urls : null;
  const failed = Boolean(loaded && loaded.entry === entry && !src);
  const [lang, setLang] = useState<'es' | 'en' | 'off'>(ui);
  const [cues, setCues] = useState<Cue[]>([]);
  const video = useRef<HTMLVideoElement>(null);
  const [voiceMissing, setVoiceMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!entry?.archivo || !entry.subtitulos) return;
      if (entry.acceso === 'publico') {
        setLoaded({ entry, urls: { video: publicMediaPath + entry.archivo, es: publicMediaPath + entry.subtitulos.es, en: publicMediaPath + entry.subtitulos.en } });
        return;
      }
      try {
        const [v, es, en] = await Promise.all([loadMedia(id, 'video', source), loadMedia(id, 'es', source), loadMedia(id, 'en', source)]);
        if (!cancelled) setLoaded({ entry, urls: v && es && en ? { video: v, es, en } : null });
      } catch {
        if (!cancelled) setLoaded({ entry, urls: null });
      }
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
  const isFlow = source === 'flow';
  return (
    <section className="mt-5" aria-labelledby="vd-media-title" data-vd-media={id} data-vd-media-source={source}>
      <h2 id="vd-media-title" className="text-lg font-black text-navy">{isFlow ? t.video : t.animation}</h2>
      <p className="text-sm font-semibold text-ink-soft">{isFlow ? t.videoNote : t.animationNote}</p>
      {flow && item?.animacion.archivo && (
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t.video}>
          <button type="button" aria-pressed={!watchChapter} onClick={() => setWatchChapter(false)} className="min-h-[44px] rounded-full bg-navy/5 px-4 font-black text-navy">{ui === 'en' ? 'Short scene' : 'Escena corta'}</button>
          <button type="button" aria-pressed={watchChapter} onClick={() => setWatchChapter(true)} className="min-h-[44px] rounded-full bg-navy/5 px-4 font-black text-navy">{t.animation}</button>
        </div>
      )}
      {failed && <p role="alert" className="mt-2 font-bold text-bad-dark">{t.error}</p>}
      {!src && !failed && <p className="mt-2 font-semibold text-ink-soft">{t.loading}</p>}
      {src && (
        <>
          <video key={src.video} ref={video} onPlay={hush} className={`mt-3 rounded-2xl bg-navy ${isFlow ? 'mx-auto block aspect-[9/16] max-h-[70vh] w-auto max-w-full' : 'aspect-video w-full'}`} controls playsInline preload="metadata" src={src.video} crossOrigin="anonymous">
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
                  <button type="button" className="ml-2 underline" onClick={() => {
                    video.current?.pause();
                    const voices = window.speechSynthesis?.getVoices();
                    const available = voices?.some((voice) => voice.lang.startsWith(lang));
                    setVoiceMissing(!available);
                    if (available) void say(c.text, { lang: lang === 'en' ? 'en-GB' : 'es-ES' });
                  }}>{ui === 'en' ? 'Listen with device voice' : 'Escuchar con la voz del dispositivo'}</button>
                </li>
              ))}
            </ol>
          </details>
          {voiceMissing && <p role="status" className="mt-2 text-sm font-semibold">{ui === 'en' ? 'No device voice is installed for this language. You can read the transcript.' : 'No hay una voz instalada para este idioma. Puedes leer la transcripción.'}</p>}
        </>
      )}
    </section>
  );
}

function PracticeRoute({ id, t, ui, setUi, accessOf }: { id: string; t: Strings; ui: Ui; setUi: (ui: Ui) => void; accessOf: (id: string) => ModuleAccess }) {
  const [unit, setUnit] = useState<Unit | null>(null);
  const [state, setState] = useState<'loading' | 'locked' | 'error' | 'ok'>('loading');
  const acc = accessOf(id);
  const canOpen = acc.open;
  useEffect(() => {
    if (!canOpen && id !== SAMPLE_MODULE_ID) return setState('locked');
    let cancelled = false;
    void loadModule(id).then((r) => {
      if (cancelled) return;
      if (r.kind === 'ok') {
        setUnit(r.unit);
        setState('ok');
      } else setState(r.kind === 'error' ? 'error' : 'locked');
    }).catch(() => { if (!cancelled) setState('error'); });
    return () => {
      cancelled = true;
    };
  }, [id, canOpen]);
  if (state === 'loading') return <p className="p-6 font-bold" role="status">{t.loading}</p>;
  if (!canOpen || state !== 'ok' || !unit)
    return (
      <div className="mx-auto max-w-3xl px-4 pt-5">
        <ModuleNav id={id} t={t} ui={ui} />
        <div className="mt-4 rounded-2xl bg-white p-4 text-navy" data-vd-paywall="" data-vd-reason={state === 'error' ? 'error' : acc.reason}>
          <p className="font-black">🔒 {t.reasonShort[state === 'error' ? 'error' : acc.reason]}</p>
          <p className="mt-1 font-semibold text-ink">{t.reasonLong[state === 'error' ? 'error' : acc.reason]}</p>
          {state !== 'error' && actionable(acc.reason) && <a href="#/acceso" className="mt-2 inline-block min-h-[44px] py-2 font-black underline" style={{ color: ACCENT }}>{t.howToAccess} →</a>}
        </div>
      </div>
    );
  return <Practice lesson={unit.lessons[0]} moduleId={id} exitHref={`#/modulo/${id}`} t={t} ui={ui} setUi={setUi} accessOf={accessOf} />;
}

/** Closing challenge of a level: exercises from the level's own modules, served only by the access-checked loader. */
function ChallengeRoute({ level, t, ui, setUi, accessOf }: { level: LevelNo; t: Strings; ui: Ui; setUi: (ui: Ui) => void; accessOf: (id: string) => ModuleAccess }) {
  const input = useNextInput(accessOf);
  const ready = levelProgress(level, input.isDone).complete;
  const blocked = levelDef(level).modules.map(accessOf).find((a) => !a.open);
  const [state, setState] = useState<'loading' | 'blocked' | 'error' | 'ok'>('loading');
  const [built, setBuilt] = useState<{ lesson: Lesson; phraseList: Array<{ en: string; es: string }> } | null>(null);
  useEffect(() => {
    if (!ready || blocked) return;
    let cancelled = false;
    void Promise.all(levelDef(level).modules.map((id) => loadModule(id))).then((res) => {
      if (cancelled) return;
      if (res.some((r) => r.kind === 'locked' || r.kind === 'signed-out')) return setState('blocked');
      const units = res.flatMap((r) => (r.kind === 'ok' ? [r.unit] : []));
      if (units.length !== res.length) return setState('error');
      const exercises = buildChallenge(level, units.map((u) => u.lessons[0]));
      if (!exercises.length) return setState('error');
      setBuilt({
        lesson: { id: `reto-nivel-${level}`, title: t.challengeTitle(level), exercises },
        phraseList: units.flatMap((u) => lessonPhraseList(u.lessons[0])),
      });
      setState('ok');
    }).catch(() => { if (!cancelled) setState('error'); });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, ready, blocked?.reason]);
  const box = (key: string, title: string, body: string, reason?: string) => (
    <div className="mx-auto max-w-3xl px-4 pt-5" data-vd-challenge-page={level}>
      <a href="#/" className="inline-block min-h-[44px] rounded-full bg-white px-4 py-3 text-sm font-black text-navy ring-1 ring-ink-line">← {t.allModules}</a>
      <div className="mt-4 rounded-2xl bg-white p-4 text-navy" data-vd-paywall={key === 'blocked' ? '' : undefined} data-vd-reason={reason}>
        <p className="font-black">🏁 {title}</p>
        <p className="mt-1 font-semibold text-ink">{body}</p>
        {key === 'blocked' && reason && actionable(reason) && <a href="#/acceso" className="mt-2 inline-block min-h-[44px] py-2 font-black underline" style={{ color: ACCENT }}>{t.howToAccess} →</a>}
      </div>
    </div>
  );
  if (!ready) return box('locked', t.challengeTitle(level), t.challengeLocked);
  if (blocked?.reason === 'checking') return <p className="p-6 font-bold" role="status">{t.challengeLoading}</p>;
  if (blocked || state === 'blocked') {
    const reason = blocked?.reason ?? 'no-access';
    return box('blocked', t.challengeTitle(level), t.reasonLong[reason], reason);
  }
  if (state === 'loading') return <p className="p-6 font-bold" role="status">{t.challengeLoading}</p>;
  if (state === 'error' || !built) return box('error', t.challengeTitle(level), t.reasonLong.error);
  return <Practice lesson={built.lesson} moduleId={`nivel-${level}`} exitHref="#/" challenge={level} phraseList={built.phraseList} t={t} ui={ui} setUi={setUi} accessOf={accessOf} />;
}

const NATIVE_ENTER = new Set(['BUTTON', 'A', 'SUMMARY', 'SELECT', 'VIDEO', 'AUDIO', 'TEXTAREA']);

function Practice({ lesson, moduleId, exitHref, challenge, phraseList: listProp, t, ui, setUi, accessOf }: {
  lesson: Lesson; moduleId: string; exitHref: string; challenge?: LevelNo; phraseList?: Array<{ en: string; es: string }>;
  t: Strings; ui: Ui; setUi: (ui: Ui) => void; accessOf: (id: string) => ModuleAccess;
}) {
  const copy = useMemo(() => copyFor(ui, 'en'), [ui]);
  const phraseList = useMemo(() => listProp ?? lessonPhraseList(lesson), [lesson, listProp]);
  const phrases = useMemo(() => phraseMap(phraseList), [phraseList]);
  const level = challenge ?? levelOf(moduleId);
  const guide = guideFor(level);
  const here = challenge ? null : OUTLINE_MODULES.find((m) => m.id === moduleId) ?? null;
  const completeLesson = useProgressStore((s) => s.completeLesson);
  const soundOn = useProgressStore((s) => s.soundOn);
  const setSoundOn = useProgressStore((s) => s.setSoundOn);
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
  useEffect(() => () => hush(), [pos, round]);

  const item = plan[pos];
  const exercise = lesson.exercises[item?.index ?? 0];
  const practice = exercise && isPractice(exercise);
  const visibleExercise = ui === 'en' && moduleId === SAMPLE_MODULE_ID ? sampleExerciseInEnglish(exercise) : exercise;
  const total = plan.length;

  const advance = useCallback(() => {
    if (pos + 1 >= plan.length) {
      const mistakes = new Set(missed).size;
      if (challenge) markChallengeDone(challenge);
      else completeLesson({ level: LEVEL, lessonId: lesson.id, xp: lessonXp(firstTry, mistakes), stars: lessonStars(mistakes) });
      setFinished(true);
      return;
    }
    setPos(pos + 1);
    setAttempt(0);
    setRound((r) => r + 1);
    setResponse(null);
    setResult(null);
    setHintLevel(0);
  }, [pos, plan.length, missed, completeLesson, lesson.id, firstTry, challenge]);

  const check = useCallback(() => {
    if (!practice || !response || result) return;
    if (response.kind === 'speech' && response.skipped) return advance();
    const r = checkAnswer(exercise, response);
    if (r.correct) sfx.correct();
    else sfx.wrong();
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
    return (
      <ResultScreen
        t={t} ui={ui} moduleId={moduleId} challenge={challenge} accessOf={accessOf}
        firstTry={firstTry} practiceCount={lesson.exercises.filter(isPractice).length} missedCount={new Set(missed).size}
      />
    );
  }

  const hint = hintLevel ? gradualHint(exercise, hintLevel === 2 ? 2 : 1, ui, response && response.kind === 'text' ? response.value : null) : '';
  return (
    <div className="paper flex min-h-screen flex-col" data-vd-practice={lesson.id}>
      <header className="bg-navy">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3">
          <a href={exitHref} className="flex min-h-[44px] min-w-[44px] items-center justify-center text-2xl font-black text-white/80" aria-label={t.exit}>✕</a>
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-label={t.step(pos + 1, total)} aria-valuemin={0} aria-valuemax={total} aria-valuenow={pos + (result?.final || !practice ? 1 : 0)}>
            <div className="h-full rounded-full transition-all" style={{ width: `${((pos + (result?.final || !practice ? 1 : 0)) / total) * 100}%`, background: ACCENT }} />
          </div>
          <span className="text-sm font-black text-white" aria-hidden>{pos + 1}/{total}</span>
          <button type="button" aria-pressed={soundOn} onClick={() => { setSoundOn(!soundOn); if (!soundOn) sfx.tap(); }} className="min-h-[44px] rounded-full border border-white/40 px-3 text-white">{ui === 'en' ? 'Sound' : 'Sonido'}</button>
          <button type="button" lang={ui === 'es' ? 'en' : 'es'} onClick={() => setUi(ui === 'es' ? 'en' : 'es')} className="min-h-[44px] rounded-full border border-white/40 px-3 font-black text-white">{t.langSwitch}</button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-56 pt-4">
        {item.review && <p className="mb-2 inline-block rounded-full bg-accent-light px-3 py-1 text-xs font-black uppercase tracking-wider" style={{ color: ACCENT }} data-vd-review="">{t.reviewPhase}</p>}
        {practice && guide.context && here && (
          <p className="mb-3 rounded-2xl bg-navy/5 p-3 text-sm font-bold text-navy" data-vd-context="">
            <span className="font-black uppercase tracking-wider text-ink-soft">{t.situation}: </span>{moduleText(here, ui).lesson} · {moduleText(here, ui).objective}
          </p>
        )}
        {practice && guide.phrases !== 'hidden' && phraseList.length > 0 && (
          <details className="mb-3 rounded-2xl bg-white p-3 ring-1 ring-ink-line" open={guide.phrases === 'open'} data-vd-guide-phrases={level ?? ''}>
            <summary className="min-h-[44px] cursor-pointer py-2 font-black text-navy">{t.guidePhrases}</summary>
            <ul className="mt-1 space-y-1">
              {phraseList.map((p) => (
                <li key={p.en} className="text-sm font-semibold text-ink"><span lang="en" className="font-black">{p.en}</span> — {p.es}</li>
              ))}
            </ul>
          </details>
        )}
        {practice && <p className="mb-3 text-lg font-black text-navy">{instructionFor(visibleExercise, copy)}</p>}
        {sitePreview && moduleId === SAMPLE_MODULE_ID && !result && exercise.type === 'multipleChoice' && exercise.answer === 'Nice to meet you too.' && (
          <SampleContextVideo ui={ui} clip="flow" />
        )}
        <ExerciseView key={`${lesson.id}-${pos}-${round}`} exercise={visibleExercise} locked={result !== null} reveal={!result || result.final} correct={result ? result.correct : null} copy={copy} onResponse={setResponse} />
        {sitePreview && moduleId === SAMPLE_MODULE_ID && result?.final && (
          exercise.type === 'multipleChoice' && exercise.answer === 'Nice to meet you too.' ? <SampleContextVideo ui={ui} clip="repaso-saludo" /> :
          exercise.type === 'wordBank' && exercise.answer === "I'm from Spain, from Valencia." ? <SampleContextVideo ui={ui} clip="repaso-origen" /> : null
        )}
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

function SampleContextVideo({ ui, clip }: { ui: Ui; clip: 'flow' | 'repaso-saludo' | 'repaso-origen' }) {
  const labels = {
    flow: ['Ver el saludo', 'Watch the greeting'],
    'repaso-saludo': ['Ver cómo devolver el saludo', 'Watch how to return the greeting'],
    'repaso-origen': ['Ver cómo decir de dónde eres', 'Watch how to say where you are from'],
  };
  const stem = publicMediaPath + 'dia-01-presentaciones-' + clip;
  return (
    <details className="my-3 rounded-2xl bg-white p-3" data-vd-context-video={clip}
      onToggle={(event) => { if (!event.currentTarget.open) event.currentTarget.querySelector('video')?.pause(); }}>
      <summary className="cursor-pointer font-black">{labels[clip][ui === 'en' ? 1 : 0]}</summary>
      <p>{ui === 'en' ? 'Silent video with subtitles.' : 'Vídeo sin voz con subtítulos.'}</p>
      <video className="max-h-[50vh] max-w-full" controls playsInline preload="none" src={stem + '.mp4'} onPlay={hush}>
        <track kind="subtitles" srcLang="es" label="Español" src={stem + '.es.vtt'} default={ui === 'es'} />
        <track kind="subtitles" srcLang="en" label="English" src={stem + '.en.vtt'} default={ui === 'en'} />
      </video>
    </details>
  );
}

/** End of a module or of a level challenge: saved result and the next real step (module, challenge, or why it is blocked). */
function ResultScreen({ t, ui, moduleId, challenge, accessOf, firstTry, practiceCount, missedCount }: {
  t: Strings; ui: Ui; moduleId: string; challenge?: LevelNo; accessOf: (id: string) => ModuleAccess;
  firstTry: number; practiceCount: number; missedCount: number;
}) {
  const input = useNextInput(accessOf);
  const lvl = challenge ?? levelOf(moduleId);
  let act: Activity | null = lvl ? nextActivity(lvl, input) : null;
  if (act?.kind === 'level-complete') {
    const cur = currentLevel(input);
    act = cur ? nextActivity(cur, input) : act;
  }
  return (
    <div className="mx-auto max-w-2xl px-4 pt-10 text-center" data-vd-result="" data-vd-result-kind={challenge ? 'challenge' : 'module'}>
      <p className="text-6xl" aria-hidden>🎉</p>
      <h1 className="mt-3 text-3xl font-black text-navy">{challenge ? t.challengeResult : t.resultTitle}</h1>
      <p className="mt-2 text-lg font-bold text-ink">{t.resultBody(firstTry, practiceCount, missedCount)}</p>
      <p className="mt-1 font-semibold text-brand-dark" role="status">{challenge ? t.challengeSavedNote : t.saved}</p>
      {act && (
        <div className="mx-auto mt-6 max-w-md text-left" data-vd-next-step="">
          <p className="mb-2 text-center text-xs font-black uppercase tracking-wider text-ink-soft">{t.nextStep}</p>
          <div className="flex justify-center"><ActivityCta act={act} t={t} ui={ui} primary /></div>
        </div>
      )}
      <div className="mt-4">
        <a href="#/" className="press inline-flex min-h-[48px] items-center rounded-2xl bg-white px-5 py-3 font-black text-navy ring-1 ring-ink-line">{t.backToModules}</a>
      </div>
    </div>
  );
}
