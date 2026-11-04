import { describe, expect, it } from 'vitest';
import { checkAnswer, checkTyped, checkWordBank, normalizeText, tokenize } from '../src/logic/answer';

describe('normalizeText', () => {
  it('lower-cases, trims and collapses whitespace', () => {
    expect(normalizeText('  Hello    WORLD  ')).toBe('hello world');
  });
  it('drops final punctuation and Spanish opening marks', () => {
    expect(normalizeText('How are you?')).toBe('how are you');
    expect(normalizeText('¡Hola!')).toBe('hola');
    expect(normalizeText('Wait...')).toBe('wait');
  });
  it('unifies curly apostrophes', () => {
    expect(normalizeText('I’m fine')).toBe("i'm fine");
  });
  it('keeps punctuation in the middle of a sentence', () => {
    expect(normalizeText('Hello, Tom.')).toBe('hello, tom');
  });
});

describe('checkTyped (typing tolerance)', () => {
  it('ignores case', () => {
    expect(checkTyped('GOODBYE', 'Goodbye')).toBe(true);
  });
  it('ignores extra spaces', () => {
    expect(checkTyped('  how   are  you ', 'How are you?')).toBe(true);
  });
  it('tolerates a missing final punctuation mark', () => {
    expect(checkTyped('How are you', 'How are you?')).toBe(true);
    expect(checkTyped('It is five pounds', 'It is five pounds.')).toBe(true);
  });
  it('tolerates extra final punctuation', () => {
    expect(checkTyped('goodbye!!', 'Goodbye')).toBe(true);
  });
  it('accepts curly apostrophes for straight ones', () => {
    expect(checkTyped('I’m happy', "I'm happy")).toBe(true);
  });
  it('accepts listed alternatives', () => {
    expect(checkTyped('bye', 'Goodbye', ['Bye'])).toBe(true);
  });
  it('rejects wrong words and empty input', () => {
    expect(checkTyped('Good morning', 'Goodbye')).toBe(false);
    expect(checkTyped('   ', 'Goodbye')).toBe(false);
  });
  it('does not ignore words missing from the middle', () => {
    expect(checkTyped('How you', 'How are you?')).toBe(false);
  });
});

describe('checkWordBank (ordering)', () => {
  const answer = "I'm fine, thanks.";
  it('accepts the tiles in the correct order', () => {
    expect(checkWordBank(["I'm", 'fine,', 'thanks'], answer)).toBe(true);
  });
  it('rejects the right tiles in the wrong order', () => {
    expect(checkWordBank(['fine,', "I'm", 'thanks'], answer)).toBe(false);
  });
  it('rejects missing or extra tiles', () => {
    expect(checkWordBank(["I'm", 'fine,'], answer)).toBe(false);
    expect(checkWordBank(["I'm", 'fine,', 'thanks', 'you'], answer)).toBe(false);
  });
  it('ignores punctuation attached to tiles and case', () => {
    expect(checkWordBank(["i'm", 'fine', 'thanks.'], answer)).toBe(true);
  });
  it('accepts alternative orders', () => {
    expect(
      checkWordBank(['I', 'went', 'to', 'the', 'cinema', 'yesterday'], 'Yesterday I went to the cinema.', [
        'I went to the cinema yesterday.',
      ]),
    ).toBe(true);
  });
  it('rejects an empty selection', () => {
    expect(checkWordBank([], answer)).toBe(false);
  });
  it('tokenize strips punctuation-only differences', () => {
    expect(tokenize('Hello, good morning.')).toEqual(['hello', 'good', 'morning']);
  });
});

describe('checkAnswer', () => {
  it('handles multiple choice', () => {
    const ex = { type: 'multipleChoice', prompt: '', options: ['Hello', 'Bye'], answer: 'Hello' } as const;
    expect(checkAnswer({ ...ex, options: [...ex.options] }, { kind: 'text', value: 'Hello' }).correct).toBe(true);
    expect(checkAnswer({ ...ex, options: [...ex.options] }, { kind: 'text', value: 'Bye' }).correct).toBe(false);
  });
  it('uses typing tolerance for typed listening and fill-in-the-blank', () => {
    expect(checkAnswer({ type: 'listening', text: 'ten', answer: 'ten', alternatives: ['10'] }, { kind: 'text', value: '10' }).correct).toBe(true);
    expect(checkAnswer({ type: 'fillBlank', sentence: 'She ___ it.', answer: 'had known' }, { kind: 'text', value: ' Had  Known ' }).correct).toBe(true);
  });
  it('treats matching as correct only without mismatches', () => {
    const ex = { type: 'matching', pairs: [{ en: 'one', es: 'uno' }] } as const;
    expect(checkAnswer({ ...ex, pairs: [...ex.pairs] }, { kind: 'matching', mismatches: 0 }).correct).toBe(true);
    expect(checkAnswer({ ...ex, pairs: [...ex.pairs] }, { kind: 'matching', mismatches: 2 }).correct).toBe(false);
  });
  it('rejects a response of the wrong kind', () => {
    expect(checkAnswer({ type: 'wordBank', prompt: '', words: ['a'], answer: 'a' }, { kind: 'text', value: 'a' }).correct).toBe(false);
  });
});

import { speechMatches } from '../src/logic/answer';

describe('speechMatches (speaking tolerance)', () => {
  it('accepts a transcript that contains most of the words, ignoring case and punctuation', () => {
    expect(speechMatches('could you help me please', 'Could you help me, please?')).toBe(true);
    expect(speechMatches('sounds great what time', 'Sounds great! What time?')).toBe(true);
  });
  it('accepts small recogniser slips (70% of the words)', () => {
    expect(speechMatches('I am here on holiday for week', "I'm here on holiday for a week.")).toBe(true);
  });
  it('rejects unrelated or empty speech', () => {
    expect(speechMatches('good morning', 'Could you help me, please?')).toBe(false);
    expect(speechMatches('', 'Hello')).toBe(false);
  });
  it('treats a skipped speaking exercise as no penalty', () => {
    expect(checkAnswer({ type: 'speak', text: 'Hello' }, { kind: 'speech', transcript: '', skipped: true }).correct).toBe(true);
    expect(checkAnswer({ type: 'speak', text: 'Hello there' }, { kind: 'speech', transcript: 'goodbye' }).correct).toBe(false);
  });
});
