# Cursos de VUM frente a Duolingo y Busuu · auditoría y hoja de ruta (12 nov 2026)

**Alcance:** auditoría de solo lectura de dos códigos, en las ramas que llevan este documento:
- **LUMI (`lumi-uk-beta`):** siete cursos, 93 unidades, `mobile-updates/` sobre `vum-mobile-source.tar.gz`. El archivo `mobile/src/progress.mjs` va dentro del tarball.
- **BritJoy English (`britjoy-english`):** React y Capacitor.

**Pruebas:**
- En LUMI pasan las 36 pruebas de `node --test tests/britjoy-integration.test.mjs tests/streak.test.mjs tests/course-experience.test.mjs`.
- En BritJoy no se ejecutó Vitest: faltaba `node_modules` y no se quiso modificar el árbol.

**Duolingo y Busuu:** solo por resultados de búsqueda, porque sus webs estaban bloqueadas desde la sesión. Copiamos patrones, nunca su marca, personajes, ilustraciones ni interfaz.

**Hallazgos comprobados en el código** el 12 nov, además de la auditoría:
1. **LUMI:** `XP` (`mobile-updates/src/streak/streak.mjs:6`) solo conoce `lesson`, `practice`, `bank` y `lab`. Los bloques de IA y la ampliación del currículo llaman a `xp('iaBlock')` y `xp('expansion')` (`guided-course.mjs:87-88`) y **suman 0 XP**.
2. **BritJoy:** en el **primer** fallo muestra la respuesta correcta y la lee en voz alta (`src/components/LessonScreen.tsx:163` y `:296`). Incumple la regla de VUM de practicar primero.
3. **BritJoy:** con 0 vidas, sin Plus, no se puede empezar una lección (`src/App.tsx:143-147`) y la que está en curso termina como no superada (`LessonScreen.tsx:173-176`).

## 1. Resumen
**LUMI.** La base pedagógica es honesta y sólida:
- ruta por módulos, XP y racha;
- repaso que empieza por los errores;
- explicación de por qué falla cada opción y pista gradual en las 93 unidades y sus 186 preguntas extra;
- tutor de voz con IA que pide consentimiento, 42 laboratorios y uso sin conexión.

**Le falta, frente a Duolingo:**
- cada lección evalúa una sola pregunta;
- el repaso reabre la lección entera y vuelve a la ruta tras cada unidad;
- el intervalo de repaso no pasa de 7 días;
- la meta que el alumno elige en la bienvenida no se usa, porque la meta diaria está fija en 50 XP;
- no hay protección de racha ni recordatorios;
- además, el fallo de XP de arriba.

**BritJoy English.** Es el que más se parece a Duolingo:
- camino con candados y estrellas;
- 9 tipos de ejercicio y prueba de nivel;
- plan semanal con fecha estimada, como Busuu;
- repaso espaciado de vocabulario y certificado.

**Sus problemas:**
- el primer fallo revela la respuesta;
- las vidas bloquean el aprendizaje y las ilimitadas se venden con Academy, en contra de la propia política de VUM: sin escasez falsa ni culpa (`docs/recorrido-humor-monetizacion-2026-11-04.md:43-49`);
- de A2 a C2 hay solo 2 lecciones por nivel.

**Referencias de Duolingo y Busuu:**
- **Duolingo:** energía en lugar de vidas, ilimitada con Super o Max [W1–W3]; hasta 2 protectores de racha [W4]; ligas, evitables con perfil privado [W5]; práctica de errores e historias [W6]; recordatorios elegidos por algoritmo [W7]; repaso según un modelo de memoria [W8]; puntuación alineada con el MCER [W9]; juego de roles con IA [W10].
- **Busuu:** plan de estudio con motivo, nivel, días, minutos y fecha [W11]; correcciones de nativos [W12]; certificados [W13]; prueba de nivel [W14]; modo sin conexión de pago [W15].

## 2. Funciones
E = esfuerzo, I = impacto.

