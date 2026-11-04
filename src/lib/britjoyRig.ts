/**
 * Britjoy's skeleton, designed in Blender (blender/britjoy_rig.py) and run live in
 * the browser with WebGL: the official avatar image is one textured mesh deformed
 * by four bones (body, head, arm, paw). The artwork is never redrawn or recoloured;
 * only its pixels move. Smooth at the screen's frame rate and no extra downloads.
 */

/** Size of the official artwork in pixels. */
export const ART_W = 655;
export const ART_H = 572;
/** Room around the artwork so the raised paw is not cut off (artwork pixels). */
export const PAD = { left: 70, top: 40, right: 10, bottom: 0 };
export const VIEW_W = ART_W + PAD.left + PAD.right;
export const VIEW_H = ART_H + PAD.top + PAD.bottom;

export type Motion = 'idle' | 'talk' | 'celebrate';

/** One pose: angles in degrees, head nod in artwork pixels, breath as a scale. */
export interface Pose {
  head: number;
  nod: number;
  arm: number;
  paw: number;
  body: number;
  breath: number;
}
const REST: Pose = { head: 0, nod: 0, arm: 0, paw: 0, body: 0, breath: 1 };
const p = (o: Partial<Pose>): Pose => ({ ...REST, ...o });

/** Keyframes [second, pose]. Small angles look natural on a flat picture. */
const LOOPS: Record<Motion, { length: number; keys: [number, Pose][] }> = {
  idle: {
    length: 3.2,
    keys: [
      [0, REST],
      [0.8, p({ head: 0.8, nod: 0.6, arm: -0.8, paw: 1, breath: 1.004 })],
      [1.6, p({ head: 0.2, nod: 1, arm: -1.2, paw: 0.4, breath: 1.006 })],
      [2.4, p({ head: -0.7, nod: 0.4, arm: -0.4, paw: -0.8, breath: 1.003 })],
      [3.2, REST],
    ],
  },
  talk: {
    length: 1.1,
    keys: [
      [0, REST],
      [0.15, p({ head: 0.9, nod: -1.2, arm: -1, paw: 1.5, breath: 1.003 })],
      [0.32, p({ head: 0.2, nod: 0.4, arm: -0.4, paw: 0.4 })],
      [0.5, p({ head: 1.1, nod: -1.5, arm: -1.8, paw: 2.2, breath: 1.004 })],
      [0.68, p({ head: -0.3, nod: 0.2, arm: -0.6, paw: 0.6, breath: 1.001 })],
      [0.86, p({ head: 0.6, nod: -0.8, arm: -1.2, paw: 1.2, breath: 1.003 })],
      [1.1, REST],
    ],
  },
  celebrate: {
    length: 2,
    keys: [
      [0, REST],
      [0.3, p({ head: -0.8, nod: 0.6, arm: -12, paw: -8, breath: 1.004 })],
      [0.55, p({ head: 0.8, nod: 0.8, arm: -22, paw: -20, body: 0.4, breath: 1.008 })],
      [0.8, p({ arm: -20, paw: -6, body: 0.2, nod: 0.6, breath: 1.006 })],
      [1.05, p({ head: 0.9, nod: 0.8, arm: -22, paw: -20, body: 0.4, breath: 1.008 })],
      [1.3, p({ arm: -20, paw: -6, nod: 0.6, breath: 1.006 })],
      [1.65, p({ head: 0.3, nod: 0.2, arm: -8, paw: -2, breath: 1.002 })],
      [2, REST],
    ],
  },
};

const ease = (t: number) => t * t * (3 - 2 * t);

/** The pose of a loop at time t (seconds), eased between keyframes. */
export function poseAt(motion: Motion, t: number): Pose {
  const loop = LOOPS[motion];
  const time = ((t % loop.length) + loop.length) % loop.length;
  const keys = loop.keys;
  let i = 0;
  while (i < keys.length - 2 && keys[i + 1][0] <= time) i++;
  const [t0, a] = keys[i];
  const [t1, b] = keys[i + 1];
  const k = ease(Math.min(1, Math.max(0, (time - t0) / (t1 - t0))));
  const out = {} as Pose;
  (Object.keys(REST) as (keyof Pose)[]).forEach((n) => (out[n] = a[n] + (b[n] - a[n]) * k));
  return out;
}

/** Blends two poses (k = 0 → a, k = 1 → b). */
export function mixPose(a: Pose, b: Pose, k: number): Pose {
  const out = {} as Pose;
  (Object.keys(REST) as (keyof Pose)[]).forEach((n) => (out[n] = a[n] + (b[n] - a[n]) * k));
  return out;
}

/** Bones (artwork pixels): where each one turns. */
const PIVOT = { body: [420, 600], head: [420, 345], arm: [290, 400], paw: [155, 445] } as const;

