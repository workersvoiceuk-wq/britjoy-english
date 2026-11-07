import { describe, expect, it } from 'vitest';
import { CATALOG } from '../src/data/catalog';
import { PATHWAYS_BY_DOMAIN, SITUATION_PATHWAY, pathwayForCatalogCourseId, pathwayForLevel } from '../src/data/coursePathways';
import { LIFE_LEVEL } from '../src/data/courses/vivir-uk';
import { UK_HIST_LEVEL } from '../src/data/courses/ampliacion';
import { inferCourseIdFromLesson, COURSE_DEFAULT_COUNTRY, SITUATION_CATALOG_IDS } from '../src/shared/question-videos/question-video-help.mjs';
import { BRITJOY_REVIEW_VIDEO_MANIFEST } from '../src/shared/question-videos/britjoy-review-videos';
import clips from '../src/shared/question-videos/britjoy-review-video-clips.json';

// «Vivir en UK» (situations by country and city) is a separate catalogue from the Life in the UK exam course.
describe('situation/country catalogue is separate from the Life in the UK exam course', () => {
  it('situational lessons resolve to the vivir-uk scope, never to the britjoy exam course', () => {
    expect(SITUATION_CATALOG_IDS).toEqual(['vivir-uk']);
    for (const track of ['life', 'migrar-uk', 'ciudades']) expect(inferCourseIdFromLesson({ lessonId: 'x-01', track })).toBe('vivir-uk');
    expect(inferCourseIdFromLesson({ lessonId: 'uk-vida-l1' })).toBe('vivir-uk');
    expect(inferCourseIdFromLesson({ courseId: 'britjoy', lessonId: 'values-01' })).toBe('britjoy');
    // Lessons that belong to a VUM course keep it.
    expect(inferCourseIdFromLesson({ lessonId: 'uk-conducir-l1', track: 'life' })).toBe('conduccion');
    expect(inferCourseIdFromLesson({ lessonId: 'uk-banco-l2', track: 'life' })).toBe('ciberseguridad');
    expect(inferCourseIdFromLesson({ lessonId: 'uk-facturas-l1', track: 'life' })).toBe('electricidad');
    expect(inferCourseIdFromLesson({ lessonId: 'uk-hist-01-constitucion', track: 'ampliacion' })).toBe('ingles');
    expect(COURSE_DEFAULT_COUNTRY['vivir-uk']).toBe('GB');
  });

  it('no review clip is filed under the exam course, and each Vivir en UK clip still resolves for its lesson', () => {
    expect(clips.filter((c) => (c as { courseId?: string }).courseId === 'britjoy')).toEqual([]);
    const situational = clips.filter((c) => (c as { courseId?: string }).courseId === 'vivir-uk');
    expect(situational.length).toBe(29);
    const lifeLessons = new Set(LIFE_LEVEL.units.flatMap((u) => u.lessons.map((l) => l.id)));
    for (const clip of situational) {
      expect(lifeLessons.has(clip.lessonId)).toBe(true);
      const concept = BRITJOY_REVIEW_VIDEO_MANIFEST.concepts.find((c) => c.conceptId === clip.id)!;
      expect(concept.courseId).toBe(inferCourseIdFromLesson({ lessonId: clip.lessonId, track: LIFE_LEVEL.track }));
    }
  });

  it('situation courses show the situations pathway; only the history block keeps the Life in the UK pathway', () => {
    expect(pathwayForLevel(LIFE_LEVEL)).toBe(SITUATION_PATHWAY);
    expect(pathwayForLevel(UK_HIST_LEVEL)).toBe(PATHWAYS_BY_DOMAIN['life-uk']);
    expect(SITUATION_PATHWAY.title.es).toContain('no es el curso de examen Life in the UK');
    const byId = Object.fromEntries(CATALOG.map((c) => [c.id, pathwayForCatalogCourseId(c.id, c.levels).domain]));
    for (const id of ['vivir-en-uk', 'tu-council', 'migrar-uk', 'consulados-londres']) expect(byId[id]).toBe('vivir-uk');
    expect(byId['uk-historia-instituciones']).toBe('life-uk');
    // «ia» inside other words must not select the AI pathway.
    for (const [id, domain] of Object.entries(byId)) {
      if (domain === 'ia') expect(id === 'ia' || id.startsWith('ia-')).toBe(true);
    }
    expect(byId['dia-a-dia']).toBe('ingles');
    expect(byId['ia-con-britjoy']).toBe('ia');
  });
});
