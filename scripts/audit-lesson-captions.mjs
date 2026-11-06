import { existsSync, lstatSync, readFileSync, realpathSync, readlinkSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { QUESTION_VIDEO_MANIFEST } from '../src/shared/question-videos/question-video-help.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAPTION_EXTENSIONS = new Set(['.srt', '.vtt']);

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

function isCaptionPath(value) {
  return typeof value === 'string' && CAPTION_EXTENSIONS.has(path.extname(value).toLowerCase());
}

export function assertSafeCaptionPath(mediaRoot, mediaPath) {
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

  const resolvedRoot = path.resolve(mediaRoot);
  const resolvedPath = path.resolve(resolvedRoot, mediaPath);
  if (!isWithin(resolvedRoot, resolvedPath)) throw new Error(`Unsafe media path: ${mediaPath}`);
  if (!existsSync(resolvedRoot)) return resolvedPath;

  const rootRealPath = realpathSync(resolvedRoot);
  let currentPath = resolvedRoot;
  for (const segment of path.relative(resolvedRoot, resolvedPath).split(path.sep).filter(Boolean)) {
    currentPath = path.join(currentPath, segment);
    let stat;
    try {
      stat = lstatSync(currentPath);
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') break;
      throw error;
    }

    if (stat.isSymbolicLink()) {
      const linkTarget = path.resolve(path.dirname(currentPath), readlinkSync(currentPath));
      if (!isWithin(rootRealPath, linkTarget)) throw new Error(`Unsafe media path: ${mediaPath}`);
    }
    try {
      if (!isWithin(rootRealPath, realpathSync(currentPath))) throw new Error(`Unsafe media path: ${mediaPath}`);
    } catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
    }
  }
  return resolvedPath;
}

function addCaptionReferences(references, video, context) {
  if (!video || typeof video !== 'object') return;
  const captions = video.captions;
  if (typeof captions === 'string' && isCaptionPath(captions)) {
    references.push({ ...context, captionPath: captions, locale: null, mediaPath: video.src ?? null });
  } else if (captions && typeof captions === 'object' && !Array.isArray(captions)) {
    for (const [locale, captionPath] of Object.entries(captions)) {
      if (isCaptionPath(captionPath)) {
        references.push({ ...context, captionPath, locale, mediaPath: video.src ?? null });
      }
    }
  }

}

export function collectCaptionReferences(levels, mediaManifest = QUESTION_VIDEO_MANIFEST) {
  const references = [];
  for (const level of levels ?? []) {
    for (const unit of level.units ?? []) {
      for (const lesson of unit.lessons ?? []) {
        for (const [exerciseIndex, exercise] of (lesson.exercises ?? []).entries()) {
          addCaptionReferences(references, exercise.video, {
            courseId: level.id,
            lessonId: lesson.id,
            unit: unit.unit ?? null,
            source: 'lesson',
            exerciseIndex,
          });
        }
      }
    }
  }

  for (const concept of mediaManifest?.concepts ?? []) {
    const mappings = concept.mappings?.length ? concept.mappings : [null];
    for (const mapping of mappings) {
      addCaptionReferences(references, concept.video, {
        courseId: mapping?.courseId ?? concept.courseId ?? null,
        lessonId: mapping?.lessonId ?? null,
        conceptId: concept.conceptId ?? null,
        source: 'question-video',
        exerciseIndex: null,
      });
    }
  }
  return references;
}

function fileExists(mediaRoot, mediaPath) {
  if (!mediaPath) return false;
  const fullPath = assertSafeCaptionPath(mediaRoot, mediaPath);
  try {
    return statSync(fullPath).isFile();
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false;
    throw error;
  }
}

function parseTimestamp(value, format) {
  const timestamp = format === 'srt'
    ? /^(\d{2,}):([0-5]\d):([0-5]\d),(\d{3})$/.exec(value)
    : /^(?:(\d{2,}):)?([0-5]\d):([0-5]\d)\.(\d{3})$/.exec(value);
  if (!timestamp) return null;
  const hours = Number(timestamp[1] ?? 0);
  const minutes = Number(timestamp[2]);
  const seconds = Number(timestamp[3]);
  const milliseconds = Number(timestamp[4]);
  return (hours * 3600 + minutes * 60 + seconds) + milliseconds / 1000;
}

