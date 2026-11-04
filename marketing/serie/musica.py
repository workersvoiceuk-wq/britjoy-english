"""Original background music for the series (no samples, no licences): Westminster-quarter
chime (public domain, 1793) at the start and at the brand close, over a soft pad."""
import sys, wave
import numpy as np

SR = 44100

def bell(f, dur, amp=0.25):
    t = np.arange(int(SR * dur)) / SR
    env = np.exp(-3.2 * t)
    return amp * env * (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.12 * np.sin(2 * np.pi * 3 * f * t))

def pad(freqs, dur, amp=0.05):
    t = np.arange(int(SR * dur)) / SR
    env = np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.6)
    return amp * env * sum(np.sin(2 * np.pi * f * t) for f in freqs)

def build(total, end_at, out):
    mix = np.zeros(int(SR * total) + SR)
    def add(sig, at):
        i = int(SR * at)
        mix[i:i + len(sig)] += sig[: len(mix) - i]
    chime = [415.30, 369.99, 329.63, 246.94]  # G#4 F#4 E4 B3
    for k, f in enumerate(chime):
        add(bell(f, 2.0), 0.15 + 0.42 * k)
    chords = [[261.63, 329.63, 392.0], [196.0, 246.94, 293.66], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63]]
    t, k = 1.5, 0
    while t < total:
        add(pad(chords[k % 4], 2.6), t)
        t += 2.4; k += 1
    for k, f in enumerate(reversed(chime)):
        add(bell(f, 2.2, 0.22), end_at + 0.2 + 0.42 * k)
    mix = mix[: int(SR * total)]
    fade = int(SR * 0.8)
    mix[-fade:] *= np.linspace(1, 0, fade)
    mix = mix / max(1e-9, np.abs(mix).max()) * 0.7
    data = (mix * 32767).astype(np.int16)
    with wave.open(out, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())

if __name__ == '__main__':
    build(float(sys.argv[1]), float(sys.argv[2]), sys.argv[3])
