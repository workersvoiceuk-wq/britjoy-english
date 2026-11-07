# «Inglés para el día a día»: curso independiente de pago

- **Identificadores:** catálogo `dia-a-dia`, nivel `DIA`, 12 módulos. Las lecciones conservan sus IDs, de `dia-01-presentaciones` a `dia-12-opiniones`, y el progreso sigue en la misma clave (`britjoy-english-progress-v1`).
- **Producto aparte:** se vende fuera de VUM Academy y del curso Life in the UK.
- **Destino comercial:** Reino Unido, **£19.99 GBP al mes** para altas nuevas.
- **Ruta propuesta:** `/britjoy-english/vida-diaria/`.

> **Estado:**
> - **No está publicado ni cobrado.** Los cobros reales están apagados por código.
> - El alta real espera dos cosas: que Óscar confirme el IVA (lo revisa ChatGPT) y una prueba del checkout de Stripe en modo de prueba con las claves del dueño.

## Qué es público y qué no

`britjoy-english` es un **repositorio público**.

**Lo que sí está en el repositorio y en la web:**
- el código;
- el índice de los 12 módulos: títulos, objetivos e IDs, sin ejercicios ni explicaciones;
- la **muestra gratuita (módulo 1)**: su lección, el clip de Google Flow, su animación y sus VTT ES/EN.

**Lo que no está en el repositorio, en la web ni en ningún artefacto público:**
- las lecciones de los **módulos 2 a 12** (ejercicios y respuestas);
- sus 11 clips de Flow y 11 animaciones, con sus 44 VTT;
- los guiones y las transcripciones;
- el ZIP de Flow.

Todo eso va en un **paquete privado** aparte, que se sube al bucket **privado** `vida-diaria-premium` de Supabase Storage. Solo la función `vida-diaria` lo lee: con service role, para una sesión válida y con `course_access` activo.

**Comprobaciones:**
- `tests/vida-diaria-course.test.ts` falla si aparece en git o en `public/` un archivo de un módulo de pago o un ZIP.
- `node scripts/check-vida-diaria-bundle.mjs` compara el `dist/` con los textos de pago. Necesita `VD_PREMIUM_DIR`.

> **Brecha conocida:** hasta `main` `f076629`, los módulos 2 a 12 estaban en `src/data/courses/dia-a-dia/` y, por tanto, siguen en el **historial público** del repositorio. Este cambio los retira de la rama y del bundle, pero no del historial. Para que el texto de esas lecciones fuera realmente exclusivo, habría que renovarlo o reescribir el historial; eso es una decisión del dueño. Los vídeos de Flow y las animaciones de pago **nunca** han estado en el repositorio.

## Piezas

| Pieza | Qué hace |
|---|---|
| `vida-diaria/index.html` + `src/vida-diaria/` | Página propia del curso con estas pantallas: inicio (12 módulos, avance, oferta y acceso, guía ES/EN) → módulo (objetivo, vídeo con controles, subtítulos ES/EN/off y transcripción) → práctica → resultado. **La práctica:** un ejercicio por pantalla; feedback sobre la opción elegida; pista gradual; reintento; respuesta en el segundo fallo; repaso de fallos al final. Funciona con teclado (Enter, foco en el resultado) y en móvil (botones de 44 px o más). |
| `src/data/vida-diaria/outline.json` | Índice público, generado con `scripts/vida-diaria-outline.mjs` (necesita `VD_PREMIUM_DIR`). |
| `src/data/vida-diaria/media.json` | Manifiesto público de medios por módulo: estado real, archivo, VTT, acceso y ruta de integración. La transcripción solo figura en la muestra. |
| `scripts/import-flow-videos.mjs` | Importa el ZIP de Flow con estas comprobaciones: SHA-256 del ZIP y de cada MP4, 12 módulos exactos, 720×1280, decodificación completa y VTT válidos que terminan antes del final del vídeo. El módulo 01 va a `public/videos/vida-diaria/` y los módulos 02–12 a `VD_PREMIUM_DIR/media/`. Si algo falla, no copia nada. |
| `scripts/upload-premium.mjs` | Sube el paquete privado al bucket, tras comprobar sus `SHA256SUMS`. Después verifica que la lectura anónima se rechaza. La clave de servicio va solo en el entorno. |
| `supabase/functions/_shared/vida-diaria.ts` | Contrato puro: precio, módulos, decisión de acceso y aplicación de eventos (una vez cada uno y nunca uno antiguo sobre uno nuevo). |
| `supabase/functions/vida-diaria` | Responde a `POST {action:"status"\|"module"\|"media"}` con sesión. Devuelve **401** sin sesión, **402** sin pago y **404** si el módulo no existe. |
| `billing-checkout` (`product: "vida_diaria_monthly"`) | Checkout de suscripción con `subscription_data.metadata` (`user_id` y `product`). Solo admite altas nuevas: con acceso activo responde 409. **Una sesión abierta por alumno:** `begin_course_checkout` decide con un bloqueo por alumno si se reutiliza la sesión abierta (le quedan más de 5 minutos) o se crea otra. La sesión se crea con una clave de idempotencia de Stripe estable por (alumno, intento), de modo que peticiones simultáneas reciben la misma. Al caducar, se abre un intento nuevo. **IVA:** `automatic_tax` (con dirección de facturación obligatoria) solo se activa con `VIDA_DIARIA_AUTOMATIC_TAX=on`, cuando el tratamiento fiscal esté confirmado. **Cobros reales apagados** salvo con clave `sk_test_`, o si el dueño pone `VIDA_DIARIA_LIVE=on`. |
| `billing-webhook` | Aplica al curso los eventos que cumplen todo esto: firmados por Stripe, `customer.subscription.*` o `invoice.paid`, precio `STRIPE_PRICE_VIDA_DIARIA` y `metadata.product` del curso. El acceso se escribe en `course_access`; nunca toca `plus_until` (Academy) ni los créditos. `invoice.paid` fija `paid_until`, la fecha efectivamente pagada, que solo avanza. |
| Migración `20261107120000_vida_diaria_access.sql` | Crea `course_access`, `course_access_events`, `apply_course_access` (solo service role), RLS de «lee solo tu fila» y el bucket privado. No modifica ninguna tabla existente. |

