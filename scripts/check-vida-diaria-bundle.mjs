// «Inglés para el día a día»: comprueba que la web compilada (dist/) NO contiene los módulos de pago (2–12): ni
// textos de sus explicaciones, ejercicios y respuestas, ni sus animaciones o subtítulos. La muestra (módulo 1) sí.
// Los módulos de pago no están en este repositorio público: para comparar textos hace falta el paquete privado.
// Uso: VD_PREMIUM_DIR=/ruta/paquete-privado node scripts/check-vida-diaria-bundle.mjs [dist]
//      Sin VD_PREMIUM_DIR solo se comprueban nombres de archivo y la muestra.
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIST = path.resolve(process.argv[2] ?? path.join(ROOT, 'dist'));
const PAID = process.env.VD_PREMIUM_DIR ? path.resolve(process.env.VD_PREMIUM_DIR, 'modules') : null;
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p) : files.push(p); } })(DIST);
const text = files.filter((f) => /\.(js|css|html|json|md|txt|vtt|webmanifest|map)$/.test(f)).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const norm = (s) => s.normalize('NFC');
const probes = [];
for (const f of PAID ? fs.readdirSync(PAID) : []) {
  const m = JSON.parse(fs.readFileSync(path.join(PAID, f), 'utf8'));
  for (const l of m.lessons) for (const e of l.exercises) {
    for (const s of [e.body, e.prompt, e.sentence, e.text, e.answer, ...(e.phrases ?? []).map((p) => p.en)]) {
      if (typeof s === 'string' && s.length >= 24) probes.push([f, s.split('\n')[0].slice(0, 60)]);
    }
  }
}
// Frases que también están en cursos gratuitos (p. ej. «I'd like a refund, please» en Turistas) no cuentan como fuga.
const pub = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(json|ts|tsx|mjs)$/.test(e.name) && !p.includes(`${path.sep}vida-diaria${path.sep}`)) pub.push(fs.readFileSync(p, 'utf8')); } })(path.join(ROOT, 'src'));
const publicText = pub.join('\n');
const shared = probes.filter(([, s]) => publicText.includes(s));
if (!PAID) console.log('Sin VD_PREMIUM_DIR: no se comparan textos de pago (solo nombres de archivo y muestra).');
const leaks = probes.filter(([, s]) => !publicText.includes(s) && (text.includes(norm(s)) || text.includes(JSON.stringify(s).slice(1, -1))));
const media = files.filter((f) => /dia-(0[2-9]|1[0-2])-[a-z]+-(capitulo|flow)\./.test(path.basename(f)));
const sample = text.includes('Ana García acaba de llegar a Londres');
console.log(`Textos de pago comprobados: ${probes.length} (${shared.length} también en cursos gratuitos) · encontrados en dist: ${leaks.length} · medios de pago en dist: ${media.length} · muestra (módulo 1) presente: ${sample}`);
for (const [f, s] of leaks.slice(0, 10)) console.log('  FUGA', f, '·', s);
for (const f of media) console.log('  MEDIO', path.relative(DIST, f));
if (leaks.length || media.length || !sample) process.exit(1);
