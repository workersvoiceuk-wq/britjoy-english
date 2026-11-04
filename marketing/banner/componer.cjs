// Compone el texto (Nunito) sobre los renders 3D de Blender y exporta los banners finales.
// Uso: node componer.cjs <escena-ancho.png> <escena-movil.png> <Nunito.ttf> <carpeta-salida>
const { chromium } = require('playwright');
const fs = require('fs');
const [ancho, movil, fuente, salida] = process.argv.slice(2);
const b64 = (f) => fs.readFileSync(f).toString('base64');

const css = `
@font-face { font-family: Nunito; src: url(data:font/ttf;base64,${b64(fuente)}) format('truetype'); font-weight: 200 1000; }
* { box-sizing: border-box; margin: 0; }
body { font-family: Nunito, sans-serif; color: #3C3C3C; }
.lienzo { position: relative; overflow: hidden; background-size: cover; }
.marca { display: inline-flex; align-items: center; gap: 10px; background: #fff; border: 3px solid #E5E5E5;
  border-radius: 999px; font-weight: 800; color: #46A302; letter-spacing: .02em; }
.marca i { width: 12px; height: 12px; border-radius: 50%; background: #58CC02; display: inline-block; }
h1 { font-weight: 900; line-height: 1.02; letter-spacing: -0.02em; color: #2E2E2E; }
h1 span { color: #58CC02; }
p.sub { font-weight: 700; color: #4B4B4B; line-height: 1.3; }
.boton { display: inline-block; background: #58CC02; color: #fff; font-weight: 900; text-transform: uppercase;
  letter-spacing: .06em; border-radius: 20px; border-bottom: 7px solid #46A302; }
.pie { font-weight: 800; color: #5B6B52; }
.pie b { color: #46A302; }
`;

const paginaAncho = `<style>${css}
.lienzo { width: 1920px; height: 800px; background-image: url(data:image/png;base64,${b64(ancho)}); }
.texto { position: absolute; left: 120px; top: 110px; width: 840px; }
.marca { font-size: 26px; padding: 10px 22px; }
h1 { font-size: 104px; margin-top: 30px; }
p.sub { font-size: 36px; margin-top: 26px; width: 760px; }
.boton { font-size: 34px; padding: 22px 52px; margin-top: 44px; }
.pie { position: absolute; left: 120px; bottom: 44px; font-size: 24px; }
</style>
<div class="lienzo"><div class="texto">
  <span class="marca"><i></i>Voz Unida Mundo Academy</span>
  <h1>Aprende inglés<br>con <span>Britjoy</span></h1>
  <p class="sub">Del A1 al C2, paso a paso: lecciones cortas, juegos y un guía que te anima.</p>
  <span class="boton">Empieza ahora</span>
</div>
<div class="pie">Voz Unida Mundo Academy · te enseña &nbsp;—&nbsp; <b>Tu voz cuenta</b> &nbsp;·&nbsp; vozunidamundo.com</div></div>`;

const paginaMovil = `<style>${css}
.lienzo { width: 1080px; height: 1350px; background-image: url(data:image/png;base64,${b64(movil)}); text-align: center; }
.texto { position: absolute; left: 0; right: 0; top: 44px; }
.marca { font-size: 26px; padding: 9px 22px; }
h1 { font-size: 86px; margin-top: 20px; }
p.sub { font-size: 33px; margin: 16px auto 0; width: 880px; }
.abajo { position: absolute; left: 0; right: 0; bottom: 56px; }
.boton { font-size: 38px; padding: 24px 64px; }
.pie { font-size: 24px; margin-top: 30px; }
</style>
<div class="lienzo"><div class="texto">
  <span class="marca"><i></i>Voz Unida Mundo Academy</span>
  <h1>Aprende inglés<br>con <span>Britjoy</span></h1>
  <p class="sub">Del A1 al C2, paso a paso, con un guía que te anima.</p>
</div>
<div class="abajo"><span class="boton">Empieza ahora</span>
<div class="pie">Voz Unida Mundo Academy · te enseña — <b>Tu voz cuenta</b></div></div></div>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ deviceScaleFactor: 1 });
  for (const [html, w, h, nombre] of [[paginaAncho, 1920, 800, 'britjoy-banner-web-1920x800'], [paginaMovil, 1080, 1350, 'britjoy-banner-movil-1080x1350']]) {
    await p.setViewportSize({ width: w, height: h });
    await p.setContent('<!doctype html><body style="margin:0">' + html);
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: `${salida}/${nombre}.png` });
    await p.screenshot({ path: `${salida}/${nombre}.jpg`, type: 'jpeg', quality: 88 });
  }
  await b.close();
})();