function addFinding(findings, reference, code, cueIndex, details = {}) {
  findings.push({
    courseId: reference.courseId,
    lessonId: reference.lessonId,
    conceptId: reference.conceptId ?? null,
    captionPath: reference.captionPath,
    locale: reference.locale,
    code,
    cueIndex,
    ...details,
  });
}

function auditCaptionFile(text, format, reference, duration, findings) {
  const blocks = text.replace(/^\uFEFF/, '').split(/\r?\n\s*\r?\n/);
  const cues = [];
  let cueIndex = 0;
  for (const block of blocks) {
    const lines = block.split(/\r?\n/);
    if (/^\s*(WEBVTT|NOTE|STYLE|REGION)\b/.test(lines[0] ?? '')) continue;
    const timingLineIndex = lines.findIndex((line) => line.includes('-->'));
    if (timingLineIndex === -1) continue;

    cueIndex += 1;
    const [startText, endAndSettings] = lines[timingLineIndex].split('-->');
    const endText = endAndSettings?.trim().split(/\s+/, 1)[0] ?? '';
    const start = parseTimestamp(startText?.trim() ?? '', format);
    const end = parseTimestamp(endText, format);
    if (start === null || end === null) {
      addFinding(findings, reference, 'malformed-timestamp', cueIndex, {
        start: startText?.trim() ?? '',
        end: endText,
      });
      continue;
    }
    if (end < start) {
      addFinding(findings, reference, 'reversed-cue', cueIndex, { start, end });
      continue;
    }

    const dialogue = lines.slice(timingLineIndex + 1).join(' ')
      .replace(/<[^>]*>/g, '')
      .replace(/&(?:nbsp|#160);/gi, ' ')
      .trim();
    if (!dialogue) addFinding(findings, reference, 'empty-dialogue', cueIndex);
    if (duration !== null && end > duration) {
      addFinding(findings, reference, 'beyond-duration', cueIndex, { end, duration });
    }
    cues.push({ cueIndex, start, end });
  }

  for (let index = 0; index < cues.length; index += 1) {
    const cue = cues[index];
    const overlapping = cues.slice(0, index).find((previous) => cue.start < previous.end && previous.start < cue.end);
    if (overlapping) {
      addFinding(findings, reference, 'overlapping-cue', cue.cueIndex, {
        overlapsCueIndex: overlapping.cueIndex,
      });
    }
  }
  return cueIndex;
}

export function auditCaptions({
  levels = [],
  mediaManifest = QUESTION_VIDEO_MANIFEST,
  mediaRoot,
  durations = {},
} = {}) {
  if (typeof mediaRoot !== 'string' || mediaRoot.length === 0) {
    throw new Error('A local media root is required.');
  }
  if (!durations || typeof durations !== 'object' || Array.isArray(durations)) {
    throw new Error('Duration metadata must be an object keyed by source media path.');
  }
  for (const [mediaPath, duration] of Object.entries(durations)) {
    if (typeof duration !== 'number' || !Number.isFinite(duration) || duration <= 0) {
      throw new Error(`Invalid duration for ${mediaPath}: expected a positive number of seconds.`);
    }
  }

  const references = collectCaptionReferences(levels, mediaManifest);
  const findings = [];
  let mediaRootPresent = false;
  try {
    mediaRootPresent = statSync(mediaRoot).isDirectory();
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
  }

  const declarations = references.map((reference) => {
    const captionPath = assertSafeCaptionPath(mediaRoot, reference.captionPath);
    const captionPresent = mediaRootPresent && fileExists(mediaRoot, reference.captionPath);
    const sourceMediaPresent = mediaRootPresent && reference.mediaPath
      ? fileExists(mediaRoot, reference.mediaPath)
      : false;
    const duration = reference.mediaPath && Object.hasOwn(durations, reference.mediaPath)
      ? durations[reference.mediaPath]
      : null;
    const durationChecked = captionPresent && sourceMediaPresent && duration !== null;
    let cueCount = null;
    let status = mediaRootPresent ? (captionPresent ? 'present' : 'missing') : 'not checked';

    if (captionPresent) {
      const format = path.extname(captionPath).toLowerCase().slice(1);
      cueCount = auditCaptionFile(
        readFileSync(captionPath, 'utf8'),
        format,
        reference,
        durationChecked ? duration : null,
        findings,
      );
    }
    if (mediaRootPresent && !captionPresent) {
      addFinding(findings, reference, 'missing-caption-file', null);
    }
    return {
      courseId: reference.courseId,
      lessonId: reference.lessonId,
      conceptId: reference.conceptId ?? null,
      unit: reference.unit ?? null,
      source: reference.source,
      exerciseIndex: reference.exerciseIndex,
      locale: reference.locale,
      captionPath: reference.captionPath,
      mediaPath: reference.mediaPath,
      status,
      cueCount,
      durationStatus: durationChecked ? 'checked' : 'not checked',
      durationSeconds: durationChecked ? duration : null,
    };
  });

  const notCheckedDurationCount = declarations.filter(({ durationStatus }) => durationStatus === 'not checked').length;
  return {
    summary: {
      mediaRootPresent,
      captionReferenceCount: declarations.length,
      presentCaptionCount: declarations.filter(({ status }) => status === 'present').length,
      missingCaptionCount: declarations.filter(({ status }) => status === 'missing').length,
      notCheckedCaptionCount: declarations.filter(({ status }) => status === 'not checked').length,
      durationCheckedCount: declarations.length - notCheckedDurationCount,
      durationNotCheckedCount: notCheckedDurationCount,
      cueCount: declarations.reduce((total, { cueCount }) => total + (cueCount ?? 0), 0),
      findingCount: findings.length,
    },
    declarations,
    findings,
  };
}

export function renderSummary(audit) {
  const { summary, declarations, findings } = audit;
  const lines = [
    'Lesson caption audit (local file and timing inventory only)',
    `Media root: ${summary.mediaRootPresent ? 'present' : 'absent'}`,
    `Caption files declared: ${summary.captionReferenceCount}`,
    `Caption files present: ${summary.presentCaptionCount}`,
    `Caption files missing: ${summary.missingCaptionCount}`,
    `Caption files not checked: ${summary.notCheckedCaptionCount}`,
    `Cues parsed: ${summary.cueCount}`,
    `Duration checks: ${summary.durationCheckedCount} checked; ${summary.durationNotCheckedCount} not checked`,
  ];
  if (declarations.length === 0) lines.push('No caption files declared; no missing references inferred.');
  for (const declaration of declarations) {
    const lesson = declaration.lessonId
      ? `${declaration.courseId ?? 'unknown-course'}/${declaration.lessonId}`
      : `${declaration.courseId ?? 'unknown-course'}/${declaration.conceptId ?? 'unmapped concept'}`;
    lines.push(`${declaration.status.toUpperCase()} ${declaration.captionPath} — ${lesson}${declaration.locale ? ` (${declaration.locale})` : ''}; duration ${declaration.durationStatus}`);
  }
  for (const finding of findings) {
    const lesson = finding.lessonId
      ? `${finding.courseId ?? 'unknown-course'}/${finding.lessonId}`
      : `${finding.courseId ?? 'unknown-course'}/${finding.conceptId ?? 'unmapped concept'}`;
    lines.push(`${finding.code.toUpperCase()} ${finding.captionPath} — ${lesson}${finding.cueIndex === null ? '' : ` cue ${finding.cueIndex}`}`);
  }
  lines.push('Playback, language accuracy, lip sync, permissions, and educational quality are not assessed.');
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
    return ALL_LEVELS;
  } finally {
    await server.close();
  }
}

function parseArguments(args) {
  const options = { json: false, mediaRoot: null, durationsFile: null };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--json') options.json = true;
    else if (argument === '--media-root' || argument === '--durations') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${argument} requires a path.`);
      options[argument === '--media-root' ? 'mediaRoot' : 'durationsFile'] = path.resolve(value);
      index += 1;
    } else if (argument === '--help' || argument === '-h') options.help = true;
    else throw new Error(`Unknown option: ${argument}. Use --help for usage.`);
  }
  return options;
}

async function main(args) {
  const options = parseArguments(args);
  if (options.help) {
    console.log('Usage: node scripts/audit-lesson-captions.mjs --media-root <directory> [--durations <json-file>] [--json]');
    console.log('Duration JSON maps source media paths relative to the media root to seconds.');
    return;
  }
  if (!options.mediaRoot) throw new Error('A local media root is required. Use --media-root <directory>.');
  const durations = options.durationsFile
    ? JSON.parse(readFileSync(options.durationsFile, 'utf8'))
    : {};
  const audit = auditCaptions({
    levels: await loadLessonRegistry(),
    mediaRoot: options.mediaRoot,
    durations,
  });
  console.log(options.json
    ? JSON.stringify({ ...audit, humanSummary: renderSummary(audit) }, null, 2)
    : renderSummary(audit));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
