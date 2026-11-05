import { Suspense, lazy, useEffect, useState, type CSSProperties } from 'react';
import { ALL_LEVELS, LEVELS, findLesson, getLevel } from './data/courses/en-es';
import { LIFE_LEVEL } from './data/courses/vivir-uk';
import { isLevelUnlocked } from './logic/unlock';
import { msUntilNextHeart } from './logic/gamification';
import { completedByLevel, useProgressStore } from './store/useProgressStore';
import { fill, formatDuration } from './lib/util';
import dialogue from './data/britjoy-dialogue.json';
import type { LevelDefinition } from './types';
import { Header } from './components/Header';
import { LearningPath } from './components/LearningPath';
const LevelSelector = lazy(() => import('./components/LevelSelector').then((m) => ({ default: m.LevelSelector })));
const PlacementQuiz = lazy(() => import('./components/PlacementQuiz').then((m) => ({ default: m.PlacementQuiz })));
import type { LessonOutcome } from './components/LessonScreen';
const LessonScreen = lazy(() => import('./components/LessonScreen').then((m) => ({ default: m.LessonScreen })));
const LessonResult = lazy(() => import('./components/LessonResult').then((m) => ({ default: m.LessonResult })));
import { BottomNav } from './components/BottomNav';
const ResourcesScreen = lazy(() => import('./components/ResourcesScreen').then((m) => ({ default: m.ResourcesScreen })));
const PlusScreen = lazy(() => import('./components/PlusScreen').then((m) => ({ default: m.PlusScreen })));
const SettingsScreen = lazy(() => import('./components/SettingsScreen').then((m) => ({ default: m.SettingsScreen })));
const StudyPlanScreen = lazy(() => import('./components/StudyTools').then((m) => ({ default: m.StudyPlanScreen })));
const ReviewScreen = lazy(() => import('./components/StudyTools').then((m) => ({ default: m.ReviewScreen })));
const LocalScreen = lazy(() => import('./components/LocalScreen').then((m) => ({ default: m.LocalScreen })));
const AiScreen = lazy(() => import('./components/AiScreen').then((m) => ({ default: m.AiScreen })));
import { AcademyScreen } from './components/AcademyScreen';
import { LanguagePicker } from './components/LanguagePicker';
import { LANGUAGES, isRtl, translate, type UiLang } from './i18n';

const isUiLang = (l: string): l is UiLang => LANGUAGES.some((x) => x.code === l);
import { backendConfigured, getSupabase, hasPlus, refreshProfile, useAccount } from './lib/backend';

type Screen =
  | { name: 'home' }
  | { name: 'lesson'; lessonId: string }
  | { name: 'result'; lessonId: string; outcome: LessonOutcome };

function accentStyle(level: LevelDefinition): CSSProperties {
  return {
    '--accent': level.accent,
    '--accent-dark': level.accentDark,
    '--accent-light': level.accentLight,
  } as CSSProperties;
}

