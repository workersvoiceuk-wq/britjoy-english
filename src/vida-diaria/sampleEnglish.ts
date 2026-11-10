import type { Exercise } from '../types';

// Presentation copy only. The canonical lesson, exercise order and answers stay intact.
const explanations = {
  'Capítulo 1 · Una casa nueva en Londres': {
    title: 'Chapter 1 · A new home in London',
    body: "Ana García has just arrived in London from Valencia with her partner, Diego, and their eight-year-old daughter, Lucía. It's Saturday morning and their next-door neighbour, Margaret, knocks on the door with a plate of biscuits.\n‘Hello! I'm Margaret, from number 12. Welcome to the street!’\nAna takes a deep breath. It's her first conversation in English in her new neighbourhood.",
    say: "Chapter one: a new home in London. Ana has just arrived from Valencia with her partner, Diego, and their daughter, Lucía. It's Saturday and their neighbour Margaret knocks on the door to welcome them. This is Ana's first conversation in her new neighbourhood. Let's help her.",
  },
  'Habla de tu familia y tus gustos': {
    title: 'Talk about your family and interests',
    body: "Margaret asks about the family and what they like doing. In English, people often ask short questions and reply in simple sentences.\n• For family: ‘This is my partner, Diego’ or ‘This is my daughter, Lucía’.\n• For interests: ‘I like…’, ‘I love…’ or ‘I'm into…’.",
  },
  '🎯 Misión': {
    title: '🎯 Mission',
    body: 'Introduce yourself to Margaret. Say your name, where you are from, who you live with and one thing you like doing.',
    say: 'Your mission is to introduce yourself to Margaret. Say your name, where you are from, who you live with and something you like doing.',
  },
};
const prompts: Record<string, string> = {
  'Margaret dice «Nice to meet you». ¿Qué respondes?': 'Margaret says “Nice to meet you”. How do you respond?',
  'Soy de España, de Valencia.': 'Use the words to say you are from Valencia in Spain.',
  'Une cada palabra de la familia': 'Match each family word with its meaning',
  '¿Cómo preguntas a Margaret qué hace en su tiempo libre?': 'How do you ask Margaret what she does in her spare time?',
  '🎯 Misión: escribe en inglés «Me gusta cocinar.»': '🎯 Mission: write a sentence about enjoying cooking.',
};
const hints: Record<string, string> = {
  'Esta es mi hija, Lucía.': 'You are introducing your daughter, Lucía.',
  'Me gusta cocinar.': 'Say that you enjoy cooking.',
};

export function sampleExerciseInEnglish(exercise: Exercise): Exercise {
  if (exercise.type === 'explain') {
    const translated = explanations[exercise.title as keyof typeof explanations];
    return translated ? { ...exercise, ...translated } : exercise;
  }
  if ('prompt' in exercise && exercise.prompt && prompts[exercise.prompt]) return { ...exercise, prompt: prompts[exercise.prompt] };
  if ('hint' in exercise && exercise.hint && hints[exercise.hint]) return { ...exercise, hint: hints[exercise.hint] };
  return exercise;
}
