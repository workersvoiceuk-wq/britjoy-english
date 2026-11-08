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
| `vida-diaria-webhook` (**destino propio en Stripe**) | Webhook exclusivo del curso, sin JWT y firmado con su **propio** secreto, `STRIPE_WEBHOOK_SECRET_VIDA_DIARIA`. Aplica los eventos `customer.subscription.*` e `invoice.paid` con el precio `STRIPE_PRICE_VIDA_DIARIA` y `metadata.product` del curso. El acceso se escribe en `course_access`; nunca toca `plus_until` (Academy) ni los créditos. `invoice.paid` registra cada factura con su cuenta, suscripción y periodo. `paid_until` es el fin más tardío entre las facturas de la suscripción que no se han reembolsado por completo ni están en disputa (ver «Reembolsos, disputas y fraude»). |
| `billing-webhook` (créditos) | **Ignora** cualquier evento del curso (`isVidaDiariaEvent`), así que un evento del curso nunca concede VUM Academy ni créditos. En lo demás no cambia. |
| Migración `20261107120000_vida_diaria_access.sql` | Crea `course_access`, `course_access_events`, `apply_course_access` (solo service role), RLS de «lee solo tu fila» y el bucket privado. No modifica ninguna tabla existente. |
| Migración `20261108120000_vida_diaria_reversals.sql` | Aditiva. Añade `course_access.payment_reversed` y las tablas `course_invoices`, `course_payment_links` y `course_payment_reversals`, sin políticas: solo service role. Sustituye `apply_course_access` y `apply_course_payment`, que gana `p_invoice`, y añade `apply_course_payment_link` y `apply_course_reversal`. No toca `profiles`, `plus_until`, créditos ni Academy. |

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
   - `vida-diaria` (acceso, contenido y portal de facturas/cancelación) y `billing-checkout`, con la sesión del alumno;
   - `vida-diaria-webhook`, firmado por Stripe desde el destino propio del curso.
4. **CORS:** se han añadido `https://vozunidamundo.com` y `https://www.vozunidamundo.com`, sin comodines.
5. **El enlace antiguo `?curso=dia-a-dia`** redirige a `vida-diaria/`, y la ficha del catálogo general abre la página del curso.

## Activación (requiere credenciales o configuración del dueño; nada se hace desde Claude)

> **Estado de Stripe comprobado por Óscar en la cuenta real de VUM (7 nov 2026):**
> - destinos activos: `/api/academy/webhook` y `/api/membership/webhook`;
> - `/api/britjoy/webhook`: desactivado;
> - no hay ningún destino de Supabase activo.
>
> **No hay que modificar ni reactivar ninguno de ellos.** El curso necesita **un destino nuevo y separado** que apunte a la función `vida-diaria-webhook`. Primero en el **sandbox**; producción, solo después.

1. **Supabase, en un entorno de pruebas:**
   - aplicar las migraciones `20261107120000_vida_diaria_access.sql` y `20261108120000_vida_diaria_reversals.sql`, en ese orden;
   - desplegar `vida-diaria`, `vida-diaria-webhook` y `billing-checkout`.

   No hace falta volver a desplegar `billing-webhook` para el curso: su cambio solo hace que ignore los eventos del curso.
2. **Paquete privado:** subirlo con `scripts/upload-premium.mjs`, usando `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` del entorno del dueño.
3. **Stripe, en el sandbox (modo de prueba):**
   1. Crear el producto «Inglés para el día a día» con un precio recurrente mensual en GBP de £19.99. Poner su ID en el secreto `STRIPE_PRICE_VIDA_DIARIA`.
   2. **Añadir un destino de webhook NUEVO**, solo para el curso:
      - URL: `https://<ref>.supabase.co/functions/v1/vida-diaria-webhook`;
      - eventos: **exactamente** los que usa el código (`VD_WEBHOOK_EVENTS`):
        - `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`;
        - `invoice.paid`, `invoice_payment.paid`;
        - `charge.refunded`;
        - `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed`;
        - `radar.early_fraud_warning.created`.

      No hay que añadir estos eventos a los destinos de Academy ni de membresías.
   3. Copiar el secreto de firma de ese destino (`whsec_…`) en el secreto `STRIPE_WEBHOOK_SECRET_VIDA_DIARIA` de Supabase. Es distinto del secreto `STRIPE_WEBHOOK_SECRET` de `billing-webhook`.
   4. Habilitar el historial de facturas y la cancelación al final del periodo en el portal de clientes del sandbox. Vida Diaria usa un cliente Stripe separado por alumno. El portal abre ese cliente y sus facturas.
   5. IVA: dejar `VIDA_DIARIA_AUTOMATIC_TAX` desactivado mientras no corresponda cobrar IVA. Activarlo únicamente cuando exista un registro fiscal activo y se haya confirmado el tratamiento aplicable.
