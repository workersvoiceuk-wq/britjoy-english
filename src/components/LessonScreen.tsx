import { useCallback, useEffect, useState } from 'react';
import type { CheckResult, Exercise, ExerciseResponse, Lesson, LevelDefinition } from '../types';
import { checkAnswer } from '../logic/answer';
import { lessonStars, lessonXp } from '../logic/gamification';
import { useProgressStore } from '../store/useProgressStore';
import { hasPlus, usePlus } from '../lib/backend';
import { copyFor, instructionFor } from '../lib/copy';
import { narrationFor } from '../lib/narration';
import { hush, narrate, useVoice } from '../lib/narrator';
import { setTargetLanguage, speak } from '../lib/speech';
import { sfx } from '../lib/sound';
import { pick } from '../lib/util';
import dialogue from '../data/britjoy-dialogue.json';
import { Britjoy, SpeechBubble, type BritjoyExpression } from './Britjoy';
import { Button } from './Button';
import { ExerciseView } from './exercises';
import { QuestionVideoHelp } from './QuestionVideoHelp';
import { LessonPrelude, LessonReflection } from './LessonStory';
import {
  extractResponseText,
  feedbackForAttempt,
  gradualHintForExercise,
  honestVisualMechanismForExercise,
  simulateContextualTutorReply,
} from '../logic/lessonStory';

/**
 * Practice first: a question's explanation can contain its answer, so it is offered on explain/dialogue
 * cards (learning content) and on exercises only once they have been checked.
 */
export function shouldOfferQuestionHelp(isExplain: boolean, answered: boolean): boolean {
  return isExplain || answered;
}

export interface LessonOutcome {
  passed: boolean;
  xp: number;
  stars: 1 | 2 | 3;
  correct: number;
  mistakes: number;
  total: number;
}

interface Props {
  level: LevelDefinition;
  lesson: Lesson;
  onExit: () => void;
  onFinish: (outcome: LessonOutcome) => void;
}

const NATIVE_ENTER_TAGS = new Set(['BUTTON', 'A', 'SUMMARY', 'SELECT', 'VIDEO', 'AUDIO']);

export function lessonProgressStep(index: number, hasResult: boolean, isExplain: boolean): number {
  return index + (hasResult || isExplain ? 1 : 0);
}

export function shouldHandleLessonEnterKey(key: string, target: EventTarget | null, practiceActive = true): boolean {
  if (!practiceActive || key !== 'Enter') return false;
  if (!target || typeof target !== 'object') return true;
  const el = target as {
    tagName?: unknown;
    closest?: (selector: string) => unknown;
  };
  if (typeof el.tagName === 'string' && NATIVE_ENTER_TAGS.has(el.tagName.toUpperCase())) {
    return false;
  }
  if (typeof el.closest === 'function' && el.closest('button, a, summary, select, video, audio')) {
    return false;
  }
  return true;
}

function promptLabelForExercise(exercise: Exercise, fallback: string): string {
  if ('prompt' in exercise && exercise.prompt) return exercise.prompt;
  if (exercise.type === 'fillBlank') return exercise.sentence;
  if (exercise.type === 'listening' || exercise.type === 'speak') return exercise.text;
  if (exercise.type === 'explain' || exercise.type === 'dialogue') return exercise.title;
  return fallback;
}

