/**
 * City guides ("Tu ciudad"): transport, housing, social services and useful facts for the main
 * cities of each country, one lesson per city, built like the country courses (../pais/build.ts).
 * UK cities: learn English (explained in Spanish). Spanish and Colombian cities: both directions.
 */
import { countryLevels, type CountrySource } from '../pais/build';

const NOT_USED = { name: '', description: '', accent: '#000000', accentDark: '#000000', accentLight: '#000000' };
const load = (m: Record<string, unknown>) => m as Record<string, CountrySource>;

export const UK_CITY_LEVELS = countryLevels(
  {
    code: 'UKC',
    flag: '🏙️',
    track: 'ciudades',
    videoDir: 'ciudades-uk',
    targets: ['en'],
    english: {
      name: 'Ciudades del Reino Unido',
      description: 'Transporte, vivienda, servicios sociales y lo que debes saber en 14 ciudades: Londres, Birmingham, Mánchester, Glasgow, Liverpool, Leeds, Sheffield, Bristol, Edimburgo, Newcastle, Nottingham, Leicester, Cardiff y Belfast.',
      accent: '#1D2D5C',
      accentDark: '#141F40',
      accentLight: '#E3E8F5',
    },
    spanish: NOT_USED,
  },
  load(import.meta.glob('./uk/lecciones/*.json', { eager: true, import: 'default' })),
);

export const ES_CITY_LEVELS = countryLevels(
  {
    code: 'ESC',
    flag: '🏙️',
    track: 'ciudades',
    videoDir: 'ciudades-es',
    english: {
      name: 'Ciudades de España · aprende inglés',
      description: 'Transporte, ayuntamiento, vivienda y servicios sociales en las grandes ciudades de España; practicas las frases en inglés.',
      accent: '#B3261E',
      accentDark: '#8A1C16',
      accentLight: '#FCE3E0',
    },
    spanish: {
      name: 'Spanish cities · learn Spanish',
      description: "Transport, the town hall, housing and social services in Spain's main cities; you practise the phrases in Spanish.",
      accent: '#9A6A00',
      accentDark: '#704D00',
      accentLight: '#FFF1CC',
    },
  },
  load(import.meta.glob('./es/lecciones/*.json', { eager: true, import: 'default' })),
);

export const CO_CITY_LEVELS = countryLevels(
  {
    code: 'COC',
    flag: '🏙️',
    track: 'ciudades',
    videoDir: 'ciudades-co',
    english: {
      name: 'Ciudades de Colombia · aprende inglés',
      description: 'Transporte, alcaldía, vivienda y programas sociales en las grandes ciudades de Colombia; practicas las frases en inglés.',
      accent: '#1F4E9C',
      accentDark: '#163A75',
      accentLight: '#E0E9FA',
    },
    spanish: {
      name: 'Colombian cities · learn Spanish',
      description: "Transport, the mayor's office, housing and social programmes in Colombia's main cities; you practise the phrases in Spanish.",
      accent: '#8A6A00',
      accentDark: '#664E00',
      accentLight: '#FFF4C2',
    },
  },
  load(import.meta.glob('./co/lecciones/*.json', { eager: true, import: 'default' })),
);

export const CITY_LEVELS = [...UK_CITY_LEVELS, ...ES_CITY_LEVELS, ...CO_CITY_LEVELS];
