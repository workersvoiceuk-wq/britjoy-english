/**
 * The academy catalogue: one card per course, Udemy / Google-courses style.
 * Each entry points at one or more levels in the registry; progress, module and
 * lesson counts are computed from the real content.
 */
import { LEVELS } from './courses/en-es';
import { AI_LEVEL, DAILY_LEVEL, TOURIST_LEVEL } from './courses/situaciones';
import { LIFE_LEVEL } from './courses/vivir-uk';
import { SPAIN_LEVELS } from './courses/espana';
import { COLOMBIA_LEVELS } from './courses/colombia';
import { CONSULATE_LEVELS } from './courses/consulados';
import { MIGRATE_UK_LEVELS } from './courses/migrar-uk';
import { UK_CITY_LEVELS, ES_CITY_LEVELS, CO_CITY_LEVELS } from './courses/ciudades';
import type { LevelDefinition } from '../types';
import { DAILY_OUTLINE_LEVEL, VIDA_DIARIA_PATH } from './vida-diaria/outline';

export type Category = 'ingles' | 'situaciones' | 'vida' | 'espana' | 'colombia' | 'ia';

export interface CatalogCourse {
  id: string;
  title: string;
  subtitle: string;
  category: Category;
  level: string;
  emoji: string;
  color: string;
  badges: string[];
  learn: string[];
  /** Levels whose lessons make up this course. */
  levels: LevelDefinition[];
  /** Where "Empezar" takes the learner: an English level/course id, or the Vivir en UK tab. */
  /**
   * Where "Empezar" takes the learner: an English level/course id, the Vivir en UK tab, or a separate product page
   * (relative to the web app, e.g. «Inglés para el día a día» at vida-diaria/).
   */
  open: { tab: 'english'; level: string } | { tab: 'life' } | { tab: 'local' } | { tab: 'product'; href: string };
}

export const CATEGORIES: { id: Category | 'todos'; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'ingles', label: 'Inglés por niveles' },
  { id: 'situaciones', label: 'Situaciones reales' },
  { id: 'vida', label: 'Vivir en UK' },
  { id: 'espana', label: 'Vivir en España' },
  { id: 'colombia', label: 'Vivir en Colombia' },
  { id: 'ia', label: 'Inteligencia artificial' },
];

const LEARN_CO = {
  es: [
    'Cédula, registro civil y documentos',
    'Acción de tutela y derecho de petición, sin abogado',
    'Salud: EPS, SISBÉN, urgencias y cómo reclamar',
    'Trabajo, pensión e impuestos (DIAN)',
    'Tránsito: licencia, SOAT, técnico-mecánica y comparendos',
    'Servicios públicos, arriendo, consumidor y líneas de emergencia',
    'Crear tu empresa (SAS) o trabajar como independiente',
  ],
  en: [
    'ID card (cédula), civil registry and documents',
    'Tutela and right of petition, without a lawyer',
    'Healthcare: EPS, SISBÉN, emergencies and complaints',
    'Work, pensions and tax (DIAN)',
    'Traffic: licence, SOAT, vehicle inspection and fines',
    'Utilities, renting, consumer rights and emergency numbers',
    'Starting a company (SAS) or working as self-employed',
  ],
};

