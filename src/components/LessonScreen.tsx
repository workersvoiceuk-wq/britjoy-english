import { useCallback, useEffect, useState } from 'react';
import type { CheckResult, ExerciseResponse, Lesson, LevelDefinition } from '../types';
import { checkAnswer } from '../logic/answer';
import { lessonStars, lessonXp } from '../logic/gamification';
import { useProgressStore } from '../store/useProgressStore';
import { copyFor, instructionFor } from '../lib/copy';
import { narrationFor } from '../lib/narration';
import { hush, narrate, useVoice } from '../lib/narrator';
import { speak } from '../lib/speech';
import { sfx } from '../lib/sound';
import { fill, pick } from '../lib/util';
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

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

export function LessonScreen({ level, lesson, onExit, onFinish }: Props) {
  const copy = copyFor(level.instructionLanguage);
  const voiceLang = level.instructionLanguage === 'es' ? 'es-ES' : 'en-GB';
  const hearts = useProgressStore((s) => s.hearts);
  const loseHeart = useProgressStore((s) => s.loseHeart);
  const speaking = useVoice((s) => s.speaking);

  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState<ExerciseResponse | null>(null);
  const [result, setResult] = useState<(CheckResult & { message: string }) | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const exercise = lesson.exercises[index];
  const isExplain = exercise.type === 'explain';
  const total = lesson.exercises.length;
  const progress = ((index + (result || isExplain ? 1 : 0)) / total) * 100;
  const expression: BritjoyExpression = result ? (result.correct ? 'celebrating' : 'sad') : 'neutral';

  // Britjoy introduces the lesson and explains each activity aloud.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (index === 0) {
        sfx.start();
        if (useProgressStore.getState().soundOn) await wait(1500);
        if (cancelled) return;
        await narrate(fill(dialogue.lessonIntro, { title: lesson.title }), voiceLang);
      }
      if (cancelled) return;
      await narrate(narrationFor(exercise, copy), voiceLang);
      if (!cancelled && exercise.type === 'listening') await speak(exercise.text);
    })();
    return () => {
      cancelled = true;
      hush();
    };
    // Re-run only when the exercise changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const advance = useCallback(() => {
    hush();
    if (index + 1 >= total) {
      onFinish({
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
    setResponse(null);
    setResult(null);
  }, [index, total, correctCount, mistakes, onFinish]);

  const check = useCallback(() => {
    if (!response || result || isExplain) return;
    hush();
    // "I can't speak right now": skip the speaking exercise without scoring it.
    if (response.kind === 'speech' && response.skipped) {
      advance();
      return;
    }
    const r = checkAnswer(exercise, response);
    const message = pick(r.correct ? dialogue.correct : dialogue.wrong);
    setResult({ ...r, message });
    if (r.correct) {
      sfx.correct();
      setCorrectCount((c) => c + 1);
      void narrate(message, voiceLang);
    } else {
      sfx.wrong();
      setMistakes((m) => m + 1);
      loseHeart();
      window.setTimeout(() => sfx.heart(), 350);
      void narrate(message, voiceLang).then(() => {
        if (exercise.type !== 'matching' && useProgressStore.getState().voiceOn) return speak(r.correctAnswer);
      });
    }
  }, [exercise, response, result, isExplain, loseHeart, voiceLang, advance]);


  const next = useCallback(() => {
    if (isExplain) return advance();
    if (!result) return;
    if (!result.correct && useProgressStore.getState().hearts <= 0) {
      hush();
      onFinish({ passed: false, xp: 0, stars: 1, correct: correctCount, mistakes, total });
      return;
    }
    advance();
  }, [isExplain, result, advance, correctCount, mistakes, total, onFinish]);

  // Enter = check / continue.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      // A focused button already handles Enter as a click.
      if (e.target instanceof HTMLElement && e.target.tagName === 'BUTTON') return;
      if (result || isExplain) next();
      else check();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [check, next, result, isExplain]);

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

  const repeat = () => void narrate(narrationFor(exercise, copy), voiceLang);

  return (
    <div className="paper flex min-h-screen flex-col">
      <div className="bg-navy">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3">
          <button onClick={exit} className="text-2xl font-black text-white/80" aria-label="Salir de la lección">
            ✕
          </button>
          <div
            className="h-4 flex-1 overflow-hidden rounded-full bg-white/20"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={index + (result ? 1 : 0)}
          >
            <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <span className="flex items-center gap-1 text-lg font-extrabold text-[#FF8A9B]">
            <span aria-hidden>❤️</span>
            {hearts}
          </span>
        </div>
      </div>
      <div className="bunting" aria-hidden />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-52 pt-4">
        <div className="mb-4 flex items-end gap-2">
          <button onClick={repeat} aria-label="Repetir la explicación de Britjoy" className="shrink-0">
            <Britjoy expression={expression} speaking={speaking} size={104} />
          </button>
          <SpeechBubble className="mb-3 flex-1">
            <span className="text-lg font-black">{isExplain ? 'Te lo explico' : instructionFor(exercise, copy)}</span>
            <button onClick={repeat} className="ml-2 align-middle text-sm font-extrabold text-royal" aria-label="Escuchar otra vez">
              🔊
            </button>
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
          result
            ? result.correct
              ? 'animate-slide-up border-transparent bg-brand-light'
              : 'animate-slide-up border-transparent bg-bad-light'
            : 'border-navy/10 bg-white'
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
          {isExplain ? (
            <Button variant="accent" onClick={next} block className="sm:ml-auto sm:w-auto sm:min-w-[10rem]">
              {copy.continue}
            </Button>
          ) : result ? (
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
