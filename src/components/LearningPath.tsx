import { useMemo, useState } from 'react';
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
  const [helpOpen, setHelpOpen] = useState(false);
  const t = useT();
  const es = level.instructionLanguage === 'es';
  const isLife = level.track === 'life';
  const allLessons = level.units.flatMap((u) => u.lessons);
  const completedCount = allLessons.filter((l) => Boolean(completed[l.id])).length;
  const nextId = nextLessonId(level, completed);
  const nextLesson = allLessons.find((l) => l.id === nextId);
  const fallbackTip = useMemo(() => pick(isLife ? dialogue.lifeTips : dialogue.tips), [isLife]);
  const tip =
    notice ??
    (isLife
      ? fallbackTip
      : nextLesson
        ? nextLesson.tip ?? fallbackTip
        : fill(dialogue.levelDone, { level: level.id }));

  const allDone = !isLife && !nextLesson && level.units.length > 0;

  const britjoyCoach = (
    <button className="w-full text-left" onClick={() => void narrate(tip)} aria-label="Escuchar el consejo de Britjoy">
      <BritjoySays expression={notice ? 'sad' : 'happy'} speaking={speaking} size={96}>
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
  );

  return (
    <div className="paper relative min-h-screen">
      <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 pb-48 pt-4 md:flex-row md:items-start">
        <div className="flex-1">
          {/* Unit menu + clear course objective + preserved progress upfront upon entering course */}
          {level.units.length > 0 && (
            <section
              data-unit-menu="true"
              aria-label={es ? 'Menú de unidades y objetivo del curso' : 'Unit menu and course goal'}
              className="mb-5 rounded-2xl border-2 border-navy/12 bg-white p-4 shadow-[0_3px_0_rgba(29,45,92,0.08)]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xs font-black uppercase tracking-wider text-royal">
                  {es ? '🎯 Objetivo claro del curso' : '🎯 Clear course goal'}
                </p>
                <span className="rounded-full bg-navy/5 px-2.5 py-0.5 text-xs font-extrabold text-navy">
                  {completedCount} / {allLessons.length} {es ? 'lecciones' : 'lessons'}
                </span>
              </div>
              <p data-course-objective="true" className="mt-1 text-sm font-bold leading-snug text-navy">
                {level.description}
              </p>
              <progress
                max={Math.max(1, allLessons.length)}
                value={completedCount}
                aria-label={`${level.name} · ${completedCount}/${allLessons.length}`}
                className="mt-2 h-2 w-full overflow-hidden rounded-full accent-accent"
              />
              <p className="mt-3 text-xs font-black uppercase tracking-wider text-ink-soft">
                {es ? 'Menú de unidades' : 'Units menu'} ({level.units.length})
              </p>
              <nav aria-label={es ? 'Ir a unidad' : 'Jump to unit'} className="mt-2 flex flex-wrap gap-2">
                {level.units.map((unit, uIdx) => {
                  const doneInUnit = unit.lessons.filter((l) => Boolean(completed[l.id])).length;
                  const hasVideo = unit.lessons.some((l) => l.exercises.some((ex) => ex.type === 'explain' && Boolean(ex.video)));
                  return (
                    <a
                      key={`${unit.unit}-${uIdx}`}
                      href={`#unit-${uIdx + 1}`}
                      title={unit.title}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border-2 border-navy/15 bg-cream/70 px-3 py-1.5 text-xs font-extrabold text-navy hover:border-royal hover:bg-white"
                    >
                      {unit.icon && <span aria-hidden>{unit.icon}</span>}
                      <span>{unit.unit}</span>
                      {hasVideo && <span title={es ? 'Incluye vídeo demostrativo' : 'Includes demo video'} aria-hidden>🎬</span>}
                      <span className="rounded-full bg-navy/10 px-1.5 py-0.5 text-[11px] font-black">
                        {doneInUnit}/{unit.lessons.length}
                      </span>
                    </a>
                  );
                })}
              </nav>
            </section>
          )}

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
            <section key={unit.unit} id={`unit-${unitIndex + 1}`} className="mb-10 scroll-mt-24">
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

        <aside className="md:sticky md:top-28 md:w-72 md:shrink-0" aria-live="polite">
          {notice ? (
            britjoyCoach
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-navy/20 bg-white/95 p-3 shadow-sm">
              <button
                type="button"
                data-britjoy-path-help="true"
                aria-expanded={helpOpen}
                onClick={() => setHelpOpen((v) => !v)}
                className="flex w-full items-center justify-between text-left text-sm font-extrabold text-navy"
              >
                <span>{es ? '🦁 Ayuda opcional con BritJoy' : '🦁 Optional help with BritJoy'}</span>
                <span aria-hidden>{helpOpen ? '▲' : '▼'}</span>
              </button>
              {helpOpen && <div className="mt-3">{britjoyCoach}</div>}
            </div>
          )}
        </aside>
      </div>
      <LondonSkyline className="pointer-events-none absolute inset-x-0 bottom-16 h-40 w-full" />
    </div>
  );
}
