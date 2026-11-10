import { useMemo, useState } from 'react';
import { normalizeText } from '../../logic/answer';
import { shuffle } from '../../lib/util';

interface Props {
  options: string[];
  answer: string;
  locked: boolean;
  /** Show the right option once locked. Practice screens that allow a retry pass false after a first miss. */
  reveal?: boolean;
  onChoose: (value: string) => void;
  /** Use a compact grid of chips instead of full-width rows. */
  compact?: boolean;
}

/** Shared option picker for multiple choice, listening and fill-in-the-blank. */
export function ChoiceList({ options, answer, locked, reveal = true, onChoose, compact }: Props) {
  const shuffled = useMemo(() => shuffle(options), [options]);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className={compact ? 'flex flex-wrap justify-center gap-3' : 'grid gap-3'}>
      {shuffled.map((option, i) => {
        const isSelected = selected === option;
        const isAnswer = normalizeText(option) === normalizeText(answer);
        let state = '';
        const showAnswer = locked && (reveal || (isSelected && isAnswer));
        if (showAnswer && isAnswer) state = 'tile-correct';
        else if (locked && isSelected) state = 'tile-wrong';
        else if (isSelected) state = 'tile-selected';
        return (
          <button
            key={option}
            disabled={locked}
            aria-pressed={isSelected}
            onClick={() => {
              setSelected(option);
              onChoose(option);
            }}
            className={`tile flex items-center gap-3 ${state} ${compact ? 'px-5' : ''}`}
          >
            {!compact && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-current text-sm opacity-60">
                {i + 1}
              </span>
            )}
            <span>{option}</span>
            {locked && ((isAnswer && showAnswer) || isSelected) && (
              <span aria-hidden className="ms-auto font-black">
                {isAnswer ? '✓' : '✗'}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
