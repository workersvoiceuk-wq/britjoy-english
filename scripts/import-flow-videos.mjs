// «Inglés para el día a día»: importa los 12 clips realistas de Google Flow (ZIP privado) y sustituye la animación
// de cada módulo por su clip, sin publicar nada:
//   - módulo 01 (muestra) → public/videos/vida-diaria/
//   - módulos 02–12 (pago) → VD_PREMIUM_DIR/media/ (paquete PRIVADO, fuera de este repositorio público; se sube al bucket
//     privado «vida-diaria-premium» y solo lo sirve la función vida-diaria con sesión y acceso verificado)
// y marca el vídeo de cada módulo como listo en src/data/vida-diaria/media.json (+ VD_PREMIUM_DIR/docs/manifiesto-medios.json).
// El ZIP tampoco se copia al repositorio.
//
// Uso: VD_PREMIUM_DIR=/ruta/paquete-privado node scripts/import-flow-videos.mjs <zip> --sha256 <hex> [--dry-run]
// Requisitos: unzip, ffprobe y ffmpeg (decodificación completa de cada clip).
//
// Contenido esperado del ZIP (en la raíz o en una carpeta):
//   manifest.json  →  { "clips": [ { "module": "01-presentaciones" | "lessonId": "dia-01-presentaciones",
//                                     "video": "<mp4>", "vtt": { "es": "<vtt>", "en": "<vtt>" } }, … 12 ] }
//   (se aceptan también "mp4"/"file" para el vídeo y "tracks"/"subtitles"/"captions" o "es"/"en" para las pistas;
//   si el manifiesto trae "sha256" y "bytes" por clip, también se comprueban)
//   12 MP4 H.264 de 720×1280 sin voz y 24 VTT (ES/EN).
// Comprobaciones: SHA-256 del ZIP; 12 módulos exactos sin duplicados; cada MP4 720×1280, decodifica entero, sin pista
// de audio con voz (si hay audio se avisa); cada VTT empieza por WEBVTT, tiene cues y no termina después del vídeo.
// Si algo falla, no se copia nada.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { createHash } from 'node:crypto'; import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const MODULES = ['01-presentaciones', '02-compras', '03-transporte', '04-vivienda', '05-salud', '06-empleo', '07-trabajo',
  '08-llamadas', '09-colegio', '10-servicios', '11-social', '12-opiniones'];
const args = process.argv.slice(2);
const zip = args[0];
const sha = args[args.indexOf('--sha256') + 1];
const dry = args.includes('--dry-run');
if (!zip || !args.includes('--sha256') || !/^[0-9a-f]{64}$/.test(sha ?? '')) {
  console.error('Uso: node scripts/import-flow-videos.mjs <zip> --sha256 <hex> [--dry-run]'); process.exit(2);
}
const fail = (msg) => { console.error('No se ha importado nada: ' + msg); process.exit(1); };
const got = createHash('sha256').update(fs.readFileSync(zip)).digest('hex');
if (got !== sha) fail(`SHA-256 distinto (${got})`);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'flow-dia-'));
execFileSync('unzip', ['-q', '-o', path.resolve(zip), '-d', tmp]);
const find = (dir, name) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) { const r = find(p, name); if (r) return r; } else if (e.name === name) return p; } return null; };
const manifestPath = find(tmp, 'manifest.json');
if (!manifestPath) fail('falta manifest.json');
const base = path.dirname(manifestPath);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const raw = Array.isArray(manifest) ? manifest : manifest.clips ?? manifest.modules ?? manifest.items ?? [];
const moduleOf = (c) => {
  const m = c.module ?? c.moduleId ?? (c.lessonId ? String(c.lessonId).replace(/^dia-/, '') : null);
  if (MODULES.includes(m)) return m;
  const nn = /^\d{1,2}$/.exec(String(m ?? '')) ? String(m).padStart(2, '0') : null;
  return (nn && MODULES.find((x) => x.startsWith(nn + '-'))) ?? m;
};
const entries = raw.map((c) => ({
  module: moduleOf(c),
  video: c.video ?? c.mp4 ?? c.file,
  es: c.vtt?.es ?? c.tracks?.es ?? c.subtitles?.es ?? c.captions?.es ?? c.es,
  en: c.vtt?.en ?? c.tracks?.en ?? c.subtitles?.en ?? c.captions?.en ?? c.en,
  title: c.title ?? null,
  sha256: c.sha256 ?? null,
  bytes: c.bytes ?? null,
}));
const mods = entries.map((e) => e.module);
if (entries.length !== 12 || new Set(mods).size !== 12 || !MODULES.every((m) => mods.includes(m))) fail(`el manifiesto no cubre exactamente los 12 módulos (${mods.join(', ')})`);

