# Precios de Britjoy Plus: comparación y lo que gana el creador

Revisado el 4 de noviembre de 2026. Los precios de la competencia son orientativos: cambian con la región, la
plataforma y las ofertas, y varias fuentes no coinciden. Compruébalos en la web o en la tienda de cada app antes de
anunciar comparaciones.

## 1. Cursos y apps parecidos (Reino Unido)

| App o curso | Qué ofrece | Precio aproximado |
|---|---|---|
| **British Council, curso de autoestudio** | Inglés oficial, sin profesor | **£5.99 al mes** (página oficial) |
| British Council English Online (clases en directo) | Clases con profesor | Desde unas £50 al mes (precio de otro país; el del Reino Unido sin confirmar) |
| Duolingo Super | Sin anuncios, vidas ilimitadas | Las fuentes no coinciden: entre **£60 y £90 al año**, o entre £7 y £11 al mes |
| Busuu Premium | Curso completo y certificados | Desde **£6.99 al mes** (página de cupones) |
| Babbel | Curso completo | Unas **£8.95 al mes** en el plan anual |
| Praktika | Tutor de IA para hablar | Unos **$8–10 al mes** (≈ £6–8); 1 año, $119.99 |
| Curso suelto de Udemy | Un curso, pago único | $10–30 en ofertas |

**Dónde queda Britjoy:** cobra lo mismo que el autoestudio del British Council y menos que Duolingo, Busuu, Babbel o
Praktika. Además incluye lo que ninguno tiene: vivir en el Reino Unido (GP, Universal Credit, Council Tax…), la
historia de la familia García, el modo turista, español como idioma base y un tutor de IA. Además, todo el contenido
sigue gratis.

## 2. Precio recomendado (ya configurado en la app)

| Producto | Antes | **Ahora** | Por qué |
|---|---|---|---|
| Plus mensual | £4.99 | **£5.99** | El mismo precio que el British Council y por debajo de los demás. Con £4.99 te quedaba ~£1 menos al mes. |
| Plus anual | £39.99 | **£47.99** (≈ £4 al mes, ahorra 33 %) | Por debajo de Duolingo Super al año, cobrado por adelantado y con una sola comisión fija de Stripe. |
| 100 créditos IA | £2.99 | **£2.99** | Sin cambios: cubre de sobra lo que cuesta la IA. |

El Modo IA de Plus ya no es ilimitado: incluye hasta **15 mensajes al día**, el triple de los 5 gratis. Con un tutor de
IA ilimitado, alguien que lo use sin parar te costaría más de lo que paga. Si alguien llega al límite, puede seguir con
créditos.

## 3. Lo que ganas tú con cada venta

Supuestos:
- **Stripe:** tarjetas del Reino Unido, 1,5 % + £0,20 por pago, más un 0,5 % de Stripe Billing en las suscripciones
  (cifra de una sola fuente; compruébala en tu cuenta de Stripe). Las tarjetas de España o de la UE cuestan algo más
  (2,5 % + £0,20).
- **IA:** el modelo que usa el tutor cuesta $4 por millón de tokens de entrada y $20 por millón de salida. Un mensaje
  corto del tutor sale por **unos 1,2 peniques**, estimación con $1 ≈ £0,75.
- **Uso normal de Plus:** 80 mensajes de IA al mes.
- **IVA:** solo hay que pagarlo si te registras, lo que es obligatorio al pasar de **£90.000 de facturación al año**.
  Por debajo de esa cifra, te quedas la columna «sin IVA». Confírmalo con tu gestor.

| Venta | Precio | Stripe | Coste IA | **Te queda (sin IVA)** | Te queda (con IVA del 20 %) |
|---|---|---|---|---|---|
| Plus mensual, uso normal | £5.99 | £0.32 | £0.96 | **£4.71** | £3.71 |
| Plus mensual, uso máximo (15 mensajes cada día del mes) | £5.99 | £0.32 | £5.40 | **£0.27** | −£0.73 |
| Plus anual, uso normal | £47.99 | £1.16 | £11.52 | **£35.31** | £27.31 |
| 100 créditos IA | £2.99 | £0.24 | £1.20 | **£1.55** | £1.05 |

