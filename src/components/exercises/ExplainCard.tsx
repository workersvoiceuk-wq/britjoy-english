import { useEffect, useState } from 'react';
import type { ExplainExercise } from '../../types';
import type { ExerciseProps } from './types';
import { speak } from '../../lib/speech';
import { sfx } from '../../lib/sound';
import { hush, narrate } from '../../lib/narrator';
import { explanationSegments } from '../../logic/lessonStory';

const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

/** Info slide: Britjoy explains; nothing to answer. */
export function ExplainCard({ exercise, onResponse, copy }: ExerciseProps<ExplainExercise>) {
  // Nothing to answer: the lesson can continue straight away.
  useEffect(() => onResponse({ kind: 'text', value: 'ok' }), [onResponse]);

  const paragraphs = explanationSegments(exercise.body);
  const [segment, setSegment] = useState(0);
  const es = copy.continue === 'Continuar';
  const line = paragraphs[segment] || '';
  useEffect(() => () => hush(), [segment]);

  return (
    <article className="rounded-3xl border-2 border-navy/10 bg-white p-5 shadow-[0_4px_0_rgba(29,45,92,0.10)]">
      <h2 className="text-2xl font-black text-navy">{exercise.title}</h2>
      <p className="mt-3 text-xs font-black uppercase tracking-wider text-royal">{es ? '2 · Una idea cada vez' : '2 · One idea at a time'} · {segment + 1}/{Math.max(1, paragraphs.length)}</p>
      <div className="mt-3 space-y-2 text-[17px] font-semibold leading-relaxed text-ink" aria-live="polite" aria-atomic="true">
        {
          line.startsWith('• ') ? (
            <p className="flex gap-2">
              <span className="text-royal" aria-hidden>●</span>
              <span>{line.slice(2)}</span>
            </p>
          ) : (
            <p>{line}</p>
          )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" disabled={segment === 0} onClick={() => setSegment((n) => n - 1)} className="rounded-xl border-2 border-navy/15 px-3 py-2 font-bold disabled:opacity-40">{es ? 'Anterior' : 'Previous'}</button>
        <button type="button" onClick={() => { hush(); void narrate(line, es ? 'es-ES' : 'en-GB'); }} className="rounded-xl bg-navy/5 px-3 py-2 font-bold">{es ? '🔊 Escuchar esta idea' : '🔊 Listen to this idea'}</button>
        <button type="button" disabled={segment >= paragraphs.length - 1} onClick={() => setSegment((n) => n + 1)} className="rounded-xl border-2 border-navy/15 px-3 py-2 font-bold disabled:opacity-40">{es ? 'Siguiente idea' : 'Next idea'}</button>
      </div>
      {exercise.say && <button type="button" onClick={() => { hush(); void narrate(exercise.say!, es ? 'es-ES' : 'en-GB'); }} className="mt-3 text-sm font-bold text-royal underline">{es ? 'Escuchar el resumen con la voz del dispositivo' : 'Listen to the summary with the device voice'}</button>}

      {exercise.video && (
        <figure className="mx-auto mt-4 max-w-[320px]">
          <video
            className="aspect-[9/16] w-full rounded-2xl bg-navy object-cover shadow-[0_4px_0_rgba(29,45,92,0.18)]"
            src={asset(exercise.video.src)}
            poster={exercise.video.poster ? asset(exercise.video.poster) : undefined}
            controls
            playsInline
            preload="metadata"
            onPlay={() => hush()}
          />
          {exercise.video.caption && (
            <figcaption className="mt-2 text-center text-xs font-bold text-ink-soft">{exercise.video.caption}</figcaption>
          )}
        </figure>
      )}

      {exercise.phrases && exercise.phrases.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-black uppercase tracking-wider text-navy/60">{es ? 'Frases útiles · toca para escuchar' : 'Useful phrases · tap to listen'}</p>
          <ul className="grid gap-2">
            {exercise.phrases.map((p) => (
              <li key={p.en}>
                <button
                  onClick={() => {
                    sfx.tap();
                    void speak(p.en);
                  }}
                  className="press flex w-full items-start gap-3 rounded-2xl border-2 border-b-4 border-navy/10 bg-cream px-4 py-3 text-left"
                >
                  <span className="text-xl" aria-hidden>🔊</span>
                  <span>
                    <span className="block font-extrabold text-navy">{p.en}</span>
                    <span className="block text-sm font-semibold text-ink-soft">{p.es}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {exercise.link && (
        <a
          href={exercise.link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-navy/5 px-3 py-2 text-sm font-extrabold text-navy underline-offset-2 hover:underline"
        >
          🔗 {exercise.link.label}
        </a>
      )}
    </article>
  );
}
