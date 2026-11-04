import type { CheckResult, Exercise, ExerciseResponse } from '../types';

/**
 * Normalises free text for tolerant comparison:
 * - case-insensitive
 * - trims and collapses repeated whitespace
 * - unifies curly quotes/apostrophes
 * - drops final punctuation (. ! ? … ,) and Spanish opening marks (¿ ¡)
 */
export function normalizeText(input: string): string {
  return input
    .normalize('NFC')
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[¿¡]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[\s.!?…,;:]+$/u, '')
    .trim();
}

/** Typing answer: tolerant of case, extra spaces and missing final punctuation. */
export function checkTyped(input: string, answer: string, alternatives: string[] = []): boolean {
  const given = normalizeText(input);
  if (!given) return false;
  return [answer, ...alternatives].some((candidate) => normalizeText(candidate) === given);
}

/** Splits a sentence into comparable tokens, ignoring punctuation-only tokens. */
export function tokenize(sentence: string): string[] {
  return normalizeText(sentence)
    .split(' ')
    .map((t) => t.replace(/^[.,!?;:"]+|[.,!?;:"]+$/g, ''))
    .filter(Boolean);
}

/** Word bank answer: the selected tiles must be in exactly the right order. */
export function checkWordBank(selected: string[], answer: string, alternatives: string[] = []): boolean {
  const given = tokenize(selected.join(' '));
  if (given.length === 0) return false;
  return [answer, ...alternatives].some((candidate) => {
    const expected = tokenize(candidate);
    return expected.length === given.length && expected.every((tok, i) => tok === given[i]);
  });
}

/** Exact option match (options come from our own data, so only light normalisation). */
export function checkChoice(choice: string, answer: string): boolean {
  return normalizeText(choice) === normalizeText(answer);
}

export function checkAnswer(exercise: Exercise, response: ExerciseResponse): CheckResult {
  switch (exercise.type) {
    case 'explain':
      // Info slide: nothing to get wrong.
      return { correct: true, correctAnswer: '' };
    case 'multipleChoice':
      return {
        correct: response.kind === 'text' && checkChoice(response.value, exercise.answer),
        correctAnswer: exercise.answer,
      };
    case 'wordBank':
      return {
        correct: response.kind === 'tokens' && checkWordBank(response.value, exercise.answer, exercise.alternatives),
        correctAnswer: exercise.answer,
      };
    case 'listening':
    case 'typing':
    case 'fillBlank': {
      const alternatives = exercise.alternatives ?? [];
      const correct =
        response.kind === 'text' &&
        ('options' in exercise && exercise.options
          ? checkChoice(response.value, exercise.answer)
          : checkTyped(response.value, exercise.answer, alternatives));
      return { correct, correctAnswer: exercise.answer };
    }
    case 'matching':
      return {
        correct: response.kind === 'matching' && response.mismatches === 0,
        correctAnswer: exercise.pairs.map((p) => `${p.en} = ${p.es}`).join(' · '),
      };
  }
}