4. **Secretos opcionales:** `VIDA_DIARIA_URL`, la URL de vuelta tras el pago (por defecto `https://vozunidamundo.com/britjoy-english/vida-diaria/`).
5. **Prueba completa en el sandbox:**
   - una compra con tarjeta de prueba: en el destino nuevo llegan `invoice.paid` y `customer.subscription.created` con respuesta 200;
   - acceso a los módulos 2 a 12;
   - dos clics seguidos en «Suscribirme»: una sola sesión que se reutiliza hasta que Stripe la expire;
   - abrir la factura y cancelar desde el portal: el acceso se mantiene hasta la fecha programada (`cancel_at` en modo flexible);
   - una renovación con tarjeta que falla (por ejemplo, con un *test clock*): el acceso no pasa de la fecha pagada y el alumno gestiona el pago pendiente desde el portal;
   - otra cuenta: sin acceso;
   - un **reembolso completo** de la factura desde el panel: el acceso se cierra aunque la suscripción siga activa. Después, cancelar la suscripción para que el alumno pueda volver a comprar;
   - un **reembolso parcial**: el acceso sigue;
   - una **disputa** con la tarjeta de prueba de contracargo: el acceso se cierra; al ganarla con la evidencia de prueba, se reabre;
   - una petición sin sesión: 401.

   Comprobar también en Stripe que los destinos de Academy y de membresías **no** han recibido nada nuevo del curso.
6. **Producción:** solo tras completar las pruebas y confirmar el tratamiento de IVA que corresponda.
   - Crear el mismo destino separado en el modo real, con su propio `whsec_`, y el precio real.
   - Cambiar a la clave `sk_live_` y poner `VIDA_DIARIA_LIVE=on`.
   - Lo decide y lo hace el dueño, sin tocar los webhooks existentes.

## Reembolsos, disputas y fraude

Cada factura pagada del curso se guarda con su cuenta, suscripción y fin de periodo. `invoice_payment.paid` la enlaza con su PaymentIntent, o con su cargo si no tiene PaymentIntent. En esta versión de la API de Stripe (`2026-09-30`, stripe-node 23), el cargo ya no indica su factura, así que el enlace es necesario. Los reembolsos y las disputas llevan el cargo y el PaymentIntent, y con ellos se localiza la factura.

| Evento | Efecto en el acceso |
|---|---|
| `charge.refunded` con `refunded: true` (reembolso **completo**) | Esa factura deja de contar. Si era el periodo vigente, el acceso se cierra. |
| `charge.refunded` con `refunded: false` (reembolso **parcial**) | Ninguno. |
| `charge.dispute.*` en `needs_response`, `under_review` o `lost` (contracargo abierto o perdido; Stripe retira los fondos) | Esa factura deja de contar. |
| `charge.dispute.*` en `won` | Vuelve a contar. |
| `charge.dispute.*` en `warning_*` (consulta sin retirada de fondos) o `prevented` | Ninguno. |
| `radar.early_fraud_warning.created` | Se registra y no cambia el acceso: por sí sola no mueve dinero. Si después hay un reembolso o una disputa, se aplica su regla. Suspender el acceso con la alerta sería una decisión de negocio, no algo que diga Stripe. |
| `invoice.payment_failed` (renovación fallida) | Ninguno por sí mismo. Con `customer.subscription.updated` en `past_due`, el acceso termina en el fin del periodo pagado, como antes. |

