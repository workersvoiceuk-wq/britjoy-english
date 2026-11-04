// Google Play feature graphic (1024 x 500) from the Blender scene + Nunito text.
// Usage: node store/grafico.cjs <escena-ancho.png> <Nunito.ttf>
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const [escena, fuente] = process.argv.slice(2);
const b64 = (f) => fs.readFileSync(f).toString('base64');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1024, height: 500 } });
  await p.setContent(`<!doctype html><style>
    @font-face { font-family: Nunito; src: url(data:font/ttf;base64,${b64(fuente)}); font-weight: 200 1000; }
    body { margin: 0; font-family: Nunito; }
    .c { width: 1024px; height: 500px; position: relative; overflow: hidden;
         background: linear-gradient(90deg, #FBF6EC 0 46%, rgba(251,246,236,0) 60%), url(data:image/png;base64,${b64(escena)}) right -60px center / auto 520px no-repeat, #FBF6EC; }
    .t { position: absolute; left: 48px; top: 70px; width: 470px; }
    h1 { margin: 0; font-size: 64px; line-height: 1.02; font-weight: 900; color: #1D2D5C; letter-spacing: -0.02em; }
    h1 span { color: #C8102E; }
    p { margin: 18px 0 0; font-size: 26px; font-weight: 800; color: #4A5578; }
    .pill { display: inline-block; margin-bottom: 20px; background: #1D2D5C; color: #fff; border: 3px solid #C9A227;
            border-radius: 999px; padding: 6px 16px; font-weight: 800; font-size: 18px; }
  </style><div class="c"><div class="t"><span class="pill">Voz Unida Mundo Academy</span>
  <h1>Aprende inglés con <span>Britjoy</span></h1><p>Del A1 al C2 y la vida en el Reino Unido.</p></div></div>`);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(__dirname, 'google-play-grafico-1024x500.png') });
  await b.close();
})();
