#!/usr/bin/env node
// Autoprueba de la guardia: node .claude/hooks/guardia-agente.selftest.mjs  (exit 0 = todo correcto)
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {decide} from './guardia-agente.mjs';

const bash = command => decide({tool_name:'Bash', tool_input:{command}});
const write = file_path => decide({tool_name:'Write', tool_input:{file_path}});
const deny = ['git push --force origin claude/x', 'git push -f origin claude/x', 'git push origin +claude/x',
  'git push --force-with-lease', 'git push origin main', 'git push origin HEAD:main', 'git push origin :main',
  'git push origin HEAD:refs/heads/master', 'git push --tags', 'git push --follow-tags origin claude/x', 'git push origin v1.2.0',
  'gh pr merge 51 --squash', 'gh pr ready 51', 'gh api -X PUT repos/o/r/pulls/5/merge', 'gh release create v1.0.0',
  'gh workflow run release.yml', 'npm publish', 'cd ios && fastlane beta', './gradlew publishBundle', 'firebase deploy',
  'npx wrangler deploy', 'npx wrangler pages deploy dist', 'vercel --prod', 'supabase db push', 'supabase functions deploy x',
  'curl -X POST https://api.codemagic.io/builds', 'stripe products create', 'env', 'printenv | sort', 'echo $GITHUB_TOKEN',
  'echo ${ANTHROPIC_API_KEY}', 'printenv CLAUDE_CODE_OAUTH_TOKEN', 'curl -H "x: $STRIPE_SECRET_KEY" x'];
const allow = ['git push -u origin claude/ingeniero-issue-25', 'git push origin claude/main-fix', 'git push --set-upstream origin claude/x',
  'git status', 'git merge origin/main', 'git tag -l', 'npm ci', 'npm run build', 'npm test', 'node --test tests/a.test.mjs',
  'gh pr create --draft --title x --body y', 'gh pr view 51', 'env FOO=1 node x.mjs', 'printenv PATH', 'npx cap sync android',
  'supabase --help', 'echo $HOME'];
for (const c of deny) assert.ok(bash(c), `debe denegar: ${c}`);
for (const c of allow) assert.equal(bash(c), null, `debe permitir: ${c}`);
for (const p of ['.github/workflows/x.yml', '/repo/.claude/hooks/guardia-agente.mjs', '.claude/agents/a.md', '.claude/settings.json',
  '.env', 'app/.env.production', 'android/app/release.keystore', 'android/app/google-services.json', 'ios/App/GoogleService-Info.plist']) assert.ok(write(p), `debe denegar escribir: ${p}`);
for (const p of ['src/main.ts', 'docs/.envios.md', 'tests/env.test.mjs', '.claude/README.md']) assert.equal(write(p), null, `debe permitir escribir: ${p}`);
assert.ok(decide({tool_name:'mcp__github__merge_pull_request', tool_input:{}}));
assert.ok(decide({tool_name:'mcp__github__actions_run_trigger', tool_input:{}}));
assert.equal(decide({tool_name:'mcp__github__create_pull_request', tool_input:{}}), null);
assert.equal(decide({tool_name:'Read', tool_input:{file_path:'.env'}}), null);
// CLI: inactiva sin --siempre ni VUM_AGENTE_GUARDIA; activa con --siempre; entrada rota = sin decisión.
const hook = fileURLToPath(new URL('./guardia-agente.mjs', import.meta.url));
const run = (args, input, env = {}) => spawnSync(process.execPath, [hook, ...args], {input, encoding:'utf8', env:{...process.env, VUM_AGENTE_GUARDIA:'', ...env}});
const ev = JSON.stringify({tool_name:'Bash', tool_input:{command:'gh pr merge 1'}});
assert.equal(run([], ev).stdout, '');
const out = JSON.parse(run(['--siempre'], ev).stdout);
assert.equal(out.hookSpecificOutput.permissionDecision, 'deny');
assert.equal(JSON.parse(run([], ev, {VUM_AGENTE_GUARDIA:'1'}).stdout).hookSpecificOutput.hookEventName, 'PreToolUse');
assert.equal(run(['--siempre'], JSON.stringify({tool_name:'Bash', tool_input:{command:'npm test'}})).stdout, '');
const broken = run(['--siempre'], '{no json');
assert.equal(broken.status, 0); assert.equal(broken.stdout, '');
console.log(`guardia-agente: ${deny.length} denegaciones y ${allow.length} permisos de Bash, rutas, MCP y CLI correctos`);