function AppScreens() {
  const store = useProgressStore();
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [showLevels, setShowLevels] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Heart regeneration + clock tick.
  useEffect(() => {
    store.syncHearts();
    const id = window.setInterval(() => {
      setNow(Date.now());
      useProgressStore.getState().syncHearts();
    }, 30_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guard: never sit on a course/level that is (no longer) unlocked.
  const completed = completedByLevel(store.levels);
  const current = getLevel(store.currentLevel);
  const unlockedCurrent = current.track !== 'life' && isLevelUnlocked(ALL_LEVELS, store.currentLevel, completed, store.placementLevel);
  const englishLevel = unlockedCurrent ? current : LEVELS[0];

  useEffect(() => setNotice(null), [store.hearts, store.currentLevel, store.tab]);

  // Interface language: <html lang/dir> follow the learner's choice (RTL for Arabic and Urdu).
  const uiLang = (store.uiLang ?? 'es') as UiLang;
  useEffect(() => {
    document.documentElement.lang = uiLang;
    document.documentElement.dir = isRtl(uiLang) ? 'rtl' : 'ltr';
  }, [uiLang]);

  // Deep links from other sites (e.g. vozunidamundo.com): ?curso=<catalogue id> opens that course
  // straight away, skipping the placement test; ?lang=xx preselects the interface language.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('curso');
    const lang = params.get('lang');
    if (!courseId && !lang) return;
    void import('./data/catalog').then(({ CATALOG }) => {
      const st = useProgressStore.getState();
      if (lang && !st.uiLang && isUiLang(lang)) st.setUiLang(lang);
      const course = CATALOG.find((c) => c.id === courseId);
      if (course) {
        if (!st.placementDone) useProgressStore.setState({ placementDone: true });
        if (course.open.tab === 'english') {
          st.setCurrentLevel(course.open.level);
          st.setTab('english');
        } else st.setTab(course.open.tab);
      }
      params.delete('curso');
      params.delete('lang');
      const rest = params.toString();
      window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : ''));
    });
  }, []);

  // Account: keep VUM Academy and AI credits in sync; after Stripe Checkout the web
  // returns with ?plus=ok|cancel, which opens the Plus screen.
  const [checkout, setCheckout] = useState<'ok' | 'cancel' | null>(null);
  useEffect(() => {
    if (!backendConfigured) return;
    const params = new URLSearchParams(window.location.search);
    const result = params.get('plus');
    if (result === 'ok' || result === 'cancel') {
      setCheckout(result);
      useProgressStore.getState().setTab('plus');
      window.history.replaceState(null, '', window.location.pathname);
      // The webhook may take a few seconds to grant the purchase.
      if (result === 'ok') [3000, 8000, 20000].forEach((ms) => window.setTimeout(() => void refreshProfile(), ms));
    }
    // Only signed-in learners load the account code at start-up.
    if (!useAccount.getState().email && !result) return;
    let unsubscribe = () => {};
    void getSupabase().then((supabase) => {
      if (!supabase) return;
      void refreshProfile();
      const { data } = supabase.auth.onAuthStateChange(() => void refreshProfile());
      unsubscribe = () => data.subscription.unsubscribe();
    });
    return () => unsubscribe();
  }, []);

  if (!store.uiLang) return <LanguagePicker />;


  if (!store.placementDone) {
    return (
      <main style={accentStyle(LEVELS[0])}>
        <PlacementQuiz onFinish={(lvl) => store.completePlacement(lvl)} />
      </main>
    );
  }

  const startLesson = (lessonId: string) => {
    store.syncHearts();
    const { hearts, heartsSince } = useProgressStore.getState();
    if (hearts <= 0 && !hasPlus()) {
      setNotice(fill(dialogue.noHeartsToStart, { time: formatDuration(msUntilNextHeart(hearts, heartsSince, Date.now())) }));
      return;
    }
    setScreen({ name: 'lesson', lessonId });
  };

  const found = screen.name === 'home' ? null : findLesson(screen.lessonId);
  if (found && (screen.name === 'lesson' || screen.name === 'result')) {
    return (
      <div style={accentStyle(found.level)}>
        {screen.name === 'lesson' ? (
          <LessonScreen
            level={found.level}
            lesson={found.lesson}
            onExit={() => setScreen({ name: 'home' })}
            onFinish={(outcome) => {
              if (outcome.passed) {
                store.completeLesson({ level: found.level.id, lessonId: found.lesson.id, xp: outcome.xp, stars: outcome.stars });
              }
              setNow(Date.now());
              setScreen({ name: 'result', lessonId: found.lesson.id, outcome });
            }}
          />
        ) : (
          <LessonResult outcome={screen.outcome} lessonTitle={found.lesson.title} onContinue={() => setScreen({ name: 'home' })} />
        )}
      </div>
    );
  }

  const tab = store.tab;
  const pathLevel = tab === 'life' ? LIFE_LEVEL : englishLevel;

  return (
    <div style={accentStyle(pathLevel)} className="paper min-h-screen">
      <Header
        now={now}
        level={tab === 'english' ? englishLevel : undefined}
        titleIsHeading={tab !== 'home'}
        onOpenLevels={() => setShowLevels(true)}
        title={translate(uiLang, ({ home: 'title.home', english: 'nav.learn', life: 'nav.life', ai: 'nav.ai', resources: 'title.resources', settings: 'nav.more', plus: 'plus.title', plan: 'plan.title', review: 'review.title', local: 'local.title' } as const)[tab])}
      />
      <main id="contenido">
      {(tab === 'english' || tab === 'life') && (
        <LearningPath level={pathLevel} completed={completed[pathLevel.id] ?? {}} onStart={startLesson} notice={notice} />
      )}
      {tab === 'home' && <AcademyScreen />}
      {tab === 'ai' && <AiScreen />}
      {tab === 'resources' && <ResourcesScreen />}
      {tab === 'settings' && <SettingsScreen />}
      {tab === 'plus' && <PlusScreen checkout={checkout} />}
      {tab === 'plan' && <StudyPlanScreen />}
      {tab === 'local' && <LocalScreen />}
      {tab === 'review' && <ReviewScreen />}
      </main>
      <BottomNav />
      {showLevels && <LevelSelector onClose={() => setShowLevels(false)} />}
    </div>
  );
}

/** Screens load on demand (code splitting); this shows while a screen's code arrives. */
function Loading() {
  return (
    <div className="paper flex min-h-screen items-center justify-center" role="status" aria-live="polite">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-navy/20 border-t-royal" aria-hidden />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <AppScreens />
    </Suspense>
  );
}