Ejemplo: con 200 suscriptores mensuales de uso normal, te quedarían unas **£940 al mes** antes de impuestos sobre la
renta, menos el coste fijo de Supabase si superas el plan gratuito (el plan Pro cuesta unos $25 al mes).

**Si las tiendas cobran** (cuando se venda dentro de Android o iPhone), Google y Apple se quedan con un 15 % (con sus
programas para pequeñas empresas) o un 30 %. Por eso conviene que la mayoría pague en la web.

## 4. Cómo ganar más sin subir el precio

- **Oferta de lanzamiento:** en Stripe, crea un cupón, por ejemplo `BRITJOY` con el primer mes a £1.99, y anúncialo en la
  serie de vídeos («Comenta BRITJOY»). La página de pago ya acepta cupones.
- **Empuja el plan anual:** cobras 12 meses de golpe y Stripe te cobra la comisión fija una sola vez.
- **Abarata la IA (tu decisión):** el tutor usa el modelo más capaz (Claude Opus 5.5). Con Claude Haiku 5.5, cada
  mensaje costaría unas 40 veces menos y podrías dar Modo IA casi ilimitado en Plus. Las respuestas serían algo menos
  finas en correcciones y role-play. Si lo quieres, dímelo y lo cambio y lo pruebo.
- **Precio regional, más adelante:** para países con menos poder adquisitivo, puedes crear en Stripe precios en otra
  moneda.

## 5. ¿Y si otros profesores crean cursos? (como Udemy)

En Udemy, el profesor se lleva el **37 %** de las ventas que hace la plataforma y el **97 %** de las que vienen de su
propio enlace o cupón. De las suscripciones se lleva un 15 % de un fondo común, repartido por minutos vistos. Si
quieres que otros creadores publiquen cursos en Britjoy y ganen dinero, una propuesta justa sería:
- **50 %** de lo que paguen los alumnos que lleguen con el enlace del creador.
- Un fondo del **20 % de Plus**, repartido según las lecciones completadas en sus cursos.

Eso necesita cuentas de creador y pagos a terceros (Stripe Connect). Dímelo si quieres que lo prepare.

## Cambiar precios

Primero cambia el precio en Stripe (Product catalogue). Después pon la misma cifra en las variables de GitHub
`VITE_PRICE_PLUS_MONTH`, `VITE_PRICE_PLUS_YEAR` y `VITE_PRICE_CREDITS_100`, para que la app muestre lo mismo. El límite de
IA de Plus se cambia con el secreto `PLUS_AI_DAILY` en Supabase y la variable `VITE_PLUS_AI_DAILY` en GitHub.

### Fuentes
- British Council, autoestudio: https://www.britishcouncil.org/english/learn-online/learnenglish-subscription
- British Council English Online, precios (versión de Egipto): https://englishonline.britishcouncil.org/plans-pricing/?country=eg&lang=ar
- Duolingo Super: https://www.papora.com/learn-english/super-duolingo-prices/ · https://lumi-academy.org/duolingo-pricing
- Busuu: https://www.weather2travel.com/shop/busuu/ · https://www.mainsum.com/busuu-review/
- Babbel: https://www.hotukdeals.com/vouchers/babbel.com · https://www.forbes.com/advisor/education/student-resources/babbel-review/
- Praktika: https://praktika.ai/blog/how-much-does-it-cost-to-learn-spanish-2026-3 · https://languavibe.com/praktika-review/
- Udemy, reparto con el profesor: https://support.udemy.com/hc/articles/229605008-Instructor-revenue-share
- Stripe en el Reino Unido: https://support.stripe.com/questions/pricing-updates-for-businesses-in-the-united-kingdom
