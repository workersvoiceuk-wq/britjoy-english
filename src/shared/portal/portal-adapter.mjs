// BritJoy English («Inglés básico») · read-only portal adapter (no imports, so the common VUM portal can
// load this exact file). Summarises the app's catalogue and the learner's real progress for a shared
// entry page. It NEVER writes storage, keeps every course/level/lesson ID, and grants no XP: watching a
// demonstration is not progress. Progress source: the app's own persisted store
// "britjoy-english-progress-v1" ({state: {levels: {<level>: {completedLessons: {<lessonId>: …}}}}}).
export const PORTAL_ADAPTER_VERSION = '1.0.0';
export const BRITJOY_PROGRESS_KEY = 'britjoy-english-progress-v1';
// «Inglés básico» = the first two levels of the general English course (CEFR A1–A2).
export const BASIC_COURSE_ID = 'ingles-a1-c2';
export const BASIC_LEVELS = Object.freeze(['A1', 'A2']);

// Only getItem is ever called.
export function readBritjoyProgress(storage) {
  try {
    const raw = storage?.getItem?.(BRITJOY_PROGRESS_KEY); if (!raw) return null;
    const value = JSON.parse(raw); const state = value?.state;
    return state && typeof state === 'object' && !Array.isArray(state) ? state : null;
  } catch { return null; }
}

const doneIn = (state, levelId) => state?.levels?.[levelId]?.completedLessons || {};

export function summarizeCourse(course, state) {
  const levels = (course?.levels || []).map(level => {
    const done = doneIn(state, level.id);
    const lessons = level.lessons || [];
    const finished = lessons.filter(id => Object.prototype.hasOwnProperty.call(done, id)).length;
    return {id: level.id, name: level.name, lessonsTotal: lessons.length, lessonsDone: finished, nextLesson: lessons.find(id => !Object.prototype.hasOwnProperty.call(done, id)) || null};
  });
  const total = levels.reduce((n, l) => n + l.lessonsTotal, 0), done = levels.reduce((n, l) => n + l.lessonsDone, 0);
  return {id: course.id, title: course.title, level: course.level, lessonsTotal: total, lessonsDone: done, percent: total ? Math.round(100 * done / total) : 0, levels};
}

export function summarizeBritjoy(storage, catalog) {
  const state = readBritjoyProgress(storage);
  const courses = (catalog?.courses || []).map(c => summarizeCourse(c, state));
  const general = courses.find(c => c.id === BASIC_COURSE_ID) || null;
  const basicLevels = general ? general.levels.filter(l => BASIC_LEVELS.includes(l.id)) : [];
  const basicTotal = basicLevels.reduce((n, l) => n + l.lessonsTotal, 0), basicDone = basicLevels.reduce((n, l) => n + l.lessonsDone, 0);
  const demo = catalog?.demo || null;
  return {
    adapter: PORTAL_ADAPTER_VERSION,
    started: Boolean(state?.placementDone) || courses.some(c => c.lessonsDone > 0),
    currentLevel: typeof state?.currentLevel === 'string' ? state.currentLevel : null,
    basic: {courseId: BASIC_COURSE_ID, levels: basicLevels, lessonsTotal: basicTotal, lessonsDone: basicDone, percent: basicTotal ? Math.round(100 * basicDone / basicTotal) : 0,
      nextLesson: basicLevels.map(l => l.nextLesson).find(Boolean) || null},
    courses,
    demo: demo ? {conceptId: demo.conceptId, status: demo.status, playable: demo.status === 'ready' && demo.playable === true, alternative: 'written-explanation'} : null,
  };
}
