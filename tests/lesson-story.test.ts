import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Lesson } from '../src/types';
import { storyForLesson, explanationSegments } from '../src/logic/lessonStory';
import { LessonPrelude, LessonReflection } from '../src/components/LessonStory';
import { useProgressStore } from '../src/store/useProgressStore';
import greetings from '../src/data/courses/en-es/a1/unit-1.json';
import { SPAIN_LEVELS } from '../src/data/courses/espana';
import { COLOMBIA_LEVELS } from '../src/data/courses/colombia';

const lesson = greetings.lessons[0] as Lesson;

describe('lesson story bookends', () => {
  it('introduces an original comic problem without inserting or rewriting exercises', () => {
    const before = JSON.stringify(lesson);
    const story = storyForLesson(lesson, 'es');
    expect(story.scene).toContain('Jorge');
    expect(story.prediction).toContain('saludo');
    expect(story.scene).not.toContain('Hello');
    expect(JSON.stringify(lesson)).toBe(before);
    expect(lesson.exercises).toHaveLength(8);
  });

  it('uses authored dialogue context as fallback and never discloses exercise answers', () => {
    const fallback: Lesson = { id: 'example', title: 'At the shop', exercises: [
      { type: 'dialogue', title: 'A visit', scene: 'Two neighbours meet.', lines: [] },
      { type: 'typing', prompt: 'A question', answer: 'secret answer' },
    ] };
    expect(storyForLesson(fallback, 'en').scene).toBe('Two neighbours meet.');
    expect(JSON.stringify(storyForLesson(fallback, 'en'))).not.toContain('secret answer');
  });

  it('renders optional labelled writing, keeps prediction escaped, and awards nothing', () => {
    const before = useProgressStore.getState();
    let finishes = 0;
    const opening = renderToStaticMarkup(createElement(LessonPrelude, { lesson, locale: 'es', onExit() {}, onContinue() {} }));
    const ending = renderToStaticMarkup(createElement(LessonReflection, { lesson, locale: 'es', prediction: '<script>example</script>', onExit() {}, onFinish() { finishes++; } }));
    expect(opening).toContain('for="lesson-prediction"');
    expect(opening).toContain('data-learning-stage="ungraded"');
    expect(ending).toContain('for="lesson-reflection"');
    expect(ending).toContain('&lt;script&gt;example&lt;/script&gt;');
    expect(ending).not.toContain('<script>');
    expect(finishes).toBe(0);
    expect(useProgressStore.getState().hearts).toBe(before.hearts);
    expect(useProgressStore.getState().xp).toBe(before.xp);
    expect(useProgressStore.getState().levels).toBe(before.levels);
  });

  it('preserves every explanation paragraph, including bullets, in order', () => {
    expect(explanationSegments('First idea.\n\n• Second idea.\nThird idea.')).toEqual(['First idea.', '• Second idea.', 'Third idea.']);
  });

  it('keeps the actual Spain and Colombia course context in both instruction languages', () => {
    for (const level of [...SPAIN_LEVELS, ...COLOMBIA_LEVELS]) {
      const localLesson = level.units[0].lessons[0];
      const before = JSON.stringify(localLesson);
      const opening = renderToStaticMarkup(createElement(LessonPrelude, { lesson: localLesson, courseName: level.name, locale: level.instructionLanguage, onExit() {}, onContinue() {} }));
      const ending = renderToStaticMarkup(createElement(LessonReflection, { lesson: localLesson, courseName: level.name, locale: level.instructionLanguage, prediction: '', onExit() {}, onFinish() {} }));
      expect(opening).toContain(level.name);
      expect(ending).toContain(level.name);
      expect(opening).not.toMatch(/Londres|London/);
      expect(ending).not.toMatch(/Londres|London/);
      expect(JSON.stringify(localLesson)).toBe(before);
    }
  });

  it('authors jurisdiction-faithful Britjoy scene -> prediction -> transfer across UK, Spain, Colombia and situation courses', () => {
    const esNie = SPAIN_LEVELS.find((l) => l.instructionLanguage === 'es')!.units[0].lessons[0];
    const esNieEn = SPAIN_LEVELS.find((l) => l.instructionLanguage === 'en')!.units[0].lessons[0];
    const coCedula = COLOMBIA_LEVELS.find((l) => l.instructionLanguage === 'es')!.units[0].lessons[0];
    const coCedulaEn = COLOMBIA_LEVELS.find((l) => l.instructionLanguage === 'en')!.units[0].lessons[0];

    expect(storyForLesson(esNie, 'es').scene).toMatch(/NIE/);
    expect(storyForLesson(esNieEn, 'en').scene).toMatch(/Madrid/);
    expect(storyForLesson(coCedula, 'es').scene).toMatch(/Registraduría/);
    expect(storyForLesson(coCedulaEn, 'en').scene).toMatch(/Registraduría/);
  });
});
