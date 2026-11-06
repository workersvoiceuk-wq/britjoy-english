# Revisión de Claude · entrega «academy-2026-11-06» · 6 nov 2026

Encargo de Óscar. Las cabeceras revisadas son **LUMI PR29 `3c59b5e`** y **BritJoy PR2 `0f47697`**; no había trabajo posterior al empezar. **No he editado esas ramas.** Cada corrección va en una rama propia con un PR en borrador hacia la rama del PR.

Leyenda: **implementado** = hay código en una rama · **probado** = con pruebas ejecutadas, que se citan · **pendiente** = falta trabajo o una decisión · **bloqueado** = falta un archivo o un acceso.

## 1. Bloqueos
**Bloqueado: no tengo el paquete privado.** Me faltan:
- `academy-preview/index.html`;
- las 7 muestras MP4 y SRT;
- `media-review-manifest.json`;
- el informe comercial.

**Dónde lo he buscado:** no está en esta sesión, ni en los archivos subidos, ni en Google Drive (búsqueda por título y por contenido).

**En consecuencia:**
- **La maqueta** (filtros, reproducción, subtítulos, pasos, preguntas, reintento, escritorio y móvil, teclado, audio superpuesto) **no se ha probado**.
- **Los vídeos** (texto pronunciado, voz, identidad, ropa, manos, boca, continuidad, subtítulos, duración y SHA-256) **no se han revisado**. **No hay ningún vídeo aceptado ni rechazado:** no se puede afirmar nada sin los archivos.
- **El informe comercial:** solo he podido revisar las restricciones que me han dado, no el documento.

Los archivos que sí hay en la sesión no son las siete muestras y no los he usado como tales: una «Prueba_01_sin_audio» de Flow y episodios o animatics de días anteriores.

## 2. Contrato de acceso (`shared/academy-contract.mjs`)
- **Probado:** las 8 pruebas originales pasan en los dos repositorios, y el archivo es idéntico en ambos.
- **Es una propuesta aislada:** `proposedAccess` y `releaseBlockers` no se usan en ningún código de cuentas ni de cobros.

**Defectos encontrados y corregidos** (rama `claude/academy-contract-revision`, implementado y probado):

| # | Defecto | Riesgo | Corrección |
|---|---|---|---|
| 1 | Solo concedía con `status === 'active'`. El servidor Academy real (`worker/academy-billing.mjs`, copia local del código del Site) mantiene el acceso en `past_due` hasta el final de la factura pagada. | Quitaría acceso a quien ya pagó ese periodo. | `GRANTING_STATUSES = active, trialing, past_due`, siempre que `expiresAt` (fin del periodo pagado) sea posterior a ahora. `canceled`, `unpaid`, `incomplete_expired` y `paused` nunca conceden. |
| 2 | No exigía identidad: cualquier lista de derechos concedía, aunque viniera de `localStorage`, de la URL o de un correo. | Abría la puerta a desbloquear con datos del cliente. | Nuevo parámetro obligatorio `verifiedUserId`, que es el ID de la sesión del servidor. Cada derecho debe tener ese mismo `userId`. Sin sesión, con otro usuario o con un derecho asociado a un correo → `preview`. |
| 3 | `evidence?.trim()` fallaba con un número u objeto. | Error de ejecución, o evidencia falsa aceptada. | La evidencia y el revisor deben ser texto no vacío. |
| 4 | Un clip sin procedencia podía pasar. | Derechos sin origen conocido. | `missing_provenance` salvo `original_recording`, `flow_generation`, `licensed_footage` o `screen_capture`. |
| 5 | No comprobaba que los IDs de pregunta existieran. | Un vídeo asociado a un ejercicio inexistente. | Opción `knownQuestionIds` → `unknown_question_id`. |

**Pruebas:** `node --test review/academy-2026-11-06/tests/academy-contract.test.mjs` da **14 de 14** con la corrección. Son las 8 originales, adaptadas a `verifiedUserId`, más 6 nuevas. Las mismas 14 pruebas contra el contrato original dan **9 de 14**: fallan las 5 nuevas.

**Sigue pendiente (servidor real):**
- permisos por `user_id` y producto en el Site;
- webhooks firmados con idempotencia;
- cancelación, reembolso y disputa;
- pruebas de integración.

El contrato es una referencia de comportamiento, **no una frontera de seguridad**.

**Derechos ya pagados:** el servidor acepta facturas Academy de £5,99 **y de £14,99** (`[ACADEMY_PLAN.amount, 1499]`). Hay suscripciones históricas a otro importe que hay que conservar como `legacy_academy_all`.

## 3. Interfaces
- **LUMI:** los 7 cursos en `/academia/apps/<id>/`, con los mismos IDs.
- **BritJoy:** su catálogo tiene **16 cursos y 224 lecciones**: inglés A1–C2, situaciones, Vivir en UK, España, Colombia, consulados, ciudades e IA. **No es solo inglés.**
  - **Propuesta, no implementada:** «Inglés básico» = A1–A2 de `ingles-a1-c2`.
  - **No se borra nada.**
  - **Pendiente:** qué recorridos de BritJoy entran en cada producto. Lo decide Óscar.

