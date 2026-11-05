/**
 * "Vivir en Colombia": the procedures every citizen and resident should know (cédula,
 * acción de tutela, derecho de petición, salud, trabajo, tránsito, DIAN…), as two
 * language courses. See ../pais/build.ts for how each bilingual lesson becomes the exercises.
 */
import { countryLevels, type CountrySource } from '../pais/build';

export const COLOMBIA_LEVELS = countryLevels(
  {
    code: 'CO',
    flag: '🇨🇴',
    track: 'colombia',
    videoDir: 'colombia',
    english: {
      name: 'Vivir en Colombia · aprende inglés',
      description: 'Tus derechos y trámites en Colombia (cédula, tutela, salud, trabajo, tránsito, DIAN…) explicados en español; practicas las frases en inglés.',
      accent: '#1F4E9C',
      accentDark: '#163A75',
      accentLight: '#E0E9FA',
    },
    spanish: {
      name: 'Living in Colombia · learn Spanish',
      description: 'Your rights and procedures in Colombia (ID card, tutela, healthcare, work, traffic, tax…) explained in English; you practise the phrases in Spanish.',
      accent: '#8A6A00',
      accentDark: '#664E00',
      accentLight: '#FFF4C2',
    },
  },
  import.meta.glob('./lecciones/*.json', { eager: true, import: 'default' }) as Record<string, CountrySource>,
);
