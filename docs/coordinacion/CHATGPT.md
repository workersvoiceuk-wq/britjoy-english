# Coordinación Claude ↔ ChatGPT (Voz Unida Mundo y BritJoy)

Propietario: **Oscar García**. Él aprueba todo lo que cueste dinero o cambie cuentas.

Claude y ChatGPT no se hablan directamente. Oscar pasa este documento a ChatGPT y le devuelve a Claude el
informe de ChatGPT, con el formato del final.

## Quién hace qué

| | Claude (Anthropic) | ChatGPT (OpenAI) |
|---|---|---|
| Acceso | Repositorios de GitHub `britjoy-english` y `lumi-uk-beta`, proyecto de Supabase `vvpmsmalgzqqfjfrlfwg`, lectura de la web pública vozunidamundo.com | **Sites de ChatGPT** (código y publicación de vozunidamundo.com, proyecto `appgprj_6acd576caeb48191a27d5ade52755a96`) y, si Oscar lo conecta, **Stripe** |
| Se encarga de | App BritJoy (web, Android e iOS), servidor de Supabase, revisiones y pruebas | Web de VUM, servidor de VUM (`/api/...`), configuración de Stripe |
| No hace | Publicar en Sites, ni entrar en Stripe o en ChatGPT | Tocar el repositorio ni Supabase sin avisar |

## Reglas comunes

- **Nunca escribir claves secretas** (`sk_live`, `sk_test`, `whsec_`, `sk-ant-`, contraseñas) en el chat, el código o
  este documento. Los `price_…`, `prod_…`, `acct_…` y las claves públicas `sb_publishable_…` sí se pueden compartir.
- **Autorización expresa de Oscar** para cada cobro real, reembolso, cancelación, cambio de precio o desactivación de
  un enlace de pago.
- Probar primero en **modo de prueba** de Stripe.
- En cada resultado, decir si se **COMPROBÓ** (se abrió o se probó), si se **DEDUCE** o si **NO SE PUDO** comprobar.

## Tareas para ChatGPT

### C1 · Arreglar las ventanas de los cursos en móvil (Sites)
- **Fallo, comprobado por Claude el 5 de noviembre en `/academia/apps/ingles/` (Pixel 7):** la ventana «English · A1–C2»
  (`<dialog class="tutor-dialog english-level-dialog">`) ocupa toda la pantalla y tapa los menús. Su cabecera con el
  título y «Close» no está fijada: al bajar desaparece y no queda ningún menú visible. Además, los niveles no caben en
  una fila (C2 queda solo) y algunas etiquetas aparecen en la misma línea que los botones.
- **Qué hacer:** añadir al CSS global del sitio el archivo
  [`docs/coordinacion/vum-dialogos.css`](./vum-dialogos.css), sin cambiar nada más. Cubre todas las ventanas
  `tutor-dialog` de los 7 cursos (`english-level-dialog`, `life-bank-dialog` y `exam-resources-dialog`).
- **Cómo comprobarlo:** en un móvil, abrir cada ventana, bajar hasta el final y verificar que siguen visibles el título
  y el botón Cerrar, y que Cerrar cierra la ventana. Hacerlo en `/academia/apps/{ingles,espanol,britjoy,ia,conduccion,ciberseguridad,electricidad}/`
  y en inglés (`/en/…`).

### C2 · IDs de precio de VUM Academy (Stripe)
- Listar los productos y precios de la cuenta `acct_1UTZAsR5Na5yDB6t`, **en modo de prueba y en modo real**: nombre,
  importe, moneda, periodicidad y si están activos.
- Dar el `price_…` de **VUM Academy (£5.99 al mes)** en cada modo. Oscar lo pondrá en Supabase como
  `STRIPE_ACADEMY_PRICE_IDS`. La app BritJoy solo da acceso con esos precios; la membresía Básica no cuenta.

### C3 · Enlaces de pago duplicados (Stripe)
- Enlaces activos según Oscar:
  - `buy.stripe.com/eVqeVf0F5fHL2Zd6LR7g404` (Academy)
  - `…/eVq28tdrR1QV7ftdaf7g402` (Membresía, el más reciente)
  - `…/4gM6oJdrRbrvczNgmr7g401` (Orientación, £25)
  - `…/14AbJ3cnNcvzdDR5HN7g400` (otra membresía)
- La web usa `billing.stripe.com/p/login/14AbJ3cnNcvzdDR5HN7g400` como portal de clientes: ese código coincide con el
  del cuarto enlace. Aclarar qué es cada uno, qué precio cobra y cuál usan las altas nuevas.
- Proponer si desactivar el enlace de membresía antiguo. Desactivarlo no cancela las suscripciones que ya existen.
  **No desactivarlo sin la autorización de Oscar.**

### C4 · Avisos de pago (webhooks) de Stripe
- Confirmar que existe un aviso hacia `https://vvpmsmalgzqqfjfrlfwg.supabase.co/functions/v1/billing-webhook` con los
  eventos `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated` y
  `customer.subscription.deleted`, en modo de prueba y en modo real.
- Enviar un evento de prueba (*Send test event*) y anotar la respuesta:
  - **200**: todo bien.
  - **400**: el `whsec_` no coincide.
  - **503**: falta una clave en Supabase.
- Indicar también qué avisos usa el servidor de vozunidamundo.com.

### C5 · Modo de prueba del servidor de VUM (Sites)
- Hoy `/api/academy/status` responde `testing:false`, es decir, cobra de verdad. Explicar cómo poner el servidor de VUM
  en modo de prueba (claves `sk_test` y precios de prueba) para probar con la tarjeta `4242 4242 4242 4242`, y cómo
  volver al modo real.
- Confirmar que el servidor de VUM solo da acceso tras un aviso de Stripe **verificado con firma**, nunca solo porque el
  usuario vuelve a la web con `?checkout=complete`.
- Avisar de algo importante: `academy-plan.js` rechaza cualquier respuesta que no sea exactamente 599, GBP y mensual.
  Si un día cambia el precio, hay que actualizar ese archivo a la vez.

## Tareas de Claude cuando llegue el informe

- **K1:** con los `price_…` de C2 y el resultado de C4, comprobar en los registros de Supabase que `billing-webhook`
  y `academy-sync` responden bien.
- **K2:** con Stripe en modo de prueba (C5), hacer la prueba completa: suscripción en la web, «Ya tengo VUM Academy:
  comprobar» en la app y cancelación.
- **K3:** volver a revisar las ventanas de los cursos en móvil tras C1 y confirmar el arreglo con capturas.
- **K4:** ajustar la app BritJoy a lo que se descubra en C3 y C5 (por ejemplo, el portal de clientes).

## Formato del informe de ChatGPT (copiar y rellenar)

```
INFORME CHATGPT · fecha:
C1 ventanas: hecho/no · publicado sí/no · comprobado en: … · problemas:
C2 precios: modo prueba price_… (Academy) · modo real price_… (Academy) · otros productos: …
C3 enlaces: 400 = … · 401 = … · 402 = … · 404 = … · portal 14AbJ3… es: … · propuesta: …
C4 webhooks: aviso a Supabase existe sí/no · eventos: … · test event: 200/400/503 · avisos de la web VUM: …
C5 modo prueba: cómo activarlo: … · verificación por firma: sí/no/no se pudo comprobar
Pendiente de autorización de Oscar: …
No se pudo comprobar: …
```
