import { describe, expect, it } from 'vitest';
import { REST_POSE, boneMatrices, mixPose, poseAt, weights } from '../src/lib/britjoyRig';

const apply = (m: number[], x: number, y: number) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

describe("Britjoy's skeleton", () => {
  it('leaves the artwork untouched at rest', () => {
    const m = boneMatrices(REST_POSE);
    for (const bone of Object.values(m)) expect(apply(bone, 123, 456).map((v) => Math.round(v * 1000) / 1000)).toEqual([123, 456]);
  });

  it('gives every pixel weights that add up to 1', () => {
    for (const [x, y] of [[20, 430], [420, 100], [420, 500], [200, 420], [600, 560]]) {
      const w = weights(x, y);
      expect(w.body + w.head + w.arm + w.paw).toBeCloseTo(1, 6);
    }
  });

  it('raises the paw when celebrating', () => {
    const paw = boneMatrices(poseAt('celebrate', 0.55)).paw;
    const [, y] = apply(paw, 40, 420);
    expect(y).toBeLessThan(420 - 60);
  });

  it('keeps idle motion subtle, so the tall hat does not swing', () => {
    let maxShift = 0;
    for (let t = 0; t < 3.2; t += 0.05) {
      const [x, y] = apply(boneMatrices(poseAt('idle', t)).head, 420, 20); // top of the bearskin hat
      maxShift = Math.max(maxShift, Math.hypot(x - 420, y - 20));
    }
    expect(maxShift).toBeGreaterThan(1);
    expect(maxShift).toBeLessThan(7);
  });

  it('loops seamlessly and blends between poses', () => {
    for (const m of ['idle', 'talk', 'celebrate'] as const) {
      expect(poseAt(m, 0)).toEqual(REST_POSE);
    }
    const half = mixPose(REST_POSE, { ...REST_POSE, head: 2 }, 0.5);
    expect(half.head).toBe(1);
  });
});