export function LessonScreen({ level, lesson, onExit, onFinish }: Props) {
  const copy = copyFor(level.instructionLanguage, level.targetLanguage);
  const es = level.instructionLanguage === 'es';
  // The language being learnt sets the voice of phrases, listening and speaking exercises.
  setTargetLanguage(level.targetLanguage === 'es' ? 'es-ES' : 'en-GB');
  useEffect(() => () => setTargetLanguage('en-GB'), []);
  const voiceLang = es ? 'es-ES' : 'en-GB';
  const hearts = useProgressStore((s) => s.hearts);
  const plus = usePlus();
  const loseHeart = useProgressStore((s) => s.loseHeart);
  const speaking = useVoice((s) => s.speaking);

  const [index, setIndex] = useState(0);
  const [attemptKey, setAttemptKey] = useState(0);
  const [response, setResponse] = useState<ExerciseResponse | null>(null);
  const [result, setResult] = useState<
    (CheckResult & { message: string; explanation: string; withholdAnswer: boolean; chosenText: string }) | null
  >(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [storyReady, setStoryReady] = useState(false);
  const [prediction, setPrediction] = useState('');
  const [pendingOutcome, setPendingOutcome] = useState<LessonOutcome | null>(null);
  const [simReply, setSimReply] = useState<{ badge: string; reply: string } | null>(null);
  const practiceActive = storyReady && pendingOutcome === null;

  const exercise = lesson.exercises[index];
  // Explanations and dialogues are not graded: they show "Continue" straight away.
  const isExplain = exercise.type === 'explain' || exercise.type === 'dialogue';
  // Busuu-style phases of the lesson (Learn → Dialogue → Check → Practise → Speak), when the content names them.
  const sections = lesson.exercises.reduce<string[]>(
    (acc, e) => (e.section && acc[acc.length - 1] !== e.section ? [...acc, e.section] : acc),
    [],
  );
  const currentSection = sections.lastIndexOf(exercise.section ?? '');
  const total = lesson.exercises.length;
  const completedSteps = lessonProgressStep(index, Boolean(result), isExplain);
  const progress = (completedSteps / total) * 100;
  const expression: BritjoyExpression = result ? (result.correct ? 'celebrating' : 'sad') : 'neutral';

  const taskInstruction = exercise.type === 'explain' ? copy.explainTitle : instructionFor(exercise, copy);
  const taskPrompt = promptLabelForExercise(exercise, taskInstruction);
  const currentChosenText = result?.chosenText || extractResponseText(response);
  const visualMechanism = !isExplain ? honestVisualMechanismForExercise(lesson, exercise, level.instructionLanguage) : null;
  const gradualHint = !isExplain ? gradualHintForExercise(lesson, exercise, level.instructionLanguage) : null;

  // Keep optional AI Mode context synchronized locally (voluntary only; zero network calls).
  useEffect(() => {
    setSimReply(null);
  }, [index, attemptKey]);

  useEffect(() => {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(
          'vum.aiTutorContext.v1',
          JSON.stringify({
            courseId: level.id,
            courseName: level.name,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            question: taskPrompt,
            chosenOption: currentChosenText || null,
            attempted: Boolean(result),
            locale: level.instructionLanguage,
          }),
        );
      }
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, [level.id, level.name, level.instructionLanguage, lesson.id, lesson.title, taskPrompt, currentChosenText, result]);

  // Play start chime on lesson start and target audio on listening exercises; BritJoy voice stays on-demand in Help / 🔊.
  useEffect(() => {
    if (!practiceActive) return;
    let cancelled = false;
    (async () => {
      if (index === 0) sfx.start();
      if (!cancelled && exercise.type === 'listening') await speak(exercise.text);
    })();
    return () => {
      cancelled = true;
      hush();
    };
    // Re-run only when the exercise changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, practiceActive]);

  const advance = useCallback(() => {
    hush();
    if (index + 1 >= total) {
      setPendingOutcome({
        passed: true,
        xp: lessonXp(correctCount, mistakes),
        stars: lessonStars(mistakes),
        correct: correctCount,
        mistakes,
        total,
      });
      return;
    }
    setIndex(index + 1);
    setAttemptKey(0);
    setResponse(null);
    setResult(null);
    setSimReply(null);
  }, [index, total, correctCount, mistakes]);

  const check = useCallback(() => {
    if (!practiceActive || !response || result || isExplain) return;
    hush();
    // "I can't speak right now": skip the speaking exercise without scoring it.
    if (response.kind === 'speech' && response.skipped) {
      advance();
      return;
    }
    const r = checkAnswer(exercise, response);
    const message = pick(r.correct ? dialogue.correct : dialogue.wrong);
    const fb = feedbackForAttempt({
      lesson,
      exercise,
      response,
      result: r,
      locale: level.instructionLanguage,
      attemptNumber: attemptKey,
    });
    setResult({ ...r, message, explanation: fb.explanation, withholdAnswer: fb.withholdAnswer, chosenText: fb.chosenText });
    if (r.correct) {
      sfx.correct();
      setCorrectCount((c) => c + 1);
    } else {
      sfx.wrong();
      setMistakes((m) => m + 1);
      loseHeart();
      window.setTimeout(() => sfx.heart(), 350);
      // Speak canonical answer only when revealed (2nd+ miss), never spoiling a 1st-miss retry.
      if (!fb.withholdAnswer && exercise.type !== 'matching' && useProgressStore.getState().voiceOn) {
        void speak(r.correctAnswer);
      }
    }
  }, [practiceActive, lesson, exercise, response, result, isExplain, loseHeart, level.instructionLanguage, attemptKey, advance]);

  const retry = useCallback(() => {
    if (!practiceActive || !result || result.correct) return;
    hush();
    setResult(null);
    setResponse(null);
    setAttemptKey((k) => k + 1);
  }, [practiceActive, result]);

  const next = useCallback(() => {
    if (!practiceActive) return;
    if (isExplain) return advance();
    if (!result) return;
    if (!result.correct && useProgressStore.getState().hearts <= 0 && !hasPlus()) {
      hush();
      onFinish({ passed: false, xp: 0, stars: 1, correct: correctCount, mistakes, total });
      return;
    }
    advance();
  }, [practiceActive, isExplain, result, advance, correctCount, mistakes, total, onFinish]);

  // Enter = check / continue.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Focused buttons, links and media controls already handle Enter themselves.
      if (!shouldHandleLessonEnterKey(e.key, e.target, practiceActive)) return;
      if (result || isExplain) next();
      else check();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [check, next, result, isExplain, practiceActive]);

  const exit = () => {
    if (index === 0 && !result) {
      hush();
      return onExit();
    }
    if (window.confirm(dialogue.quitConfirm)) {
      hush();
      onExit();
    }
  };

  const repeat = () => void narrate(exercise.type === 'explain' ? exercise.title : narrationFor(exercise, copy), voiceLang);
  const canRetry = Boolean(result && !result.correct && (hearts > 0 || plus));

  const runContextualTutorQa = () => {
    setSimReply(
      simulateContextualTutorReply({
        courseId: level.id,
        courseName: level.name,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        prompt: taskPrompt,
        chosenOption: currentChosenText || null,
        attempted: Boolean(result),
        correct: result ? result.correct : null,
        lesson,
        exercise,
        locale: level.instructionLanguage,
      }),
    );
  };

  if (!storyReady) {
    return (
      <LessonPrelude
        lesson={lesson}
        courseName={level.name}
        locale={level.instructionLanguage}
        onExit={exit}
        onContinue={(text) => {
          setPrediction(text);
          setStoryReady(true);
        }}
      />
    );
  }
  if (pendingOutcome) {
    return (
      <LessonReflection
        lesson={lesson}
        courseName={level.name}
        locale={level.instructionLanguage}
        prediction={prediction}
        onExit={exit}
        onFinish={() => onFinish(pendingOutcome)}
      />
    );
  }

  return (
    <div className="paper flex min-h-screen flex-col">
      <header className="bg-navy">
        <h1 className="sr-only">{lesson.title}</h1>
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3">
          <button onClick={exit} className="text-2xl font-black text-white/80" aria-label="Salir de la lección">
            ✕
          </button>
          <div
            className="h-4 flex-1 overflow-hidden rounded-full bg-white/20"
            role="progressbar"
            aria-label={lesson.title}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={completedSteps}
          >
            <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <span className="flex items-center gap-1 text-lg font-extrabold text-[#FF8A9B]">
            <span aria-hidden>❤️</span>
            {plus ? '∞' : hearts}
          </span>
        </div>
      </header>
      <div className="bunting" aria-hidden />

      <main data-single-task-stage="true" className="mx-auto w-full max-w-2xl flex-1 px-4 pb-6 pt-4">
        {sections.length > 1 && (
          <ol className="mb-3 flex flex-wrap gap-1.5" aria-label="Fases de la lección">
            {sections.map((s, i) => (
              <li
                key={s}
                aria-current={i === currentSection ? 'step' : undefined}
                className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                  i === currentSection ? 'bg-navy text-white' : i < currentSection ? 'bg-brand-light text-brand-dark' : 'bg-navy/5 text-navy/70'
                }`}
              >
                {i < currentSection ? '✓ ' : ''}
                {s}
              </li>
            ))}
          </ol>
        )}

        {/* Clear single-task instruction upfront; BritJoy available on demand in optional Help */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-navy/10 bg-white px-4 py-2.5 shadow-sm">
          <span className="text-base font-black text-navy sm:text-lg">{taskInstruction}</span>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-navy/5 px-2.5 py-0.5 text-xs font-black text-navy/80">
              {index + 1}/{total}
            </span>
            <button
              type="button"
              onClick={repeat}
              className="rounded-xl bg-navy/5 px-2.5 py-1 text-sm font-extrabold text-royal"
              aria-label="Escuchar otra vez"
            >
              🔊
            </button>
          </div>
        </div>

        {/* Honest visual mechanism + gradual hint before solving (never spoils the answer) */}
        {!isExplain && visualMechanism && gradualHint && (
          <div className="mb-3 space-y-2">
            <section
              data-honest-visual-demo="true"
              aria-label={es ? 'Mecanismo visual del ejercicio' : 'Visual mechanism for this task'}
              className="rounded-2xl border-2 border-navy/10 bg-cream/85 px-3.5 py-2.5"
            >
              <div className="grid gap-1.5 sm:grid-cols-3">
                {visualMechanism.steps.map((step, sIdx) => (
                  <p key={sIdx} className="rounded-xl bg-white px-2.5 py-1.5 text-xs font-bold leading-snug text-navy shadow-[0_1px_0_rgba(29,45,92,0.06)]">
                    {step}
                  </p>
                ))}
              </div>
              <p data-honest-media-status="true" className="mt-1.5 text-[11px] font-semibold text-ink-soft">
                {visualMechanism.mediaStatus}
              </p>
            </section>

            <details data-gradual-hint="true" className="rounded-2xl border border-navy/15 bg-white px-3.5 py-2">
              <summary className="cursor-pointer select-none text-xs font-extrabold text-royal">
                {es ? '💡 Ver pista gradual (sin revelar la respuesta)' : '💡 Show gradual hint (without revealing the answer)'}
              </summary>
              <p className="mt-1.5 text-xs font-semibold leading-relaxed text-ink">{gradualHint}</p>
            </details>
          </div>
        )}

        <details data-britjoy-help="true" className="mb-4 rounded-2xl border-2 border-dashed border-navy/20 bg-white/90 px-3.5 py-2">
          <summary className="cursor-pointer select-none text-xs font-extrabold text-navy">
            {es ? '🦁 Ayuda opcional con BritJoy (contextual)' : '🦁 Optional help with BritJoy (contextual)'}
          </summary>
          <div className="mt-2 space-y-2.5">
            <div className="flex items-end gap-2">
              <button type="button" onClick={repeat} aria-label="Repetir la explicación de Britjoy" className="shrink-0">
                <Britjoy expression={expression} speaking={speaking} size={84} />
              </button>
              <SpeechBubble className="mb-2 flex-1">
                <p className="text-sm font-bold text-ink">
                  {result
                    ? result.message
                    : lesson.tip ?? (es ? 'Fíjate en el ejemplo clave antes de elegir tu respuesta.' : 'Check the key example before choosing your answer.')}
                </p>
                <button type="button" onClick={repeat} className="mt-1 text-xs font-extrabold text-royal underline">
                  {es ? '🔊 Escuchar instrucción (1x)' : '🔊 Listen to instruction (1x)'}
                </button>
              </SpeechBubble>
            </div>

            {!isExplain && (
              <div
                data-tutor-context-summary="true"
                className="rounded-xl border border-navy/15 bg-cream/75 px-3 py-2 text-xs font-semibold text-navy"
              >
                <p className="font-extrabold">
                  {es ? 'Contexto detectado:' : 'Detected context:'} {level.id} · {lesson.title}
                </p>
                <p className="mt-0.5 text-ink-soft">
                  {es ? 'Tarea actual:' : 'Current task:'} {taskPrompt}
                  {currentChosenText ? ` · ${es ? 'Opción marcada:' : 'Selected:'} «${currentChosenText}»` : ''}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    data-tutor-sim-btn="true"
                    onClick={runContextualTutorQa}
                    className="rounded-xl border-2 border-royal/30 bg-white px-3 py-1.5 text-xs font-extrabold text-royal hover:border-royal"
                  >
                    {result && !result.correct
                      ? es
                        ? '🧪 Explicar por qué falló mi opción (simulación QA)'
                        : '🧪 Explain why my option failed (QA simulation)'
                      : es
                        ? '🧪 Pedir pista contextual sin resolver (simulación QA)'
                        : '🧪 Ask for non-spoiler contextual hint (QA simulation)'}
                  </button>
                </div>
                {simReply && (
                  <div
                    data-contextual-tutor-qa="true"
                    role="region"
                    aria-label={es ? 'Orientación contextual simulada' : 'Simulated contextual guidance'}
                    className="mt-2 rounded-xl border border-royal/25 bg-white px-3 py-2 text-xs leading-relaxed text-ink"
                  >
                    <p data-tutor-sim-badge="true" className="font-black uppercase tracking-wide text-amber-800">
                      {simReply.badge}
                    </p>
                    <p className="mt-1 font-semibold">{simReply.reply}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </details>

        <ExerciseView
          key={`${lesson.id}-${index}-${attemptKey}`}
          exercise={exercise}
          locked={result !== null}
          withholdAnswer={result?.withholdAnswer}
          correct={result?.correct ?? null}
          copy={copy}
          onResponse={setResponse}
        />
        {shouldOfferQuestionHelp(isExplain, result !== null && !result.withholdAnswer) && (
          <QuestionVideoHelp
            // Own key: sharing ExerciseView's key made React leave stale exercises in the DOM.
            key={`qvh-${lesson.id}-${index}`}
            lessonId={lesson.id}
            questionId={isExplain ? undefined : `${lesson.id}:${index}`}
            locale={level.instructionLanguage}
            targetLanguage={level.targetLanguage || 'en'}
            track={level.track}
            onStopAudio={hush}
          />
        )}
      </main>

      <footer
        data-feedback-state={result ? (result.correct ? 'right' : 'wrong') : 'idle'}
        className={`sticky bottom-0 z-10 border-t-2 pb-[env(safe-area-inset-bottom)] ${
          result
            ? result.correct
              ? 'animate-slide-up border-brand bg-brand-light'
              : 'animate-slide-up border-bad bg-bad-light'
            : 'border-navy/10 bg-white'
        }`}
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          {result && (
            <div role="status" className={result.correct ? 'text-brand-dark' : 'text-bad-dark'}>
              <p className="text-xl font-black">{result.correct ? `✓ ${copy.correct}` : `✗ ${copy.wrong}`}</p>
              {!result.correct && !result.withholdAnswer && (
                <p data-revealed-answer="true" className="text-lg font-extrabold">{result.correctAnswer}</p>
              )}
              <p data-feedback-explanation="true" className="mt-0.5 text-sm font-bold leading-snug">
                {result.explanation}
              </p>
            </div>
          )}
          {isExplain ? (
            <Button variant="accent" onClick={next} block className="sm:ml-auto sm:w-auto sm:min-w-[10rem]">
              {copy.continue}
            </Button>
          ) : result ? (
            <div className="flex flex-wrap gap-2 sm:ml-auto sm:flex-nowrap">
              {canRetry && (
                <Button variant="ghost" onClick={retry} data-retry-exercise="true" className="flex-1 border-2 border-bad/40 bg-white text-bad-dark sm:flex-initial">
                  {es ? 'Intentar de nuevo' : 'Try again'}
                </Button>
              )}
              <Button variant={result.correct ? 'primary' : 'danger'} onClick={next} className="flex-1 sm:min-w-[9.5rem] sm:flex-initial">
                {copy.continue}
              </Button>
            </div>
          ) : (
            <Button variant="accent" disabled={!response} onClick={check} block className="sm:ml-auto sm:w-auto sm:min-w-[10rem]">
              {copy.check}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
