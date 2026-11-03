import type { LevelDefinition } from '../types';
import { isLessonUnlocked, nextLessonId } from '../logic/unlock';
import type { LessonRecord } from '../store/useProgressStore';
import { BritjoySays } from './Britjoy';
import dialogue from '../data/britjoy-dialogue.json';
import { fill, pick } from '../lib/util';
import { useMemo } from 'react';

interface Props {
  level: LevelDefinition;
  completed: Record<string, LessonRecord>;
  onStart: (lessonId: string) => void;
  /** Overrides Britjoy's tip (e.g. "no hearts left"). */
  notice?: string | null;
}

// Horizontal offsets that create the winding path (in px).
const OFFSETS = [0, 44, 72, 44, 0, -44, -72, -44];

export function LearningPath({ level, completed, onStart, notice }: Props) {
  const nextId = nextLessonId(level, completed);
  const nextLesson = level.units.flatMap((u) => u.lessons).find((l) => l.id === nextId);
  const fallbackTip = useMemo(() => pick(dialogue.tips), []);
  const tip = notice ?? (nextLesson ? nextLesson.tip ?? fallbackTip : fill(dialogue.levelDone, { level: level.id }));

  let position = 0;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pb-24 pt-4 md:flex-row-reverse md:items-start">
      <aside className="md:sticky md:top-20 md:w-72 md:shrink-0" aria-live="polite">
        <BritjoySays expression={notice ? 'sad' : 'happy'}>
          {nextLesson && !notice && (
            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-accent-dark">
              Próxima: {nextLesson.title}
            </span>
          )}
          {tip}
        </BritjoySays>
      </aside>

      <main className="flex-1">
        {level.units.map((unit) => (
          <section key={unit.unit} className="mb-10">
            <div className="mb-8 rounded-2xl border-b-4 border-accent-dark bg-accent px-5 py-4 text-white">
              <p className="text-sm font-extrabold uppercase opacity-90">
                {level.id} · {unit.unit.replace('Unit', 'Unidad')}
              </p>
              <h2 className="text-xl font-black">{unit.title}</h2>
            </div>

            <ol className="relative flex flex-col items-center gap-7">
              {unit.lessons.map((lesson) => {
                const offset = OFFSETS[position++ % OFFSETS.length];
                const record = completed[lesson.id];
                const unlocked = isLessonUnlocked(level, lesson.id, completed);
                const isNext = lesson.id === nextId;
                const state = record ? 'completed' : unlocked ? 'unlocked' : 'locked';
                return (
                  <li key={lesson.id} className={`relative flex flex-col items-center ${isNext ? 'mt-8' : ''}`} style={{ transform: `translateX(${offset}px)` }}>
                    {isNext && (
                      <span className="animate-float absolute -top-9 z-10 whitespace-nowrap rounded-xl border-2 border-ink-line bg-white px-3 py-1 text-sm font-black uppercase text-accent-dark">
                        Empezar
                      </span>
                    )}
                    <button
                      disabled={state === 'locked'}
                      onClick={() => onStart(lesson.id)}
                      aria-label={`${lesson.title} (${
                        state === 'completed' ? 'completada' : state === 'unlocked' ? 'disponible' : 'bloqueada'
                      })`}
                      className={`press flex items-center justify-center rounded-full border-b-[6px] text-3xl font-black ${
                        isNext ? 'h-20 w-20 ring-8 ring-accent-light' : 'h-[72px] w-[72px]'
                      } ${
                        state === 'locked'
                          ? 'border-[#B7B7B7] bg-[#E5E5E5] text-[#AFAFAF]'
                          : state === 'completed'
                            ? 'border-[#E0A800] bg-[#FFC800] text-white'
                            : 'border-accent-dark bg-accent text-white'
                      }`}
                    >
                      {state === 'locked' ? '🔒' : state === 'completed' ? '✓' : '★'}
                    </button>
                    {record && (
                      <span className="mt-1 text-sm leading-none tracking-tight" aria-label={`${record.stars} estrellas`}>
                        {[1, 2, 3].map((s) => (
                          <span key={s} className={s <= record.stars ? 'text-[#FFC800]' : 'text-ink-line'}>
                            ★
                          </span>
                        ))}
                      </span>
                    )}
                    <span className="mt-1 max-w-[9rem] text-center text-sm font-extrabold text-ink-soft">{lesson.title}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </main>
    </div>
  );
}
