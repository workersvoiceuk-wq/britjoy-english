# Reparación integrada · 6 nov 2026 · PREPARADA, no publicada

Rama `claude/academia-reparacion-integrada`, creada desde la cabecera actual del PR (LUMI `3c59b5e`, BritJoy `0f47697`). **No modifica esa cabecera.** Une con *merge* normal, sin conflictos, las tres correcciones ya revisadas por separado:

1. **Explicación solo después de responder.** En BritJoy, además, la clave de React ya no está duplicada: «Continuar» deja de bloquearse y la lección A1 se puede terminar. PR en borrador lumi #30 / britjoy #3.
2. **Asignaciones pregunta→concepto precisas** (22 quitadas), lecciones `dia-…` bien clasificadas y aviso al alumno sin jerga interna. Módulo compartido idéntico en los dos repositorios, SHA-256 `dd4b2ff7…`. PR lumi #31 / britjoy #4.
3. **Contrato de acceso:** `past_due` conserva el periodo pagado, `verifiedUserId` obligatorio y evidencia en texto. PR lumi #32 / britjoy #5.

## Pruebas del conjunto (6 nov 2026)
- **LUMI:**
  - `source.sha256` correcto, extracción limpia, compilación correcta;
  - `npm test` 19 de 19;
  - `node --test` más el contrato: 269 pasan, 0 fallan, 13 se omiten;
  - navegador sin fallos: `question-video-practice-first`, `bank`, `courses`, `keyboard`, `labs` y `streak`;
  - el aviso dice «Vídeo en preparación. Mientras tanto, tienes la explicación escrita y el ejemplo visual» (capturas en la rama de `lumi-uk-beta`).
- **BritJoy:**
  - Vitest 312 de 312;
  - compilación correcta (`tsc -b` + vite);
  - contrato 14 de 14;
  - `npx playwright test` 12 de 12, incluidas la lección A1 completa y la ayuda tras comprobar.

## No incluido / sigue pendiente
- **Revisión de la maqueta y de los 7 vídeos:** bloqueada; el paquete privado no está disponible en la sesión.
- **Sites164:** `/britjoy-english/` y `/vum-tv/en-directo/` siguen en 404; lo lleva otro responsable.
- **Permisos reales en el servidor** y **verificación de precios en Stripe**.
- **Precios, cobros, cuentas y proveedores:** sin cambios.
