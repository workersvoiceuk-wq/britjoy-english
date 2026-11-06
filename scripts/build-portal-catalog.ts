// Writes public/portal-catalog.json for the common VUM portal: course/level/lesson IDs and titles from
// the real catalogue, plus the review status of the English demonstration (shared manifest).
// No answers, options or explanations. Usage: npx vite-node scripts/build-portal-catalog.ts
import { writeFileSync } from 'node:fs';
import { buildPortalCatalog } from '../src/shared/portal/portal-catalog';

const catalog = buildPortalCatalog();
writeFileSync(new URL('../public/portal-catalog.json', import.meta.url), JSON.stringify(catalog, null, 1) + '\n');
console.log(`public/portal-catalog.json: ${catalog.courses.length} courses, ${catalog.courses.reduce((n, c) => n + c.levels.reduce((m, l) => m + l.lessons.length, 0), 0)} lessons`);
