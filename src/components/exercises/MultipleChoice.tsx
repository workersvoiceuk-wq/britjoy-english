import type { MultipleChoiceExercise } from '../../types';
import type { ExerciseProps } from './types';
import { ChoiceList } from './ChoiceList';

export function MultipleChoice({ exercise, locked, withholdAnswer, onResponse }: ExerciseProps<MultipleChoiceExercise>) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-xl font-bold">{exercise.prompt}</p>
      <ChoiceList
        options={exercise.options}
        answer={exercise.answer}
        locked={locked}
        withholdAnswer={withholdAnswer}
        onChoose={(value) => onResponse({ kind: 'text', value })}
      />
    </div>
  );
}
