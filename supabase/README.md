# Servidor de Britjoy English (Supabase)

Este servidor hace funcionar las **cuentas**, el **Modo IA**, el acceso de **VUM Academy** en la app y los **créditos IA**.
El progreso de las lecciones sigue guardado solo en el dispositivo.

Las claves secretas (Claude y Stripe) **solo** están aquí, como secretos de Supabase.
Nunca van en la web, en las apps ni en el repositorio.

| Pieza | Qué hace |
|---|---|
| `migrations/*.sql` | Crea las tablas `profiles` (fecha de VUM Academy en la app, `plus_until`, y créditos), `ai_usage` (mensajes gratis de hoy) y `purchases` (compras ya aplicadas). La app solo puede **leer** su propia fila; las escrituras solo las hacen las funciones. |
| `functions/britjoy-tutor` | Modo IA. Exige sesión iniciada y cobra cada mensaje antes de llamar a Claude: con VUM Academy hay `PLUS_AI_DAILY` mensajes al día (15, uso justo); sin ella, `FREE_AI_DAILY` gratis al día (5), y después cada mensaje gasta 1 crédito. Si Claude falla, el mensaje se devuelve. |
| `functions/billing-checkout` | Abre el pago de Stripe del pack de 100 créditos. Solo se usa en la web. La suscripción (VUM Academy) se vende en vozunidamundo.com. |
| `functions/academy-sync` | Botón «Ya tengo VUM Academy: comprobar». Busca en Stripe, por el email verificado de la cuenta, una suscripción activa de VUM Academy y activa la app hasta el final del periodo pagado. Solo lee de Stripe. |
| `functions/billing-webhook` | Recibe los avisos de Stripe. Suma créditos, y cuando se crea, renueva o cancela una suscripción de VUM Academy (comprada en vozunidamundo.com), actualiza la app de la cuenta con el mismo email verificado. Cada aviso se aplica una sola vez. |
| `functions/billing-portal` | Abre el portal de Stripe para gestionar VUM Academy y descargar recibos. |
| `functions/council-finder` | «Tu ciudad»: convierte un código postal del Reino Unido en su council con la API oficial de GOV.UK. Es pública (no hace falta cuenta), no guarda nada y no usa secretos. |
| `functions/account-delete` | Botón «Borrar mi cuenta». Borra la cuenta de la app; **no** cancela la suscripción de VUM Academy, que es de la web. Lo exigen Google Play y la App Store. |
| `config.toml` | `billing-webhook` va sin token de Supabase, porque Stripe no lo envía; lo protege la firma de Stripe. |

## Estado del proyecto

- Proyecto de Supabase **`britjoy-english`** (ref `vvpmsmalgzqqfjfrlfwg`, región Londres), creado el 4 de noviembre de 2026.
- Base de datos aplicada: las dos migraciones de `migrations/`. La revisión de seguridad de Supabase no muestra avisos.
- Las 7 funciones están desplegadas (council-finder, el 5 de noviembre de 2026). Endpoint del webhook de Stripe:
  `https://vvpmsmalgzqqfjfrlfwg.supabase.co/functions/v1/billing-webhook`
- Falta lo que solo puede hacer el dueño: los secretos (Claude y Stripe), las plantillas de email y las variables de
  GitHub (pasos 1.4–1.6, 2, 3 y 5).

## Puesta en marcha (una vez, unos 30 minutos)

### 1. Proyecto de Supabase
1. En https://supabase.com/dashboard crea un proyecto, por ejemplo `britjoy-english` en la región **London (eu-west-2)**.
   El plan gratuito basta para empezar.
2. **SQL Editor** → pega y ejecuta `migrations/20261104120000_accounts_plus_credits.sql`.
3. **Authentication → Providers → Email**: déjalo activado.
4. **Authentication → Email Templates**: en **Confirm signup** (primera vez) y en **Magic Link** (las siguientes),
   cambia el texto para que incluya el código, por ejemplo:
   `Tu código para entrar en Britjoy English es: {{ .Token }}`
   La app pide ese código de 6 dígitos y no usa enlaces.
