// «Inglés para el día a día»: pedagogy of the practice screen (pure, tested in tests/vida-diaria-practice.test.ts).
// One exercise per screen. A first miss gets feedback about the CHOSEN option and a gradual hint, never the answer;
// a second miss shows the answer and sends the exercise to the end-of-lesson review of mistakes.
import type { Exercise, ExerciseResponse, Lesson } from '../types';

export type Ui = 'es' | 'en';

export const isPractice = (e: Exercise) => e.type !== 'explain' && e.type !== 'dialogue';

/** English phrases taught in the lesson's explanation cards, with their Spanish meaning. */
export function lessonPhrases(lesson: Lesson): Map<string, string> {
  return phraseMap(lessonPhraseList(lesson));
}

/** The same phrases as written (English as taught, Spanish meaning), in lesson order and without repeats. */
export function lessonPhraseList(lesson: Lesson): Array<{ en: string; es: string }> {
  const seen = new Set<string>();
  const out: Array<{ en: string; es: string }> = [];
  for (const e of lesson.exercises)
    if (e.type === 'explain')
      for (const p of e.phrases ?? []) {
        const k = norm(p.en);
        if (!seen.has(k)) {
          seen.add(k);
          out.push({ en: p.en, es: p.es });
        }
      }
  return out;
}

export function phraseMap(list: ReadonlyArray<{ en: string; es: string }>): Map<string, string> {
  return new Map(list.map((p) => [norm(p.en), p.es]));
}

