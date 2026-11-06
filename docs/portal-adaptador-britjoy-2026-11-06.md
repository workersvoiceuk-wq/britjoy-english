# Adaptador de portal · Inglés básico (BritJoy English) · 6 nov 2026 · PREPARADO, SIN INTEGRAR NI PUBLICAR

**Rama:** `claude/portal-adaptador-britjoy`. Parte de `claude/pr2-ayuda-tras-responder` (PR2 más la corrección de la clave duplicada y la ayuda tras responder).

## Qué es
- **`src/shared/portal/portal-adapter.mjs`:** módulo sin importaciones, con tipos en `.d.mts`. El portal común de VUM puede cargar el mismo archivo.
  - **Solo lee** `britjoy-english-progress-v1`, el almacén persistido de la app. No cambia IDs, no escribe y no da XP.
- **«Inglés básico»** = los niveles **A1 y A2** del curso `ingles-a1-c2`: hoy, 10 + 2 = 12 lecciones.
  - El adaptador devuelve las hechas, la siguiente y el nivel actual.
  - Resume también el resto del catálogo, que son 16 cursos y 224 lecciones.
- **`public/portal-catalog.json`,** generado con `npx vite-node scripts/build-portal-catalog.ts`. Lleva solo IDs y títulos de cursos, niveles y lecciones, sin respuestas.
  - Una prueba comprueba que coincide con `CATALOG`.
  - Vite lo copia a `dist/`, así que se publica junto con la app.
- **Demostración de inglés** (`ingles-morning-greeting`): en `draft`, no reproducible y sin URL. La alternativa es la explicación escrita.

## Pruebas (6 nov 2026)
- `npx vitest run`: **316 de 316**, 7 de ellas nuevas en `tests/portal-adapter.test.ts`. El almacenamiento de las pruebas falla si se escribe.
- `npm run build` (`tsc -b` + vite): correcta; `dist/portal-catalog.json` presente.

## Bloqueo para el portal en la web
La app React se publica hoy en **GitHub Pages** (`workersvoiceuk-wq.github.io/britjoy-english/`), que es otro origen: un portal en `vozunidamundo.com` **no puede leer** ese progreso. Para que el portal muestre el progreso de Inglés básico, la app tiene que servirse bajo `vozunidamundo.com`, por ejemplo en `/britjoy-english/`.
- **Esa ruta da hoy 404** (Sites164), y lo que había antes era otra implementación, la «ciudad».
- **Decidir qué se sirve ahí** corresponde a Oscar y al responsable de Sites.
- **Separar orígenes no migra ni mezcla progreso:** cada app conserva el suyo.
