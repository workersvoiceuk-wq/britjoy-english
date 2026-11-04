/**
 * Text-to-speech, preferring a British voice.
 * - In the browser: Web Speech API (speechSynthesis).
 * - In the Android/iOS apps: the native text-to-speech plugin, because
 *   Android's WebView has no speechSynthesis.
 */
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

const isNative = Capacitor.isNativePlatform();

function webSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function speechSupported(): boolean {
  return isNative || webSpeechSupported();
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === 'en-GB') ??
    voices.find((v) => v.lang.startsWith('en-GB')) ??
    voices.find((v) => v.lang.startsWith('en'))
  );
}

export function speak(text: string, slow = false): void {
  if (isNative) {
    void TextToSpeech.stop()
      .catch(() => undefined)
      .then(() => TextToSpeech.speak({ text, lang: 'en-GB', rate: slow ? 0.6 : 0.95 }))
      .catch(() => undefined);
    return;
  }
  if (!webSpeechSupported()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-GB';
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = slow ? 0.6 : 0.95;
  synth.speak(utterance);
}

export function stopSpeaking(): void {
  if (isNative) {
    void TextToSpeech.stop().catch(() => undefined);
  } else if (webSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}

// Some browsers load voices asynchronously; touching getVoices() warms the list.
if (!isNative && webSpeechSupported()) {
  window.speechSynthesis.getVoices();
}