| Función | LUMI | BritJoy | Recomendación | E | I | Riesgos |
|---|---|---|---|---|---|---|
| Ruta y microlecciones | Sí; 1 pregunta evaluada por lección | Sí; 8–12 ejercicios | LUMI: 3 preguntas evaluadas, con las 2 extra dentro del flujo | M | Alto | No cambiar IDs ni qué cuenta como «completada» |
| XP, racha, protección, meta y estrellas | Parcial: meta fija, sin protección ni estrellas, XP a 0 en IA y ampliación | Parcial: sin protección | Día de descanso gratuito y automático, meta personal y arreglo del XP | S | Alto | No venderlo ni culpabilizar |
| Vidas o energía | No (solo un cupo de IA que se recarga gratis) | Sí, y con 0 bloquea | BritJoy: que no bloqueen; LUMI: no añadirlas | S | Alto | Decisión de negocio |
| Ligas y social | No | No | Sin ligas públicas; retos privados más adelante | L | Bajo | Privacidad y presión |
| Repaso espaciado y errores | Parcial: 0/1/3/7 días; reabre la lección | Parcial: solo vocabulario | Repaso rápido con variantes y hasta 35 días | M | Alto | Mantener `version:1`, la clave y `curso:unidad` |
| Prueba de nivel y MCER | No | Parcial: 10 preguntas | Prueba orientativa y descriptores «puedo…» | M | Medio | No prometer un nivel oficial |
| Plan personal | Parcial: lo pregunta y nada lo usa | Sí, pero no propone la lección del día | Usar los datos de la bienvenida; plan → lección del día | S–M | Alto | Datos solo en el dispositivo |
| Variedad de ejercicios | Parcial: la ruta solo tiene opción múltiple | Sí; hablar depende del navegador | LUMI: retos de módulo con las mecánicas de los laboratorios; BritJoy: voz nativa | M–L | Alto | Micrófono; no penalizar acentos |
| Historias y diálogos | Parcial: piloto | Parcial: sin evaluar | Diálogo con comprensión en cada módulo | L | Medio | Exactitud cultural y legal |
| Conversación con IA | Sí: voz y 43 escenas de inglés | Sí: texto | Escena con objetivo y valoración final | M | Medio | Coste, cupo y datos |
| Correcciones de nativos | No | No | No por ahora; piloto con tutores de VUM | L | Bajo | Moderación |
| Gramática en contexto | Sí | Parcial: solo da la respuesta | BritJoy: explicar por qué falla cada opción | M | Alto | Que la explicación no revele la respuesta |
| Recordatorios | No | No | Aviso local opcional a la hora elegida | M | Alto | Permisos; sin culpabilizar |
| Certificados | Solo avisos | Sí, sin aviso de «no oficial» | Constancia tras un reto ≥ 80 %, con aviso fijo | S | Medio | Confusión con exámenes oficiales |
| Sin conexión | Sí | Parcial: la web no tiene service worker | Precargar contenido | S | Bajo | Contenido desfasado |
| Accesibilidad | Buena | Parcial: etiquetas fijas en ES y `window.confirm` | Traducir etiquetas; opción «hoy sin audio» | S | Medio | — |

## 3. Hoja de ruta

### 1. LUMI · Meta personal, racha protegida y arreglo del XP (S, impacto alto)

**Cambios:**
- `mobile-updates/src/streak/streak.mjs`:
  - `goalFromMinutes`: 5, 10 o 15 minutos pasan a 20, 40 o 60 XP; si no hay dato, 50;
  - añadir `iaBlock` y `expansion` a `XP`;
  - descanso: 1 día por cada 7 de racha, con un máximo de 2, que solo cubre un día perdido aislado.
- `vum-welcome-v1`: guardar también `courseId`.
- `main.js`: pasar `welcome` dentro de `getState`.
- `guided-course.mjs`: aplicar la meta y mostrar «Tu motivo».
- `ui-locales.mjs`: las traducciones.

**Pruebas:**
- `tests/streak.test.mjs`:
  - la meta según los minutos;
  - un día perdido queda protegido y dos rompen la racha;
  - el tope de días de descanso;
  - XP de los dos tipos nuevos;
  - solo se toca `STREAK_KEY`.
- `tests/britjoy-integration.test.mjs`: la tarjeta muestra «0 / 40 XP».
- `node --test tests/*.test.mjs`.

### 2. BritJoy · Practicar primero, repetir los fallos y vidas que no bloquean (M, impacto alto)

**Cambios:**
- `src/logic/feedback.ts`: pistas por tipo de ejercicio que nunca dan la respuesta, con la guarda `answerMention`.
- `LessonScreen.tsx`:
  - el primer fallo da una pista y otro intento;
  - el segundo revela la respuesta;
  - lo fallado se repite una vez al final;
  - como máximo se pierde una vida por ejercicio.
- Con 0 vidas, la lección sigue como repaso. **Esto necesita la aprobación de Óscar:** hoy las vidas ilimitadas son una ventaja de Academy.
- Quitar la promoción que sale tras un fallo (`LessonResult.tsx:70-76`).

