# Servidor de Britjoy English (Supabase)

Este servidor hace funcionar las **cuentas**, el **Modo IA**, **Britjoy Plus** y los **créditos IA**.
El progreso de las lecciones sigue guardado solo en el dispositivo.

Las claves secretas (Claude y Stripe) **solo** están aquí, como secretos de Supabase.
Nunca van en la web, en las apps ni en el repositorio.

| Pieza | Qué hace |
|---|---|
| `migrations/…_accounts_plus_credits.sql` | Crea las tablas `profiles` (Plus y créditos), `ai_usage` (mensajes gratis de hoy) y `purchases` (compras ya aplicadas). La app solo puede **leer** su propia fila; las escrituras solo las hacen las funciones. |
| `functions/britjoy-tutor` | Modo IA. Exige sesión iniciada y cobra cada mensaje antes de llamar a Claude: con Plus hay `PLUS_AI_DAILY` mensajes al día (15, uso justo), sin Plus `FREE_AI_DAILY` gratis al día (5), y después cada mensaje gasta 1 crédito. Si Claude falla, el mensaje se devuelve. |
| `functions/billing-checkout` | Abre el pago de Stripe (Plus mensual o anual, o el pack de 100 créditos). Solo se usa en la web. |
| `functions/billing-webhook` | Recibe los avisos de Stripe (pago completado, renovación, cancelación) y activa Plus o suma créditos. Cada aviso se aplica una sola vez. |
| `functions/billing-portal` | Abre el portal de Stripe para cambiar o cancelar Plus y descargar recibos. |
| `functions/account-delete` | Botón «Borrar mi cuenta». Cancela Plus y borra la cuenta. Lo exigen Google Play y la App Store. |
| `config.toml` | `billing-webhook` va sin token de Supabase, porque Stripe no lo envía; lo protege la firma de Stripe. |

## Puesta en marcha (una vez, unos 30 minutos)

### 1. Proyecto de Supabase
1. En https://supabase.com/dashboard crea un proyecto, por ejemplo `britjoy-english` en la región **London (eu-west-2)**.
   El plan gratuito basta para empezar.
2. **SQL Editor** → pega y ejecuta `migrations/20261104120000_accounts_plus_credits.sql`.
3. **Authentication → Providers → Email**: déjalo activado.
4. **Authentication → Email Templates → Magic Link**: cambia el texto para que incluya el código, por ejemplo:
   `Tu código para entrar en Britjoy English es: {{ .Token }}`
   La app pide ese código de 6 dígitos y no usa enlaces.
5. **Authentication → URL Configuration → Site URL**: `https://workersvoiceuk-wq.github.io/britjoy-english/`.
6. Para más de unos pocos emails al día, configura un SMTP propio en **Authentication → SMTP**
   (por ejemplo, el correo de vozunidamundo.com). El correo de prueba de Supabase tiene un límite muy bajo.

### 2. Claude (Modo IA)
1. Crea una clave en https://console.anthropic.com/ (Settings → API keys) y fija un **límite de gasto mensual** en Billing.
2. En Supabase, **Edge Functions → Secrets**, añade `ANTHROPIC_API_KEY`.
3. Opcional: `FREE_AI_DAILY` (por defecto, 5 mensajes gratis al día) y `PLUS_AI_DAILY` (por defecto, 15 con Plus).

### 3. Stripe (Britjoy Plus y créditos)
1. Crea una cuenta en https://dashboard.stripe.com y complétala con los datos de Voz Unida Mundo.
   Empieza en **modo de prueba** (test mode).
2. **Product catalogue → Add product**. Los precios son una propuesta; puedes cambiarlos:

   | Producto | Precio | Tipo | Secreto en Supabase con el ID del precio (`price_…`) |
   |---|---|---|---|
   | Britjoy Plus mensual | £5.99 / mes | Recurrente | `STRIPE_PRICE_PLUS_MONTH` |
   | Britjoy Plus anual | £47.99 / año | Recurrente | `STRIPE_PRICE_PLUS_YEAR` |
   | 100 créditos IA | £2.99 | Pago único | `STRIPE_PRICE_CREDITS_100` |

3. **Developers → API keys**: copia la *Secret key* en el secreto `STRIPE_SECRET_KEY`.
   Hazlo en Supabase, nunca en GitHub ni en el chat.
4. **Developers → Webhooks → Add endpoint**:
   - URL: `https://<REF>.supabase.co/functions/v1/billing-webhook`
   - Eventos: `checkout.session.completed`, `customer.subscription.updated` y `customer.subscription.deleted`.
   - Copia el *Signing secret* (`whsec_…`) en el secreto `STRIPE_WEBHOOK_SECRET`.
5. **Settings → Billing → Customer portal**: actívalo para que los usuarios puedan cancelar o cambiar de plan.
6. Opcional: el secreto `APP_URL` si la web cambia de dirección (por ejemplo `https://ingles.vozunidamundo.com/`).

### 4. Desplegar las funciones
```sh
npx supabase login
npx supabase link --project-ref <REF>
npx supabase functions deploy britjoy-tutor billing-checkout billing-webhook billing-portal account-delete
```
O pídeselo a Claude, dándole permiso para usar tu cuenta de Supabase.

### 5. Conectar la web y las apps
En GitHub, repositorio britjoy-english → **Settings → Secrets and variables → Actions → Variables**,
añade estas variables. **No son secretas**: son las públicas de Supabase, pensadas para ir en la app.

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | `https://<REF>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | La clave pública *anon* o *publishable* del proyecto (Project Settings → API) |
| `VITE_PRICE_PLUS_MONTH`, `VITE_PRICE_PLUS_YEAR`, `VITE_PRICE_CREDITS_100` | Opcional: el precio que se **muestra** si lo cambias en Stripe (por defecto 5.99 / 47.99 / 2.99) |
| `VITE_FREE_AI_DAILY` | Opcional: igual que `FREE_AI_DAILY` |

La siguiente publicación de la web (al hacer push a `main`) y de las apps activa todo.

### 6. Probar antes de cobrar de verdad
1. Con Stripe en modo de prueba, en la web: **Más → Britjoy Plus y tu cuenta**, inicia sesión con tu email y pulsa
   **Elegir** en el plan mensual.
2. Paga con la tarjeta de prueba `4242 4242 4242 4242` (cualquier fecha futura y cualquier CVC).
3. Al volver a la app debe aparecer «Tienes Britjoy Plus hasta el …», las vidas en ∞ y el Modo IA con 15 mensajes al día.
4. Compra el pack de créditos y comprueba que el saldo sube a 100.
5. En **Gestionar suscripción**, cancela: Plus sigue activo hasta el final del periodo pagado y luego termina solo. Para probarlo al momento, cancela la suscripción «inmediatamente» desde el panel de Stripe.
6. Cuando todo funcione, repite el paso 3 de Stripe con las claves **live** (modo real).
