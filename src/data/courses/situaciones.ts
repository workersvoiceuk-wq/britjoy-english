/**
 * Story courses organised by real-life situations (always open; modules in order).
 * - Día a día: 12 modules for living in the UK, following the García family.
 * - Turistas: "tus primeros días en Inglaterra", 12 missions following Sofía's trip.
 *
 * New module: add `dia-a-dia/NN-name.json` (or `turistas/…`), import it here and
 * append it to `units`. Facts carry the date they were checked (`checked`).
 */
import type { LevelDefinition, Unit } from '../../types';

const units = (modules: Record<string, unknown>): Unit[] =>
  Object.keys(modules)
    .sort()
    .map((k) => (modules[k] as { default: Unit }).default);

export const DAILY_LEVEL: LevelDefinition = {
  id: 'DIA',
  track: 'daily',
  short: '🏙️ Día a día',
  name: 'Inglés para el día a día',
  description: 'Presentarte, comprar, moverte, trabajar, llamar, el colegio y la vida social, en una historia.',
  accent: '#C8102E',
  accentDark: '#950B22',
  accentLight: '#FBE3E7',
  instructionLanguage: 'es',
  units: units(import.meta.glob('./dia-a-dia/*.json', { eager: true })),
};

export const TOURIST_LEVEL: LevelDefinition = {
  id: 'TUR',
  track: 'tourist',
  short: '🧳 Turistas',
  name: 'Inglés para turistas',
  description: 'Tus primeros días en Inglaterra: del pasaporte al viaje de vuelta, misión a misión (A1–B1).',
  accent: '#00837A',
  accentDark: '#006158',
  accentLight: '#D7F2EF',
  instructionLanguage: 'es',
  units: units(import.meta.glob('./turistas/*.json', { eager: true })),
};

export const AI_LEVEL: LevelDefinition = {
  id: 'IA',
  track: 'ai',
  short: '🤖 IA',
  name: 'IA con Britjoy',
  description: 'Cómo aprende una IA y cómo usarla con cabeza, con el vocabulario en inglés (basado en el curso de IA de Voz Unida Mundo).',
  accent: '#6D4585',
  accentDark: '#4E2F61',
  accentLight: '#EFE5F5',
  instructionLanguage: 'es',
  units: units(import.meta.glob('./ia/*.json', { eager: true })),
};

/** Topic courses listed in the course selector (after the A1–C2 levels). */
export const SITUATION_LEVELS = [DAILY_LEVEL, TOURIST_LEVEL, AI_LEVEL];
