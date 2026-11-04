# Ficha de tienda · Britjoy English

Textos listos para copiar en Google Play Console y App Store Connect.

## Datos básicos

| Campo | Valor |
|---|---|
| Nombre de la app | Britjoy English |
| ID de Android / Bundle ID de iOS | `com.workersvoiceuk.britjoyenglish` (no se puede cambiar después de publicar) |
| Categoría | Educación (Education) |
| Precio | Gratis |
| Idioma principal | Español (España) |
| Política de privacidad | https://workersvoiceuk-wq.github.io/britjoy-english/privacidad.html |
| Web de soporte / marketing | https://www.vozunidamundo.com/ |
| Edad | Para todos (PEGI 3 / 4+) |

## App Store (iOS)

**Subtítulo** (máx. 30): `Inglés A1–C2 y vida en UK`

**Palabras clave** (máx. 100, separadas por comas):
`inglés,aprender inglés,Reino Unido,Londres,Life in the UK,share code,NHS,GP,Universal Credit,A1,C2`

**Texto promocional** (máx. 170):
Britjoy, tu guía con gorro de guardia real, te enseña inglés del A1 al C2 y lo que necesitas para vivir en el Reino Unido: transporte, médico, ayudas y trámites.

## Google Play

**Descripción corta** (máx. 80):
`Inglés del A1 al C2 y la vida práctica en el Reino Unido, con Britjoy.`

## Descripción completa (las dos tiendas)

¡Aprende inglés y a moverte por el Reino Unido con Britjoy!

Britjoy es tu guía: un león con uniforme de guardia real que te explica cada actividad en voz alta, celebra tus aciertos y te ayuda cuando fallas.

INGLÉS DEL A1 AL C2
• Un test de nivel de 10 preguntas te dice por dónde empezar.
• Lecciones cortas con 6 tipos de ejercicio: elegir la respuesta, ordenar palabras, escuchar, unir parejas, escribir y completar huecos.
• Audio en inglés británico y modo lento para escuchar con calma.
• Vidas, XP, rachas diarias y estrellas para mantener la motivación.

VIVIR EN UK
Lo práctico para tus primeras semanas, explicado por Britjoy y con frases en inglés para usar en la vida real:
• Transporte: pagar con contactless u Oyster, touch in y touch out, las líneas del Overground, billetes de tren y Railcards.
• Salud: registrarte en un GP, pedir cita, cuándo llamar al 111 o al 999 y la farmacia.
• Universal Credit: quién puede pedirlo, cómo solicitarlo, pagos y anticipos.
• Council Tax: qué es, descuentos y qué hacer si te atrasas.
• Papeles: el examen Life in the UK, el share code para trabajar (guía paso a paso en vídeo), NI number y eVisa.
• Extra: NIE y TIE en España.

RECURSOS
Te recomendamos dónde seguir aprendiendo: clases con profesores, apps para estudiar a tu ritmo y ejercicios gratuitos.

SIN CUENTAS NI ANUNCIOS
No hace falta registrarse. Tu progreso se guarda solo en tu móvil. Sin publicidad y sin seguimiento.

La información de «Vivir en UK» es general y se ha revisado con fuentes oficiales (GOV.UK, NHS, TfL). No es asesoramiento legal ni financiero: confirma siempre en la web oficial.

Voz Unida Mundo Academy · te enseña — Tu voz cuenta.

## Respuestas para los formularios de las tiendas

**Google Play · Seguridad de los datos (Data safety)** (con el servidor activado):
- **Email** (*Personal info → Email address*): **recogido**, para *Account management* y *App functionality*; **opcional** (solo si el usuario crea cuenta); no se comparte; cifrado en tránsito; el usuario **puede pedir que se borre** (botón «Borrar mi cuenta» en la app y en la web).
- **Historial de compras** (*Financial info → Purchase history*): recogido, para *App functionality*, opcional. Los pagos son en la web (Stripe); la app no vende nada.
- **Mensajes de la app** (*Other in-app messages*): **recogidos y compartidos** con el proveedor de IA (Anthropic) para *App functionality*, **procesados de forma efímera** (el servidor no guarda el contenido, solo el número de mensajes), opcionales.
- **Audio** (micrófono en los ejercicios para hablar): en la app Android el reconocimiento de voz no está disponible y el ejercicio se salta, así que la app **no pide el micrófono**. En la web lo gestiona el navegador.
- Sin analítica ni anuncios de terceros. El progreso se guarda en el dispositivo.
- **Borrado de cuenta (obligatorio en Play):** URL para el formulario: `https://workersvoiceuk-wq.github.io/britjoy-english/privacidad.html` (sección «Cuenta») + el botón en la app.

**App Store · Privacidad de la app:**
- *Contact Info → Email Address*: **vinculado** a la identidad, para *App Functionality*; sin seguimiento.
- *Purchases → Purchase History*: vinculado, *App Functionality*.
- *User Content → Other User Content* (mensajes al Modo IA): no vinculado, *App Functionality*. La app avisa de que los mensajes van a un proveedor de IA externo, como pide Apple para la IA de terceros.
- Apple exige **borrar la cuenta desde la app** (guideline 5.1.1(v)): ya está en «Más → Britjoy Plus y tu cuenta».

**Clasificación de contenido:** app educativa, sin violencia, sin contenido sexual, sin apuestas y sin interacción entre usuarios. La lección de bienestar menciona dónde pedir apoyo emocional (Samaritans): es información de ayuda, no contenido sensible.

**Compras en la app:** las apps de Android e iOS **no venden nada** y no enlazan a la página de pago (las tiendas lo prohíben para contenido digital sin su sistema de cobro). No muestran precios ni dicen dónde comprar (Apple 3.1.1 / 3.1.3(b)): solo «si ya tienes Plus o créditos, inicia sesión». Quien lo contrató en la web, inicia sesión y le funciona. Si más adelante quieres vender dentro de las apps, hay que añadir Google Play Billing y App Store In-App Purchase (ver `docs/MONETIZACION.md`).

**Anuncios:** en las apps solo aparece la tarjeta «Invita a un amigo» (compartir la app); no hay redes publicitarias ni promociones de terceros, así que la respuesta es **No**. Las tarjetas de Britjoy Plus y de Voz Unida Mundo solo salen en la web. Si algún día se añade AdMob, la respuesta pasa a **Sí** y hace falta el aviso de consentimiento (UMP).

**IA generativa:** el Modo IA genera respuestas con IA (Claude, de Anthropic). Google Play pide declararlo y ofrecer una forma de reportar contenido inapropiado: el usuario puede escribir al soporte de Voz Unida Mundo.

**Exportación / cifrado (iOS):** la app no usa cifrado propio (`ITSAppUsesNonExemptEncryption = NO` ya está en el proyecto).

## Imágenes

| Tienda | Archivo |
|---|---|
| App Store · iPhone 6,9" (1320 × 2868) | `store/screenshots/ios/*.png` |
| Google Play · teléfono (1080 × 1920) | `store/screenshots/android/*.png` |
| Google Play · icono (512 × 512) | `store/google-play-icono-512.png` |
| Google Play · gráfico destacado (1024 × 500) | `store/google-play-grafico-1024x500.png` |
| App Store · icono | Lo coge del proyecto (`ios/App/App/Assets.xcassets`) |

Para regenerar las capturas: `npm run build && npx vite preview --port 4173`, y en otra terminal `node store/capturas.cjs`.
