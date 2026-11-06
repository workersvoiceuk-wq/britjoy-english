export const PORTAL_ADAPTER_VERSION: string;
export const BRITJOY_PROGRESS_KEY: string;
export const BASIC_COURSE_ID: string;
export const BASIC_LEVELS: ReadonlyArray<string>;
export interface PortalCatalog {
  schemaVersion: number;
  adapter: string;
  courses: Array<{ id: string; title: string; level: string; category: string; levels: Array<{ id: string; name: string; lessons: string[] }> }>;
  demo: { conceptId: string; status: string; playable: boolean } | null;
}
export interface LevelSummary { id: string; name: string; lessonsTotal: number; lessonsDone: number; nextLesson: string | null }
export interface CourseSummary { id: string; title: string; level: string; lessonsTotal: number; lessonsDone: number; percent: number; levels: LevelSummary[] }
export interface ReadOnlyStorage { getItem(key: string): string | null }
export function readBritjoyProgress(storage: ReadOnlyStorage | null | undefined): Record<string, unknown> | null;
export function summarizeCourse(course: PortalCatalog['courses'][number], state: unknown): CourseSummary;
export function summarizeBritjoy(storage: ReadOnlyStorage | null | undefined, catalog: PortalCatalog): {
  adapter: string;
  started: boolean;
  currentLevel: string | null;
  basic: { courseId: string; levels: LevelSummary[]; lessonsTotal: number; lessonsDone: number; percent: number; nextLesson: string | null };
  courses: CourseSummary[];
  demo: { conceptId: string; status: string; playable: boolean; alternative: 'written-explanation' } | null;
};
