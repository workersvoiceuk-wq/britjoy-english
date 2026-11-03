import type { TypingExercise } from '../../types';
import type { ExerciseProps } from './types';
import { TextAnswer } from './TextAnswer';

export function Typing({ exercise, locked, correct, copy, onResponse }: ExerciseProps<TypingExercise>) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-xl font-bold">{exercise.prompt}</p>
      <TextAnswer
        locked={locked}
        correct={correct}
        placeholder={copy.typeHere}
        onChange={(value) => onResponse(value.trim() ? { kind: 'text', value } : null)}
      />
    </div>
  );
}
