# Repaso A2 con vídeos: entrega independiente para Sites

La carpeta `repaso-a2/` se copia **tal cual** a `/britjoy-english/repaso-a2/` del Site.

**No sustituye ni modifica** nada de lo existente:
- `/britjoy-english/` (`story.js` y `city-hub.js`);
- `/britjoy-english/tutor/`;
- `/britjoy-english/api/*`;
- las cuentas, el historial y las constancias.

No necesita servidor, base de datos, Supabase, cuota ni proveedor nuevos: son solo archivos estáticos.

## Qué contiene
| Archivo | Contenido |
|---|---|
| `index.html` y `app.js` | Página sin dependencias externas |
| `data.json` | Las 4 lecciones A2 con sus IDs originales: `a2-u1-l1`, `a2-u1-l2`, `a2-u2-l1` y `a2-u2-l2`. Cada pregunta se identifica como `<lección>:<índice>`, igual que en la app React. |
| `media/` | 34 MP4 (4 de capítulo y 30 de pregunta) y 68 VTT (español e inglés) |
| `MANIFIESTO.json` | Clip, lección, pregunta, archivos con bytes y SHA-256, y permisos de cada medio |

## Comportamiento
- **Vídeo de capítulo:** al abrir cada lección, antes de las preguntas.
- **Primer fallo:** se marca en rojo, con pista y reintento. No se muestran la solución ni el vídeo.
- **Vídeo de repaso:** solo **después de acertar** o al **agotar los dos intentos**. En el segundo caso, también se muestra la respuesta correcta.
- **Subtítulos:** Español, English o Sin subtítulos. Un aviso indica que la locución original está pendiente.
- **Enlace de retorno:** «← Volver a BritJoy English» (`href="../"`), que lleva a `/britjoy-english/`.

## Progreso: qué se conserva y qué no
- **El progreso de la app vigente no se toca.** La página no lee ni escribe `lumi-v8-guest` ni `britjoy-answer-sound-v1`, y no llama a `/britjoy-english/api/me` ni a `/api/story/*`. La cuenta, el historial, las misiones y las constancias quedan igual.
- **El avance del repaso** (qué lecciones se han terminado) se guarda **solo en el navegador del alumno**, en la clave `britjoy-repaso-a2-v1`. No se sincroniza con la cuenta y no cuenta para constancias.

## Comprobaciones antes de publicar (Claude)
- `node scripts/build-sites-repaso-a2.mjs` regenera esta carpeta desde la app (lecciones y clips).
- `node e2e/sites-repaso-a2.cjs` es la prueba en Chromium a 390 y 1280 px. Usa un servidor que imita las rutas de Sites y un perfil histórico aislado.
- GET de producción a las 12:30Z del 07-11-2026:
  - `/britjoy-english/` responde 200 (destino del retorno) y `/britjoy-english/tutor/` también responde 200;
  - `/britjoy-english/repaso-a2/` responde 404, así que la ruta está libre.

## Aviso para la publicación
El dominio sin `www` ignora las peticiones de rango (`Range`) en los estáticos: lo documenté en el diagnóstico de VUM TV. Los vídeos se reproducen desde el principio, pero adelantar dentro de un vídeo puede no funcionar en el dominio sin `www` hasta que se active el soporte de rangos.
