import { LEVELS } from '../data/courses/en-es';
import { isLevelUnlocked, unitCompletionRatio } from '../logic/unlock';
import { completedByLevel, useProgressStore } from '../store/useProgressStore';
import dialogue from '../data/britjoy-dialogue.json';
import { fill } from '../lib/util';

interface Props {
  onClose: () => void;
}

export function LevelSelector({ onClose }: Props) {
  const { levels, currentLevel, placementLevel, setCurrentLevel } = useProgressStore();
  const completed = completedByLevel(levels);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Elige tu nivel"
        className="animate-slide-up max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black">Elige tu nivel</h2>
          <button onClick={onClose} className="rounded-full p-2 text-2xl text-ink-soft" aria-label="Cerrar">
            ✕
          </button>
        </div>
        <ul className="space-y-3">
          {LEVELS.map((level, i) => {
            const unlocked = isLevelUnlocked(LEVELS, level.id, completed, placementLevel);
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
      </div>
    </div>
  );
}
