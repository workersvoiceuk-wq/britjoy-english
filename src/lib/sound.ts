/**
 * Small synthesised sound effects (Web Audio API): no audio files, no licences.
 * Every sound respects the "sounds" setting in the store.
 */
import { useProgressStore } from '../store/useProgressStore';

type Note = { f: number; t: number; d: number; type?: OscillatorType; g?: number };

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function play(notes: Note[]): void {
  if (!useProgressStore.getState().soundOn) return;
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime + 0.01;
  for (const n of notes) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = n.type ?? 'sine';
    osc.frequency.value = n.f;
    const peak = n.g ?? 0.18;
    gain.gain.setValueAtTime(0.0001, now + n.t);
    gain.gain.exponentialRampToValueAtTime(peak, now + n.t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);
    osc.connect(gain).connect(ac.destination);
    osc.start(now + n.t);
    osc.stop(now + n.t + n.d + 0.05);
  }
}

// Bell-like tone: fundamental plus a soft octave partial.
const bell = (f: number, t: number, d = 0.9, g = 0.16): Note[] => [
  { f, t, d, g },
  { f: f * 2, t, d: d * 0.6, g: g * 0.35 },
  { f: f * 3, t, d: d * 0.3, g: g * 0.12 },
];

export const sfx = {
  tap: () => play([{ f: 880, t: 0, d: 0.05, type: 'triangle', g: 0.07 }]),
  correct: () => play([...bell(784, 0, 0.35), ...bell(1175, 0.11, 0.5)]),
  wrong: () =>
    play([
      { f: 220, t: 0, d: 0.18, type: 'square', g: 0.06 },
      { f: 165, t: 0.16, d: 0.28, type: 'square', g: 0.06 },
    ]),
  /** First phrase of the Westminster Quarters (public domain, 1793). */
  start: () => play([...bell(415.3, 0, 0.8), ...bell(370, 0.42, 0.8), ...bell(329.6, 0.84, 0.8), ...bell(246.9, 1.26, 1.4)]),
  complete: () =>
    play([
      ...bell(523.3, 0, 0.4), ...bell(659.3, 0.14, 0.4), ...bell(784, 0.28, 0.4), ...bell(1046.5, 0.42, 1.0, 0.2),
    ]),
  heart: () => play([{ f: 330, t: 0, d: 0.12, type: 'triangle', g: 0.1 }, { f: 247, t: 0.1, d: 0.25, type: 'triangle', g: 0.1 }]),
  pop: () => play([{ f: 600, t: 0, d: 0.06, type: 'sine', g: 0.1 }, { f: 900, t: 0.03, d: 0.06, type: 'sine', g: 0.08 }]),
};
