/** Thin wrapper over the browser's SpeechRecognition (Chrome/Edge/Safari). */
import { targetLanguage } from './speech';
type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function ctor(): (new () => Recognition) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function recognitionSupported(): boolean {
  return ctor() !== null;
}

/** Listens once in the language being learnt (British English by default) and resolves with the transcript. */
export function listenOnce(): { result: Promise<string>; stop: () => void } {
  const C = ctor();
  if (!C) return { result: Promise.reject(new Error('unsupported')), stop: () => undefined };
  const rec = new C();
  rec.lang = targetLanguage();
  rec.interimResults = false;
  rec.maxAlternatives = 3;
  const result = new Promise<string>((resolve, reject) => {
    let heard = '';
    rec.onresult = (e) => {
      const alts = e.results[0];
      heard = Array.from({ length: alts.length }, (_, i) => alts[i].transcript).join(' ');
    };
    rec.onerror = (e) => (e.error === 'no-speech' ? resolve('') : reject(new Error(e.error)));
    rec.onend = () => resolve(heard);
  });
  rec.start();
  return { result, stop: () => rec.stop() };
}
