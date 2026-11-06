import { describe, expect, it } from 'vitest';
import { lessonProgressStep, shouldHandleLessonEnterKey } from '../src/components/LessonScreen';
import { bindNarratorVisibilityStop, useVoice } from '../src/lib/narrator';

describe('lessonProgressStep', () => {
  it('counts ungraded explain/dialogue slides just like the visual progress bar', () => {
    expect(lessonProgressStep(0, false, false)).toBe(0);
    expect(lessonProgressStep(0, true, false)).toBe(1);
    expect(lessonProgressStep(0, false, true)).toBe(1);
    expect(lessonProgressStep(3, false, true)).toBe(4);
    expect(lessonProgressStep(3, true, true)).toBe(4);
  });
});

describe('shouldHandleLessonEnterKey', () => {
  it('ignores non-Enter keys', () => {
    expect(shouldHandleLessonEnterKey('Space', null)).toBe(false);
    expect(shouldHandleLessonEnterKey('Escape', null)).toBe(false);
  });

  it('ignores Enter on focused buttons, links and media controls so it does not double-advance', () => {
    expect(shouldHandleLessonEnterKey('Enter', { tagName: 'BUTTON' } as unknown as EventTarget)).toBe(false);
    expect(shouldHandleLessonEnterKey('Enter', { tagName: 'A' } as unknown as EventTarget)).toBe(false);
    expect(shouldHandleLessonEnterKey('Enter', { tagName: 'VIDEO' } as unknown as EventTarget)).toBe(false);
    expect(
      shouldHandleLessonEnterKey('Enter', {
        tagName: 'SPAN',
        closest: (selector: string) => (selector.includes('a') ? {} : null),
      } as unknown as EventTarget),
    ).toBe(false);
  });

  it('handles Enter on answer inputs and the document body', () => {
    expect(shouldHandleLessonEnterKey('Enter', null)).toBe(true);
    expect(shouldHandleLessonEnterKey('Enter', { tagName: 'BODY', closest: () => null } as unknown as EventTarget)).toBe(true);
    expect(shouldHandleLessonEnterKey('Enter', { tagName: 'TEXTAREA', closest: () => null } as unknown as EventTarget)).toBe(true);
    expect(shouldHandleLessonEnterKey('Enter', { tagName: 'INPUT', closest: () => null } as unknown as EventTarget)).toBe(true);
  });

  it('never grades or advances while prediction or reflection is active', () => {
    for (const tagName of ['TEXTAREA', 'INPUT', 'DIV', 'BODY']) {
      const target = { tagName, closest: () => null } as unknown as EventTarget;
      expect(shouldHandleLessonEnterKey('Enter', target, false)).toBe(false);
      expect(shouldHandleLessonEnterKey('Enter', target, true)).toBe(true);
    }
    expect(shouldHandleLessonEnterKey('Enter', null, false)).toBe(false);
  });
});

describe('bindNarratorVisibilityStop', () => {
  it('stops active narration when the document becomes hidden or on pagehide', () => {
    const docListeners: Record<string, (() => void)[]> = {};
    const winListeners: Record<string, (() => void)[]> = {};
    let hidden = false;
    bindNarratorVisibilityStop({
      document: {
        get hidden() {
          return hidden;
        },
        addEventListener: (type, fn) => {
          (docListeners[type] ??= []).push(fn);
        },
      },
      addEventListener: (type, fn) => {
        (winListeners[type] ??= []).push(fn);
      },
    });

    useVoice.setState({ speaking: true });
    hidden = false;
    docListeners.visibilitychange?.forEach((fn) => fn());
    expect(useVoice.getState().speaking).toBe(true);

    hidden = true;
    docListeners.visibilitychange?.forEach((fn) => fn());
    expect(useVoice.getState().speaking).toBe(false);

    useVoice.setState({ speaking: true });
    winListeners.pagehide?.forEach((fn) => fn());
    expect(useVoice.getState().speaking).toBe(false);
  });
});
