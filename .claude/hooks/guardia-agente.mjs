#!/usr/bin/env node
// Guardia de los agentes de VUM (hook PreToolUse de Claude Code).
// Lee el evento por stdin y deniega lo que el agente no puede hacer por su cuenta:
// fusionar o marcar listo un PR, publicar o desplegar, reescribir historia, empujar a la rama
// principal o etiquetas de versión, exponer secretos y cambiar sus propias reglas o los flujos de GitHub.
// Solo decide cuando el agente está activo: con --siempre (frontmatter del agente y flujo de GitHub)
// o con VUM_AGENTE_GUARDIA=1. En cualquier otro caso no emite decisión y Claude Code sigue igual.
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

// [regla, motivo]. Se evalúan sobre el comando completo de Bash.
export const BASH_RULES = [
  [/\bgit\s+push\b[^\n]*(\s--force(-with-lease)?\b|\s-[a-z]*f[a-z]*\b|\s\+[^\s]+)/i, 'Push forzado: está prohibido reescribir historia.'],
  [/\bgit\s+push\b[^\n]*\s(\S*:)?(refs\/heads\/)?(main|master)(\s|$)/i, 'Push a la rama principal: el agente trabaja solo en su rama.'],
  [/\bgit\s+push\b[^\n]*(\s--(follow-)?tags\b|\srefs\/tags\/|\sv\d+(\.\d+)*\b)/i, 'Push de etiquetas: una etiqueta v* lanza la publicación.'],
  [/\bgh\s+pr\s+(merge|ready)\b/i, 'Fusionar o marcar listo un PR lo decide el propietario.'],
  [/\bgh\s+api\b[^\n]*\/merges?\b/i, 'Fusionar por la API lo decide el propietario.'],
  [/\bgh\s+(release\s+(create|upload|edit)|workflow\s+(run|enable|disable))\b/i, 'Versiones y flujos de GitHub los lanza el propietario.'],
  [/\b(npm|pnpm|yarn)\s+publish\b/i, 'Publicar paquetes no está permitido.'],
  [/\b(fastlane|transporter|altool|eas\s+submit)\b/i, 'Subir a tiendas no está permitido.'],
  [/\bgradlew\b[^\n]*\bpublish/i, 'Publicar en tiendas no está permitido.'],
  [/\b(firebase\s+deploy|wrangler\s+(deploy|publish|pages\s+deploy)|netlify\s+deploy\b[^\n]*--prod|vercel\b[^\n]*--prod)\b/i, 'Desplegar no está permitido: el despliegue lo aprueba Óscar.'],
  [/\bsupabase\s+(db\s+(push|reset)|functions\s+deploy|secrets\s+set|link)\b/i, 'Cambios en la base de datos o funciones de producción no están permitidos.'],
  [/api\.codemagic\.io/i, 'Lanzar compilaciones de Codemagic lo hace el propietario.'],
  [/\bstripe\b/i, 'Pagos: la CLI de Stripe no está permitida para el agente.'],
  [/(^|[;&|]\s*)(printenv|env)\s*($|[;&|])/i, 'Volcar el entorno puede exponer secretos.'],
  [/(\$\{?|\bprintenv\s+)(ANTHROPIC_API_KEY|CLAUDE_CODE_OAUTH_TOKEN|GITHUB_TOKEN|GH_TOKEN|ACTIONS_[A-Z_]*TOKEN|[A-Z_]*SECRET[A-Z_]*|[A-Z_]*PASSWORD[A-Z_]*)\b/, 'Leer variables de credenciales no está permitido.'],
];
// [regla, motivo]. Se evalúan sobre la ruta del archivo que se va a escribir.
export const PATH_RULES = [
  [/(^|\/)\.github\/workflows\//, 'Los flujos de GitHub los cambia el propietario.'],
  [/(^|\/)\.claude\/(hooks\/|agents\/|settings(\.local)?\.json$)/, 'Las reglas del agente las cambia el propietario.'],
  [/((^|\/)\.env(\.[^/]*)?$|\.(jks|keystore|p12|pem|mobileprovision)$|(^|\/)(google-services\.json|GoogleService-Info\.plist)$)/i, 'Archivo de credenciales: no se toca.'],
];
// Herramientas MCP que el agente no usa por su cuenta.
export const MCP_RULES = [
  [/merge/i, 'Fusionar lo decide el propietario.'],
  [/(delete_file|delete_branch|create_release|actions_run_trigger|run_workflow)/i, 'Borrar, publicar versiones o lanzar flujos lo decide el propietario.'],
];

export function decide(event) {
  const tool = String(event?.tool_name || ''), input = event?.tool_input || {};
  if (tool === 'Bash') {
    const command = String(input.command || '');
    for (const [rule, reason] of BASH_RULES) if (rule.test(command)) return reason;
    return null;
  }
  if (/^(Edit|Write|NotebookEdit|MultiEdit)$/.test(tool)) {
    const path = String(input.file_path || input.notebook_path || '').replace(/\\/g, '/');
    for (const [rule, reason] of PATH_RULES) if (rule.test(path)) return reason;
    return null;
  }
  if (tool.startsWith('mcp__')) {
    for (const [rule, reason] of MCP_RULES) if (rule.test(tool)) return reason;
  }
  return null;
}

function main() {
  const active = process.argv.includes('--siempre') || process.env.VUM_AGENTE_GUARDIA === '1';
  if (!active) return;
  let event;
  try { event = JSON.parse(readFileSync(0, 'utf8')); }
  catch { process.stderr.write('guardia-agente: entrada no válida; sin decisión\n'); return; }
  const reason = decide(event);
  if (!reason) return;
  process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:'PreToolUse', permissionDecision:'deny',
    permissionDecisionReason:`Guardia del agente: ${reason} Propónselo a Óscar en el PR o en la issue.`}}) + '\n');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
