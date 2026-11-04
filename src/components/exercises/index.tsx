import type { Exercise } from '../../types';
import type { ExerciseProps } from './types';
import { MultipleChoice } from './MultipleChoice';
import { WordBank } from './WordBank';
import { Listening } from './Listening';
import { Matching } from './Matching';
import { Typing } from './Typing';
import { FillBlank } from './FillBlank';
import { ExplainCard } from './ExplainCard';

/** Renders the right component for an exercise. Add new exercise types here. */
export function ExerciseView(props: ExerciseProps<Exercise>) {
  const { exercise } = props;
  switch (exercise.type) {
    case 'explain':
      return <ExplainCard {...props} exercise={exercise} />;
    case 'multipleChoice':
      return <MultipleChoice {...props} exercise={exercise} />;
    case 'wordBank':
      return <WordBank {...props} exercise={exercise} />;
    case 'listening':
      return <Listening {...props} exercise={exercise} />;
    case 'matching':
      return <Matching {...props} exercise={exercise} />;
    case 'typing':
      return <Typing {...props} exercise={exercise} />;
    case 'fillBlank':
      return <FillBlank {...props} exercise={exercise} />;
  }
}
