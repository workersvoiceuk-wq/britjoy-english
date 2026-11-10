// «Inglés para el día a día»: sube el paquete PRIVADO (módulos 02–12, clips de Flow, animaciones y subtítulos) al
// bucket privado «vida-diaria-premium» de Supabase Storage. Lo ejecuta el dueño (o quien él autorice) en su equipo.
// La clave de servicio se lee SOLO del entorno y nunca se escribe en ningún archivo.
//   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=… \
//     node scripts/upload-premium.mjs /ruta/paquete-privado [--dry-run]
// Comprueba antes SHA256SUMS del paquete. Después comprueba que una lectura anónima del bucket se rechaza.
import fs from 'node:fs'; import path from 'node:path'; import { createHash } from 'node:crypto';
const [dir, flag] = process.argv.slice(2);
if (!dir) { console.error('Uso: node scripts/upload-premium.mjs <paquete-privado> [--dry-run]'); process.exit(2); }
const root = path.resolve(dir);
const sums = fs.readFileSync(path.join(root, 'SHA256SUMS'), 'utf8').trim().split('\n').map((l) => l.split(/\s+/));
for (const [sum, rel] of sums) {
  if (createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex') !== sum) { console.error('SHA-256 distinto: ' + rel); process.exit(1); }
}
const files = sums.map(([, rel]) => rel).filter((rel) => rel.startsWith('modules/') || rel.startsWith('media/'));
console.log(`${files.length} archivos verificados (${sums.length} en SHA256SUMS).`);
if (flag === '--dry-run') process.exit(0);
const url = process.env.SUPABASE_URL?.replace(/\/$/, ''); const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno.'); process.exit(2); }
const type = (f) => (f.endsWith('.json') ? 'application/json' : f.endsWith('.mp4') ? 'video/mp4' : 'text/vtt');
for (const rel of files) {
  const res = await fetch(`${url}/storage/v1/object/vida-diaria-premium/${rel}`, {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': type(rel), 'x-upsert': 'true' }, body: fs.readFileSync(path.join(root, rel)),
  });
  if (!res.ok) { console.error(`Fallo al subir ${rel}: ${res.status} ${await res.text()}`); process.exit(1); }
}
// Lectura anónima: debe rechazarse (bucket privado, sin políticas).
const anon = await fetch(`${url}/storage/v1/object/public/vida-diaria-premium/${files[0]}`);
console.log(`Subidos ${files.length}. Lectura anónima pública de ${files[0]}: ${anon.status} (debe ser 400/403/404).`);
if (anon.ok) { console.error('ATENCIÓN: el bucket responde en público. Ponlo privado antes de seguir.'); process.exit(1); }
