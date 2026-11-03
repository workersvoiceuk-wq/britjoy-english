/** Thin wrapper around the Web Speech API (speechSynthesis), preferring a British voice. */

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
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
  if (!speechSupported()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-GB';
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = slow ? 0.6 : 0.95;
  synth.speak(utterance);
}

// Some browsers load voices asynchronously; touching getVoices() warms the list.
if (speechSupported()) {
  window.speechSynthesis.getVoices();
}
