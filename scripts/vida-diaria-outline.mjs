// «Inglés para el día a día»: genera el índice PÚBLICO de los 12 módulos (títulos, objetivos e IDs, sin ejercicios
// ni explicaciones) a partir de la muestra pública (módulo 1, src/data/courses/dia-a-dia/) y de los módulos de pago,
// que NO están en este repositorio público: viven en el paquete privado (VD_PREMIUM_DIR/modules/) y en el bucket
// privado de Supabase Storage.
// Uso: VD_PREMIUM_DIR=/ruta/paquete-privado node scripts/vida-diaria-outline.mjs [--check]
//      Sin VD_PREMIUM_DIR, --check solo comprueba la muestra pública y que haya 12 módulos.
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PREMIUM = process.env.VD_PREMIUM_DIR ? path.resolve(process.env.VD_PREMIUM_DIR, 'modules') : null;
const target0 = path.join(ROOT, 'src/data/vida-diaria/outline.json');
if (!PREMIUM) {
  if (!process.argv.includes('--check')) { console.error('Falta VD_PREMIUM_DIR (paquete privado) para generar el índice.'); process.exit(2); }
  const o = JSON.parse(fs.readFileSync(target0, 'utf8'));
  const s = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/courses/dia-a-dia/01-presentaciones.json'), 'utf8'));
  const ok = o.modules.length === 12 && o.modules[0].id === '01-presentaciones' && o.modules[0].lessons[0].id === s.lessons[0].id && o.modules.filter((m) => m.sample).length === 1;
  console.log(ok ? 'outline.json: 12 módulos (sin paquete privado: solo se comprueba la muestra)' : 'outline.json no cuadra con la muestra pública');
  process.exit(ok ? 0 : 1);
}
const dirs = [['src/data/courses/dia-a-dia', true], [PREMIUM, false]];
const modules = dirs.flatMap(([d, sample]) => fs.readdirSync(path.resolve(ROOT, d)).filter((f) => f.endsWith('.json')).map((f) => {
  const m = JSON.parse(fs.readFileSync(path.resolve(ROOT, d, f), 'utf8'));
  return {
    id: f.replace(/\.json$/, ''), unit: m.unit, title: m.title, icon: m.icon, sample,
    lessons: m.lessons.map((l) => ({ id: l.id, title: l.title, icon: l.icon, objective: l.tip, steps: l.exercises.length,
      practice: l.exercises.filter((e) => e.type !== 'explain' && e.type !== 'dialogue').length })),
  };
})).sort((a, b) => a.id.localeCompare(b.id));
const out = JSON.stringify({ level: 'DIA', catalogId: 'dia-a-dia', modules }, null, 2) + '\n';
const target = path.join(ROOT, 'src/data/vida-diaria/outline.json');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== out) { console.error('outline.json desactualizado: ejecuta node scripts/vida-diaria-outline.mjs'); process.exit(1); }
  console.log('outline.json al día:', modules.length, 'módulos');
} else { fs.writeFileSync(target, out); console.log('outline.json:', modules.length, 'módulos'); }
