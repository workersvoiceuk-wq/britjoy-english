import { useEffect, useRef, useState } from 'react';
import type { ExplainExercise } from '../../types';
import type { ExerciseProps } from './types';
import { speak } from '../../lib/speech';
import { sfx } from '../../lib/sound';
import { hush, narrate } from '../../lib/narrator';
import { explanationSegments } from '../../logic/lessonStory';

const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

/** Info slide: visual mechanism + optional concept demo video with mobile-legible subtitles. */
export function ExplainCard({ exercise, onResponse, copy }: ExerciseProps<ExplainExercise>) {
  // Nothing to answer: the lesson can continue straight away.
  useEffect(() => onResponse({ kind: 'text', value: 'ok' }), [onResponse]);

  const paragraphs = explanationSegments(exercise.body);
  const [segment, setSegment] = useState(0);
  const es = copy.continue === 'Continuar';
  const defaultSubLang: 'es' | 'en' = es ? 'es' : 'en';
  const [subLang, setSubLang] = useState<'es' | 'en' | 'off'>(defaultSubLang);
  const [cueText, setCueText] = useState('');
  const [showStepSubs, setShowStepSubs] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const line = paragraphs[segment] || '';
  const samplePhrase = exercise.phrases?.[segment] ?? exercise.phrases?.[0];

  useEffect(() => () => hush(), [segment]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !exercise.video?.tracks?.length) return;
    const sync = () => {
      const list = vid.textTracks;
      if (!list) return;
      for (let i = 0; i < list.length; i++) {
        const tt = list[i];
        tt.mode = subLang !== 'off' && tt.language === subLang ? 'showing' : 'disabled';
        tt.oncuechange = () => {
          const active = tt.activeCues?.[0] as { text?: string } | undefined;
          if (active?.text && tt.language === subLang) setCueText(active.text);
        };
      }
    };
    sync();
    vid.addEventListener('loadedmetadata', sync);
    return () => vid.removeEventListener('loadedmetadata', sync);
  }, [exercise.video?.src, exercise.video?.tracks, subLang]);

  const isWideVideo = exercise.video?.aspect === '16/9';

  return (
    <article className="rounded-3xl border-2 border-navy/10 bg-white p-5 shadow-[0_4px_0_rgba(29,45,92,0.10)]">
      <h2 className="text-2xl font-black text-navy">{exercise.title}</h2>

      {exercise.video && (
        <figure className={`mx-auto mt-4 ${isWideVideo ? 'w-full' : 'max-w-[320px]'}`} data-demo-video="true">
          <video
            ref={videoRef}
            className={`${
              isWideVideo ? 'aspect-video object-contain' : 'aspect-[9/16] object-cover'
            } w-full rounded-2xl bg-navy shadow-[0_4px_0_rgba(29,45,92,0.18)]`}
            src={asset(exercise.video.src)}
            poster={exercise.video.poster ? asset(exercise.video.poster) : undefined}
            controls
            playsInline
            preload="metadata"
            onPlay={() => hush()}
          >
            {exercise.video.tracks?.map((tr) => (
              <track
                key={tr.srclang}
                kind="subtitles"
                srcLang={tr.srclang}
                label={tr.label}
                src={asset(tr.src)}
                default={tr.srclang === defaultSubLang}
              />
            ))}
          </video>

          {exercise.video.tracks && exercise.video.tracks.length > 0 && (
            <div data-mobile-captions={subLang} className="mt-2 rounded-2xl bg-navy px-3.5 py-2.5 text-white">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-extrabold">
                <span className="me-1 text-white/80">{es ? 'Subtítulos móviles:' : 'Mobile captions:'}</span>
                {(['es', 'en', 'off'] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    data-sub-lang={code}
                    aria-pressed={subLang === code}
                    onClick={() => setSubLang(code)}
                    className={`min-h-[30px] rounded-full px-2.5 py-0.5 text-xs font-black ${
                      subLang === code ? 'bg-gold-light text-navy' : 'border border-white/30 bg-white/10 text-white'
                    }`}
                  >
                    {code === 'off' ? (es ? 'Ocultar' : 'Off') : code.toUpperCase()}
                  </button>
                ))}
              </div>
              {subLang !== 'off' && (
                <p aria-live="polite" className="mobile-caption-line mt-1.5 font-bold leading-snug text-white">
                  {cueText || (es ? 'Subtítulos ES/EN listos · pulsa reproducir para leer cada paso.' : 'ES/EN captions ready · press play to read each step.')}
                </p>
              )}
            </div>
          )}

          {!exercise.video.tracks?.length && exercise.video.captionsSummary && exercise.video.captionsSummary.length > 0 && (
            <div data-mobile-captions={showStepSubs ? defaultSubLang : 'off'} className="mt-2 rounded-2xl bg-navy px-3.5 py-2.5 text-white">
              <div className="flex items-center justify-between gap-2 text-xs font-extrabold">
                <span>{es ? 'Subtítulos paso a paso (móvil)' : 'Step-by-step mobile captions'}</span>
                <button
                  type="button"
                  aria-pressed={showStepSubs}
                  onClick={() => setShowStepSubs((v) => !v)}
                  className="rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 text-xs font-black text-white"
                >
                  {showStepSubs ? (es ? 'Ocultar' : 'Hide') : (es ? 'Mostrar' : 'Show')}
                </button>
              </div>
              {showStepSubs && (
                <ol className="mobile-caption-line mt-1.5 list-decimal space-y-1 ps-4 font-bold leading-snug text-white">
                  {exercise.video.captionsSummary.map((st, idx) => (
                    <li key={idx}>{st}</li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {exercise.video.narrationPending && (
            <p
              data-narration-pending="true"
              className="mt-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-extrabold text-amber-950"
            >
              {es
                ? 'Demostración visual · música/efectos propios y subtítulos ES/EN legibles en móvil; narración pendiente (sin clonar ni sustituir voces aprobadas).'
                : 'Visual demonstration · original music/effects and mobile-legible ES/EN subtitles; narration pending (approved voices preserved at 1x).'}
            </p>
          )}
          {exercise.video.caption && !exercise.video.narrationPending && (
            <figcaption className="mt-2 text-center text-xs font-bold text-ink-soft">{exercise.video.caption}</figcaption>
          )}
        </figure>
      )}

      {/* Visual mechanism cards: concise steps + concrete example instead of dense walls of text */}
      <section data-visual-mechanism="true" className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-black uppercase tracking-wider text-royal">
            {es ? '⚡ Mecanismo visual paso a paso' : '⚡ Step-by-step visual mechanism'} · {segment + 1}/{Math.max(1, paragraphs.length)}
          </p>
          {paragraphs.length > 1 && (
            <div className="flex flex-wrap gap-1">
              {paragraphs.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-pressed={idx === segment}
                  onClick={() => setSegment(idx)}
                  className={`h-7 min-w-[28px] rounded-full px-2 text-xs font-black ${
                    idx === segment ? 'bg-navy text-white' : 'bg-navy/10 text-navy'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2" aria-live="polite" aria-atomic="true">
          <div className={`rounded-2xl border-2 border-navy/12 bg-cream/60 p-3.5 ${samplePhrase ? '' : 'sm:col-span-2'}`}>
            <span className="block text-[11px] font-black uppercase tracking-wider text-royal">
              {es ? 'Regla / Paso clave' : 'Key rule / Step'}
            </span>
            <div className="mt-1 text-base font-bold leading-snug text-ink">
              {line.startsWith('• ') ? (
                <p className="flex gap-2">
                  <span className="text-royal" aria-hidden>●</span>
                  <span>{line.slice(2)}</span>
                </p>
              ) : (
                <p>{line}</p>
              )}
            </div>
          </div>

          {samplePhrase && (
            <div className="rounded-2xl border-2 border-brand/25 bg-brand-light/50 p-3.5">
              <span className="block text-[11px] font-black uppercase tracking-wider text-brand-dark">
                {es ? '✓ Ejemplo en acción' : '✓ Working example'}
              </span>
              <p className="mt-1 text-base font-extrabold text-navy">{samplePhrase.en}</p>
              <p className="text-xs font-bold text-ink-soft">{samplePhrase.es}</p>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {paragraphs.length > 1 && (
            <button type="button" disabled={segment === 0} onClick={() => setSegment((n) => n - 1)} className="rounded-xl border-2 border-navy/15 px-3 py-1.5 text-sm font-bold disabled:opacity-40">
              {es ? 'Anterior' : 'Previous'}
            </button>
          )}
          <button type="button" onClick={() => { hush(); void narrate(line, es ? 'es-ES' : 'en-GB'); }} className="rounded-xl bg-navy/5 px-3 py-1.5 text-sm font-bold">
            {es ? '🔊 Escuchar paso' : '🔊 Listen to step'}
          </button>
          {paragraphs.length > 1 && (
            <button type="button" disabled={segment >= paragraphs.length - 1} onClick={() => setSegment((n) => n + 1)} className="rounded-xl border-2 border-navy/15 px-3 py-1.5 text-sm font-bold disabled:opacity-40">
              {es ? 'Siguiente paso' : 'Next step'}
            </button>
          )}
        </div>
      </section>

      {exercise.say && (
        <button type="button" onClick={() => { hush(); void narrate(exercise.say!, es ? 'es-ES' : 'en-GB'); }} className="mt-2.5 text-xs font-bold text-royal underline">
          {es ? 'Escuchar resumen completo (1x)' : 'Listen to full summary (1x)'}
        </button>
      )}

      {exercise.phrases && exercise.phrases.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-black uppercase tracking-wider text-navy/60">
            {es ? 'Ejemplos con voz aprobada (1x) · toca para escuchar' : 'Examples with approved voice (1x) · tap to listen'}
          </p>
          <ul className="grid gap-2">
            {exercise.phrases.map((p) => (
              <li key={p.en}>
                <button
                  onClick={() => {
                    sfx.tap();
                    void speak(p.en);
                  }}
                  className="press flex w-full items-start gap-3 rounded-2xl border-2 border-b-4 border-navy/10 bg-cream px-4 py-2.5 text-left"
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
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-navy/5 px-3 py-2 text-sm font-extrabold text-navy underline-offset-2 hover:underline"
        >
          🔗 {exercise.link.label}
        </a>
      )}
    </article>
  );
}

