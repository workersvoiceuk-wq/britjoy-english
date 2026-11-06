# Revisión de PR2 (codex/question-video-review-2026-11-06 @ b0fa08a) · Claude · 6 nov 2026

Rama de corrección: `claude/pr2-ayuda-tras-responder`, creada desde `b0fa08a`. No modifica el módulo compartido `question-video-help.mjs/.css`, que sigue idéntico byte a byte al de LUMI.

## Defectos
1. **Bloqueante: ejercicios duplicados en pantalla.**
   - **Causa:** `ExerciseView` y `QuestionVideoHelp` eran hermanos con la misma `key` (`${lesson.id}-${index}`). Con claves duplicadas, React deja ejercicios antiguos en el DOM: la lección pasa de 3 a 79 botones y ya no se puede terminar.
   - **La propia prueba existente** `e2e/app.spec.ts › a full A1 lesson can be completed…` **falla sobre `b0fa08a`.**
   - **Corrección:** la ayuda usa su propia clave, `qvh-${lesson.id}-${index}`.
2. **Media: la explicación se ofrece antes de responder y puede contener la respuesta.**
   - **Ejemplo:** el concepto de saludo explica «Good morning».
   - **Corrección:** `shouldOfferQuestionHelp(isExplain, answered)`. Se muestra en tarjetas de explicación o diálogo, y en ejercicios solo después de «Comprobar».

## Pruebas (Chromium, `vite preview` local)
| Prueba | `main` 2ea76d7 | PR2 b0fa08a | Esta rama |
|---|---|---|---|
| Lección A1 completa respondiendo bien (script de recuento de botones) | completa, 3/3/3/8/5/3 | **no termina**: 12→21→35→56→79 botones | completa, 3/3/3/8/5/3; también abriendo la ayuda 3 veces |
| `npx playwright test` (12 pruebas, incluida la nueva `e2e/question-help.spec.ts`) | — | **3 fallan** (lección A1, Vivir en UK, question-help) | **12 de 12** |
| `npx vitest run` | — | 308 de 308 | 309 de 309 |
| `npm run build` (`tsc -b` + vite) | — | correcta | correcta |

`e2e/question-help.spec.ts` comprueba:
- que solo está en pantalla el ejercicio actual;
- que no hay ayuda antes de «Comprobar» y sí después en los ejercicios asignados;
- que abrirla no cambia `britjoy-english-progress-v1`;
- que no aparece ningún `<video>` mientras los conceptos siguen en borrador.

**Estado: preparado.** No fusionado ni publicado; los 7 vídeos siguen en borrador, sin URL.
