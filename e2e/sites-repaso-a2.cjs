// Prueba Chromium (390 y 1280 px) de la entrega independiente /britjoy-english/repaso-a2/ para Sites.
// Servidor local que reproduce la estructura de Sites: /britjoy-english/ (página sustituta de la app vigente) y
// /britjoy-english/repaso-a2/ (la entrega). Perfil histórico aislado: se siembran las claves de la app vigente
// (lumi-v8-guest con historial ficticio, britjoy-answer-sound-v1) y se exige que queden intactas. Se registra cualquier
// petición a /britjoy-english/api/* (debe haber cero) y se aborta todo lo que no sea 127.0.0.1. Clics reales.
// Uso: node e2e/sites-repaso-a2.cjs [LOG_FILE]
const http = require('http'); const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '../sites');
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'britjoy-english/repaso-a2/data.json'), 'utf8'));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.mp4': 'video/mp4', '.vtt': 'text/vtt' };
const api = [];
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.startsWith('/britjoy-english/api/')) { api.push(p); res.writeHead(404); return res.end(); }
  if (p === '/britjoy-english/') { res.writeHead(200, { 'content-type': MIME['.html'] }); return res.end('<!doctype html><title>BritJoy English vigente</title><h1 id="vigente">BritJoy English (app vigente, sustituta de prueba)</h1>'); }
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  const data = fs.readFileSync(f); const range = req.headers.range;
  if (range && f.endsWith('.mp4')) { const [a, b] = range.replace('bytes=', '').split('-'); const s = +a, e = b ? +b : data.length - 1; res.writeHead(206, { 'content-type': 'video/mp4', 'content-range': `bytes ${s}-${e}/${data.length}`, 'accept-ranges': 'bytes', 'content-length': e - s + 1 }); return res.end(data.subarray(s, e + 1)); }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream', 'accept-ranges': 'bytes' }); res.end(data);
});
const HIST = { 'lumi-v8-guest': JSON.stringify({ xp: 340, chapters: { 'arrive-london': { done: true, at: 1758283200000 } }, certificate: { at: 1758283200000 } }), 'britjoy-answer-sound-v1': 'off' };
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
(async () => {
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const BASE = `http://127.0.0.1:${srv.address().port}`;
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const log = []; let ok = true;
  const check = (n, v, x = '') => { log.push([new Date().toISOString(), n, v ? 'OK' : 'FALLO', String(x).replace(/\s+/g, ' ').slice(0, 220)]); if (!v) ok = false; };
  for (const w of [1280, 390]) for (const L of DATA.lessons) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 } }); const out = [];
    await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => { out.push(r.request().url()); return r.abort(); });
    await ctx.addInitScript((h) => { if (!sessionStorage.getItem('seeded')) { for (const [k, v] of Object.entries(h)) localStorage.setItem(k, v); sessionStorage.setItem('seeded', '1'); } }, HIST);
    const p = await ctx.newPage(); p.setDefaultTimeout(6000); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); let paso = 'entrar';
    const T = (s) => `${L.id}@${w} · ${s}`; api.length = 0;
    const playEnglish = async (fig, clip, label) => {
      const v = p.locator(`${fig} video`); const sel = p.locator(`${fig} select.captions`);
      check(T(`${label}: vídeo exacto ${clip.id}`), (await v.getAttribute('src')) === clip.mp4);
      await v.evaluate((x) => { x.muted = true; x.currentTime = 1; return x.play(); }).catch(() => {});
      await sel.selectOption({ label: 'English' }); await p.waitForTimeout(1200);
      const st = await v.evaluate((x) => ({ t: x.currentTime, err: x.error?.code || 0, modes: [...x.textTracks].map((t) => `${t.language}:${t.mode}:${t.cues?.length ?? -1}`).join(',') }));
      check(T(`${label}: reproduce y English activa la pista EN (ES desactivada)`), st.t > 1.5 && !st.err && /en:showing:[1-9]/.test(st.modes) && /es:disabled/.test(st.modes), JSON.stringify(st));
      check(T(`${label}: aviso de locución pendiente`), /Locución original pendiente/.test(await p.locator(fig).textContent()));
      await v.evaluate((x) => x.pause()); };
    try {
      await p.goto(`${BASE}/britjoy-english/repaso-a2/`); await p.locator(`[data-lesson="${L.id}"]`).click();
      paso = 'capítulo'; await playEnglish(`[data-chapter="${L.id}"]`, L.chapter, 'capítulo');
      await p.locator(`[data-start="${L.id}"]`).click();
      for (const [i, e] of L.exercises.entries()) {
        if (e.type === 'explain') { await p.locator('button').filter({ hasText: 'Continuar →' }).click(); continue; }
        const qid = `${L.id}:${i}`; const clip = L.reviews[qid]; paso = `${qid} (${e.type})`;
        const choose = async (right) => {
          if (e.options?.length) { const o = right ? e.answer : e.options.find((x) => x !== e.answer); await p.locator('.option').filter({ hasText: new RegExp(`^${o.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).click(); }
          else if (e.type === 'wordBank') { const ws = e.answer.split(' '); const seq = right ? ws : [ws[1], ws[0], ...ws.slice(2)]; for (const wd of seq) await p.locator(`.bank [data-word="${wd.replace(/"/g, '\\"')}"]`).first().click(); }
          else if (e.type === 'matching') { const es = e.pairs.map((x) => x.es); for (const [k, pr] of e.pairs.entries()) { await p.locator(`[data-en="${pr.en}"]`).click(); await p.locator(`[data-es="${right ? pr.es : es[(k + 1) % es.length]}"]`).click(); } }
          else await p.locator('.typed').fill(right ? e.answer : 'zzz wrong');
          await p.locator(`[data-check="${qid}"]`).click(); await p.waitForTimeout(150); };
        check(T(`${qid}: sin repaso antes de responder`), (await p.locator(`[data-review="${qid}"]`).count()) === 0);
        await choose(false);
        const f1 = await p.evaluate((q) => ({ wrong: !!document.querySelector('[data-state=wrong1]'), revealed: !!document.querySelector('[data-revealed]'), review: !!document.querySelector(`[data-review="${q}"]`), retry: !!document.querySelector(`[data-retry="${q}"]`) }), qid);
        const answerShown = e.type !== 'matching' && norm(await p.locator('.feedback').textContent()).includes(norm(e.answer));
        check(T(`${qid}: 1.er fallo rojo, con reintento, sin solución ni repaso`), f1.wrong && !f1.revealed && !f1.review && f1.retry && !answerShown, JSON.stringify(f1));
        await p.locator(`[data-retry="${qid}"]`).click();
        const first = L.exercises.findIndex((x) => x.type !== 'explain');
        if (i === first) {
          await choose(false);
          check(T(`${qid}: intentos agotados → revela la solución y ofrece el repaso`), (await p.locator('[data-state=wrong2] ~ [data-revealed]').count()) === 1 && (await p.locator(`[data-review="${qid}"]`).count()) === 1);
          await playEnglish(`[data-review="${qid}"]`, clip, 'repaso tras agotar intentos');
        } else {
          await choose(true);
          check(T(`${qid}: acierto en verde y repaso exacto`), (await p.locator('[data-state=right]').count()) === 1 && (await p.locator(`[data-review="${qid}"]`).count()) === 1);
          await playEnglish(`[data-review="${qid}"]`, clip, 'repaso tras acertar');
        }
        let real = true; try { await p.locator(`[data-next="${qid}"]`).click({ timeout: 3000 }); } catch { real = false; }
        check(T(`${qid}: «Continuar» pulsable con clic real`), real); if (!real) throw new Error('continuar tapado');
      }
      paso = 'fin'; await p.locator(`[data-finish="${L.id}"]`).waitFor();
      const keys = await p.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
      check(T('avance guardado solo en britjoy-repaso-a2-v1'), JSON.parse(keys['britjoy-repaso-a2-v1']).lessons[L.id]?.done === true);
      check(T('perfil histórico de la app vigente intacto (lumi-v8-guest, britjoy-answer-sound-v1)'), Object.entries(HIST).every(([k, v]) => keys[k] === v) && Object.keys(keys).sort().join() === ['britjoy-answer-sound-v1', 'britjoy-repaso-a2-v1', 'lumi-v8-guest'].join(), Object.keys(keys).join());
      check(T('cero peticiones a /britjoy-english/api/* y cero externas'), api.length === 0 && out.length === 0, [...api, ...out].join(' '));
      check(T('sin desbordamiento horizontal'), await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      paso = 'retorno'; await p.locator('[data-return="britjoy-english"]').click(); await p.waitForURL(`${BASE}/britjoy-english/`);
      check(T('enlace de retorno abre /britjoy-english/'), (await p.locator('#vigente').count()) === 1, p.url());
    } catch (e) { check(T(`flujo (paso: ${paso})`), false, e.message.split('\n')[0]); }
    check(T('sin errores de página'), errs.length === 0, errs.join(' | ')); await ctx.close();
  }
  if (process.argv[2]) fs.writeFileSync(process.argv[2], 'fecha\tprueba\tresultado\tdetalle\n' + log.map((r) => r.join('\t')).join('\n') + '\n');
  const f = log.filter((r) => r[2] !== 'OK'); console.log(`${log.length - f.length} OK, ${f.length} FALLO`); for (const r of f) console.log('FALLO', r[1], '|', r[3]);
  await b.close(); srv.close(); process.exit(ok ? 0 : 1);
})();