**Garantías:**
- **Alcance:** solo cae el periodo de esa factura, en esa suscripción y en esa cuenta. Los periodos pagados posteriores siguen contando y las demás cuentas no cambian.
- **Duplicados:** cada evento se aplica una vez. Una misma factura reenviada con otro evento no cambia nada.
- **Orden:** los eventos pueden llegar en cualquier orden. Para una misma disputa o un mismo reembolso, un estado más antiguo no pisa uno más nuevo. `event.created` tiene resolución de un segundo: dentro del mismo segundo, un estado terminal de la disputa (`won`, `lost`, `warning_closed`, `prevented`) es más nuevo que una apertura o una actualización. Con segundos distintos manda la cronología. El ID del evento nunca se usa como reloj.
- **Concurrencia:** las escrituras se serializan con un bloqueo de transacción, así que un pago y su reembolso simultáneos no se pierden el uno al otro.
- **Otros productos:** sus cargos, disputas y enlaces llegan al mismo destino, porque los eventos de la cuenta no llevan metadata del producto. Solo se guardan sus IDs y no cambian nada, porque no enlazan con ninguna factura del curso.
- **Nueva compra:** tras un reembolso o una disputa, mientras la misma suscripción siga viva en Stripe, no se abre un checkout nuevo (cobraría dos veces). El estado es `expired` y el alumno vuelve a poder comprar cuando se cancela la suscripción.

## Pruebas

| Comando | Qué cubre |
|---|---|
| `npm test` (Vitest) | **Contrato:** muestra, compra de prueba, firma, cancelación, caducidad, cuenta distinta, separación de Academy, idempotencia y orden, y cobros reales apagados. **Contenido:** IDs. **Repositorio público:** sin contenido de pago. **Manifiesto de medios.** **Pedagogía:** el feedback por opción y la pista no dan la respuesta. Sin `VD_PREMIUM_DIR` se omiten las comprobaciones que necesitan el contenido de pago. |
| `VD_PREMIUM_DIR=… npx playwright test -c playwright.vida-diaria.config.ts` | Móvil 390 px y escritorio 1280 px con un servidor de pruebas que aplica el mismo contrato a eventos firmados. **Muestra:** vídeo de Flow, subtítulos, transcripción, fallo, feedback, pista, reintento, repaso y progreso. **Compra de prueba:** vídeo de pago servido en memoria; cancelación, caducidad y otra cuenta. **Acceso anónimo rechazado. Enlaces del catálogo general.** |
| `npx vitest run tests/vida-diaria-reversals.test.ts` | **Reembolsos y disputas:** reembolso completo y parcial; duplicados; las 24 llegadas posibles de alta, factura, enlace y reembolso; renovación posterior; reembolso de un periodo antiguo; otras cuentas y otro producto; otra suscripción; disputa abierta, ganada, perdida, consulta y en orden inverso; **mismo segundo**: `won` y `lost` en los dos órdenes, cronología de segundos distintos, IDs de evento en orden opuesto y duplicados; alerta de fraude; renovación fallida. **Control negativo:** con el `vida-diaria.ts` de `acf931a1` fallan 9 de 12; las 3 restantes son casos que no deben cambiar el acceso. |
| `scripts/test-vida-diaria-sql.sh` | Las migraciones en PostgreSQL local. **Reversiones:** reembolso antes que el enlace, la factura y el alta; duplicados; parcial; otro producto; renovación posterior; disputa abierta, ganada y antigua tardía; disputas del mismo segundo con `won` y `lost` en los dos órdenes; segundos distintos al revés; duplicados; reembolso y renovación después de la disputa; alerta de fraude; tablas nuevas invisibles para el alumno; funciones nuevas no ejecutables por `anon` ni `authenticated`. **Además:** idempotencia, orden, usuario inexistente, Academy sin tocar, `paid_until` que no retrocede, checkout (reutilizar, mismo intento, recuperar al caducar, un intento viejo no pisa y **dos sesiones concurrentes reales obtienen el mismo intento**), bucket privado y RLS (A, B y anónimo). |