5. **Authentication → URL Configuration → Site URL**: `https://workersvoiceuk-wq.github.io/britjoy-english/`.
6. Para más de unos pocos emails al día, configura un SMTP propio en **Authentication → SMTP**
   (por ejemplo, el correo de vozunidamundo.com). El correo de prueba de Supabase tiene un límite muy bajo.

### 2. Claude (Modo IA)
1. Crea una clave en https://console.anthropic.com/ (Settings → API keys) y fija un **límite de gasto mensual** en Billing.
2. En Supabase, **Edge Functions → Secrets**, añade `ANTHROPIC_API_KEY`.
3. Opcional: `FREE_AI_DAILY` (por defecto, 5 mensajes gratis al día) y `PLUS_AI_DAILY` (por defecto, 15 con VUM Academy).

### 3. Stripe (la misma cuenta de Voz Unida Mundo)
1. Usa la cuenta de Stripe de Voz Unida Mundo (`Voz unida mundo`). Prueba primero en **modo de prueba**.
2. Secretos en Supabase con los IDs de precio (`price_…`):

   | Qué | Precio | Secreto en Supabase |
   |---|---|---|
   | VUM Academy (ya existe; se vende en vozunidamundo.com) | £5.99 / mes | `STRIPE_ACADEMY_PRICE_IDS`: el ID o IDs del precio de Academy, separados por comas. Solo esos precios activan la app; Básica no. |
   | 100 créditos IA (producto nuevo) | £2.99, pago único | `STRIPE_PRICE_CREDITS_100` |

3. **Developers → API keys**: copia la *Secret key* en el secreto `STRIPE_SECRET_KEY`.
   Hazlo en Supabase, nunca en GitHub ni en el chat.
4. **Developers → Webhooks → Add endpoint**:
   - URL: `https://<REF>.supabase.co/functions/v1/billing-webhook`
   - Eventos: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated` y `customer.subscription.deleted`.
   - Copia el *Signing secret* (`whsec_…`) en el secreto `STRIPE_WEBHOOK_SECRET`.
5. **Settings → Billing → Customer portal**: ya lo usa vozunidamundo.com; no hace falta tocarlo.
6. Opcional: el secreto `APP_URL` si la web cambia de dirección (por ejemplo `https://ingles.vozunidamundo.com/`).

### 4. Desplegar las funciones
```sh
npx supabase login
npx supabase link --project-ref <REF>
npx supabase functions deploy britjoy-tutor billing-checkout billing-webhook billing-portal account-delete academy-sync council-finder
```
O pídeselo a Claude, dándole permiso para usar tu cuenta de Supabase.

### 5. Conectar la web y las apps
En GitHub, repositorio britjoy-english → **Settings → Secrets and variables → Actions → Variables**,
añade estas variables. **No son secretas**: son las públicas de Supabase, pensadas para ir en la app.

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | `https://<REF>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | La clave pública *anon* o *publishable* del proyecto (Project Settings → API) |
| `VITE_PRICE_ACADEMY_MONTH`, `VITE_PRICE_CREDITS_100` | Opcional: el precio que se **muestra** si lo cambias en Stripe (por defecto 5.99 / 2.99) |
| `VITE_FREE_AI_DAILY` | Opcional: igual que `FREE_AI_DAILY` |

La siguiente publicación de la web (al hacer push a `main`) y de las apps activa todo.

### 6. Probar antes de cobrar de verdad
1. Con Stripe en modo de prueba, suscríbete a VUM Academy en vozunidamundo.com con un email de prueba
   (tarjeta `4242 4242 4242 4242`, cualquier fecha futura y CVC).
2. En la app: **Más → VUM Academy y tu cuenta**, inicia sesión con **el mismo email** y pulsa
   «Ya tengo VUM Academy: comprobar». Debe aparecer «Tienes VUM Academy hasta el …», las vidas en ∞ y el Modo IA con 15 mensajes al día.
3. Compra el pack de créditos en la web de la app y comprueba que el saldo sube a 100.
4. Cancela la suscripción «inmediatamente» desde el panel de Stripe: la app debe quitar el acceso con el aviso del webhook.
6. Cuando todo funcione, repite el paso 3 de Stripe con las claves **live** (modo real).