const smooth = (e0: number, e1: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Bone weights of an artwork pixel (same regions as the Blender rig). */
export function weights(x: number, y: number) {
  const head = smooth(372, 318, y) * smooth(250, 300, x);
  const armAll = smooth(300, 235, x) * smooth(330, 372, y);
  const paw = armAll * smooth(185, 135, x);
  const arm = armAll - paw;
  const body = Math.max(0, 1 - head - armAll);
  return { body, head, arm, paw };
}

/** 2D affine matrix [a, b, c, d, e, f]: x' = a x + c y + e, y' = b x + d y + f. */
type M = [number, number, number, number, number, number];
const mul = (m: M, n: M): M => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];
const translate = (x: number, y: number): M => [1, 0, 0, 1, x, y];
/** Rotation on screen (y points down): positive degrees turn counter-clockwise, as in Blender's front view. */
const rotate = (deg: number): M => {
  const r = (deg * Math.PI) / 180;
  return [Math.cos(r), -Math.sin(r), Math.sin(r), Math.cos(r), 0, 0];
};
const scale = (sx: number, sy: number): M => [sx, 0, 0, sy, 0, 0];
const about = (px: number, py: number, m: M): M => mul(translate(px, py), mul(m, translate(-px, -py)));

/** World matrices of the four bones for a pose. */
export function boneMatrices(pose: Pose) {
  const body = about(PIVOT.body[0], PIVOT.body[1], mul(rotate(pose.body), scale(1 + (pose.breath - 1) * 0.3, pose.breath)));
  const head = mul(body, about(PIVOT.head[0], PIVOT.head[1], mul(translate(0, -pose.nod), rotate(pose.head))));
  const arm = mul(body, about(PIVOT.arm[0], PIVOT.arm[1], rotate(pose.arm)));
  const paw = mul(arm, about(PIVOT.paw[0], PIVOT.paw[1], rotate(pose.paw)));
  return { body, head, arm, paw };
}

/** A grid mesh over the artwork with per-vertex bone weights. */
export function buildMesh(nx = 48, ny = 42) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const w: number[] = [];
  for (let j = 0; j <= ny; j++) {
    for (let i = 0; i <= nx; i++) {
      const x = (ART_W * i) / nx;
      const y = (ART_H * j) / ny;
      positions.push(x, y);
      uvs.push(i / nx, j / ny);
      const b = weights(x, y);
      w.push(b.body, b.head, b.arm, b.paw);
    }
  }
  const indices: number[] = [];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      indices.push(a, a + nx + 1, a + 1, a + 1, a + nx + 1, a + nx + 2);
    }
  }
  return { positions, uvs, weights: w, indices };
}

const VERT = `
attribute vec2 aPos; attribute vec2 aUv; attribute vec4 aW;
uniform mat3 uBone[4]; uniform vec2 uView; uniform vec2 uPad;
varying vec2 vUv;
void main() {
  vec3 p = vec3(aPos, 1.0);
  vec2 q = (uBone[0] * p).xy * aW.x + (uBone[1] * p).xy * aW.y + (uBone[2] * p).xy * aW.z + (uBone[3] * p).xy * aW.w;
  vec2 c = (q + uPad) / uView * 2.0 - 1.0;
  gl_Position = vec4(c.x, -c.y, 0.0, 1.0);
  vUv = aUv;
}`;
const FRAG = `
precision mediump float; uniform sampler2D uTex; varying vec2 vUv;
void main() { gl_FragColor = texture2D(uTex, vUv); }`;

/** Draws Britjoy on a canvas. Returns null when WebGL is not available. */
export function createRig(canvas: HTMLCanvasElement, image: HTMLImageElement) {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true });
  if (!gl) return null;
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const mesh = buildMesh();
  const attr = (name: string, data: number[], size: number) => {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, name);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  };
  attr('aPos', mesh.positions, 2);
  attr('aUv', mesh.uvs, 2);
  attr('aW', mesh.weights, 4);
  const ibuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.uniform2f(gl.getUniformLocation(prog, 'uView'), VIEW_W, VIEW_H);
  gl.uniform2f(gl.getUniformLocation(prog, 'uPad'), PAD.left, PAD.top);
  const uBone = gl.getUniformLocation(prog, 'uBone');

  return {
    /** Frees the GPU context (browsers allow only a few at a time). */
    dispose() {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
    draw(pose: Pose) {
      const m = boneMatrices(pose);
      const data: number[] = [];
      // mat3 column-major: [a, b, 0, c, d, 0, e, f, 1]
      for (const k of ['body', 'head', 'arm', 'paw'] as const) {
        const [a, b, c, d, e, f] = m[k];
        data.push(a, b, 0, c, d, 0, e, f, 1);
      }
      gl.uniformMatrix3fv(uBone, false, new Float32Array(data));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
    },
  };
}

export { REST as REST_POSE };
