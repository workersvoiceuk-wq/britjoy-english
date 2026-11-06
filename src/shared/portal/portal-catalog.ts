import { CATALOG } from '../../data/catalog';
import { QUESTION_VIDEO_MANIFEST, isValidRelativeMediaPath } from '../question-videos/question-video-help.mjs';
import { PORTAL_ADAPTER_VERSION } from './portal-adapter.mjs';

/** IDs and titles only (no answers, options or explanations): what the common VUM portal needs. */
export function buildPortalCatalog() {
  const concept = QUESTION_VIDEO_MANIFEST.concepts.find((c) => c.courseId === 'ingles');
  // Same rule as the shared module's isConceptPlayable: ready AND a reviewed relative mp4/webm file.
  const english = concept && {
    conceptId: concept.conceptId,
    status: concept.status,
    playable: concept.status === 'ready' && isValidRelativeMediaPath(concept.video.src) && /\.(mp4|webm)$/i.test(String(concept.video.src)),
  };
  return {
    schemaVersion: 1,
    adapter: PORTAL_ADAPTER_VERSION,
    courses: CATALOG.map((c) => ({
      id: c.id,
      title: c.title,
      level: c.level,
      category: c.category,
      levels: c.levels.map((l) => ({ id: l.id, name: l.name, lessons: l.units.flatMap((u) => u.lessons.map((x) => x.id)) })),
    })),
    demo: english ? { conceptId: english.conceptId, status: english.status, playable: english.playable === true } : null,
  };
}
