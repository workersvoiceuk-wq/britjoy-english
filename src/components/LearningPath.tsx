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
import { useT } from '../i18n';

interface Props {
  level: LevelDefinition;
  completed: Record<string, LessonRecord>;
  onStart: (lessonId: string) => void;
  /** Overrides Britjoy's tip (e.g. "no hearts left"). */
  notice?: string | null;
}


export function LearningPath({ level, completed, onStart, notice }: Props) {
  const speaking = useVoice((s) => s.speaking);
  const t = useT();
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

  const allDone = !isLife && !nextLesson && level.units.length > 0;

  return (
    <div className="paper relative min-h-screen">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pb-48 pt-4 md:flex-row-reverse md:items-start">
        <aside className="md:sticky md:top-28 md:w-72 md:shrink-0" aria-live="polite">
          <button className="w-full text-left" onClick={() => void narrate(tip)} aria-label="Escuchar el consejo de Britjoy">
            <BritjoySays expression={notice ? 'sad' : 'happy'} speaking={speaking} size={112}>
              {nextLesson && !notice && !isLife && (
                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-royal">
                  {t('path.next')}: {nextLesson.title}
                </span>
              )}
              {isLife && !notice && (
                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-royal">Vivir en UK</span>
              )}
              {tip}
              <span className="mt-1 block text-xs font-bold text-ink-soft">🔊 {t('path.tapToListen')}</span>
            </BritjoySays>
          </button>
        </aside>

        <div className="flex-1">
          {/* Departures board: the next lesson, like a station's dot-matrix display. */}
          {!isLife && level.units.length > 0 && (
            <div className="departures mb-6 rounded-xl p-3" role="status">
              <p className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                <span>{t('path.departures')} · {t('path.line')} {level.short ?? level.id}</span>
                <span aria-hidden>●●●</span>
              </p>
              <p className="dot-matrix mt-1 truncate text-lg">
                {allDone ? t('path.terminus') : `${t('path.nextStation')}: ${nextLesson?.title ?? ''}`}
              </p>
              {!allDone && <p className="dot-matrix text-sm opacity-80">{t('path.arriving')}…</p>}
            </div>
          )}
          {level.units.length === 0 && (
            <p className="rounded-2xl bg-white p-5 text-center font-bold text-ink-soft">{t('path.soon')}</p>
          )}
          {level.units.map((unit, unitIndex) => (
            <section key={unit.unit} className="mb-10">
              {/* Line board: the unit is a zone of the line. */}
              <div className="line-board mb-5 overflow-hidden rounded-xl">
                <span className="block h-2 bg-accent" aria-hidden />
                <div className="px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-gold-light">
                    {isLife
                      ? 'Vivir en UK'
                      : level.track === 'english'
                        ? `${t('path.line')} ${level.id} · ${t('path.zone')} ${unitIndex + 1}`
                        : `${level.name} · ${unit.unit}`}
                  </p>
                  <h2 className="text-xl font-black uppercase tracking-wide text-white">
                    {unit.icon && <span className="me-2" aria-hidden>{unit.icon}</span>}
                    {unit.title}
                  </h2>
                </div>
              </div>

              <ol className="tube-line relative">
                {unit.lessons.map((lesson, i) => {
                  const record = completed[lesson.id];
                  const unlocked = isLessonUnlocked(level, lesson.id, completed);
                  const isNext = !isLife && lesson.id === nextId;
                  const state = record ? 'completed' : unlocked ? 'unlocked' : 'locked';
                  const last = i === unit.lessons.length - 1;
                  return (
                    <li key={lesson.id} className="relative">
                      {/* Track to the next station: solid once travelled, dashed while closed. */}
                      {!last && (
                        <span
                          aria-hidden
                          className={`absolute start-[26px] top-9 h-full w-[10px] rounded-full ${
                            record ? 'bg-accent' : 'track-closed'
                          }`}
                        />
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
                        className="press group relative flex w-full items-center gap-4 py-2 text-start disabled:cursor-not-allowed"
                      >
                        {/* Station marker */}
                        <span
                          aria-hidden
                          className={`relative z-10 flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-full border-[7px] text-2xl font-black ${
                            state === 'locked'
                              ? 'border-[#BDBDBD] bg-[#EEEEEE] text-[#9E9E9E]'
                              : state === 'completed'
                                ? 'border-accent bg-white text-accent'
                                : 'border-accent bg-white text-accent'
                          } ${isNext ? 'station-next' : ''}`}
                        >
                          {state === 'locked' ? '🔒' : state === 'completed' ? '✓' : lesson.icon ?? '★'}
                        </span>
                        {/* Station name board */}
                        <span
                          className={`station-name flex-1 rounded-lg px-3 py-2 ${
                            state === 'locked' ? 'opacity-70' : ''
                          } ${isNext ? 'ring-4 ring-gold' : ''}`}
                        >
                          {isNext && (
                            <span className="mb-0.5 block text-[11px] font-black uppercase tracking-[0.18em] text-royal">
                              {t('path.nextStation')} · {t('path.start')}
                            </span>
                          )}
                          <span className="block text-base font-black text-ink">{lesson.title}</span>
                          {record ? (
                            <span className="text-sm leading-none" aria-label={`${record.stars} estrellas`}>
                              {[1, 2, 3].map((s) => (
                                <span key={s} className={s <= record.stars ? 'text-gold-dark' : 'text-ink-line'}>
                                  ★
                                </span>
                              ))}
                            </span>
                          ) : (
                            state === 'locked' && (
                              <span className="text-xs font-bold text-ink-soft">{t('path.closed')}</span>
                            )
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      </div>
      <LondonSkyline className="pointer-events-none absolute inset-x-0 bottom-16 h-40 w-full" />
    </div>
  );
}
