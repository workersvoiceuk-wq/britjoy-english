import { useEffect, useState } from 'react';
import type { ListeningExercise } from '../../types';
import type { ExerciseProps } from './types';
import { speak, speechSupported, stopSpeaking } from '../../lib/speech';
import { ChoiceList } from './ChoiceList';
import { TextAnswer } from './TextAnswer';

export function Listening({ exercise, locked, correct, copy, onResponse }: ExerciseProps<ListeningExercise>) {
  const supported = speechSupported();
  const [revealed, setRevealed] = useState(false);

  // The lesson screen plays the audio after Britjoy's instruction.
  useEffect(() => () => stopSpeaking(), []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => speak(exercise.text)}
          disabled={!supported}
          className="press flex h-24 w-24 items-center justify-center rounded-3xl border-b-[6px] border-accent-dark bg-accent text-5xl text-white"
          aria-label={copy.play}
        >
          🔊
        </button>
        <button
          onClick={() => speak(exercise.text, true)}
          disabled={!supported}
          className="press flex h-16 w-16 flex-col items-center justify-center rounded-2xl border-b-4 border-accent-dark bg-accent text-2xl text-white"
          aria-label={copy.slow}
        >
          🐢
        </button>
      </div>
      {!supported && (
        <div className="text-center text-sm font-bold text-ink-soft">
          {copy.noAudio}{' '}
          {revealed ? (
            <span className="text-ink">«{exercise.text}»</span>
          ) : (
            <button className="underline" onClick={() => setRevealed(true)}>
              {copy.showText}
            </button>
          )}
        </div>
      )}
      {exercise.options ? (
        <ChoiceList
          options={exercise.options}
          answer={exercise.answer}
          locked={locked}
          onChoose={(value) => onResponse({ kind: 'text', value })}
        />
      ) : (
        <TextAnswer
          locked={locked}
          correct={correct}
          placeholder={copy.typeHere}
          onChange={(value) => onResponse(value.trim() ? { kind: 'text', value } : null)}
        />
      )}
    </div>
  );
}
