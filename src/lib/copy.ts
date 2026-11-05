import type { Exercise } from '../types';

/** In-lesson UI copy. Lower levels get Spanish instructions; higher levels get English. */
const COPY = {
  es: {
    multipleChoice: 'Elige la respuesta correcta',
    wordBank: 'Traduce esta frase',
    listeningChoice: 'Escucha y elige lo que oyes',
    listeningTyping: 'Escribe lo que oyes',
    matching: 'Une las parejas',
    typing: 'Escribe la respuesta',
    fillBlank: 'Completa la frase',
    check: 'Comprobar',
    continue: 'Continuar',
    correct: '¡Correcto!',
    wrong: 'Respuesta correcta:',
    typeHere: 'Escribe en inglés…',
    slow: 'Lento',
    play: 'Escuchar',
    tapWords: 'Toca las palabras en orden',
    noAudio: 'Tu navegador no puede reproducir audio.',
    showText: 'Mostrar texto',
    speak: 'Dilo en voz alta',
    explainTitle: 'Te lo explico',
    showTranslation: 'Ver traducción',
    hideTranslation: 'Ocultar traducción',
    playAll: 'Escuchar todo el diálogo',
  },
  en: {
    multipleChoice: 'Choose the correct answer',
    wordBank: 'Build the sentence',
    listeningChoice: 'Listen and choose what you hear',
    listeningTyping: 'Type what you hear',
    matching: 'Match the pairs',
    typing: 'Type your answer',
    fillBlank: 'Fill in the blank',
    check: 'Check',
    continue: 'Continue',
    correct: 'Correct!',
    wrong: 'Correct answer:',
    typeHere: 'Type in English…',
    slow: 'Slow',
    play: 'Play',
    tapWords: 'Tap the words in order',
    noAudio: 'Your browser cannot play audio.',
    showText: 'Show text',
    speak: 'Say it out loud',
    explainTitle: 'Let me explain',
    showTranslation: 'Show translation',
    hideTranslation: 'Hide translation',
    playAll: 'Play the whole dialogue',
  },
} as const;

export type Lang = keyof typeof COPY;
export type Copy = (typeof COPY)[Lang];

/** Typing hint when the lesson practises Spanish instead of English. */
const TYPE_SPANISH = { es: 'Escribe en español…', en: 'Type in Spanish…' } as const;

export function copyFor(lang: Lang, target: 'en' | 'es' = 'en'): Copy {
  return target === 'es' ? ({ ...COPY[lang], typeHere: TYPE_SPANISH[lang] } as unknown as Copy) : COPY[lang];
}

export function instructionFor(exercise: Exercise, copy: Copy): string {
  switch (exercise.type) {
    case 'explain':
    case 'dialogue':
      return exercise.title;
    case 'speak':
      return copy.speak;
    case 'listening':
      return exercise.prompt ?? (exercise.options ? copy.listeningChoice : copy.listeningTyping);
    case 'matching':
      return exercise.prompt ?? copy.matching;
    default:
      return copy[exercise.type];
  }
}
