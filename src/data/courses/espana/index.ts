/**
 * "Vivir en España": everything a newcomer needs to know in Spain (NIE/TIE,
 * padrón, arraigo, sanidad, Hacienda, trabajo, ayudas…), as a language course.
 *
 * One bilingual source per lesson (lecciones/*.json) builds TWO courses:
 * - ES-EN "Vivir en España · aprende inglés": explained in Spanish, practised in English.
 * - ES-ES "Living in Spain · learn Spanish": explained in English, practised in Spanish
 *   (Spanish voice and speech recognition).
 * Exercises follow the Duolingo pattern: explanation (+ video) → quiz on the facts →
 * match, build, listen, type and say the key phrases.
 */
import type { Exercise, Lesson, LevelDefinition, Unit } from '../../../types';

type Bi = { es: string; en: string };
export interface SpainSource {
  id: string;
  order: number;
  icon: string;
  checked: string;
  title: Bi;
  unit: Bi;
  cards: { title: Bi; body: Bi; say?: Bi; link?: { label: Bi; url: string }; video?: { src: string; poster?: string; caption?: Bi } }[];
  /** 3–4 short steps shown in the lesson's explainer video (scripts/espana_videos.py). */
  steps: Bi[];
  /** Key phrases to practise (4–6), short enough to build word by word. */
  phrases: Bi[];
  quiz: { q: Bi; options: Bi[]; answer: number }[];
}

const sources = Object.values(
  import.meta.glob('./lecciones/*.json', { eager: true, import: 'default' }) as Record<string, SpainSource>,
).sort((a, b) => a.order - b.order);

type Lang = 'es' | 'en';
const other = (l: Lang): Lang => (l === 'es' ? 'en' : 'es');

/** Lesson exercises for learners of `target`, explained in the other language. */
export function buildLesson(src: SpainSource, target: Lang): Lesson {
  const L = other(target);
  const ph = src.phrases;
  const pair = (p: Bi) => ({ en: p[target], es: p[L] }); // "en" = phrase being learnt, "es" = meaning
  const words = (s: string) => s.split(' ');
  const exercises: Exercise[] = [];

  src.cards.forEach((c, i) =>
    exercises.push({
      type: 'explain',
      title: c.title[L],
      body: c.body[L],
      ...(c.say ? { say: c.say[L] } : {}),
      ...(i === 0 ? { phrases: ph.map(pair) } : {}),
      // Every lesson opens with its own short explainer video in the explanation language.
      ...(i === 0 && !c.video
        ? {
            video: {
              src: `videos/espana/${src.id}-${L}.mp4`,
              poster: `videos/espana/${src.id}-${L}.jpg`,
              caption: L === 'es' ? 'Britjoy te lo explica paso a paso' : 'Britjoy explains it step by step',
            },
          }
        : {}),
      ...(c.link ? { link: { label: c.link.label[L], url: c.link.url } } : {}),
      ...(c.video ? { video: { src: c.video.src, poster: c.video.poster, caption: c.video.caption?.[L] } } : {}),
    }),
  );
  for (const q of src.quiz) {
    exercises.push({ type: 'multipleChoice', prompt: q.q[L], options: q.options.map((o) => o[L]), answer: q.options[q.answer][L] });
  }
  exercises.push({
    type: 'matching',
    prompt: L === 'es' ? 'Une cada frase con su significado' : 'Match each phrase with its meaning',
    pairs: ph.slice(0, 4).map(pair),
  });
  // Build a sentence: the answer's words plus a few from another phrase as distractors.
  const build = ph[1] ?? ph[0];
  const answerWords = words(build[target]);
  const extra = words((ph[2] ?? ph[0])[target]).filter((w) => !answerWords.includes(w)).slice(0, 3);
  exercises.push({ type: 'wordBank', prompt: build[L], words: [...answerWords, ...(extra.length ? extra : ['please'])], answer: build[target] });
  const heard = ph[0];
  const others = ph.filter((p) => p !== heard).slice(0, 2).map((p) => p[target]);
  exercises.push({ type: 'listening', text: heard[target], options: [heard[target], ...others], answer: heard[target] });
  const typed = ph[3] ?? ph[ph.length - 1];
  exercises.push({
    type: 'typing',
    prompt: L === 'es' ? `Escribe en inglés: «${typed.es}»` : `Write in Spanish: "${typed.en}"`,
    answer: typed[target],
  });
  const spoken = ph[2] ?? ph[0];
  exercises.push({ type: 'speak', text: spoken[target], hint: spoken[L] });

  return { id: `${target === 'en' ? 'esen' : 'eses'}-${src.id}`, title: src.title[L], icon: src.icon, exercises };
}

function buildLevel(target: Lang): LevelDefinition {
  const units: Unit[] = sources.map((s) => ({
    level: target === 'en' ? 'ES-EN' : 'ES-ES',
    unit: s.unit[other(target)],
    title: s.title[other(target)],
    icon: s.icon,
    checked: s.checked,
    lessons: [buildLesson(s, target)],
  }));
  return target === 'en'
    ? {
        id: 'ES-EN',
        short: '🇪🇸 EN',
        track: 'spain',
        name: 'Vivir en España · aprende inglés',
        description: 'Todos los trámites de España (NIE, padrón, sanidad, Hacienda…) explicados en español; practicas las frases en inglés.',
        accent: '#B3261E',
        accentDark: '#8A1C16',
        accentLight: '#FCE3E0',
        instructionLanguage: 'es',
        targetLanguage: 'en',
        units,
      }
    : {
        id: 'ES-ES',
        short: '🇪🇸 ES',
        track: 'spain',
        name: 'Living in Spain · learn Spanish',
        description: 'Every step of settling in Spain (NIE, padrón, healthcare, tax…) explained in English; you practise the phrases in Spanish.',
        accent: '#9A6A00',
        accentDark: '#704D00',
        accentLight: '#FFF1CC',
        instructionLanguage: 'en',
        targetLanguage: 'es',
        units,
      };
}

export const SPAIN_LEVELS: LevelDefinition[] = sources.length ? [buildLevel('en'), buildLevel('es')] : [];
