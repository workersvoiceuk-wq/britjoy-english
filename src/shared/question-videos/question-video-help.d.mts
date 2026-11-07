export interface QuestionVideoQuery {
  courseId?: string;
  questionId?: string;
  lessonId?: string;
  country?: string;
  locale?: string;
  baseUrl?: string;
  track?: string;
  targetLanguage?: string;
  triggerMode?: 'example' | 'explanation';
}
export interface MountedQuestionVideoHelp {
  element: HTMLElement;
  triggerButton: HTMLButtonElement;
  panelElement: HTMLElement;
  open(): void;
  close(options?: {restoreFocus?: boolean}): void;
  stop(): void;
  update(query: QuestionVideoQuery): void;
  destroy(): void;
  getState(): QuestionVideoQuery & {isOpen: boolean; isPlaying: boolean};
}
export const COURSE_DEFAULT_COUNTRY: Readonly<Record<string, string>>;
export const SITUATION_CATALOG_IDS: ReadonlyArray<string>;
export function inferCourseIdFromLesson(query?: QuestionVideoQuery): string;
export const QUESTION_VIDEO_MANIFEST: {
  schemaVersion: string;
  concepts: ReadonlyArray<{
    conceptId: string;
    courseId: string;
    country?: string | null;
    status: string;
    video: {src: string | null};
    visualExample?: {steps: ReadonlyArray<ReadonlyArray<string>>};
    mappings: ReadonlyArray<QuestionVideoQuery>;
  }>;
};
export function mountQuestionVideoHelp(options: QuestionVideoQuery & {onStopAudio?: () => void; manifest?: typeof QUESTION_VIDEO_MANIFEST}): MountedQuestionVideoHelp;
export function isValidRelativeMediaPath(path: unknown): boolean;
export function isConceptPlayable(concept: unknown): boolean;
export function resolveQuestionVideoHelp(query: QuestionVideoQuery, manifest?: unknown): null | {conceptId: string; courseId: string; status: string; playable: boolean};
