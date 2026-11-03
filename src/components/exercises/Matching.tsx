import { useEffect, useMemo, useState } from 'react';
import type { MatchingExercise } from '../../types';
import type { ExerciseProps } from './types';
import { shuffle } from '../../lib/util';
import { speak } from '../../lib/speech';

type Side = 'en' | 'es';

export function Matching({ exercise, locked, onResponse }: ExerciseProps<MatchingExercise>) {
  const left = useMemo(() => shuffle(exercise.pairs.map((p, i) => ({ i, text: p.en }))), [exercise.pairs]);
  const right = useMemo(() => shuffle(exercise.pairs.map((p, i) => ({ i, text: p.es }))), [exercise.pairs]);
  const [picked, setPicked] = useState<{ en: number | null; es: number | null }>({ en: null, es: null });
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<{ en: number; es: number } | null>(null);
  const [mismatches, setMismatches] = useState(0);

  useEffect(() => {
    if (!wrong) return;
    const t = window.setTimeout(() => setWrong(null), 600);
    return () => window.clearTimeout(t);
  }, [wrong]);

  const choose = (side: Side, i: number, text: string) => {
    if (side === 'en') speak(text);
    const next = { ...picked, [side]: picked[side] === i ? null : i };
    if (next.en === null || next.es === null) {
      setPicked(next);
      return;
    }
    setPicked({ en: null, es: null });
    if (next.en === next.es) {
      const done = new Set(matched).add(next.en);
      setMatched(done);
      if (done.size === exercise.pairs.length) onResponse({ kind: 'matching', mismatches });
    } else {
      setWrong({ en: next.en, es: next.es });
      setMismatches((m) => m + 1);
    }
  };

  const column = (side: Side, items: { i: number; text: string }[]) => (
    <div className="flex flex-col gap-3">
      {items.map(({ i, text }) => {
        const done = matched.has(i);
        const isWrong = wrong?.[side] === i;
        const isPicked = picked[side] === i;
        return (
          <button
            key={i}
            disabled={locked || done}
            onClick={() => choose(side, i, text)}
            className={`tile min-h-[3.5rem] text-center text-base ${
              done ? 'border-ink-line bg-white text-ink-line' : isWrong ? 'tile-wrong animate-shake' : isPicked ? 'tile-selected' : ''
            }`}
          >
            {text}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      {column('en', left)}
      {column('es', right)}
    </div>
  );
}
