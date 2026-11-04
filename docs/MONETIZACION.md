# BritJoy y Voz Unida Mundo: cómo ganan dinero

## Decisión (4 de noviembre de 2026): una sola suscripción, VUM Academy

Hay **una sola suscripción**: VUM Academy, a £5.99 al mes. Se contrata en
vozunidamundo.com y desbloquea también la app BritJoy, con el **mismo email verificado** y la misma cuenta de
Stripe. La app ya no vende una suscripción propia («BritJoy Plus»); solo vende los packs de créditos IA.

| Nivel | Precio | Dónde se paga |
|---|---|---|
| Gratis | £0 | — |
| VUM Academy (web y app) | £5.99 / mes (anual a £47.99, pendiente de crear en Stripe) | vozunidamundo.com |
| Créditos IA | £2.99 / 100 | Web de la app |
| Básica (orientación) | £15 / mes | vozunidamundo.com |
| Orientación puntual | £25 | Enlace enviado tras confirmar la cita |
| Empresa / Market | Desde £59 / mes, más la propuesta «Inglés para tu equipo» | vozunidamundo.com |

**Cómo ganan dinero las apps de referencia** (cifras aproximadas):
- **Duolingo**: la mayor parte de sus ingresos son suscripciones; el resto, anuncios y su examen oficial.
- **Busuu**: Premium y venta a empresas.
- **Babbel**: suscripción y clases en directo.
- **Praktika**: suscripción a su tutor de IA.
- **British Council**: el contenido gratis atrae; ganan con las clases con profesor y los exámenes (IELTS).
- **Udemy**: venta de cursos sueltos y planes para empresas.

**Conclusión:** volumen barato, más un servicio humano caro, más venta a empresas. VUM ya tiene las tres piezas.

---


La idea copia lo mejor de Duolingo (Super), Busuu (Premium) y Praktika (créditos de IA), adaptada a una academia
social: **todo el contenido de los cursos sigue siendo gratis**. Se paga por la comodidad y por el coste real de
la IA.

| | Gratis | 👑 VUM Academy |
|---|---|---|
| Todos los cursos, lecciones, vídeos y certificados | ✓ | ✓ |
| Vidas | 5, que se recargan | ∞ ilimitadas (como Duolingo Super) |
| Modo IA (tutor Britjoy con Claude) | 5 mensajes al día y luego créditos | 15 mensajes al día (uso justo) y luego créditos |
| Recomendaciones entre lecciones | Sí, solo propias | No |
| Precio propuesto | — | £5.99 al mes o £47.99 al año (ahorra 33 %); comparación y márgenes en `docs/PRECIOS.md` |

**Créditos IA** (como Praktika): un pack de 100 por £2.99, que no caduca. 1 crédito = 1 mensaje.
Sirve para quien no quiere suscripción. Un mensaje corto del tutor cuesta a la academia unos céntimos de API,
así que el pack cubre su coste con margen. Revisa los precios de Claude en tu consola antes de fijar los tuyos.

## Lo que está hecho
- Cuenta con email y código de 6 dígitos, sin contraseña. Es opcional: sin cuenta se puede hacer todo menos el Modo IA.
- Base de datos con seguridad por filas: nadie puede darse VUM Academy ni créditos desde la app.
- Pago en la web con Stripe Checkout, suscripción y pack. Incluye renovaciones, cancelaciones e impagos (webhook).
  Cada aviso de Stripe se aplica una sola vez.
- Portal de Stripe para cancelar, cambiar de plan y descargar facturas.
- Modo IA con mensajes gratis al día, VUM Academy y créditos. Si Claude falla, el mensaje no se cobra.
- Vidas ilimitadas con VUM Academy (∞ en la cabecera y en la lección).
- Recomendaciones propias al terminar una lección (solo si no tienes VUM Academy):
  - «Invita a un amigo», con el botón de compartir del móvil (el crecimiento por recomendación de Duolingo).
  - «Prueba VUM Academy».
  - «Voz Unida Mundo».
  No hay redes publicitarias, cookies ni seguimiento.
- Botón «Borrar mi cuenta», obligatorio en Google Play y la App Store.
- Política de privacidad (es/en) y respuestas de las tiendas actualizadas (`store/ficha-tienda.md`).
- Todo traducido a los 10 idiomas de la app.

## Lo que tienes que hacer tú
Sigue `supabase/README.md`: crear Supabase, Stripe y la clave de Claude, y meter las claves como secretos.
Claude no puede crear cuentas de pago ni manejar tus claves por ti.

## Por qué las apps de las tiendas no venden nada (todavía)
Google Play y la App Store obligan a vender el contenido digital (suscripciones, créditos) **con su propio sistema
de cobro**, y se quedan con un 15 % (en el primer millón al año o en suscripciones de más de un año) o un 30 %.
Para publicar ya sin ese trabajo:
- Las apps **no muestran precios ni enlaces de pago**. Solo dicen: «Si ya tienes VUM Academy o créditos, inicia sesión».
  Apple lo permite en apps multiplataforma (3.1.3(b)).
- Quien paga en la web tiene VUM Academy también en el móvil.

**Siguiente paso, si quieres vender dentro de las apps:** añade Google Play Billing y StoreKit con
RevenueCat (`@revenuecat/purchases-capacitor`). Necesitas:
1. Crear los mismos productos en Play Console y en App Store Connect.
2. Una cuenta de RevenueCat.
3. Un webhook de RevenueCat a una función nueva que llame a `apply_purchase`.
La base de datos ya está preparada para ello.

## Publicidad de terceros (AdMob): no recomendada ahora
- Muchos usuarios son personas recién llegadas, a veces con móviles y datos limitados. Los anuncios empeoran la experiencia y pagan poco.
- AdMob obliga a añadir el aviso de consentimiento (UMP, por el RGPD del Reino Unido) y a declarar «Contiene anuncios» en las tiendas.
- Si más adelante se quiere, el sitio ya existe: la `PromoCard` al terminar cada lección.