const probe = (f) => JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height:format=duration', '-of', 'json', f]).toString());
const vttEnd = (txt) => Math.max(0, ...[...txt.matchAll(/-->\s*(?:(\d+):)?(\d\d):(\d\d)\.(\d{3})/g)].map((m) => (+(m[1] ?? 0)) * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000));
const report = [];
for (const e of entries) {
  const files = { video: e.video, es: e.es, en: e.en };
  for (const [k, rel] of Object.entries(files)) if (!rel || !fs.existsSync(path.join(base, rel))) fail(`${e.module}: falta ${k} (${rel})`);
  const mp4 = path.join(base, e.video);
  if (e.sha256 && createHash('sha256').update(fs.readFileSync(mp4)).digest('hex') !== e.sha256) fail(`${e.module}: SHA-256 del MP4 distinto del manifiesto`);
  if (e.bytes && fs.statSync(mp4).size !== e.bytes) fail(`${e.module}: tamaño del MP4 distinto del manifiesto`);
  const info = probe(mp4);
  const v = info.streams.find((s) => s.codec_type === 'video');
  const audio = info.streams.some((s) => s.codec_type === 'audio');
  const duration = Number(info.format.duration);
  if (!v || v.width !== 720 || v.height !== 1280) fail(`${e.module}: el vídeo no es 720×1280 (${v?.width}×${v?.height})`);
  try { execFileSync('ffmpeg', ['-v', 'error', '-xerror', '-i', mp4, '-f', 'null', '-'], { stdio: 'pipe' }); } catch (err) { fail(`${e.module}: no decodifica entero (${String(err.stderr ?? err).slice(0, 200)})`); }
  for (const lang of ['es', 'en']) {
    const txt = fs.readFileSync(path.join(base, e[lang]), 'utf8');
    if (!txt.startsWith('WEBVTT') || !txt.includes('-->')) fail(`${e.module}: VTT ${lang} no válido`);
    if (vttEnd(txt) > duration + 0.5) fail(`${e.module}: VTT ${lang} termina después del vídeo`);
  }
  report.push({ module: e.module, duration: Math.round(duration * 10) / 10, audio, bytes: fs.statSync(mp4).size, codec: v.codec_name });
}
console.log('Validado:', report.map((r) => `${r.module} ${r.duration}s ${r.codec}${r.audio ? ' (con audio)' : ''}`).join(' · '));
if (dry) process.exit(0);

if (!process.env.VD_PREMIUM_DIR) fail('falta VD_PREMIUM_DIR: los clips de pago solo se copian al paquete privado');
const PREMIUM = path.resolve(process.env.VD_PREMIUM_DIR);
if (PREMIUM.startsWith(ROOT + path.sep)) fail('VD_PREMIUM_DIR no puede estar dentro de este repositorio público');
fs.mkdirSync(path.join(PREMIUM, 'media'), { recursive: true });
fs.mkdirSync(path.join(PREMIUM, 'docs'), { recursive: true });
const mediaJson = path.join(ROOT, 'src/data/vida-diaria/media.json');
const docJson = path.join(PREMIUM, 'docs/manifiesto-medios.json');
if (!fs.existsSync(docJson)) fs.copyFileSync(mediaJson, docJson);
const pub = JSON.parse(fs.readFileSync(mediaJson, 'utf8'));
const doc = JSON.parse(fs.readFileSync(docJson, 'utf8'));
for (const e of entries) {
  const lesson = `dia-${e.module}-flow`;
  const isSample = e.module === '01-presentaciones';
  const dir = isSample ? path.join(ROOT, 'public/videos/vida-diaria') : path.join(PREMIUM, 'media');
  fs.copyFileSync(path.join(base, e.video), path.join(dir, `${lesson}.mp4`));
  fs.copyFileSync(path.join(base, e.es), path.join(dir, `${lesson}.es.vtt`));
  fs.copyFileSync(path.join(base, e.en), path.join(dir, `${lesson}.en.vtt`));
  const r = report.find((x) => x.module === e.module);
  const video = {
    estado: 'listo-sin-voz',
    origen: 'Google Flow (Ultra), clip realista sin voz con subtítulos didácticos ES/EN',
    archivo: `${lesson}.mp4`, subtitulos: { es: `${lesson}.es.vtt`, en: `${lesson}.en.vtt` },
    formato: '720×1280 (vertical)', duracionSegundos: r.duration, conAudio: r.audio,
    acceso: isSample ? 'publico' : 'servidor',
    ruta: isSample ? `videos/vida-diaria/${lesson}.mp4` : `bucket privado vida-diaria-premium: media/${lesson}.mp4 → POST vida-diaria {action:'media', source:'flow'}`,
    zipSha256: sha,
  };
  for (const list of [pub.modules, doc.modules]) list.find((m) => m.module === e.module).video = video;
}
fs.writeFileSync(mediaJson, JSON.stringify(pub, null, 1) + '\n');
fs.writeFileSync(docJson, JSON.stringify(doc, null, 1) + '\n');
console.log(`Importados 12 clips: módulo 01 en public/videos/vida-diaria/, 02–12 en ${path.join(PREMIUM, 'media')} (privado).`);
