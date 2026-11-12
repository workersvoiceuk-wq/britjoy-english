# Agentes de Claude para VUM · cómo usarlos

En este repositorio trabaja por Óscar el **ingeniero de sistemas** (`ingeniero-sistemas-vum`, en `.claude/agents/ingeniero-sistemas-vum.md`). Diagnostica y corrige fallos, compila y prueba la web y las apps Android e iOS, revisa PR y se coordina en la issue #25 de `lumi-uk-beta`. El guionista de la serie de humor negro vive en `lumi-uk-beta`.

Crea ramas, cambian archivos, ejecutan pruebas y dejan el trabajo para revisión. **Nunca** fusionan, despliegan, publican, tocan pagos ni credenciales: eso lo decide Óscar.

## 1. En Claude Code (web, app o terminal)
Disponible en cualquier sesión abierta sobre una rama que contenga `.claude/agents/`, normalmente `main` una vez fusionado este cambio.
- **Pídeselo con su nombre:** por ejemplo, «Usa el agente ingeniero-sistemas-vum para revisar por qué falla el build de Android». O menciónalo con `@ingeniero-sistemas-vum`.
- **En el terminal:** `claude --agent ingeniero-sistemas-vum` abre una sesión en la que ese agente es el principal.
- **La guardia** (`.claude/hooks/guardia-agente.mjs`) actúa mientras el agente está activo. Para que se ejecute, la carpeta del repositorio tiene que ser de confianza en Claude Code.

## 2. Desde GitHub
Escribe en una issue, un PR o un comentario:
- `/ingeniero` seguido del encargo. Por ejemplo: «/ingeniero revisa por qué falla el build de Android y prepara el arreglo».

Lo ejecuta `.github/workflows/claude-agente.yml`:
- **Quién lo activa:** solo el propietario del repositorio.
- **Dónde trabaja:** cada encargo va a su propia rama, `claude/ingeniero-…`, y Claude deja un comentario con el progreso y el enlace para abrir el PR.
- **Límites:** 80 turnos, 6 USD y 45 min. Se ajustan en `claude_args` del flujo.
- **Citar sin activar:** escribe la frase entre comillas invertidas (`` `/ingeniero` ``). El trabajo de GitHub puede llegar a arrancar, pero Claude no se ejecuta.

**Requisitos (una sola vez):**
1. Fusionar este cambio en `main`: los flujos de comentarios solo se ejecutan desde la rama por defecto.
2. La app de Claude instalada en el repositorio: https://github.com/apps/claude.
3. Uno de estos secretos en *Settings → Secrets and variables → Actions* de este repositorio: `CLAUDE_CODE_OAUTH_TOKEN` (usa tu plan) o `ANTHROPIC_API_KEY` (pago por uso). Si solo están en `lumi-uk-beta`, hay que añadirlos aquí también.

## 3. La guardia técnica
`.claude/hooks/guardia-agente.mjs` bloquea antes de ejecutarse:
- **Git y GitHub:**
  - fusionar o marcar listo un PR;
  - push a `main`, forzado o de etiquetas `v*`;
  - lanzar versiones o flujos.
- **Publicar y desplegar:**
  - publicar paquetes o subir a tiendas;
  - desplegar (Firebase, Wrangler, Vercel o Netlify en producción, funciones o base de Supabase);
  - lanzar Codemagic.
- **Pagos y secretos:**
  - la CLI de Stripe;
  - volcar variables de entorno o leer variables de credenciales.
- **Archivos protegidos:** escribir en `.github/workflows/`, `.claude/` o en archivos de credenciales.

Su autoprueba es `node .claude/hooks/guardia-agente.selftest.mjs`, y el flujo de GitHub la ejecuta antes de cada encargo. La guardia es una red de seguridad: las reglas completas están en cada agente.

## 4. Apagarlo
- **Flujo de GitHub:** *Actions → «Claude · agente ingeniero» → Disable workflow*, o borrar el archivo.
- **Agentes:** borrar `.claude/agents/`.
