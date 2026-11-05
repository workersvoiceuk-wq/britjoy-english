import type { Exercise } from '../types';
import { instructionFor, type Copy } from './copy';

/** What Britjoy says aloud when an exercise appears. */
export function narrationFor(exercise: Exercise, copy: Copy): string {
  if (exercise.say) return exercise.say;
  switch (exercise.type) {
    case 'explain':
      return `${exercise.title}. ${exercise.body}`;
    case 'dialogue':
      return `${exercise.title}. ${exercise.scene ?? ''}`;
    case 'multipleChoice':
    case 'typing':
      return `${instructionFor(exercise, copy)}. ${exercise.prompt}`;
    case 'speak':
      return `${instructionFor(exercise, copy)}: ${exercise.hint ?? ''}`;
    case 'wordBank':
      return `${instructionFor(exercise, copy)}: ${exercise.prompt}`;
    default:
      return instructionFor(exercise, copy);
  }
}
