import { useEffect, useState, type CSSProperties } from 'react';
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
import { LevelSelector } from './components/LevelSelector';
import { PlacementQuiz } from './components/PlacementQuiz';
import { LessonScreen, type LessonOutcome } from './components/LessonScreen';
import { LessonResult } from './components/LessonResult';
import { BottomNav } from './components/BottomNav';
import { ResourcesScreen } from './components/ResourcesScreen';
import { SettingsScreen } from './components/SettingsScreen';

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

export default function App() {
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

  if (!store.placementDone) {
    return (
      <div style={accentStyle(LEVELS[0])}>
        <PlacementQuiz onFinish={(lvl) => store.completePlacement(lvl)} />
      </div>
    );
  }

  const startLesson = (lessonId: string) => {
    store.syncHearts();
    const { hearts, heartsSince } = useProgressStore.getState();
    if (hearts <= 0) {
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
        onOpenLevels={() => setShowLevels(true)}
        title={{ english: 'Inglés', life: 'Vivir en UK', resources: 'Recursos', settings: 'Ajustes' }[tab]}
      />
      {(tab === 'english' || tab === 'life') && (
        <LearningPath level={pathLevel} completed={completed[pathLevel.id] ?? {}} onStart={startLesson} notice={notice} />
      )}
      {tab === 'resources' && <ResourcesScreen />}
      {tab === 'settings' && <SettingsScreen />}
      <BottomNav />
      {showLevels && <LevelSelector onClose={() => setShowLevels(false)} />}
    </div>
  );
}