export const CATALOG: CatalogCourse[] = [
  {
    id: 'ingles-a1-c2',
    title: 'Inglés general: del A1 al C2',
    subtitle: 'El camino completo, nivel a nivel, con test de nivel inicial y Britjoy explicando cada actividad.',
    category: 'ingles',
    level: 'A1 → C2',
    emoji: '🎓',
    color: '#398401',
    badges: ['Test de nivel', 'Audio británico'],
    learn: [
      'Saludar, presentarte y manejar números (A1)',
      'Hablar de tu rutina y del pasado (A2)',
      'Dar opiniones y hablar de planes (B1)',
      'Condicionales e ideas abstractas (B2)',
      'Argumentar con matices y usar expresiones (C1)',
      'Precisión y registro casi nativos (C2)',
    ],
    levels: LEVELS,
    open: { tab: 'english', level: 'A1' },
  },
  {
    id: 'dia-a-dia',
    title: DAILY_LEVEL.name,
    subtitle: 'Sigue a la familia García en su primer año en Londres: 12 módulos con historia y una misión en cada uno. Curso aparte: módulo 1 gratis, sin tarjeta.',
    category: 'situaciones',
    level: 'A1 → B1',
    emoji: '🏙️',
    color: DAILY_LEVEL.accent,
    badges: ['Con historia', 'Muestra gratis', '£19.99/mes'],
    learn: [
      'Presentarte y hablar de tu familia',
      'Comprar, pedir devoluciones y entender recibos',
      'Moverte en transporte y comunicar averías en casa',
      'Pedir cita en el GP y hablar en la farmacia',
      'Buscar empleo, hacer entrevistas e inglés en el trabajo',
      'Llamadas, correos, colegio, servicios públicos y vida social',
    ],
    // The paid modules are not in this bundle: the outline gives the real module and lesson counts.
    levels: [DAILY_OUTLINE_LEVEL],
    open: { tab: 'product', href: VIDA_DIARIA_PATH },
  },
  {
    id: 'turistas',
    title: 'Inglés para turistas: tus primeros días en Inglaterra',
    subtitle: 'Acompaña a Sofía en su semana en Londres: ETA, aeropuerto, metro, hotel, restaurantes, museos y vuelta a casa.',
    category: 'situaciones',
    level: 'A1 → B1',
    emoji: '🧳',
    color: TOURIST_LEVEL.accent,
    badges: ['Con historia', 'Datos 2026', 'Nuevo'],
    learn: [
      'Preparar pasaporte y ETA antes de viajar',
      'Pasar el control de fronteras y la aduana',
      'Recuperar una maleta perdida',
      'Moverte en metro y tren y seguir indicaciones',
      'Entrar en museos: entradas gratis, reservas y seguridad',
      'Resolver emergencias, retrasos y objetos perdidos',
    ],
    levels: [TOURIST_LEVEL],
    open: { tab: 'english', level: TOURIST_LEVEL.id },
  },
  {
    id: 'vivir-en-uk',
    title: 'Vivir en el Reino Unido',
    subtitle: 'Lo práctico, revisado con GOV.UK y NHS: 18 temas, del médico y las ayudas a los impuestos, el banco, la familia, conducir y tu barrio.',
    category: 'vida',
    level: 'Todos los niveles',
    emoji: '🇬🇧',
    color: LIFE_LEVEL.accent,
    badges: ['Fuentes oficiales', 'Con vídeo'],
    learn: [
      'Pagar el transporte y entender el Overground',
      'Registrarte en un GP y usar el 111 y la farmacia',
      'Universal Credit y Council Tax paso a paso',
      'Tus derechos al alquilar y en el trabajo',
      'Colegios, compras y reclamaciones',
      'Banco, facturas de casa y cómo evitar estafas',
      'Impuestos (HMRC), nómina y Self Assessment',
      'Child Benefit, guardería gratis y registrar a tu bebé',
      '999, 101, dentista, conducir y tu barrio',
      'Life in the UK test, share code, NI number y eVisa',
    ],
    levels: [LIFE_LEVEL],
    open: { tab: 'life' },
  },
  ...UK_CITY_LEVELS.map(
    (level): CatalogCourse => ({
      id: 'tu-council',
      title: 'Tu council y tu ciudad en el Reino Unido',
      subtitle: 'Escribe tu código postal y llega a los servicios de TU council (vivienda, council tax, servicios sociales, colegios), más guías de transporte y servicios de las 14 ciudades principales.',
      category: 'vida',
      level: 'Todos los niveles',
      emoji: '🏙️',
      color: level.accent,
      badges: ['Datos de GOV.UK', 'Por código postal'],
      learn: [
        'Encontrar tu council con tu código postal',
        'Pedir vivienda social y ayuda si te quedas sin casa',
        'Servicios sociales, colegios y comida escolar gratis',
        'Transporte y descuentos en Londres, Birmingham, Mánchester, Glasgow y 10 ciudades más',
        'Escocia, Gales e Irlanda del Norte: lo que cambia',
      ],
      levels: [level],
      open: { tab: 'local' },
    }),
  ),
  ...MIGRATE_UK_LEVELS.map(
    (level): CatalogCourse => ({
      id: 'migrar-uk',
      title: level.name,
      subtitle: 'Para ciudadanos de España y Latinoamérica: visados y ETA según tu país, EU Settlement Scheme, eVisa, residencia, ciudadanía, HMRC y cómo montar tu empresa.',
      category: 'vida',
      level: 'A1 → B1',
      emoji: '🛂',
      color: level.accent,
      badges: ['GOV.UK', 'Con vídeo'],
      learn: [
        'ETA o visado según tu nacionalidad',
        'EU Settlement Scheme y eVisa (share code)',
        'Visados de trabajo, estudios y familia',
        'Residencia permanente y ciudadanía británica',
        'NI number, HMRC y doble imposición',
        'Autónomo (sole trader) o limited company',
      ],
      levels: [level],
      open: { tab: 'english', level: level.id },
    }),
  ),
  ...CONSULATE_LEVELS.map(
    (level): CatalogCourse => ({
      id: 'consulados-londres',
      title: level.name,
      subtitle: 'España, Colombia, México, Ecuador, Perú, Venezuela, Bolivia, Argentina y Chile: cómo pedir cita y hacer cada trámite en tu consulado en Londres.',
      category: 'vida',
      level: 'A1 → B1',
      emoji: '🏛️',
      color: level.accent,
      badges: ['9 países', 'Con vídeo'],
      learn: [
        'Pedir cita (gratis) y evitar estafas',
        'Registro consular y voto desde el Reino Unido',
        'Pasaporte, documento de emergencia y DNI o cédula',
        'Registrar a un bebé nacido en el Reino Unido',
        'Poderes, fe de vida y apostilla',
        'Qué puede y qué no puede hacer tu consulado',
      ],
      levels: [level],
      open: { tab: 'english', level: level.id },
    }),
  ),
  ...SPAIN_LEVELS.map(
    (level): CatalogCourse =>
      level.targetLanguage === 'es'
        ? {
            id: 'espana-espanol',
            title: 'Living in Spain · learn Spanish',
            subtitle: '14 topics: every step of settling in Spain explained in English (NIE, padrón, healthcare, tax…), while you learn the Spanish you need.',
            category: 'espana',
            level: 'A1 → B1',
            emoji: '🇪🇸',
            color: level.accent,
            badges: ['Learn Spanish', 'With video'],
            learn: [
              'NIE, TIE and NIF: what each one is',
              'Padrón, arraigo and asylum appointments',
              'Health card, GP and emergencies (112)',
              'Tax (Hacienda), work, benefits and housing',
              'Social Security number, school and driving licence',
              'Emergency numbers: 112, 091, 062 and 016',
              'Becoming self-employed or setting up a company',
            ],
            levels: [level],
            open: { tab: 'english', level: level.id },
          }
        : {
            id: 'espana-ingles',
            title: 'Vivir en España · aprende inglés',
            subtitle: '14 temas: los trámites de España claros y paso a paso (NIE, padrón, sanidad, Hacienda…), mientras aprendes a decirlos en inglés.',
            category: 'espana',
            level: 'A1 → B1',
            emoji: '🇪🇸',
            color: level.accent,
            badges: ['Trámites claros', 'Con vídeo'],
            learn: [
              'NIE, TIE y NIF: qué es cada uno',
              'Padrón, arraigo y cita de asilo',
              'Tarjeta sanitaria, centro de salud y 112',
              'Hacienda, trabajo, ayudas y vivienda',
              'Seguridad Social, colegio y carné de conducir',
              'Teléfonos de emergencia: 112, 091, 062 y 016',
              'Hacerte autónomo o crear una empresa',
            ],
            levels: [level],
            open: { tab: 'english', level: level.id },
          },
  ),
  ...COLOMBIA_LEVELS.map(
    (level): CatalogCourse =>
      level.targetLanguage === 'es'
        ? {
            id: 'colombia-espanol',
            title: 'Living in Colombia · learn Spanish',
            subtitle: 'Your rights and every procedure in Colombia explained in English (ID card, tutela, healthcare, work, traffic…), while you learn the Spanish you need.',
            category: 'colombia',
            level: 'A1 → B1',
            emoji: '🇨🇴',
            color: level.accent,
            badges: ['Learn Spanish', 'With video'],
            learn: LEARN_CO.en,
            levels: [level],
            open: { tab: 'english', level: level.id },
          }
        : {
            id: 'colombia-ingles',
            title: 'Vivir en Colombia · aprende inglés',
            subtitle: 'Tus derechos y todos los trámites de Colombia, claros y paso a paso (cédula, tutela, salud, trabajo, tránsito…), mientras aprendes a decirlos en inglés.',
            category: 'colombia',
            level: 'A1 → B1',
            emoji: '🇨🇴',
            color: level.accent,
            badges: ['Tus derechos', 'Con vídeo'],
            learn: LEARN_CO.es,
            levels: [level],
            open: { tab: 'english', level: level.id },
          },
  ),
  ...[...ES_CITY_LEVELS, ...CO_CITY_LEVELS].map((level): CatalogCourse => {
    const es = level.id.startsWith('ESC');
    const learnSpanish = level.targetLanguage === 'es';
    return {
      id: `ciudades-${es ? 'espana' : 'colombia'}${learnSpanish ? '-espanol' : ''}`,
      title: level.name,
      subtitle: level.description,
      category: es ? 'espana' : 'colombia',
      level: 'A1 → B1',
      emoji: es ? '🏙️' : '🚡',
      color: level.accent,
      badges: learnSpanish ? ['Learn Spanish', 'With video'] : ['Por ciudades', 'Con vídeo'],
      learn: es
        ? learnSpanish
          ? ['Transport cards and 2026 passes', 'Padrón appointments in each city', 'Municipal housing and social services', 'Low emission zones']
          : ['Tarjetas y abonos de transporte 2026', 'Cita del padrón en cada ciudad', 'Vivienda municipal y servicios sociales', 'Zonas de bajas emisiones']
        : learnSpanish
          ? ['Transport cards and 2026 fares', 'Pico y placa in each city', 'Sisbén and social programmes', 'Housing and local help lines']
          : ['Tarjetas y pasajes 2026', 'Pico y placa en cada ciudad', 'Sisbén y programas sociales', 'Vivienda y líneas de atención'],
      levels: [level],
      open: { tab: 'english', level: level.id },
    };
  }),
  {
    id: 'ia-con-britjoy',
    title: AI_LEVEL.name,
    subtitle: 'Cómo aprende una inteligencia artificial y cómo usarla con cabeza, con el vocabulario en inglés.',
    category: 'ia',
    level: 'Principiante',
    emoji: '🤖',
    color: AI_LEVEL.accent,
    badges: ['Laboratorio', 'Nuevo'],
    learn: [
      'Datos, etiquetas y patrones',
      'Qué cambia cuando se entrena un modelo',
      'Por qué hay que probar con ejemplos nuevos',
      'Detectar grupos que faltan en los datos',
      'Distinguir un texto fluido de un hecho comprobado',
      'Usar el Modo IA de Britjoy sin fiarte a ciegas',
    ],
    levels: [AI_LEVEL],
    open: { tab: 'english', level: AI_LEVEL.id },
  },
];

/** Minutes per lesson used for the duration estimate shown on cards. */
export const MINUTES_PER_LESSON = 6;

export function courseStats(course: CatalogCourse, completed: Record<string, Record<string, unknown> | undefined>) {
  const lessons = course.levels.flatMap((l) => l.units.flatMap((u) => u.lessons.map((lesson) => ({ level: l.id, id: lesson.id }))));
  const done = lessons.filter((x) => x.id in (completed[x.level] ?? {})).length;
  const modules = course.levels.reduce((n, l) => n + l.units.length, 0);
  const minutes = lessons.length * MINUTES_PER_LESSON;
  return { lessons: lessons.length, done, modules, hours: Math.max(1, Math.round(minutes / 60)) };
}

/** Public download links. The APK is attached to the latest GitHub release by release-apk.yml. */
export const DOWNLOADS = {
  android: 'https://github.com/workersvoiceuk-wq/britjoy-english/releases/latest/download/britjoy-english.apk',
  web: 'https://workersvoiceuk-wq.github.io/britjoy-english/',
};
