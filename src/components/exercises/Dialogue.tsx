import { useEffect, useState } from 'react';
import type { DialogueExercise } from '../../types';
import type { ExerciseProps } from './types';
import { speak } from '../../lib/speech';
import { sfx } from '../../lib/sound';
import { hush } from '../../lib/narrator';

/** Busuu-style dialogue: chat bubbles, tap a line to hear it, show or hide the translation. */
export function DialogueView({ exercise, copy, onResponse }: ExerciseProps<DialogueExercise>) {
  // Not graded: the lesson can continue straight away.
  useEffect(() => onResponse({ kind: 'text', value: 'ok' }), [onResponse]);
  const [showMeaning, setShowMeaning] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);

  const play = async (i: number) => {
    hush();
    setPlaying(i);
    await speak(exercise.lines[i].text);
    setPlaying((p) => (p === i ? null : p));
  };
  const playAll = async () => {
    sfx.tap();
    for (let i = 0; i < exercise.lines.length; i++) await play(i);
  };

  return (
    <article className="rounded-3xl border-2 border-navy/10 bg-white p-4 shadow-[0_4px_0_rgba(29,45,92,0.10)] sm:p-5">
      <h2 className="text-2xl font-black text-navy">{exercise.title}</h2>
      {exercise.scene && <p className="mt-1 text-sm font-bold text-ink-soft">{exercise.scene}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => void playAll()} className="press rounded-xl border-2 border-b-4 border-navy/10 bg-cream px-3 py-2 text-sm font-extrabold text-navy">
          ▶️ {copy.playAll}
        </button>
        <button
          onClick={() => setShowMeaning((v) => !v)}
          aria-pressed={showMeaning}
          className="press rounded-xl border-2 border-b-4 border-navy/10 bg-cream px-3 py-2 text-sm font-extrabold text-navy"
        >
          🌐 {showMeaning ? copy.hideTranslation : copy.showTranslation}
        </button>
      </div>
      <ol className="mt-4 space-y-3">
        {exercise.lines.map((line, i) => (
          <li key={i} className={`flex ${line.me ? 'justify-end' : 'justify-start'}`}>
            <button
              onClick={() => {
                sfx.tap();
                void play(i);
              }}
              className={`max-w-[85%] rounded-2xl border-2 px-4 py-3 text-left transition ${
                line.me ? 'rounded-br-md border-royal/30 bg-royal/10' : 'rounded-bl-md border-navy/10 bg-cream'
              } ${playing === i ? 'ring-4 ring-accent/40' : ''}`}
            >
              <span className="block text-xs font-black uppercase tracking-wider text-navy/60">
                {line.who} <span aria-hidden>🔊</span>
              </span>
              <span className="block text-[17px] font-extrabold text-navy">{line.text}</span>
              {showMeaning && <span className="mt-1 block text-sm font-semibold text-ink-soft">{line.meaning}</span>}
            </button>
          </li>
        ))}
      </ol>
    </article>
  );
}
