/**
 * Text-to-speech for Britjoy's voice and English audio.
 * - Browser: Web Speech API (speechSynthesis).
 * - Android/iOS apps: native text-to-speech plugin (Android's WebView has no speechSynthesis).
 * `say()` returns a promise that resolves when speaking ends (or is interrupted).
 */
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

export type SpeechLang = 'en-GB' | 'es-ES';

const isNative = Capacitor.isNativePlatform();
let generation = 0;

function webSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function speechSupported(): boolean {
  return isNative || webSpeechSupported();
}

function pickVoice(lang: SpeechLang): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const base = lang.slice(0, 2);
  return voices.find((v) => v.lang === lang) ?? voices.find((v) => v.lang.replace('_', '-') === lang) ?? voices.find((v) => v.lang.startsWith(base));
}

/** Strips emoji and markup so the voice doesn't read them out. */
function clean(text: string): string {
  return text
    .replace(/\p{Extended_Pictographic}|️|‍/gu, '')
    .replace(/[«»“”"]/g, '')
    .replace(/^•\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function say(text: string, opts: { lang?: SpeechLang; slow?: boolean } = {}): Promise<void> {
  const lang = opts.lang ?? 'en-GB';
  const rate = opts.slow ? 0.6 : lang === 'es-ES' ? 1.0 : 0.95;
  const spoken = clean(text);
  const id = ++generation;
  if (!spoken) return Promise.resolve();

  if (isNative) {
    return TextToSpeech.stop()
      .catch(() => undefined)
      .then(() => (id === generation ? TextToSpeech.speak({ text: spoken, lang, rate }) : undefined))
      .catch(() => undefined);
  }
  if (!webSpeechSupported()) return Promise.resolve();
  const synth = window.speechSynthesis;
  synth.cancel();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(spoken);
    u.lang = lang;
    const voice = pickVoice(lang);
    if (voice) u.voice = voice;
    u.rate = rate;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    synth.speak(u);
    // Safety net: some browsers never fire onend.
    window.setTimeout(resolve, 600 + spoken.length * 90);
  });
}

/** Plays English audio (listening exercises, phrases). */
export function speak(text: string, slow = false): Promise<void> {
  return say(text, { lang: 'en-GB', slow });
}

export function stopSpeaking(): void {
  generation++;
  if (isNative) void TextToSpeech.stop().catch(() => undefined);
  else if (webSpeechSupported()) window.speechSynthesis.cancel();
}

// Some browsers load voices asynchronously; touching getVoices() warms the list.
if (!isNative && webSpeechSupported()) window.speechSynthesis.getVoices();
