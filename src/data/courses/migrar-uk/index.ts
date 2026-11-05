/**
 * "Inmigración, impuestos y empresa en el Reino Unido": what citizens of Spain and Latin
 * America need for UK immigration (ETA, visados, EU Settlement Scheme, eVisa, residencia y
 * ciudadanía, asilo), HMRC (NI number, doble imposición) and starting a business (sole
 * trader, limited company), explained in Spanish while you practise English.
 */
import { countryLevels, type CountrySource } from '../pais/build';

const NOT_USED = { name: '', description: '', accent: '#000000', accentDark: '#000000', accentLight: '#000000' };

export const MIGRATE_UK_LEVELS = countryLevels(
  {
    code: 'MUK',
    flag: '🛂',
    track: 'migrar-uk',
    videoDir: 'migrar-uk',
    targets: ['en'],
    english: {
      name: 'Inmigración, impuestos y empresa en el Reino Unido',
      description: 'Visados y ETA según tu nacionalidad, EU Settlement Scheme, eVisa, residencia, ciudadanía, NI number, doble imposición y cómo montar tu empresa, explicados en español.',
      accent: '#0B6E4F',
      accentDark: '#08523B',
      accentLight: '#DDF3EA',
    },
    spanish: NOT_USED,
  },
  import.meta.glob('./lecciones/*.json', { eager: true, import: 'default' }) as Record<string, CountrySource>,
);
