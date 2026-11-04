import { useEffect } from 'react';
import type { ExplainExercise } from '../../types';
import type { ExerciseProps } from './types';
import { speak } from '../../lib/speech';
import { sfx } from '../../lib/sound';
import { hush } from '../../lib/narrator';

const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

/** Info slide: Britjoy explains; nothing to answer. */
export function ExplainCard({ exercise, onResponse }: ExerciseProps<ExplainExercise>) {
  // Nothing to answer: the lesson can continue straight away.
  useEffect(() => onResponse({ kind: 'text', value: 'ok' }), [onResponse]);

  const paragraphs = exercise.body.split('\n').filter((l) => l.trim());

  return (
    <article className="rounded-3xl border-2 border-navy/10 bg-white p-5 shadow-[0_4px_0_rgba(29,45,92,0.10)]">
      <h2 className="text-2xl font-black text-navy">{exercise.title}</h2>
      <div className="mt-3 space-y-2 text-[17px] font-semibold leading-relaxed text-ink">
        {paragraphs.map((line, i) =>
          line.startsWith('• ') ? (
            <p key={i} className="flex gap-2">
              <span className="text-royal" aria-hidden>●</span>
              <span>{line.slice(2)}</span>
            </p>
          ) : (
            <p key={i}>{line}</p>
          ),
        )}
      </div>

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
          <p className="mb-2 text-xs font-black uppercase tracking-wider text-navy/60">Frases útiles · toca para escuchar</p>
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
