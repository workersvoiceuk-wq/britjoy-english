/**
 * The ONE place where levels and units are registered.
 *
 * - New unit:  add `src/data/courses/en-es/<level>/unit-N.json`, import it here
 *              and append it to that level's `units` array.
 * - New level: create the folder + JSON files, then add a LevelDefinition below
 *              (order matters: each level unlocks from the one before it).
 */
import type { LevelDefinition, Unit } from '../../../types';
import { LIFE_LEVEL } from '../vivir-uk';
import { SITUATION_LEVELS } from '../situaciones';
import { SPAIN_LEVELS } from '../espana';
import { COLOMBIA_LEVELS } from '../colombia';

import a1u1 from './a1/unit-1.json';
import a1u2 from './a1/unit-2.json';
import a2u1 from './a2/unit-1.json';
import b1u1 from './b1/unit-1.json';
import b2u1 from './b2/unit-1.json';
import c1u1 from './c1/unit-1.json';
import c2u1 from './c2/unit-1.json';

const unit = (data: unknown) => data as Unit;

export const LEVELS: LevelDefinition[] = [
  {
    id: 'A1',
    track: 'english',
    name: 'Principiante',
    description: 'Saludos, presentaciones y números.',
    accent: '#398401',
    accentDark: '#2C6701',
    accentLight: '#D7FFB8',
    instructionLanguage: 'es',
    units: [unit(a1u1), unit(a1u2)],
  },
  {
    id: 'A2',
    track: 'english',
    name: 'Elemental',
    description: 'Rutinas diarias y el pasado.',
    accent: '#137CAE',
    accentDark: '#0F6188',
    accentLight: '#DDF4FF',
    instructionLanguage: 'es',
    units: [unit(a2u1)],
  },
  {
    id: 'B1',
    track: 'english',
    name: 'Intermedio',
    description: 'Opiniones, planes y experiencias.',
    accent: '#945DB7',
    accentDark: '#73498F',
    accentLight: '#F4E6FF',
    instructionLanguage: 'es',
    units: [unit(b1u1)],
  },
  {
    id: 'B2',
    track: 'english',
    name: 'Intermedio alto',
    description: 'Temas abstractos y condicionales.',
    accent: '#AA6400',
    accentDark: '#854E00',
    accentLight: '#FFF0D9',
    instructionLanguage: 'en',
    units: [unit(b2u1)],
  },
  {
    id: 'C1',
    track: 'english',
    name: 'Avanzado',
    description: 'Argumentación con matices y expresiones idiomáticas.',
    accent: '#D33E3E',
    accentDark: '#A53030',
    accentLight: '#FFE1E1',
    instructionLanguage: 'en',
    units: [unit(c1u1)],
  },
  {
    id: 'C2',
    track: 'english',
    name: 'Maestría',
    description: 'Precisión casi nativa y registro.',
    accent: '#2B70C9',
    accentDark: '#1F5299',
    accentLight: '#DCE9FA',
    instructionLanguage: 'en',
    units: [unit(c2u1)],
  },
];

export const LEVEL_IDS = LEVELS.map((l) => l.id);

/** Every course: English levels, the story courses by situation and "Vivir en UK". */
export const ALL_LEVELS: LevelDefinition[] = [...LEVELS, ...SITUATION_LEVELS, LIFE_LEVEL, ...SPAIN_LEVELS, ...COLOMBIA_LEVELS];

export function getLevel(id: string): LevelDefinition {
  return ALL_LEVELS.find((l) => l.id === id) ?? LEVELS[0];
}

export function findLesson(lessonId: string) {
  for (const level of ALL_LEVELS) {
    for (const u of level.units) {
      const lesson = u.lessons.find((l) => l.id === lessonId);
      if (lesson) return { level, unit: u, lesson };
    }
  }
  return null;
}
