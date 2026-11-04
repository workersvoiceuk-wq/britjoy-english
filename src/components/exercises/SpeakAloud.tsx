import { useState } from 'react';
import type { SpeakExercise } from '../../types';
import type { ExerciseProps } from './types';
import { speak } from '../../lib/speech';
import { listenOnce, recognitionSupported } from '../../lib/speechRecognition';
import { useT } from '../../i18n';

/** Say the sentence out loud; the browser's speech recogniser checks it. */
export function SpeakAloud({ exercise, locked, onResponse }: ExerciseProps<SpeakExercise>) {
  const t = useT();
  const supported = recognitionSupported();
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);

  const listen = async () => {
    setListening(true);
    try {
      const text = await listenOnce().result;
      setHeard(text);
      onResponse(text ? { kind: 'speech', transcript: text } : null);
    } catch {
      setHeard('');
    } finally {
      setListening(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <button
        onClick={() => void speak(exercise.text)}
        className="press rounded-2xl border-2 border-b-4 border-navy/10 bg-white px-5 py-4"
        aria-label={`🔊 ${exercise.text}`}
      >
        <span className="block text-2xl font-black text-navy">🔊 {exercise.text}</span>
        {exercise.hint && <span className="mt-1 block text-sm font-semibold text-ink-soft">{exercise.hint}</span>}
      </button>

      {supported ? (
        <button
          onClick={() => void listen()}
          disabled={locked || listening}
          className={`press flex h-24 w-24 items-center justify-center rounded-full border-b-[6px] text-4xl text-white ${
            listening ? 'animate-pulse border-royal-dark bg-royal' : 'border-accent-dark bg-accent'
          }`}
          aria-label={listening ? t('speak.listening') : t('speak.tap')}
        >
          🎤
        </button>
      ) : (
        <p className="rounded-2xl bg-gold-light px-4 py-3 text-sm font-bold text-gold-dark">{t('speak.unsupported')}</p>
      )}
      <p className="text-sm font-bold text-ink-soft" aria-live="polite">
        {listening ? t('speak.listening') : heard ? `${t('speak.heard')} «${heard}»` : supported ? t('speak.tap') : ''}
      </p>

      <button
        disabled={locked}
        onClick={() => onResponse({ kind: 'speech', transcript: '', skipped: true })}
        className="text-sm font-extrabold uppercase tracking-wide text-navy/60 underline underline-offset-4"
      >
        {t('speak.cantNow')}
      </button>
    </div>
  );
}
