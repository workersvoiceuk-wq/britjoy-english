import { LEVELS } from '../data/courses/en-es';
import { SITUATION_LEVELS } from '../data/courses/situaciones';
import { SPAIN_LEVELS } from '../data/courses/espana';
import { COLOMBIA_LEVELS } from '../data/courses/colombia';
import { CONSULATE_LEVELS } from '../data/courses/consulados';
import { MIGRATE_UK_LEVELS } from '../data/courses/migrar-uk';
import { CITY_LEVELS } from '../data/courses/ciudades';
import { sfx } from '../lib/sound';
import { isLevelUnlocked, unitCompletionRatio } from '../logic/unlock';
import { completedByLevel, useProgressStore } from '../store/useProgressStore';
import dialogue from '../data/britjoy-dialogue.json';
import { fill } from '../lib/util';
import { useT } from '../i18n';

interface Props {
  onClose: () => void;
}

export function LevelSelector({ onClose }: Props) {
  const { levels, currentLevel, placementLevel, legacyEnglishLevels, setCurrentLevel } = useProgressStore();
  const completed = completedByLevel(levels);
  const t = useT();

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('levels.title')}
        className="animate-slide-up max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black text-navy">{t('levels.title')}</h2>
          <button onClick={onClose} className="rounded-full p-2 text-2xl text-ink-soft" aria-label="Cerrar">
            ✕
          </button>
        </div>
        <h3 className="mb-2 text-sm font-black uppercase tracking-wider text-royal">{t('levels.byLevel')}</h3>
        <ul className="space-y-3">
          {LEVELS.map((level, i) => {
            const unlocked = isLevelUnlocked(LEVELS, level.id, completed, placementLevel, legacyEnglishLevels);
            const lessons = level.units.flatMap((u) => u.lessons);
            const done = lessons.filter((l) => l.id in (completed[level.id] ?? {})).length;
            const unitPct = Math.round(unitCompletionRatio(level, completed[level.id] ?? {}) * 100);
            const active = level.id === currentLevel;
            return (
              <li key={level.id}>
                <button
                  disabled={!unlocked}
                  onClick={() => {
                    setCurrentLevel(level.id);
                    onClose();
                  }}
                  style={{ borderColor: unlocked ? level.accent : undefined }}
                  className={`press flex w-full items-center gap-4 rounded-2xl border-2 border-b-4 p-3 text-left ${
                    unlocked ? 'bg-white' : 'border-ink-line bg-[#F7F7F7] opacity-80'
                  } ${active ? 'ring-4 ring-accent-light' : ''}`}
                >
                  <span
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-black text-white"
                    style={{ background: unlocked ? level.accent : '#AFAFAF' }}
                  >
                    {unlocked ? level.id : '🔒'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-extrabold">
                      {level.id} · {level.name}
                    </span>
                    <span className="block text-sm text-ink-soft">
                      {unlocked
                        ? level.description
                        : fill(dialogue.lockedLevel, { previous: LEVELS[i - 1]?.id ?? '' })}
                    </span>
                    {unlocked && (
                      <span className="mt-2 block">
                        <span className="block h-2.5 overflow-hidden rounded-full bg-ink-line">
                          <span
                            className="block h-full rounded-full transition-all"
                            style={{ width: `${(done / Math.max(1, lessons.length)) * 100}%`, background: level.accent }}
                          />
                        </span>
                        <span className="mt-1 block text-xs font-bold text-ink-soft">
                          {done}/{lessons.length} lecciones · {unitPct}% de unidades
                        </span>
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <h3 className="mb-2 mt-6 text-sm font-black uppercase tracking-wider text-royal">{t('levels.topics')}</h3>
        <ul className="space-y-3">
          {[...SITUATION_LEVELS, ...MIGRATE_UK_LEVELS, ...CONSULATE_LEVELS, ...SPAIN_LEVELS, ...COLOMBIA_LEVELS, ...CITY_LEVELS].map((course) => {
            const lessons = course.units.flatMap((u) => u.lessons);
            const done = lessons.filter((l) => l.id in (completed[course.id] ?? {})).length;
            const active = course.id === currentLevel;
            return (
              <li key={course.id}>
                <button
                  onClick={() => {
                    sfx.tap();
                    setCurrentLevel(course.id);
                    onClose();
                  }}
                  style={{ borderColor: course.accent }}
                  className={`press flex w-full items-center gap-4 rounded-2xl border-2 border-b-4 bg-white p-3 text-left ${active ? 'ring-4 ring-accent-light' : ''}`}
                >
                  <span
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
                    style={{ background: course.accent }}
                    aria-hidden
                  >
                    {course.short?.split(' ')[0]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-extrabold">{course.name}</span>
                    <span className="block text-sm text-ink-soft">{course.description}</span>
                    <span className="mt-2 block">
                      <span className="block h-2.5 overflow-hidden rounded-full bg-ink-line">
                        <span
                          className="block h-full rounded-full transition-all"
                          style={{ width: `${(done / Math.max(1, lessons.length)) * 100}%`, background: course.accent }}
                        />
                      </span>
                      <span className="mt-1 block text-xs font-bold text-ink-soft">
                        {course.units.length} módulos · {done}/{lessons.length} lecciones
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
