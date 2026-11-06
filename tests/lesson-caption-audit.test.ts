import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { QUESTION_VIDEO_MANIFEST } from '../src/shared/question-videos/question-video-help.mjs';
import { assertSafeCaptionPath, auditCaptions, auditExitCode, renderSummary } from '../scripts/audit-lesson-captions.mjs';

const temporaryDirectories: string[] = [];

function makeMediaRoot() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'lesson-caption-audit-'));
  temporaryDirectories.push(root);
  mkdirSync(path.join(root, 'videos'), { recursive: true });
  return root;
}

function levelsWithCaptions(captions: Record<string, string>) {
  return [{
    id: 'CO-EN',
    units: [{
      unit: 'Cédula',
      lessons: [{
        id: 'co-en-cedula',
        exercises: [{
          video: {
            src: 'videos/lesson.mp4',
            captions,
          },
        }],
      }],
    }],
  }];
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe('lesson caption audit', () => {
  it('parses valid SRT and WebVTT references and associates them with lesson IDs', () => {
    const mediaRoot = makeMediaRoot();
    writeFileSync(path.join(mediaRoot, 'videos', 'lesson.mp4'), 'local fixture');
    writeFileSync(path.join(mediaRoot, 'videos', 'lesson.srt'), '1\n00:00:00,000 --> 00:00:02,000\nHello there.\n');
    writeFileSync(path.join(mediaRoot, 'videos', 'lesson.vtt'), 'WEBVTT\n\n00:00.000 --> 00:02.000\nHola.\n');

    const audit = auditCaptions({
      levels: levelsWithCaptions({ en: 'videos/lesson.srt', es: 'videos/lesson.vtt' }),
      mediaManifest: { concepts: [] },
      mediaRoot,
      durations: { 'videos/lesson.mp4': 3 },
    });

    expect(audit.summary).toMatchObject({
      captionReferenceCount: 2,
      presentCaptionCount: 2,
      cueCount: 2,
      findingCount: 0,
      durationCheckedCount: 2,
    });
    expect(audit.declarations.map(({ lessonId, locale }) => [lessonId, locale])).toEqual([
      ['co-en-cedula', 'en'],
      ['co-en-cedula', 'es'],
    ]);
    expect(auditExitCode(audit)).toBe(0);
  });

  it.each([
    ['empty SRT', 'srt', '', 'empty-track', 'not checked'],
    ['garbage SRT', 'srt', 'plain garbage', 'malformed-cue', 'not checked'],
    ['malformed SRT timestamp', 'srt', '1\n00:00:xx,000 --> 00:00:02,000\nText', 'malformed-timestamp', 'not checked'],
    ['malformed SRT arrow', 'srt', '1\n00:00:00,000 - > 00:00:02,000\nText', 'malformed-cue', 'not checked'],
    ['WebVTT without header', 'vtt', '00:00.000 --> 00:02.000\nText', 'malformed-header', 'not checked'],
    ['zero-length WebVTT cue', 'vtt', 'WEBVTT\n\n00:00.000 --> 00:00.000\nText', 'non-positive-cue-duration', 'not checked'],
    ['out-of-order WebVTT cues', 'vtt', 'WEBVTT\n\n00:04.000 --> 00:05.000\nLater\n\n00:02.000 --> 00:03.000\nEarlier', 'out-of-order-cue', 'checked'],
  ])('marks %s invalid instead of clean', (_name, extension, content, expectedFinding, durationStatus) => {
    const mediaRoot = makeMediaRoot();
    writeFileSync(path.join(mediaRoot, 'videos', 'lesson.mp4'), 'local fixture');
    const captionPath = `videos/invalid.${extension}`;
    writeFileSync(path.join(mediaRoot, captionPath), content);

    const audit = auditCaptions({
      levels: levelsWithCaptions({ en: captionPath }),
      mediaManifest: { concepts: [] },
      mediaRoot,
      durations: { 'videos/lesson.mp4': 10 },
    });

    expect(audit.findings.map(({ code }) => code)).toContain(expectedFinding);
    expect(audit.declarations[0]).toMatchObject({
      status: 'present',
      validationStatus: 'invalid',
      durationStatus,
    });
    expect(audit.summary.invalidCaptionCount).toBe(1);
    expect(auditExitCode(audit)).toBe(1);
    expect(renderSummary(audit)).toContain('PRESENT / INVALID');
  });

  it('reports malformed timestamps, overlaps, reversed cues, and empty dialogue', () => {
    const mediaRoot = makeMediaRoot();
    writeFileSync(path.join(mediaRoot, 'videos', 'lesson.srt'), [
      '1',
      '00:00:xx,000 --> 00:00:02,000',
      'bad time',
      '',
      '2',
      '00:00:01,000 --> 00:00:04,000',
      '<i></i>&nbsp;',
      '',
      '3',
      '00:00:03,000 --> 00:00:02,000',
      'reversed',
    ].join('\n'));

    const audit = auditCaptions({
      levels: levelsWithCaptions({ en: 'videos/lesson.srt' }),
      mediaManifest: { concepts: [] },
      mediaRoot,
    });

    expect(audit.findings.map(({ code }) => code)).toEqual([
      'malformed-timestamp',
      'empty-dialogue',
      'reversed-cue',
    ]);
  });

  it('reports overlap and cues beyond a supplied duration, but marks absent duration not checked', () => {
    const mediaRoot = makeMediaRoot();
    writeFileSync(path.join(mediaRoot, 'videos', 'lesson.mp4'), 'local fixture');
    writeFileSync(path.join(mediaRoot, 'videos', 'timed.vtt'), [
      'WEBVTT',
      '',
      '00:00.000 --> 00:03.000',
      'First',
      '',
      '00:02.000 --> 00:05.000',
      'Second',
    ].join('\n'));
    const levels = levelsWithCaptions({ en: 'videos/timed.vtt' });

    const checked = auditCaptions({
      levels,
      mediaManifest: { concepts: [] },
      mediaRoot,
      durations: { 'videos/lesson.mp4': 4 },
    });
    expect(checked.findings.map(({ code }) => code)).toEqual(['beyond-duration', 'overlapping-cue']);

    const unchecked = auditCaptions({
      levels: levels.slice(0, 1),
      mediaManifest: { concepts: [] },
      mediaRoot,
    });
    expect(unchecked.declarations[0].durationStatus).toBe('not checked');
    expect(unchecked.findings.map(({ code }) => code)).toEqual(['overlapping-cue']);
  });

  it('reports missing declared captions and does not invent references when none are declared', () => {
    const mediaRoot = makeMediaRoot();
    const missing = auditCaptions({
      levels: levelsWithCaptions({ en: 'videos/missing.srt' }),
      mediaManifest: { concepts: [] },
      mediaRoot,
    });
    expect(missing.findings[0].code).toBe('missing-caption-file');

    const noCaptions = auditCaptions({
      levels: [{ id: 'A1', units: [{ lessons: [{ id: 'a1-hello', exercises: [{ video: { src: 'videos/lesson.mp4', caption: 'Display text only.srt' } }] }] }] }],
      mediaManifest: QUESTION_VIDEO_MANIFEST,
      mediaRoot,
    });
    expect(noCaptions.summary.captionReferenceCount).toBe(0);
    expect(noCaptions.summary.missingCaptionCount).toBe(0);
    expect(renderSummary(noCaptions)).toContain('No caption files declared; no missing references inferred.');
  });

  it('marks caption files unchecked when the media root is absent', () => {
    const mediaRoot = path.join(os.tmpdir(), 'missing-caption-media-root');
    const audit = auditCaptions({
      levels: levelsWithCaptions({ en: 'videos/caption.srt' }),
      mediaManifest: { concepts: [] },
      mediaRoot,
    });
    expect(audit.declarations[0]).toMatchObject({ status: 'not checked', durationStatus: 'not checked' });
    expect(audit.findings).toEqual([]);
  });

  it('rejects traversal and escaping symlinks, and does not mutate the media root', () => {
    const mediaRoot = makeMediaRoot();
    const outside = path.join(path.dirname(mediaRoot), 'caption-audit-outside');
    mkdirSync(outside, { recursive: true });
    symlinkSync(outside, path.join(mediaRoot, 'videos', 'escape'));
    writeFileSync(path.join(mediaRoot, 'videos', 'local.srt'), 'WEBVTT\n\n00:00.000 --> 00:01.000\nHi\n');
    const before = readFileSync(path.join(mediaRoot, 'videos', 'local.srt'), 'utf8');
    const filesBefore = readdirSync(path.join(mediaRoot, 'videos')).sort();

    expect(() => assertSafeCaptionPath(mediaRoot, '../outside.srt')).toThrow(/Unsafe media path/);
    expect(() => assertSafeCaptionPath(mediaRoot, 'videos/escape/outside.srt')).toThrow(/Unsafe media path/);
    auditCaptions({
      levels: levelsWithCaptions({ en: 'videos/local.srt' }),
      mediaManifest: { concepts: [] },
      mediaRoot,
    });
    expect(readFileSync(path.join(mediaRoot, 'videos', 'local.srt'), 'utf8')).toBe(before);
    expect(readdirSync(path.join(mediaRoot, 'videos')).sort()).toEqual(filesBefore);
  });
});
