import { existsSync, readdirSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MEDIA_EXTENSIONS = new Set([
  '.avi', '.gif', '.jpeg', '.jpg', '.m4v', '.mov', '.mp4', '.png', '.webm', '.webp',
]);

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

export function assertSafeMediaPath(publicRoot, mediaPath) {
  if (
    typeof mediaPath !== 'string'
    || mediaPath.length === 0
    || mediaPath.includes('\\')
    || mediaPath.includes('\0')
    || path.isAbsolute(mediaPath)
    || path.win32.isAbsolute(mediaPath)
  ) {
    throw new Error(`Unsafe media path: ${String(mediaPath)}`);
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(mediaPath);
  } catch {
    throw new Error(`Unsafe media path: ${mediaPath}`);
  }
  if (decodedPath.includes('\\') || decodedPath.split('/').includes('..')) {
    throw new Error(`Unsafe media path: ${mediaPath}`);
  }

  const resolvedPath = path.resolve(publicRoot, mediaPath);
  if (!isWithin(publicRoot, resolvedPath)) {
    throw new Error(`Unsafe media path: ${mediaPath}`);
  }
  if (!existsSync(publicRoot)) return resolvedPath;

  const publicRealPath = realpathSync(publicRoot);
  let existingPath = resolvedPath;
  while (!existsSync(existingPath) && existingPath !== publicRoot) {
    existingPath = path.dirname(existingPath);
  }
  const existingRealPath = realpathSync(existingPath);
  if (!isWithin(publicRealPath, existingRealPath)) {
    throw new Error(`Unsafe media path: ${mediaPath}`);
  }
  return resolvedPath;
}

function listPublicMedia(publicRoot) {
  const videoRoot = path.join(publicRoot, 'videos');
  if (!existsSync(videoRoot)) return [];

  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
      } else if (entry.isFile() && MEDIA_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        files.push(path.relative(publicRoot, fullPath).split(path.sep).join('/'));
      }
    }
  };
  visit(videoRoot);
  return files.sort();
}

export function auditLevels(levels, { publicRoot = path.join(ROOT, 'public'), questionVideos = [] } = {}) {
  const lessonIds = new Set();
  const declarations = [];
  const questionVideosByLesson = new Map();
  for (const { video, mappings } of questionVideos) {
    if (!video?.src) continue;
    for (const { lessonId } of mappings ?? []) {
      if (!lessonId) continue;
      const paths = questionVideosByLesson.get(lessonId) ?? new Set();
      paths.add(video.src);
      questionVideosByLesson.set(lessonId, paths);
    }
  }

  function declareMedia(level, unit, lesson, kind, mediaPath) {
    const fullPath = assertSafeMediaPath(publicRoot, mediaPath);
    let present = false;
    try {
      present = statSync(fullPath).isFile();
    } catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
    }
    declarations.push({
      courseId: level.id,
      courseName: level.name,
      track: level.track,
      targetLanguage: level.targetLanguage ?? null,
      unit: unit.unit,
      lessonId: lesson.id,
      kind,
      path: mediaPath,
      status: present ? 'present' : 'missing',
    });
  }
  let publicRootPresent = false;
  try {
    publicRootPresent = statSync(publicRoot).isDirectory();
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
  }

  for (const level of levels) {
    for (const unit of level.units ?? []) {
      for (const lesson of unit.lessons ?? []) {
        lessonIds.add(`${level.id}/${lesson.id}`);
        for (const exercise of lesson.exercises ?? []) {
          if (!exercise.video) continue;

          for (const [kind, mediaPath] of [['video', exercise.video.src], ['poster', exercise.video.poster]]) {
            if (mediaPath === undefined) continue;
            declareMedia(level, unit, lesson, kind, mediaPath);
          }
        }
        for (const mediaPath of questionVideosByLesson.get(lesson.id) ?? []) {
          declareMedia(level, unit, lesson, 'video', mediaPath);
        }
      }
    }
  }

  const declaredFiles = [...new Set(declarations.map(({ path: mediaPath }) => mediaPath))].sort();
  const presentFiles = [...new Set(declarations.filter((item) => item.status === 'present').map(({ path: mediaPath }) => mediaPath))].sort();
  const missingFiles = [...new Set(declarations.filter((item) => item.status === 'missing').map(({ path: mediaPath }) => mediaPath))].sort();
  const declaredSet = new Set(declaredFiles);
  const unreferencedFiles = listPublicMedia(publicRoot).filter((mediaPath) => !declaredSet.has(mediaPath));

  return {
    summary: {
      lessonCount: lessonIds.size,
      publicRootPresent,
      declarationCount: declarations.length,
      uniqueDeclaredFileCount: declaredFiles.length,
      presentFileCount: presentFiles.length,
      missingFileCount: missingFiles.length,
      unreferencedFileCount: unreferencedFiles.length,
    },
    declarations,
    presentFiles,
    missingFiles,
    unreferencedFiles,
  };
}

export function renderSummary(audit) {
  const { summary, declarations, missingFiles, unreferencedFiles } = audit;
  const lines = [
    'Lesson video audit (file inventory only; playback and quality are not assessed)',
    `Media root public/: ${summary.publicRootPresent ? 'present' : 'absent'}`,
    `Lessons scanned: ${summary.lessonCount}`,
    `Media declarations: ${summary.declarationCount} (${summary.uniqueDeclaredFileCount} unique files)`,
    `Declared files present under public/: ${summary.presentFileCount}`,
    `Declared files missing under public/: ${summary.missingFileCount}`,
    `Unreferenced media files under public/videos/: ${summary.unreferencedFileCount}`,
  ];

  for (const mediaPath of missingFiles) {
    const lessonReferences = declarations
      .filter((item) => item.path === mediaPath && item.status === 'missing')
      .map((item) => `${item.courseId}/${item.lessonId} (${item.kind})`);
    lines.push(`MISSING ${mediaPath} — ${lessonReferences.join(', ')}`);
  }
  for (const mediaPath of unreferencedFiles) lines.push(`UNREFERENCED ${mediaPath}`);
  return lines.join('\n');
}

async function loadLessonRegistry() {
  const { createServer } = await import('vite');
  const server = await createServer({
    root: ROOT,
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  try {
    const { ALL_LEVELS } = await server.ssrLoadModule('/src/data/courses/en-es/index.ts');
    const { BRITJOY_REVIEW_VIDEO_MANIFEST } = await server.ssrLoadModule(
      '/src/shared/question-videos/britjoy-review-videos.ts',
    );
    return { levels: ALL_LEVELS, questionVideos: BRITJOY_REVIEW_VIDEO_MANIFEST.concepts };
  } finally {
    await server.close();
  }
}

async function main(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node scripts/audit-lesson-videos.mjs [--json]');
    return;
  }
  if (args.some((arg) => arg !== '--json')) throw new Error('Unknown option. Use --help for usage.');

  const { levels, questionVideos } = await loadLessonRegistry();
  const audit = auditLevels(levels, { questionVideos });
  console.log(args.includes('--json')
    ? JSON.stringify({ ...audit, humanSummary: renderSummary(audit) }, null, 2)
    : renderSummary(audit));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
