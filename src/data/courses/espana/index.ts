/**
 * "Vivir en España": everything a newcomer needs to know in Spain (NIE/TIE, padrón,
 * arraigo, sanidad, Hacienda, trabajo, ayudas…), as two language courses.
 * See ../pais/build.ts for how each bilingual lesson becomes the exercises.
 */
import { countryLevels, type CountrySource } from '../pais/build';

export const SPAIN_LEVELS = countryLevels(
  {
    code: 'ES',
    flag: '🇪🇸',
    track: 'spain',
    videoDir: 'espana',
    english: {
      name: 'Vivir en España · aprende inglés',
      description: 'Todos los trámites de España (NIE, padrón, sanidad, Hacienda…) explicados en español; practicas las frases en inglés.',
      accent: '#B3261E',
      accentDark: '#8A1C16',
      accentLight: '#FCE3E0',
    },
    spanish: {
      name: 'Living in Spain · learn Spanish',
      description: 'Every step of settling in Spain (NIE, padrón, healthcare, tax…) explained in English; you practise the phrases in Spanish.',
      accent: '#9A6A00',
      accentDark: '#704D00',
      accentLight: '#FFF1CC',
    },
  },
  import.meta.glob('./lecciones/*.json', { eager: true, import: 'default' }) as Record<string, CountrySource>,
);
