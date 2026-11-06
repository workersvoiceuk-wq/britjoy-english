import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { assertSafeMediaPath, auditLevels, renderSummary } from '../scripts/audit-lesson-videos.mjs';

const temporaryDirectories: string[] = [];

function makePublicDirectory() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'lesson-video-audit-'));
  temporaryDirectories.push(root);
  const publicRoot = path.join(root, 'public');
  mkdirSync(path.join(publicRoot, 'videos', 'course'), { recursive: true });
  return publicRoot;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe('lesson video audit', () => {
  it('reports declared videos and posters, missing media, and unreferenced public media', () => {
    const publicRoot = makePublicDirectory();
    writeFileSync(path.join(publicRoot, 'videos', 'course', 'present.mp4'), 'video');
    writeFileSync(path.join(publicRoot, 'videos', 'orphan.jpg'), 'poster');
    const levels = [{
      id: 'CO-EN',
      name: 'Vivir en Colombia · aprende inglés',
      track: 'colombia',
      targetLanguage: 'en',
      units: [{
        unit: 'Cédula',
        lessons: [{
          id: 'co-en-cedula',
          exercises: [{
            type: 'explain',
            video: { src: 'videos/course/present.mp4', poster: 'videos/course/missing.jpg' },
          }],
        }],
      }],
    }];

    const audit = auditLevels(levels, { publicRoot });

    expect(audit.summary).toEqual({
      lessonCount: 1,
      declarationCount: 2,
      uniqueDeclaredFileCount: 2,
      presentFileCount: 1,
      missingFileCount: 1,
      unreferencedFileCount: 1,
    });
    expect(audit.declarations).toEqual([
      expect.objectContaining({
        courseId: 'CO-EN',
        track: 'colombia',
        targetLanguage: 'en',
        lessonId: 'co-en-cedula',
        kind: 'video',
        path: 'videos/course/present.mp4',
        status: 'present',
      }),
      expect.objectContaining({
        lessonId: 'co-en-cedula',
        kind: 'poster',
        path: 'videos/course/missing.jpg',
        status: 'missing',
      }),
    ]);
    expect(audit.missingFiles).toEqual(['videos/course/missing.jpg']);
    expect(audit.unreferencedFiles).toEqual(['videos/orphan.jpg']);
    expect(renderSummary(audit)).toContain('MISSING videos/course/missing.jpg');
    expect(renderSummary(audit)).toContain('playback and quality are not assessed');
  });

  it.each([
    '../outside.mp4',
    '/outside.mp4',
    'C:\\outside.mp4',
    'videos/%2e%2e/outside.mp4',
    'videos\\..\\outside.mp4',
  ])('rejects unsafe media paths: %s', (mediaPath) => {
    const publicRoot = makePublicDirectory();
    expect(() => assertSafeMediaPath(publicRoot, mediaPath)).toThrow(/Unsafe media path/);
  });

  it('rejects a declared file reached through a symlink outside public', () => {
    const publicRoot = makePublicDirectory();
    const outside = path.join(path.dirname(publicRoot), 'outside');
    mkdirSync(outside);
    symlinkSync(outside, path.join(publicRoot, 'videos', 'outside-link'));

    expect(() => assertSafeMediaPath(publicRoot, 'videos/outside-link/missing.mp4')).toThrow(/Unsafe media path/);
  });
});
