import { useMemo } from 'react';
import type { LevelDefinition } from '../types';
import { isLessonUnlocked, nextLessonId } from '../logic/unlock';
import type { LessonRecord } from '../store/useProgressStore';
import { BritjoySays } from './Britjoy';
import { LondonSkyline } from './LondonSkyline';
import dialogue from '../data/britjoy-dialogue.json';
import { fill, pick } from '../lib/util';
import { narrate, useVoice } from '../lib/narrator';
import { sfx } from '../lib/sound';

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
  const speaking = useVoice((s) => s.speaking);
  const isLife = level.track === 'life';
  const nextId = nextLessonId(level, completed);
  const nextLesson = level.units.flatMap((u) => u.lessons).find((l) => l.id === nextId);
  const fallbackTip = useMemo(() => pick(isLife ? dialogue.lifeTips : dialogue.tips), [isLife]);
  const tip =
    notice ??
    (isLife
      ? fallbackTip
      : nextLesson
        ? nextLesson.tip ?? fallbackTip
        : fill(dialogue.levelDone, { level: level.id }));

  let position = 0;

  return (
    <div className="paper relative min-h-screen">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pb-48 pt-4 md:flex-row-reverse md:items-start">
        <aside className="md:sticky md:top-28 md:w-72 md:shrink-0" aria-live="polite">
          <button className="w-full text-left" onClick={() => void narrate(tip)} aria-label="Escuchar el consejo de Britjoy">
            <BritjoySays expression={notice ? 'sad' : 'happy'} speaking={speaking} size={112}>
              {nextLesson && !notice && !isLife && (
                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-royal">
                  Próxima: {nextLesson.title}
                </span>
              )}
              {isLife && !notice && (
                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-royal">Vivir en UK</span>
              )}
              {tip}
              <span className="mt-1 block text-xs font-bold text-ink-soft">🔊 Toca para escucharme</span>
            </BritjoySays>
          </button>
        </aside>

        <main className="flex-1">
          {level.units.length === 0 && (
            <p className="rounded-2xl bg-white p-5 text-center font-bold text-ink-soft">Muy pronto: nuevas lecciones.</p>
          )}
          {level.units.map((unit) => (
            <section key={unit.unit} className="mb-12">
              <div className="street-sign mb-9 px-5 py-3 text-center">
                <p className="district text-xs font-black uppercase tracking-[0.2em]">
                  {isLife ? 'Vivir en UK' : `${level.id} · ${unit.unit.replace('Unit', 'Unidad')}`}
                </p>
                <h2 className="text-xl font-black uppercase tracking-wide text-navy">
                  {unit.icon && <span className="mr-2" aria-hidden>{unit.icon}</span>}
                  {unit.title}
                </h2>
              </div>

              <ol className="relative flex flex-col items-center gap-7">
                {unit.lessons.map((lesson) => {
                  const offset = OFFSETS[position++ % OFFSETS.length];
                  const record = completed[lesson.id];
                  const unlocked = isLessonUnlocked(level, lesson.id, completed);
                  const isNext = !isLife && lesson.id === nextId;
                  const state = record ? 'completed' : unlocked ? 'unlocked' : 'locked';
                  const face = state === 'locked' ? '🔒' : state === 'completed' ? '✓' : lesson.icon ?? '★';
                  return (
                    <li
                      key={lesson.id}
                      className={`relative flex flex-col items-center ${isNext ? 'mt-8' : ''}`}
                      style={{ transform: `translateX(${offset}px)` }}
                    >
                      {isNext && (
                        <span className="animate-float absolute -top-9 z-10 whitespace-nowrap rounded-xl border-2 border-navy/15 bg-white px-3 py-1 text-sm font-black uppercase text-royal">
                          Empezar
                        </span>
                      )}
                      <button
                        disabled={state === 'locked'}
                        onClick={() => {
                          sfx.tap();
                          onStart(lesson.id);
                        }}
                        aria-label={`${lesson.title} (${
                          state === 'completed' ? 'completada' : state === 'unlocked' ? 'disponible' : 'bloqueada'
                        })`}
                        className={`press flex items-center justify-center rounded-full border-b-[6px] text-3xl font-black ${
                          isNext ? 'h-20 w-20 ring-8 ring-accent-light' : 'h-[72px] w-[72px]'
                        } ${
                          state === 'locked'
                            ? 'border-[#B7B7B7] bg-[#E5E5E5] text-[#AFAFAF]'
                            : state === 'completed'
                              ? 'border-gold-dark bg-gold text-white'
                              : 'border-accent-dark bg-accent text-white'
                        }`}
                      >
                        {face}
                      </button>
                      {record && (
                        <span className="mt-1 text-sm leading-none tracking-tight" aria-label={`${record.stars} estrellas`}>
                          {[1, 2, 3].map((s) => (
                            <span key={s} className={s <= record.stars ? 'text-gold' : 'text-ink-line'}>
                              ★
                            </span>
                          ))}
                        </span>
                      )}
                      <span className="mt-1 max-w-[10rem] text-center text-sm font-extrabold text-navy/70">{lesson.title}</span>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </main>
      </div>
      <LondonSkyline className="pointer-events-none absolute inset-x-0 bottom-16 h-40 w-full" />
    </div>
  );
}