const norm = (s: string) => s.toLowerCase().replace(/[.,!?¿¡'’"]/g, '').replace(/\s+/g, ' ').trim();
const words = (s: string) => norm(s).split(' ').filter(Boolean);

function chosenText(r: ExerciseResponse | null): string | null {
  if (!r) return null;
  if (r.kind === 'text') return r.value;
  if (r.kind === 'tokens') return r.value.join(' ');
  return null;
}

/** Feedback on what the learner chose. It explains the choice and never contains the expected answer. */
export function optionFeedback(exercise: Exercise, response: ExerciseResponse | null, phrases: Map<string, string>, ui: Ui = 'es'): string {
  const es = ui === 'es';
  const chosen = chosenText(response);
  switch (exercise.type) {
    case 'multipleChoice':
    case 'fillBlank':
    case 'listening': {
      if (exercise.type !== 'multipleChoice' && !('options' in exercise && exercise.options)) break;
      if (!chosen) break;
      const meaning = phrases.get(norm(chosen));
      if (meaning) return es ? `«${chosen}» significa «${meaning}». No es lo que pide esta situación.` : `“${chosen}” means “${meaning}”. It is not what this situation asks for.`;
      if (exercise.type === 'fillBlank') return es ? `Con «${chosen}» la frase no tiene sentido. Lee la frase entera con el hueco.` : `With “${chosen}” the sentence does not make sense. Read the whole sentence with the gap.`;
      if (exercise.type === 'listening') return es ? `«${chosen}» no es lo que se oye. Escucha otra vez y fíjate en la primera palabra.` : `“${chosen}” is not what you hear. Listen again and focus on the first word.`;
      return es ? `«${chosen}» no responde a lo que te piden. Vuelve a leer la situación: ¿quién habla y qué necesita?` : `“${chosen}” does not answer what is asked. Read the situation again: who is speaking and what do they need?`;
    }
    case 'wordBank': {
      const got = response?.kind === 'tokens' ? response.value.map(norm) : [];
      const want = words(exercise.answer);
      if (got.length < want.length) return es ? 'Te falta alguna palabra: la frase está incompleta.' : 'A word is missing: the sentence is incomplete.';
      if (got.length > want.length) return es ? 'Sobra alguna palabra: quita la que no encaja.' : 'There is an extra word: remove the one that does not fit.';
      const off = got.filter((w, i) => w !== want[i]).length;
      return es ? `Hay ${off} palabra${off === 1 ? '' : 's'} fuera de su sitio. Recuerda: sujeto, verbo y después el resto.` : `${off} word${off === 1 ? ' is' : 's are'} out of place. Remember: subject, verb, then the rest.`;
    }
    case 'typing': {
      const got = words(chosen ?? '');
      const want = words(exercise.answer);
      const i = want.findIndex((w, k) => got[k] !== w);
      const at = i < 0 ? want.length + 1 : i + 1;
      return es ? `Casi: revisa a partir de la palabra ${at}.` : `Almost: check from word ${at}.`;
    }
    case 'matching': {
      const n = response?.kind === 'matching' ? response.mismatches : 0;
      return es ? `${n} pareja${n === 1 ? ' no coincide' : 's no coinciden'}. Empieza por las que tengas seguras.` : `${n} pair${n === 1 ? ' does' : 's do'} not match. Start with the ones you are sure about.`;
    }
    default:
      break;
  }
  return es ? 'Esa respuesta no encaja todavía. Mira la pista y prueba otra vez.' : 'That answer does not fit yet. Look at the hint and try again.';
}

/**
 * Gradual hint: level 1 (before or after a first try) gives a strategy; level 2 (after a miss) narrows it down
 * with the first word, still without the full answer.
 */
export function gradualHint(exercise: Exercise, level: 1 | 2, ui: Ui = 'es', chosen?: string | null): string {
  const es = ui === 'es';
  const answer = 'answer' in exercise ? String(exercise.answer) : '';
  const options = 'options' in exercise && exercise.options ? exercise.options : null;
  if (level === 2 && options) {
    // With options, a first word would give the answer away. With 4+ options, rule one more out; with 3, point back
    // to the lesson instead of narrowing it to a single option.
    const out = options.length > 3 ? options.find((o) => o !== answer && o !== chosen) : null;
    if (out) return es ? `Descarta también «${out}».` : `Rule out “${out}” as well.`;
    return es ? 'Vuelve a la explicación de la lección: allí está la frase que encaja, con su traducción.' : 'Go back to the lesson explanation: the phrase that fits is there, with its translation.';
  }
  if (level === 2 && answer && !options) {
    const first = answer.split(/\s+/)[0].replace(/[.,!?]$/, '');
    const n = answer.split(/\s+/).length;
    return es ? `Empieza por «${first}…» y tiene ${n} palabra${n === 1 ? '' : 's'}.` : `It starts with “${first}…” and has ${n} word${n === 1 ? '' : 's'}.`;
  }
  switch (exercise.type) {
    case 'multipleChoice':
      return es ? 'Piensa en lo que dirías tú en esa situación, con educación y en pocas palabras.' : 'Think about what you would say in that situation, politely and briefly.';
    case 'wordBank':
      return es ? 'Coloca primero quién hace la acción y el verbo.' : 'Place who does the action and the verb first.';
    case 'listening':
      return es ? 'Escucha otra vez: la primera palabra suele ser una pregunta o un saludo.' : 'Listen again: the first word is often a question word or a greeting.';
    case 'typing':
      return es ? 'Usa una de las frases de la explicación: está casi igual.' : 'Use one of the phrases from the explanation: it is almost the same.';
    case 'fillBlank':
      return es ? 'Lee la frase entera y elige la palabra que le da sentido.' : 'Read the whole sentence and pick the word that makes it work.';
    case 'matching':
      return es ? 'Empieza por las palabras que ya conoces y deja las dudosas para el final.' : 'Start with the words you already know and leave the doubtful ones for last.';
    case 'speak':
      return es ? 'Dilo despacio y completo. Si no puedes hablar ahora, puedes saltarlo.' : 'Say it slowly and in full. If you cannot speak now, you can skip it.';
    default:
      return '';
  }
}

export interface PracticeItem { index: number; review: boolean }

/** Order of screens: every exercise once, then the practice exercises that were missed twice (review of mistakes). */
export function practicePlan(lesson: Lesson, missed: number[]): PracticeItem[] {
  return [
    ...lesson.exercises.map((_, index) => ({ index, review: false })),
    ...missed.filter((i, k) => missed.indexOf(i) === k).map((index) => ({ index, review: true })),
  ];
}
