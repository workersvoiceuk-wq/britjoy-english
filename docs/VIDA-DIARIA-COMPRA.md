# Vida Diaria · compra para nuevas altas en Reino Unido (diff respecto al borrador de £19.99)

**Estado:** preparado en el PR #16 (borrador). **Nada activado:** sin venta, enlaces, cobros, IVA, webhooks vivos ni precios o productos creados.

**Precios confirmados por Óscar, IVA incluido:**
- **Curso:** **£12 al mes**.
- **Curso con orientación escrita básica:** **£20 al mes**, que son £12 del curso más **£8** de orientación.

**Estado de Stripe real, leído por ChatGPT:**
- los dos precios acordados existen, son mensuales e inclusivos, y están **inactivos**;
- no hay enlaces activos ni registros en Stripe Tax.

La Básica histórica, Academy y las suscripciones existentes no cambian.

## Qué cambia respecto al borrador antiguo (`acf931a1`, un precio de £19.99)

| Tema | Borrador de £19.99 (`acf931a1`) | Ahora (PR #16) | Commit |
|---|---|---|---|
| Precio y conceptos | Un precio de £19.99 en `STRIPE_PRICE_VIDA_DIARIA` | Curso £12 (`STRIPE_PRICE_VIDA_DIARIA`) y orientación £8 (`STRIPE_PRICE_VIDA_DIARIA_ORIENTACION`), solo junto al curso | `dd78a8d` |
| Precio en Stripe | Se usaba el ID sin comprobarlo | Antes de crear la sesión se lee cada Price: activo, mensual, GBP, importe exacto e IVA inclusivo si hay impuesto automático. Si no coincide, `price_mismatch` y no cobra | `dd78a8d` |
| Factura | Abría con cualquier `invoice.paid` del precio (incluso con `amount_paid` 1) | Pagada, GBP, `amount_paid = total`, todas las líneas del curso con su importe exacto y la suma igual al total | `dd78a8d` |
| Reembolsos y disputas | Un reembolso completo no cerraba el acceso | El reembolso completo y la disputa abierta o perdida cierran el periodo de esa factura; la disputa ganada lo reabre; cuenta el orden y el mismo segundo | `baf23fa`, `0aaeadb` |
| Orientación | No existía | Incluida solo si la suscripción la tiene y su línea está pagada; en **borrador** (`VIDA_DIARIA_ORIENTACION`) | `dd78a8d` |
| Una sesión por alumno | Sí, pero sin oferta: con una sesión abierta, la otra oferta recibía su URL | La sesión recuerda su oferta. Otra oferta recibe **409 `checkout_open`**. El cambio explícito (`replace: true`) caduca la sesión en Stripe y crea la nueva. Si la anterior se está pagando, `checkout_completing` | este commit |
| Vinculación | Cuenta iniciada (`client_reference_id` y metadatos) | Igual, más `metadata.offer`. Sin Payment Links | — |
| Cobros reales | Apagados salvo `sk_test_` o `VIDA_DIARIA_LIVE=on` | Igual | — |

## Migraciones (aditivas, en este orden y aún sin aplicar en ningún entorno)
1. `20261107120000_vida_diaria_access.sql`
2. `20261108120000_vida_diaria_reversals.sql`
3. `20261109120000_vida_diaria_conceptos.sql`
4. `20261110120000_vida_diaria_checkout_oferta.sql`: `course_checkout.offer`; `begin_course_checkout(p_user, p_product, p_offer)`, que devuelve `reuse`, `create` o `conflict` con su `reason`; `record_course_checkout` con la oferta; y `release_course_checkout`.

## Estados

| Pieza | Implementado | Probado (sin red) | Bloqueado | Listo para publicar |
|---|---|---|---|---|
| Comprobación de factura (£12 y £8) | Sí | Sí: 27 casos y control negativo | — | No (falta el sandbox) |
| Reembolsos, disputas y orden | Sí | Sí: 17 casos y PostgreSQL 16 | — | No (falta el sandbox) |
| Checkout por oferta, una sesión pagable | Sí | Sí: 10 casos con el handler real y dobles, SQL y concurrencia real con dos ofertas | — | No (falta el sandbox) |
| Precio verificado en Stripe | Sí | Sí, con dobles | Precios reales inactivos (correcto) | No |
| Orientación (£8) | Sí, en borrador | Sí | Activación, portal para añadirla o quitarla, e interfaz para `checkout_open`/`replace` | No |
| Sandbox dedicado (precios de prueba y webhook propio) | — | — | **Por validar** | — |
| Supabase de producción | — | — | Sin servicio ni material privado | — |

## Casos reproducibles
| Comando | Qué demuestra |
|---|---|
| `npx vitest run tests/vida-diaria-checkout-ofertas.test.ts` | Handler real `vidaDiariaCheckout` con dobles: controles en limpio; curso → orientación y orientación → curso devuelven **409** y nunca la URL de la otra oferta; `replace` caduca y crea; `checkout_completing`; 25 rondas de 8 peticiones simultáneas mezcladas (una sola sesión); reintentos; caducidad; creación abandonada que deja de bloquear a los 2 minutos; otra cuenta |
| `npx vitest run tests/vida-diaria-conceptos.test.ts` | Las 14 facturas insuficientes no abren nada; orientación; precios y ofertas |
| `npx vitest run tests/vida-diaria-reversals.test.ts` | Reembolsos, disputas, orden y mismo segundo |
| `PGHOST=… scripts/test-vida-diaria-sql.sh` | Migraciones en PostgreSQL 16, incluida la **concurrencia real con dos ofertas**: una crea y la otra recibe `conflict/in_progress` |
| **Control negativo SQL** | Con las migraciones de `dd78a8d`: tras una sesión de curso registrada (£12), la petición de `curso_orientacion` recibe `reuse` con la URL de £12 |

## Lo que falta antes de vender (lo decide y lo hace el dueño; nada desde aquí)
1. **Sandbox dedicado:** precios de prueba de £12 y £8 mensuales e inclusivos, un destino de webhook propio con los eventos de `VD_WEBHOOK_EVENTS`, Supabase de pruebas con las 4 migraciones y el paquete privado.
2. **Recorrido en el sandbox:**
   - compra de £12;
   - compra de £20;
   - cambio de oferta con una sesión abierta (409 y `replace`);
   - reembolso completo;
   - disputa con la tarjeta de prueba;
   - renovación fallida con *test clock*;
   - otra cuenta;
   - comprobar que Academy y la Básica no reciben nada del curso.
3. **Interfaz:** antes de vender la orientación, la página debe ofrecer las dos ofertas y responder a `checkout_open` con «continuar con la sesión abierta» o «cambiar de oferta» (`replace: true`).
4. **Producción:** solo después. Precios activos, `sk_live_`, `VIDA_DIARIA_LIVE=on` y, si corresponde, IVA automático.
