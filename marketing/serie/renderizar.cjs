// Renders the social media series as vertical MP4s (1080x1920, 24 fps) from real app captures.
// Usage: node marketing/serie/renderizar.cjs [episode numbers…]   (needs ffmpeg and python3 + numpy)
const { chromium } = require('@playwright/test');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const ROOT = path.join(HERE, '..', '..');
const OUT = path.join(HERE, 'videos');
const FPS = 24;
const INTRO = 2.6, SCENE = 4.2, END = 4.4;
const data = JSON.parse(fs.readFileSync(path.join(HERE, 'episodios.json'), 'utf8'));
const b64 = (f) => fs.readFileSync(f).toString('base64');
const font = process.env.NUNITO_TTF;
const avatar = `data:image/webp;base64,${b64(path.join(ROOT, 'src/assets/britjoy-avatar.webp'))}`;

function html(ep) {
  const imgs = Object.fromEntries(ep.scenes.map((s) => [s.img, `data:image/png;base64,${b64(path.join(HERE, 'capturas', s.img + '.png'))}`]));
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
  ${font ? `@font-face{font-family:Nunito;src:url(data:font/ttf;base64,${b64(font)});font-weight:200 1000}` : ''}
  *{box-sizing:border-box;margin:0}
  body{width:1080px;height:1920px;overflow:hidden;font-family:Nunito,system-ui,sans-serif;background:#1D2D5C;color:#fff}
  .bunting{position:absolute;left:0;right:0;top:0;height:46px;background:
    linear-gradient(135deg,#C8102E 25%,transparent 25%) -16px 0/120px 46px,linear-gradient(225deg,#C8102E 25%,transparent 25%) -16px 0/120px 46px,
    linear-gradient(135deg,#fff 25%,transparent 25%) 24px 0/120px 46px,linear-gradient(225deg,#fff 25%,transparent 25%) 24px 0/120px 46px,
    linear-gradient(135deg,#C9A227 25%,transparent 25%) 64px 0/120px 46px,linear-gradient(225deg,#C9A227 25%,transparent 25%) 64px 0/120px 46px;background-repeat:repeat-x}
  .kicker{position:absolute;top:96px;left:0;right:0;text-align:center;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#FFE79A;font-size:30px}
  .title{position:absolute;top:150px;left:60px;right:60px;text-align:center;font-weight:900;font-size:68px;line-height:1.05}
  .phone{position:absolute;left:50%;top:330px;width:620px;height:1342px;margin-left:-310px;border-radius:64px;background:#0b1430;padding:18px;box-shadow:0 30px 80px rgba(0,0,0,.45)}
  .screen{position:relative;width:100%;height:100%;border-radius:48px;overflow:hidden;background:#FBF6EC}
  .screen img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top;opacity:0}
  .cap{position:absolute;top:262px;left:0;right:0;text-align:center}
  .cap span{display:inline-block;background:#C8102E;color:#fff;font-weight:900;font-size:40px;padding:14px 34px;border-radius:999px;border-bottom:8px solid #950B22}
  .lion{position:absolute;left:-10px;bottom:40px;width:420px}
  .bubble{position:absolute;left:330px;right:40px;bottom:250px;background:#fff;color:#1D2D5C;font-weight:800;font-size:40px;line-height:1.2;padding:28px 34px;border-radius:36px;box-shadow:0 10px 0 rgba(0,0,0,.15)}
  .bubble:before{content:'';position:absolute;left:-26px;bottom:40px;border-style:solid;border-width:20px 30px 20px 0;border-color:transparent #fff transparent transparent}
  .end{position:absolute;inset:0;background:#1D2D5C;opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:250px;text-align:center}
  .end .brand{font-weight:900;font-size:58px;line-height:1.1;padding:0 60px}
  .end .voz{margin-top:24px;font-weight:900;font-size:76px;color:#FFE79A}
  .end .cta{margin-top:40px;font-weight:800;font-size:38px;background:#58CC02;padding:18px 34px;border-radius:24px;border-bottom:8px solid #46A302}
  .end .url{margin-top:22px;font-weight:800;font-size:30px;opacity:.85}
  .end .lionbig{position:absolute;bottom:60px;width:720px;left:50%;margin-left:-360px}
  .end .say{position:absolute;bottom:800px;left:110px;right:110px;background:#fff;color:#1D2D5C;font-weight:900;font-size:40px;padding:24px 30px;border-radius:32px}
  .label{position:absolute;bottom:18px;left:0;right:0;text-align:center;font-size:22px;font-weight:700;opacity:.7}
  </style></head><body>
  <div class="bunting"></div>
  <div class="kicker" id="kicker">Cómo funciona · Episodio ${ep.n}/8</div>
  <div class="title" id="title">${ep.title}</div>
  <div class="cap"><span id="cap"></span></div>
  <div class="phone" id="phone"><div class="screen">${ep.scenes.map((s, i) => `<img id="s${i}" src="${imgs[s.img]}" style="${s.fit === 'contain' ? 'object-fit:contain;object-position:center;background:#FBF6EC' : ''}">`).join('')}</div></div>
  <img class="lion" id="lion" src="${avatar}">
  <div class="bubble" id="bubble"></div>
  <div class="end" id="end">
    <div class="brand">Voz Unida Mundo Academy · te enseña</div>
    <div class="voz">Tu voz cuenta</div>
    <div class="cta">Comenta «${data.keyword}» y te paso el enlace</div>
    <div class="url">${data.cta}</div>
    <div class="say" id="endsay">«Voz Unida Mundo Academy te enseña. ¡Tu voz cuenta!»</div>
    <img class="lionbig" id="lionbig" src="${avatar}">
  </div>
  <div class="label">Britjoy English · capturas reales de la app</div>
  <script>
  const ep = ${JSON.stringify(ep)};
  const INTRO=${INTRO}, SCENE=${SCENE};
  const ease = (x) => x<0?0:x>1?1:1-Math.pow(1-x,3);
  window.render = (t) => {
    const n = ep.scenes.length, endAt = INTRO + n*SCENE;
    const title = document.getElementById('title');
    title.textContent = t < INTRO ? ep.hook : ep.title;
    title.style.fontSize = t < INTRO ? '52px' : (ep.title.length > 24 ? '52px' : '68px');
    title.style.opacity = ease(t/0.5);
    title.style.transform = 'translateY(' + (1-ease(t/0.6))*40 + 'px)';
    const phone = document.getElementById('phone');
    phone.style.transform = 'translateY(' + (1-ease((t-0.4)/0.9))*900 + 'px)';
    const idx = Math.min(n-1, Math.max(0, Math.floor((t-INTRO)/SCENE)));
    ep.scenes.forEach((s,i) => {
      const local = t - INTRO - i*SCENE;
      const img = document.getElementById('s'+i);
      const vis = i===0 ? (t<INTRO ? 1 : (local<SCENE ? 1 : 1-ease((local-SCENE)/0.4))) : (local<0 ? 0 : local<0.4 ? ease(local/0.4) : local<SCENE ? 1 : 1-ease((local-SCENE)/0.4));
      img.style.opacity = i===n-1 && local>=SCENE ? 1 : vis;
      img.style.transform = 'scale(' + (1 + Math.max(0,Math.min(local,SCENE))*0.006) + ')';
    });
    const cap = document.getElementById('cap');
    const scene = ep.scenes[idx];
    const local = t - INTRO - idx*SCENE;
    cap.textContent = t < INTRO ? 'Britjoy Academy' : scene.caption;
    cap.parentElement.style.opacity = t < INTRO ? 0 : (local < 0.3 ? ease(local/0.3) : 1);
    const bubble = document.getElementById('bubble');
    const line = t < INTRO ? '¡Hola! Te enseño cómo funciona.' : scene.say;
    const typed = t < INTRO ? Math.floor(Math.max(0,t-0.9)*40) : Math.floor(Math.max(0,local-0.3)*38);
    bubble.textContent = line.slice(0, typed) || '…';
    const lion = document.getElementById('lion');
    const talking = (t < INTRO ? t>0.9 && typed<line.length : typed<line.length);
    lion.style.transform = 'translateY(' + ((1-ease((t-0.2)/0.7))*500 + (talking ? Math.sin(t*22)*6 : 0)) + 'px)';
    const end = document.getElementById('end');
    const e = t - endAt;
    end.style.opacity = e<0 ? 0 : ease(e/0.5);
    document.getElementById('lionbig').style.transform = 'translateY(' + (e<0?600:(1-ease(e/0.7))*600 + (e>0.8 && e<3 ? Math.sin(t*20)*8 : 0)) + 'px)';
    document.getElementById('endsay').style.opacity = ease((e-0.6)/0.4);
  };
  </script></body></html>`;
}

(async () => {
  const pick = process.argv.slice(2).map(Number);
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const ep of data.episodes) {
    if (pick.length && !pick.includes(ep.n)) continue;
    // A fresh page per episode: each episode's script defines its own timeline.
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    const total = INTRO + ep.scenes.length * SCENE + END;
    const frames = fs.mkdtempSync(path.join(require('os').tmpdir(), `ep${ep.n}-`));
    await page.setContent(html(ep), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const count = Math.round(total * FPS);
    for (let f = 0; f < count; f++) {
      await page.evaluate((t) => window.render(t), f / FPS);
      await page.screenshot({ path: path.join(frames, String(f).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 90 });
    }
    const wav = path.join(frames, 'music.wav');
    execFileSync('python3', [path.join(HERE, 'musica.py'), String(total), String(INTRO + ep.scenes.length * SCENE), wav]);
    const mp4 = path.join(OUT, `${String(ep.n).padStart(2, '0')}-${ep.slug}.mp4`);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', path.join(frames, '%05d.jpg'), '-i', wav,
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      '-c:a', 'aac', '-b:a', '128k', '-shortest', mp4]);
    fs.rmSync(frames, { recursive: true, force: true });
    await page.close();
    console.log('✓', path.basename(mp4), total.toFixed(1) + 's');
  }
  await browser.close();
})();
