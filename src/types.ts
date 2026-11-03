/** Content types. These mirror the JSON files in src/data/courses/en-es/<level>/. */

export type LevelId = string; // "A1" … "C2" (string so new levels need no type change)

export interface MultipleChoiceExercise {
  type: 'multipleChoice';
  prompt: string;
  options: string[];
  answer: string;
}

export interface WordBankExercise {
  type: 'wordBank';
  /** Sentence to translate (usually Spanish). */
  prompt: string;
  /** Tiles shown to the learner: the words of the answer plus distractors. */
  words: string[];
  /** The target English sentence. */
  answer: string;
  /** Other accepted word orders. */
  alternatives?: string[];
}

export interface ListeningExercise {
  type: 'listening';
  /** English text read aloud with speechSynthesis. */
  text: string;
  /** Optional instruction override. */
  prompt?: string;
  /** If present the learner picks an option; otherwise they type what they heard. */
  options?: string[];
  answer: string;
  alternatives?: string[];
}

export interface MatchingExercise {
  type: 'matching';
  prompt?: string;
  pairs: { en: string; es: string }[];
}

export interface TypingExercise {
  type: 'typing';
  prompt: string;
  answer: string;
  alternatives?: string[];
}

export interface FillBlankExercise {
  type: 'fillBlank';
  /** Sentence with "___" marking the gap. */
  sentence: string;
  /** Optional hint/translation shown under the sentence. */
  hint?: string;
  /** If present the learner picks an option; otherwise they type the missing word(s). */
  options?: string[];
  answer: string;
  alternatives?: string[];
}

export type Exercise =
  | MultipleChoiceExercise
  | WordBankExercise
  | ListeningExercise
  | MatchingExercise
  | TypingExercise
  | FillBlankExercise;

export type ExerciseType = Exercise['type'];

export interface Lesson {
  id: string;
  title: string;
  /** Optional tip Britjoy shows on the path before this lesson. */
  tip?: string;
  exercises: Exercise[];
}

export interface Unit {
  level: LevelId;
  unit: string;
  title: string;
  lessons: Lesson[];
}

export interface LevelDefinition {
  id: LevelId;
  name: string;
  description: string;
  /** Accent colours so the learner always knows which level they are in. */
  accent: string;
  accentDark: string;
  accentLight: string;
  /** Language for UI instructions inside lessons ("es" for lower levels, "en" for higher). */
  instructionLanguage: 'es' | 'en';
  units: Unit[];
}

/** What an exercise component reports back to the lesson screen. */
export type ExerciseResponse =
  | { kind: 'text'; value: string }
  | { kind: 'tokens'; value: string[] }
  | { kind: 'matching'; mismatches: number };

export interface CheckResult {
  correct: boolean;
  /** Canonical answer to show the learner when wrong. */
  correctAnswer: string;
}