**Reglas de acceso:**
- El acceso termina en la **más temprana** de dos fechas: el final del periodo de la suscripción y `paid_until`. Una renovación todavía no pagada no abre el periodo nuevo.
- `past_due`, una renovación impagada, deja el acceso en el inicio del periodo no pagado.
- `active` y `trialing` dan acceso hasta ese límite.
- Si el pago llega antes que la suscripción, o al revés, el estado queda `pending` hasta que llegan los dos.
- Si el alumno cancela al final del periodo, mantiene el acceso hasta esa fecha.
- `deleted`, `unpaid` e `incomplete` lo cierran.
- El acceso pertenece al `user_id` verificado que pagó; otra cuenta no ve nada.

## Integración en Sites

1. **Publicar** el `dist/` de esta rama en `/britjoy-english/`, conservando la ruta `vida-diaria/`. Las rutas son relativas (`base: './'`).
2. **Compilar** con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. La clave pública ya la usa la app; no es secreta.
3. **Endpoints**, en `https://<ref>.supabase.co/functions/v1/…`:
   - `vida-diaria` y `billing-checkout`, con la sesión del alumno;
   - `billing-webhook`, firmado por Stripe.
4. **CORS:** se han añadido `https://vozunidamundo.com` y `https://www.vozunidamundo.com`, sin comodines.
5. **El enlace antiguo `?curso=dia-a-dia`** redirige a `vida-diaria/`, y la ficha del catálogo general abre la página del curso.

## Activación (requiere credenciales o configuración del dueño; nada se hace desde Claude)

1. **Supabase:** aplicar la migración `20261107120000_vida_diaria_access.sql` y desplegar `vida-diaria`, `billing-checkout` y `billing-webhook`.
2. **Paquete privado:** subirlo con `scripts/upload-premium.mjs`, usando `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` del entorno del dueño.
3. **Stripe, en modo de prueba:**
   - crear el producto «Inglés para el día a día» con un precio recurrente mensual en GBP de £19.99;
   - configurar el IVA de Reino Unido según decidan Óscar y ChatGPT;
   - poner el ID del precio en el secreto `STRIPE_PRICE_VIDA_DIARIA`;
   - comprobar que el webhook existente recibe `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` e **`invoice.paid`**.
   - Cuando se confirme el IVA: activar Stripe Tax en la cuenta y poner `VIDA_DIARIA_AUTOMATIC_TAX=on`.
4. **Secretos opcionales:** `VIDA_DIARIA_URL`, la URL de vuelta tras el pago (por defecto `https://vozunidamundo.com/britjoy-english/vida-diaria/`).
5. **Prueba real en modo de prueba:**
   - una compra con tarjeta de prueba;
   - acceso a los módulos 2 a 12;
   - cancelar desde el portal: el acceso se mantiene hasta la fecha;
   - otra cuenta: sin acceso;
   - una petición sin sesión: 401.
6. **Producción:** solo tras esa verificación y la confirmación del IVA. Cambiar a la clave `sk_live_` y poner `VIDA_DIARIA_LIVE=on`.

## Pruebas

| Comando | Qué cubre |
|---|---|
| `npm test` (Vitest) | **Contrato:** muestra, compra de prueba, firma, cancelación, caducidad, cuenta distinta, separación de Academy, idempotencia y orden, y cobros reales apagados. **Contenido:** IDs. **Repositorio público:** sin contenido de pago. **Manifiesto de medios.** **Pedagogía:** el feedback por opción y la pista no dan la respuesta. Sin `VD_PREMIUM_DIR` se omiten las comprobaciones que necesitan el contenido de pago. |
| `VD_PREMIUM_DIR=… npx playwright test -c playwright.vida-diaria.config.ts` | Móvil 390 px y escritorio 1280 px con un servidor de pruebas que aplica el mismo contrato a eventos firmados. **Muestra:** vídeo de Flow, subtítulos, transcripción, fallo, feedback, pista, reintento, repaso y progreso. **Compra de prueba:** vídeo de pago servido en memoria; cancelación, caducidad y otra cuenta. **Acceso anónimo rechazado. Enlaces del catálogo general.** |
| `scripts/test-vida-diaria-sql.sh` | La migración en PostgreSQL local: idempotencia, orden, usuario inexistente, Academy sin tocar, `paid_until` que no retrocede, checkout (reutilizar, mismo intento, recuperar al caducar, un intento viejo no pisa y **dos sesiones concurrentes reales obtienen el mismo intento**), bucket privado y RLS (A, B y anónimo). |
