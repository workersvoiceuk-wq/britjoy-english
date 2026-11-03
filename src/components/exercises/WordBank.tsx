import { useMemo, useState } from 'react';
import type { WordBankExercise } from '../../types';
import type { ExerciseProps } from './types';
import { shuffle } from '../../lib/util';

export function WordBank({ exercise, locked, correct, copy, onResponse }: ExerciseProps<WordBankExercise>) {
  // Tiles keep their index so duplicate words (e.g. two "I") stay distinct.
  const tiles = useMemo(() => shuffle(exercise.words.map((word, id) => ({ id, word }))), [exercise.words]);
  const [chosen, setChosen] = useState<number[]>([]);

  const update = (next: number[]) => {
    setChosen(next);
    onResponse(next.length ? { kind: 'tokens', value: next.map((id) => exercise.words[id]) } : null);
  };

  const lineState = locked ? (correct ? 'border-brand' : 'border-bad') : 'border-ink-line';

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xl font-bold">{exercise.prompt}</p>
      <div
        className={`flex min-h-[7.5rem] flex-wrap content-start gap-2 border-y-2 py-3 ${lineState}`}
        aria-label={copy.tapWords}
      >
        {chosen.map((id) => (
          <button
            key={id}
            disabled={locked}
            onClick={() => update(chosen.filter((c) => c !== id))}
            className="tile animate-pop px-3 py-2 text-base"
          >
            {exercise.words[id]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {tiles.map(({ id, word }) => {
          const used = chosen.includes(id);
          return (
            <button
              key={id}
              disabled={locked || used}
              onClick={() => update([...chosen, id])}
              className={`tile px-3 py-2 text-base ${used ? 'border-ink-line bg-ink-line text-transparent' : ''}`}
              aria-hidden={used}
            >
              {word}
            </button>
          );
        })}
      </div>
    </div>
  );
}
