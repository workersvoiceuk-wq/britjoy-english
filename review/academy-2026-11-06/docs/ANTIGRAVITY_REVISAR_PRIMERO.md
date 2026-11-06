# Antigravity: revisar antes de activar — 6 noviembre 2026

## Encargo de Óscar
Coordinar las dos interfaces, una entrada común de VUM y los siete cursos con microlecciones originales: vídeo breve, demostración, práctica, explicación y repaso. Inglés sería el acceso básico. Los otros seis cursos serían adicionales. Dejar todo revisable antes de publicar o modificar cobros.

## Punto de partida comprobado
- `workersvoiceuk-wq/lumi-uk-beta`: PR #29 en borrador, head `6f779291ddea85d44bbc44927343256cb53d4d60`. Siete IDs: ingles, espanol, britjoy, ia, conduccion, ciberseguridad, electricidad. `mobile-updates/src/guided-course.mjs` y `src/course-catalog.mjs`.
- `workersvoiceuk-wq/britjoy-english`: PR #2 en borrador, head `b0fa08a438c07ea7c815fb94ffc1b082245797cd`. El catálogo actual NO contiene solo inglés: también situaciones, vida en UK, España, Colombia y un módulo IA. `src/data/catalog.ts`, `src/components/AcademyScreen.tsx`.
- El alcance comercial de «básico inglés» es una propuesta; no se ha eliminado el catálogo existente ni cambiado accesos. El código actual muestra Academy £5.99, pero no se ha comprobado el precio real configurado en Stripe.
- Ambas PR seguían abiertas, en borrador y fusionables al consultarlas. No fusionadas, no desplegadas.

## Qué hay nuevo en esta entrega
- `shared/academy-contract.mjs`: misma propuesta de agrupación y comprobaciones de publicación para ambos repositorios. No está conectado a cuentas ni cobros.
- `tests/academy-contract.test.mjs`: ocho pruebas de alcance por curso, derechos anteriores, vencimiento y bloqueo de vídeo sin revisión del hash exacto.
- Paquete privado aparte: `academy-preview/`, siete muestras, preguntas y correcciones; `media-review-manifest.json`; informe comercial. No subir sus MP4 ni guiones privados a GitHub.
- La maqueta permite filtrar cursos, ver el vídeo sin reproducción automática, avanzar por pasos, responder, leer explicación y reintentar. No tiene cuenta, pagos, XP ni progreso sincronizado. Sus preguntas son muestras pedagógicas locales; no dan por terminada la vinculación con IDs de producción.

## Reparto de trabajo
1. **Flow / operador ChatGPT**: tomar las referencias y voces ya aprobadas; generar solo tomas que falten; máximo 10 segundos por toma, 720×1280, 24 fps; descargar por vía oficial y calcular SHA256. Si falla la descarga, detener esa toma; no regenerar para eludir el fallo. Proyecto existente: https://flow.google.com/project/2cecd7c5-cb38-4b05-bc2e-dfeb57bfcce0 .
2. **Antigravity**: revisar código, ejecutar pruebas, verificar formatos/decodificación/hashes, corregir integración y devolver cambios aislados por repositorio. Reutilizar `tools.britjoy_video_qc`; no contratar un plan ni alterar cuentas si continúa agotada la cuota.
3. **Claude**: cuando tenga los MP4 autorizados, revisar el texto realmente pronunciado, voz, identidad, boca, manos, ropa y continuidad con segundos precisos. Editar silencios/niveles justificados a 1x. No cambiar tono o velocidad.
4. **ChatGPT**: reunir evidencias, revisar las dos interfaces, preparar pruebas de aceptación y documentar bloqueos. **Óscar** aprueba la voz/naturalidad y los términos comerciales; esa aprobación no se deduce de «continuar».

## Producción pendiente, curso por curso
| Curso | Disponible | Siguiente pieza que falta |
|---|---|---|
| Inglés | Clip de saludo y muestra de pregunta | Situación real autorizada de saludo por la mañana; ejercicio con respuesta del alumno |
| Español | Clip Yo soy y pasos escritos | Presentación real o grabación propia; conservar la frase objetivo |
| Life in the UK (`britjoy`) | Clip de libertad individual y ejemplo original | Situación visual propia que explique ese principio; no anunciar banco oficial |
| IA | Clip de prompt y comparación escrita | Captura real de redactar una instrucción, ver la respuesta y comprobarla; nunca simular una respuesta de proveedor como si fuera real |
| Conducción GB | Clip y esquema de línea de parada | Filmación propia/licenciada; contrastar señal/posición con Highway Code; sin conducir grabando |
| Ciberseguridad | Montaje real de permisos, 44 s, original y SRT | Revisar narración/sincronía, subtítulos y asociación con pregunta exacta; narración continua aún pendiente |
| Electricidad | Clip de unidades y ejemplo conceptual | Medición real segura de equipo de formación de baja tensión por persona competente; no tratar un esquema como medición real |

## Orden concreto para la revisión
1. Abrir las dos PR y anotar sus heads actuales. Si difieren, comparar; no sobrescribir trabajo ajeno.
2. Ejecutar `node --test review/academy-2026-11-06/tests/academy-contract.test.mjs` desde la raíz de cada repo.
3. Abrir el `index.html` del paquete privado en escritorio y móvil. Probar los siete vídeos, subtítulos, filtros, paso→pregunta, fallo→explicación→reintento, acierto→repaso y cierre/cambio de pestaña. Comprobar que no se solapen audios. La revisión visual queda pendiente: el navegador de esta sesión bloqueó el protocolo local `file:`.
4. Corregir cualquier fallo visual con captura y tamaño de pantalla. No afirmar QA móvil por compilar.
5. Auditar la semántica: el catálogo de BritJoy no equivale a un solo curso; separar una oferta comercial no debe borrar contenido. Resolver antes de modificar navegación.
6. Diseñar permisos en servidor por `user_id` y producto: english_basic, curso individual, academy_all y legacy_academy_all. El contrato es una referencia de comportamiento, NO una frontera de seguridad. No aceptar localStorage, email sin identidad verificada o parámetros de URL para desbloquear contenido. Webhooks firmados, idempotencia, cancelaciones y reembolsos necesitan pruebas de integración.
7. Conservar derechos pagados actuales y los registros de progreso. Comparar precios visibles con productos/price IDs reales mediante lectura autorizada de Stripe. No cambiar ni crear precios automáticamente.
8. Asociar cada vídeo a una pregunta/concepto real y revisado. Comprobar SHA, texto pronunciado, duración, derechos y formato; `releaseBlockers()` debe quedar vacío con evidencias auténticas. No rellenar revisiones ficticias para pasar el control.
9. Repetir pruebas existentes de cada aplicación y builds. No incluir la maqueta en producción por defecto ni generar una app nueva.
10. Entregar: SHA por repo, diff, pruebas con resultado, capturas, vídeos aceptados/rechazados con motivos y pendientes. No fusionar/publicar ni subir a tiendas en esta revisión.

## Límites ya detectados
- Siete clips no son siete cursos completos en vídeo. Se ha producido una sola demostración real completa.
- La consulta de métricas de páginas devolvió `rows: []`: no hay base para estimar conversión o ingresos reales. No significa cero ventas.
- QA técnica no aprueba identidad, voz ni utilidad educativa. Hay que escuchar y mirar los archivos completos.
- No exponer tokens, credenciales, archivos privados o el guion del piloto en las PR.
