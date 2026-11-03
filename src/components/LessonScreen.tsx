import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CheckResult, ExerciseResponse, Lesson, LevelDefinition } from '../types';
import { checkAnswer } from '../logic/answer';
import { lessonStars, lessonXp } from '../logic/gamification';
import { useProgressStore } from '../store/useProgressStore';
import { copyFor, instructionFor } from '../lib/copy';
import { pick } from '../lib/util';
import dialogue from '../data/britjoy-dialogue.json';
import { Britjoy, SpeechBubble, type BritjoyExpression } from './Britjoy';
import { Button } from './Button';
import { ExerciseView } from './exercises';

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

export function LessonScreen({ level, lesson, onExit, onFinish }: Props) {
  const copy = copyFor(level.instructionLanguage);
  const hearts = useProgressStore((s) => s.hearts);
  const loseHeart = useProgressStore((s) => s.loseHeart);

  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState<ExerciseResponse | null>(null);
  const [result, setResult] = useState<(CheckResult & { message: string }) | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const exercise = lesson.exercises[index];
  const total = lesson.exercises.length;
  const progress = ((index + (result ? 1 : 0)) / total) * 100;

  const expression: BritjoyExpression = result ? (result.correct ? 'happy' : 'sad') : 'neutral';
  const encouragement = useMemo(() => (index === 0 ? pick(dialogue.tips) : null), [index]);

  const check = useCallback(() => {
    if (!response || result) return;
    const r = checkAnswer(exercise, response);
    setResult({ ...r, message: pick(r.correct ? dialogue.correct : dialogue.wrong) });
    if (r.correct) setCorrectCount((c) => c + 1);
    else {
      setMistakes((m) => m + 1);
      loseHeart();
    }
  }, [exercise, response, result, loseHeart]);

  const next = useCallback(() => {
    if (!result) return;
    const finalCorrect = correctCount;
    const finalMistakes = mistakes;
    if (!result.correct && useProgressStore.getState().hearts <= 0) {
      onFinish({ passed: false, xp: 0, stars: 1, correct: finalCorrect, mistakes: finalMistakes, total });
      return;
    }
    if (index + 1 >= total) {
      onFinish({
        passed: true,
        xp: lessonXp(finalCorrect, finalMistakes),
        stars: lessonStars(finalMistakes),
        correct: finalCorrect,
        mistakes: finalMistakes,
        total,
      });
      return;
    }
    setIndex(index + 1);
    setResponse(null);
    setResult(null);
  }, [result, correctCount, mistakes, index, total, onFinish]);

  // Enter = check / continue.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      // A focused button already handles Enter as a click.
      if (e.target instanceof HTMLElement && e.target.tagName === 'BUTTON') return;
      if (result) next();
      else check();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [check, next, result]);

  const exit = () => {
    if (index === 0 && !result) return onExit();
    if (window.confirm(dialogue.quitConfirm)) onExit();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 pt-5">
        <button onClick={exit} className="text-2xl font-black text-ink-soft" aria-label="Salir de la lección">
          ✕
        </button>
        <div
          className="h-4 flex-1 overflow-hidden rounded-full bg-ink-line"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={index + (result ? 1 : 0)}
        >
          <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <span className="flex items-center gap-1 text-lg font-extrabold text-bad">
          <span aria-hidden>❤️</span>
          {hearts}
        </span>
      </div>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-48 pt-6">
        <div className="mb-5 flex items-end gap-3">
          <Britjoy expression={expression} size={64} className="shrink-0" />
          <SpeechBubble className="flex-1">
            <span className="text-lg font-black">{instructionFor(exercise, copy)}</span>
            {encouragement && !result && <span className="block text-sm font-semibold text-ink-soft">{encouragement}</span>}
          </SpeechBubble>
        </div>
        <ExerciseView
          key={`${lesson.id}-${index}`}
          exercise={exercise}
          locked={result !== null}
          correct={result?.correct ?? null}
          copy={copy}
          onResponse={setResponse}
        />
      </main>

      <footer
        className={`fixed inset-x-0 bottom-0 border-t-2 pb-[env(safe-area-inset-bottom)] ${
          result ? (result.correct ? 'animate-slide-up border-transparent bg-brand-light' : 'animate-slide-up border-transparent bg-bad-light') : 'border-ink-line bg-white'
        }`}
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          {result && (
            <div role="status" className={result.correct ? 'text-brand-dark' : 'text-bad-dark'}>
              <p className="text-xl font-black">{result.correct ? copy.correct : copy.wrong}</p>
              {!result.correct && <p className="text-lg font-bold">{result.correctAnswer}</p>}
              <p className="text-sm font-semibold opacity-90">Britjoy: {result.message}</p>
            </div>
          )}
          {result ? (
            <Button variant={result.correct ? 'primary' : 'danger'} onClick={next} className="sm:min-w-[10rem]">
              {copy.continue}
            </Button>
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
