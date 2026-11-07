// Genera la entrega independiente para Sites: sites/britjoy-english/repaso-a2/ (copiar tal cual a /britjoy-english/repaso-a2/).
// Toma las lecciones A2 (unidades 1 y 2) y los clips de la propia app, para que IDs y vídeos no se desincronicen.
// Uso: node scripts/build-sites-repaso-a2.mjs
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const OUT = 'sites/britjoy-english/repaso-a2';
const units = ['src/data/courses/en-es/a2/unit-1.json', 'src/data/courses/en-es/a2/unit-2.json'].map((f) => JSON.parse(readFileSync(f, 'utf8')));
const clips = JSON.parse(readFileSync('src/shared/question-videos/britjoy-review-video-clips.json', 'utf8'));
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');

rmSync(OUT, { recursive: true, force: true });
mkdirSync(path.join(OUT, 'media'), { recursive: true });
const used = [];
const media = (clip) => {
  const files = { mp4: `${clip.id}.mp4`, es: `${clip.id}.es.vtt`, en: `${clip.id}.en.vtt` };
  for (const f of Object.values(files)) copyFileSync(path.join('public/videos/ingles-a2', f), path.join(OUT, 'media', f));
  used.push(clip);
  return { id: clip.id, mp4: `media/${files.mp4}`, vtt: { es: `media/${files.es}`, en: `media/${files.en}` } };
};

const lessons = [];
for (const unit of units) for (const l of unit.lessons) {
  const chapter = clips.find((c) => c.lessonId === l.id && !c.questionId);
  if (!chapter) throw new Error(`sin vídeo de capítulo: ${l.id}`);
  const reviews = {};
  l.exercises.forEach((e, i) => {
    if (e.type === 'explain' || e.type === 'dialogue') return;
    const c = clips.find((x) => x.questionId === `${l.id}:${i}`);
    if (!c) throw new Error(`sin vídeo de pregunta: ${l.id}:${i}`);
    reviews[`${l.id}:${i}`] = media(c);
  });
  lessons.push({
    id: l.id, title: l.title, tip: l.tip ?? '', unitTitle: unit.title,
    questions: Object.keys(reviews).length, chapter: media(chapter), reviews, exercises: l.exercises,
  });
}
writeFileSync(path.join(OUT, 'data.json'), JSON.stringify({ version: 1, lessons }, null, 1) + '\n');
for (const f of ['index.html', 'app.js']) copyFileSync(path.join('scripts/sites-repaso', f), path.join(OUT, f));

const licence = (c) => c.source?.kind === 'original'
  ? 'Producción original de Voz Unida Mundo (animación + captura de la app BritJoy). Uso en vozunidamundo.com.'
  : `Metraje de terceros declarado por la entrega de Antigravity: ${c.source?.title ?? '?'} (${c.source?.url ?? '?'}), licencia de Pexels. No verificado por Claude (Pexels no accesible desde su entorno).`;
const manifest = {
  ruta: '/britjoy-english/repaso-a2/',
  origen: 'britjoy-english, rama ccr-2adf0366-90z793',
  generado: new Date().toISOString(),
  progreso: 'Solo local en este navegador, clave britjoy-repaso-a2-v1. No lee ni escribe el progreso de la app vigente (lumi-v8-guest, /britjoy-english/api/*), ni cuentas, cuotas, proveedores o constancias.',
  voz: 'Sin locución: la locución original de Óscar está pendiente; los vídeos llevan texto y subtítulos ES/EN.',
  clips: used.map((c) => ({
    id: c.id, lessonId: c.lessonId, questionId: c.questionId ?? null, tipo: c.questionId ? 'pregunta' : 'capitulo', duracion: c.duration,
    archivos: ['mp4', 'es.vtt', 'en.vtt'].map((ext) => { const f = path.join(OUT, 'media', `${c.id}.${ext}`); return { ruta: `media/${c.id}.${ext}`, bytes: statSync(f).size, sha256: sha(f) }; }),
    permisos: licence(c),
  })),
  paginas: ['index.html', 'app.js', 'data.json'].map((f) => ({ ruta: f, sha256: sha(path.join(OUT, f)) })),
};
writeFileSync(path.join(OUT, 'MANIFIESTO.json'), JSON.stringify(manifest, null, 1) + '\n');
console.log(`${lessons.length} lecciones, ${used.length} clips → ${OUT}`);
