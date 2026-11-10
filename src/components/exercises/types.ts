import type { Exercise, ExerciseResponse } from '../../types';
import type { Copy } from '../../lib/copy';

export interface ExerciseProps<E extends Exercise = Exercise> {
  exercise: E;
  /** True once the answer has been checked: inputs freeze and show the outcome. */
  locked: boolean;
  /** Result of the check (only meaningful when locked). */
  correct: boolean | null;
  copy: Copy;
  /** When false, a locked wrong answer is marked red without revealing the right option (default true). */
  reveal?: boolean;
  onResponse: (response: ExerciseResponse | null) => void;
}
