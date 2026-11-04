/** Content types. These mirror the JSON files in src/data/courses/en-es/<level>/. */

export type LevelId = string; // "A1" … "C2" (string so new levels need no type change)

export interface MultipleChoiceExercise {
  /** Optional line Britjoy says aloud before the exercise. */
  say?: string;
  type: 'multipleChoice';
  prompt: string;
  options: string[];
  answer: string;
}

export interface WordBankExercise {
  /** Optional line Britjoy says aloud before the exercise. */
  say?: string;
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
  /** Optional line Britjoy says aloud before the exercise. */
  say?: string;
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
  /** Optional line Britjoy says aloud before the exercise. */
  say?: string;
  type: 'matching';
  prompt?: string;
  pairs: { en: string; es: string }[];
}

export interface TypingExercise {
  /** Optional line Britjoy says aloud before the exercise. */
  say?: string;
  type: 'typing';
  prompt: string;
  answer: string;
  alternatives?: string[];
}

export interface FillBlankExercise {
  /** Optional line Britjoy says aloud before the exercise. */
  say?: string;
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

/**
 * Explanation card (not graded): Britjoy explains something before practising.
 * Shown as an info slide; the lion reads `say` (or `body`) aloud.
 */
export interface ExplainExercise {
  type: 'explain';
  title: string;
  /** Paragraphs; lines starting with "• " render as bullets. */
  body: string;
  /** What Britjoy says aloud (defaults to title + body). */
  say?: string;
  /** Key English phrases with their Spanish meaning; tap to hear them. */
  phrases?: { en: string; es: string }[];
  /** Official source / further reading. */
  link?: { label: string; url: string };
  /** Optional video (file in public/videos/), e.g. a Voz Unida Mundo step-by-step guide. */
  video?: { src: string; poster?: string; caption?: string };
}

export type Exercise =
  | ExplainExercise
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
  /** Emoji shown on the path node (Vivir en UK track). */
  icon?: string;
  /** Optional tip Britjoy shows on the path before this lesson. */
  tip?: string;
  exercises: Exercise[];
}

export interface Unit {
  level: LevelId;
  unit: string;
  title: string;
  /** Emoji for the unit sign (e.g. 🚆). */
  icon?: string;
  /** Date the facts in this unit were last checked against official sources. */
  checked?: string;
  lessons: Lesson[];
}

/** english = CEFR levels A1–C2 · life = Vivir en UK · daily / tourist = story courses by situation. */
export type TrackId = 'english' | 'life' | 'daily' | 'tourist';

export interface LevelDefinition {
  id: LevelId;
  /** Which course this belongs to. English levels unlock in order; life topics are always open. */
  track: TrackId;
  /** Short label for the header button (defaults to the id, e.g. "A1"). */
  short?: string;
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
