/**
 * "Tu consulado en Londres": how the consulates of Spain and the Latin American countries
 * work in London (citas, registro consular, pasaporte, registro civil, voto, poderes,
 * apostilla), explained in Spanish while you practise the English you need around them.
 */
import { countryLevels, type CountrySource } from '../pais/build';

const NOT_USED = { name: '', description: '', accent: '#000000', accentDark: '#000000', accentLight: '#000000' };

export const CONSULATE_LEVELS = countryLevels(
  {
    code: 'CON',
    flag: '🏛️',
    track: 'consulados',
    videoDir: 'consulados',
    targets: ['en'],
    english: {
      name: 'Tu consulado en Londres',
      description: 'Cómo funcionan en Londres los consulados de España y de Latinoamérica: citas, registro consular, pasaporte, bebés nacidos en el Reino Unido, voto, poderes y apostilla.',
      accent: '#6B3FA0',
      accentDark: '#4F2D78',
      accentLight: '#EEE5F8',
    },
    spanish: NOT_USED,
  },
  import.meta.glob('./lecciones/*.json', { eager: true, import: 'default' }) as Record<string, CountrySource>,
);