**Defectos de interfaz, ya entregados en ramas separadas** (implementado y probado):
- **«Ver explicación» antes de responder** (revelaba la respuesta).
  - LUMI: `claude/pr29-ayuda-tras-responder`. En navegador, antes 3 fallos y después 10 de 10.
  - BritJoy: `claude/pr2-ayuda-tras-responder`.
- **«Continuar» bloqueado en BritJoy:** el ejercicio y la ayuda compartían clave de React, los ejercicios se acumulaban y la lección A1 no terminaba. Playwright: antes 3 fallos, después 12 de 12.

**Evidencia visual** (en `lumi-uk-beta`, rama `claude/academy-contract-revision`, carpeta `review/academy-2026-11-06/evidencia/`, Chromium a 390 y 1280 px):
- **LUMI:** pregunta sin ayuda antes de responder (`lumi-pregunta-sin-ayuda-*`); tras fallar, explicación escrita sin `<video>` (`lumi-fallo-explicacion-escrita-*`).
- **BritJoy:** ejercicio sin ayuda (`britjoy-ejercicio-sin-ayuda-*`); tras comprobar, ayuda disponible (`britjoy-tras-comprobar-explicacion-*`).
- **Portal común (propuesta):** `portal-nuevo-*`.

## 4. Integración por pregunta (`question-video-help.mjs`, compartido)
- **Probado:** los 42 IDs asignados existen.
- **Problema:** **22 asignaciones no explicaban el ejercicio concreto.**

| Concepto | Asignaciones quitadas (motivo) |
|---|---|
| Semáforo rojo (conducción) | `rules` (límite de 20 mph), `signs` (señal triangular), `uk-conducir-l1` (carné y seguro) |
| Verbo «ser» (español) | `name` («Me llamo»: llamarse), `a1-u1-l3` (inglés), `dia-01-presentaciones` (inglés para hispanohablantes) |
| Amperio (electricidad) | `vum-electricidad-005`, `vum-electricidad-006`, `predict` (ley de Ohm, no la unidad) |
| Libertad individual (Life in the UK) | `own-values-02`, `-07`, `own-expanded-094`, `-100` (tolerancia y respeto mutuo: otro valor), `uk-vida-l1` (logística del examen) |
| Confidencialidad | `transfer`, `inspect` (verificar identidad o contraseña), `uk-banco-l2` (estafas) |
| Prompt (IA) | `language`, `ia-06-language` («predecir no es certeza»), `ia-07-modo-ia` |
| Saludo de mañana (inglés) | `a1-u1-l1:0` («hola» = Hello), `a1-u1-l1` (sin tarjetas de explicación) |

- **Quedan 20 asignaciones precisas.** Los ejercicios sin asignación conservan su explicación escrita propia.
- **Error de clasificación corregido:** las lecciones `dia-…` de BritJoy se trataban como el curso de español aunque enseñan inglés. Ahora manda el idioma que se aprende.
- **Aviso al alumno:** decía «…cuando su estado editorial pase a aprobado (ready)». Ahora dice «Vídeo en preparación. Mientras tanto, tienes la explicación escrita y el ejemplo visual». Los textos en idiomas distintos de español e inglés **necesitan revisión nativa** (pendiente).
- **Ver no da XP ni completa:** comprobado en el código (`ended` solo actualiza el botón) y en navegador (abrir la ayuda no escribe nada).
- **Rama:** `claude/qvh-asignaciones-precisas` en los dos repositorios.
  - **Módulo:** idéntico byte a byte (SHA-256 `dd4b2ff7…`).
  - **LUMI:** `question-video-mappings` y `question-video-help` 18 de 18; repositorio 255 pasan, 0 fallan; `npm test` 19 de 19.
  - **BritJoy:** Vitest 311 de 311 y compilación correcta.

## 5. Precios y oferta comercial
- **No he cambiado precios, cobros, cuentas ni proveedores.**
- **Dónde aparece el precio en el código:** solo en BritJoy, `src/lib/plans.ts` → `ACADEMY_MONTHLY = VITE_PRICE_ACADEMY_MONTH || 5.99`. **No está confirmado en Stripe:** no tengo acceso a Stripe desde esta sesión.
- **Importes vivos verificados antes por otro hilo:** Academy £5,99/mes, Básica £15/mes y orientación £25 única. Los importes del informe comercial (Básico £5,99 / Academia £12,99) **son hipótesis**: no se propagan ni se activan.
- **Pendiente:** revalidar en Stripe, en lectura, antes de cualquier texto con precio; conservar los contratos históricos (£14,99 y el enlace antiguo de £10 de la Básica).

## 6. Pendientes
- **Contenido:**
  - 6 de las 7 demostraciones reales siguen pendientes (español, Life in the UK, IA, conducción, electricidad e inglés);
  - la demostración real de ciberseguridad (44 s) no la he podido revisar;
  - revisión nativa de las traducciones del aviso;
  - decidir la oferta de BritJoy por recorrido.
- **Acceso:** el servidor real de permisos (sección 2).
- **Pagos:** Stripe sin verificar desde aquí.
- **Publicación:** nada fusionado, publicado ni desplegado. `/britjoy-english/` sigue en 404 en Sites164 (lo lleva otro responsable).