**Pruebas:**
- `tests/feedback.test.ts`: ninguna pista contiene la respuesta.
- `tests/lesson-screen.test.ts`, con un reductor puro.
- Un caso nuevo en `e2e/app.spec.ts`.
- `npm test`, `npm run build` y `npm run test:e2e`.

### 3. LUMI · Repaso rápido y repetición espaciada más larga (M, impacto alto)

**Cambios:**
- `mobile-updates/src/review-session.mjs`: hasta 8 unidades vencidas, con los errores primero, alternando la pregunta principal y sus 2 `checks`.
- Progreso:
  - intervalos `[0,1,3,7,16,35]` y `level` de 0 a 5;
  - se mantienen `PROGRESS_KEY`, `version:1` y la clave `curso:unidad`;
  - acertar una variante no marca la unidad como completada.
- En la interfaz:
  - «Empezar repaso (n)» lleva directamente a la pregunta;
  - después pasa a la siguiente unidad sin volver a la ruta.

**Pruebas:** `tests/review-session.test.mjs` cubre:
- orden, tamaño y rotación;
- el primer fallo no da la respuesta;
- los intervalos de 16 y 35 días;
- que los datos antiguos siguen siendo válidos.

### 4 a 10
4. **Ambos · Recordatorios locales opcionales** (`@capacitor/local-notifications`): uno al día como máximo, a la hora elegida (M, alto). Necesita compilación nativa y revisión de las tiendas.
5. **LUMI · Lecciones de 3 preguntas y reto final de módulo:** ordenar, emparejar y dictado, con estrellas guardadas en una clave nueva (M, alto).
6. **BritJoy · Voz nativa** reutilizando VUMVoice de LUMI, y paso de los fallos de la lección al repaso (M–L, alto).
7. **Ambos · Accesibilidad:** traducir las etiquetas, sustituir `window.confirm` y añadir la opción «hoy sin audio ni micrófono» (S, medio).
8. **Ambos · Certificado honesto:** solo con un reto superado al 80 % o más, y la frase «no es una cualificación oficial» (S, medio).
9. **Ambos · Prueba de nivel orientativa y descriptores MCER**, revisados por un docente (M, medio).
10. **Ambos · Historias con diálogo y juego de roles con IA** con valoración final (L, medio).

Las ligas públicas y las correcciones de nativos quedan fuera hasta que haya cuentas y moderación.

## 4. Preguntas para Óscar
1. ¿Pueden dejar de bloquear las vidas de BritJoy? Hoy las vidas ilimitadas son una ventaja de Academy: ¿qué ventaja las sustituiría?
2. ¿La protección de racha será siempre gratuita? Se recomienda que sí.
3. ¿Puede llevar notificaciones la próxima versión de las tiendas?
4. ¿Qué cursos tendrán certificado, con qué umbral y qué docente lo revisa?
5. ¿Se unifican los motores de LUMI y BritJoy o se mantienen dos apps con patrones comunes?
6. ¿Pasamos la racha de LUMI de `localStorage` a Preferences, con una clave nueva?

## Fuentes de Duolingo y Busuu
Todas proceden de resultados de búsqueda; no se pudieron abrir las páginas.
- **W1:** https://www.androidauthority.com/quitting-duolingo-energy-system-3599842/
- **W2:** https://blog.duolingo.com/duolingo-max/
- **W3:** https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/ ; https://www.duolingo.com/help/super-duolingo
- **W4:** https://blog.duolingo.com/how-duolingo-streak-builds-habit
- **W5:** https://www.duolingo.com/help/leaderboards-and-league
- **W6:** https://blog.duolingo.com/guide-to-duolingo-practice-hub/
- **W7:** https://research.duolingo.com/papers/yancey.kdd20.pdf
- **W8:** https://research.duolingo.com/papers/settles.acl16.pdf
- **W9:** https://blog.duolingo.com/duolingo-score/
- **W10:** https://www.duolingo.com/help/what-is-duolingo-max
- **W11:** https://help.busuu.com/hc/en-us/articles/16097312171153-What-s-a-Study-Plan-How-do-I-make-one
- **W12:** https://www.busuu.com/en/how-to/corrections
- **W13:** https://help.busuu.com/hc/en-us/articles/16559434818321-What-are-Certificates-and-how-can-I-get-them
- **W14:** https://blog.busuu.com/find-your-level/
- **W15:** https://help.busuu.com/hc/en-gb/articles/16269241908497-What-is-Premium ; https://www.busuu.com/en/how-to/offline-mode
- **W16:** https://blog.duolingo.com/learning-with-hearing-aids/
