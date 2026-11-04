/**
 * Britjoy's voice: reads explanations and instructions aloud (if the voice
 * setting is on) and exposes `speaking` so the avatar can animate.
 */
import { create } from 'zustand';
import { useProgressStore } from '../store/useProgressStore';
import { say, stopSpeaking, type SpeechLang } from './speech';

interface VoiceState {
  speaking: boolean;
}

export const useVoice = create<VoiceState>(() => ({ speaking: false }));

let turn = 0;

/** Britjoy says `text`. Resolves when finished (immediately if the voice is off). */
export async function narrate(text: string, lang: SpeechLang = 'es-ES'): Promise<void> {
  if (!useProgressStore.getState().voiceOn || !text.trim()) return;
  const mine = ++turn;
  useVoice.setState({ speaking: true });
  try {
    await say(text, { lang });
  } finally {
    if (mine === turn) useVoice.setState({ speaking: false });
  }
}

export function hush(): void {
  turn++;
  stopSpeaking();
  useVoice.setState({ speaking: false });
}
