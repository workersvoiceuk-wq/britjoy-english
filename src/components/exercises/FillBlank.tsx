import { useState } from 'react';
import type { FillBlankExercise } from '../../types';
import type { ExerciseProps } from './types';
import { ChoiceList } from './ChoiceList';
import { TextAnswer } from './TextAnswer';

export function FillBlank({ exercise, locked, correct, copy, reveal, onResponse }: ExerciseProps<FillBlankExercise>) {
  const [value, setValue] = useState('');
  const [before, after = ''] = exercise.sentence.split('___');
  const slotState = locked ? (correct ? 'border-brand text-brand-dark' : 'border-bad text-bad-dark') : 'border-accent text-accent-dark';

  const change = (v: string) => {
    setValue(v);
    onResponse(v.trim() ? { kind: 'text', value: v } : null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xl font-bold leading-relaxed">
          {before}
          <span className={`mx-1 inline-block min-w-[5rem] border-b-4 px-1 text-center ${slotState}`}>{value || ' '}</span>
          {after}
        </p>
        {exercise.hint && <p className="mt-2 text-base font-semibold text-ink-soft">{exercise.hint}</p>}
      </div>
      {exercise.options ? (
        <ChoiceList options={exercise.options} answer={exercise.answer} locked={locked} reveal={reveal} onChoose={change} compact />
      ) : (
        <TextAnswer locked={locked} correct={correct} placeholder={copy.typeHere} onChange={change} multiline={false} />
      )}
    </div>
  );
}
