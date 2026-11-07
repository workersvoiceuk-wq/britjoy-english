import { useState } from 'react';
import type { Lesson } from '../types';
import { objectiveForLesson, storyForLesson } from '../logic/lessonStory';
import { Button } from './Button';

interface Props {
  lesson: Lesson;
  locale: 'es' | 'en';
  courseName?: string;
  onExit: () => void;
}

/** Ungraded bookends: their text stays in this lesson session, outside progress and scoring. */
function StoryShell({ title, children, onExit, locale }: { title: string; children: React.ReactNode; onExit: () => void; locale: 'es' | 'en' }) {
  return (
    <div className="paper min-h-screen" data-learning-stage="ungraded">
      <header className="bg-navy px-4 py-4 text-white">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <button type="button" onClick={onExit} aria-label={locale === 'es' ? 'Salir de la lección' : 'Exit lesson'} className="text-2xl">✕</button>
          <h1 className="text-xl font-black">{title}</h1>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6 pb-12">{children}</main>
    </div>
  );
}

export function LessonPrelude({ lesson, locale, courseName, onExit, onContinue, chapterVideo }: Props & { onContinue: (prediction: string) => void; chapterVideo?: React.ReactNode }) {
  const [prediction, setPrediction] = useState('');
  const story = storyForLesson(lesson, locale);
  const objective = objectiveForLesson(lesson, locale);
  const es = locale === 'es';
  return (
    <StoryShell title={lesson.title} locale={locale} onExit={onExit}>
      {courseName && <p className="text-sm font-bold text-ink-soft">{courseName}</p>}
      <div data-lesson-objective="true" className="rounded-2xl border-l-4 border-royal bg-white px-4 py-3 shadow-sm">
        <p className="text-xs font-black uppercase tracking-wider text-royal">{es ? '🎯 Objetivo claro' : '🎯 Clear goal'}</p>
        <p className="mt-1 text-base font-bold text-navy">{objective}</p>
      </div>
      <p className="text-sm font-black uppercase tracking-wider text-royal">{es ? '1 · Escena breve y predicción' : '1 · Short scene and prediction'}</p>
      <article className="rounded-3xl border-2 border-navy/10 bg-white p-5 shadow-sm">
        <span aria-hidden className="text-3xl">🎬</span>
        <h2 className="mt-1 text-xl font-black text-navy">{es ? 'Antes de ver la demostración…' : 'Before watching the demo…'}</h2>
        <p className="mt-2 text-base font-semibold leading-relaxed">{story.scene}</p>
      </article>
      {chapterVideo && <div data-chapter-video="true">{chapterVideo}</div>}
      <div>
        <label htmlFor="lesson-prediction" className="block text-lg font-black text-navy">{story.prediction}</label>
        <p id="prediction-note" className="my-2 text-sm font-semibold text-ink-soft">{es ? 'Una intuición breve, no un examen. Es opcional y no cuesta corazones.' : 'A quick intuition, not a test. Optional, with no hearts at stake.'}</p>
        <textarea id="lesson-prediction" aria-describedby="prediction-note" value={prediction} onChange={(e) => setPrediction(e.target.value)} rows={2} maxLength={1000} className="w-full rounded-2xl border-2 border-navy/20 bg-white p-3.5 text-base text-ink" />
      </div>
      <ol className="flex flex-wrap gap-2 text-sm font-bold text-navy" aria-label={es ? 'Recorrido' : 'Learning journey'}>
        <li>{es ? '🎬 Vídeo / mecanismo visual' : '🎬 Demo / visual mechanism'}</li><li>→ {es ? '🎯 Tarea + explicación' : '🎯 Task + explanation'}</li><li>→ {es ? '💡 Otro caso' : '💡 Another case'}</li>
      </ol>
      <Button block onClick={() => onContinue(prediction.trim())}>{es ? 'Explorar la lección' : 'Explore the lesson'}</Button>
    </StoryShell>
  );
}

export function LessonReflection({ lesson, locale, courseName, onExit, prediction, onFinish }: Props & { prediction: string; onFinish: () => void }) {
  const [reflection, setReflection] = useState('');
  const [finished, setFinished] = useState(false);
  const es = locale === 'es';
  const story = storyForLesson(lesson, locale);
  return (
    <StoryShell title={lesson.title} locale={locale} onExit={onExit}>
      {courseName && <p className="text-sm font-bold text-ink-soft">{courseName}</p>}
      <p className="text-sm font-black uppercase tracking-wider text-royal">{es ? '3 · Reflexiona y aplica' : '3 · Reflect and apply'}</p>
      <h2 className="text-2xl font-black text-navy">{es ? '¿Qué cambió en tu idea?' : 'How did your thinking change?'}</h2>
      {prediction && <blockquote className="rounded-2xl border-l-4 border-royal bg-white p-4"><p className="mb-1 text-sm font-black">{es ? 'Tu predicción inicial' : 'Your initial prediction'}</p><p className="whitespace-pre-wrap break-words">{prediction}</p></blockquote>}
      <label htmlFor="lesson-reflection" className="block text-lg font-bold">{story.transfer}</label>
      <textarea id="lesson-reflection" value={reflection} onChange={(e) => setReflection(e.target.value)} rows={4} maxLength={1000} className="w-full rounded-2xl border-2 border-navy/20 bg-white p-4 text-base text-ink" aria-describedby="reflection-note" />
      <p id="reflection-note" className="text-sm font-semibold text-ink-soft">{es ? 'Reflexión opcional, sin puntuación. Compara tu respuesta con lo que acabas de practicar. Este texto no se guarda al salir.' : 'Optional and ungraded. Compare your answer with what you just practised. This text is not saved when you leave.'}</p>
      <Button block disabled={finished} onClick={() => { if (finished) return; setFinished(true); onFinish(); }}>{es ? 'Terminar y ver resultado' : 'Finish and see results'}</Button>
    </StoryShell>
  );
}
