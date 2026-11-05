/**
 * The academy catalogue: one card per course, Udemy / Google-courses style.
 * Each entry points at one or more levels in the registry; progress, module and
 * lesson counts are computed from the real content.
 */
import { LEVELS } from './courses/en-es';
import { AI_LEVEL, DAILY_LEVEL, TOURIST_LEVEL } from './courses/situaciones';
import { LIFE_LEVEL } from './courses/vivir-uk';
import { SPAIN_LEVELS } from './courses/espana';
import type { LevelDefinition } from '../types';

export type Category = 'ingles' | 'situaciones' | 'vida' | 'espana' | 'ia';

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
  open: { tab: 'english'; level: string } | { tab: 'life' };
}

export const CATEGORIES: { id: Category | 'todos'; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'ingles', label: 'Inglés por niveles' },
  { id: 'situaciones', label: 'Situaciones reales' },
  { id: 'vida', label: 'Vivir en UK' },
  { id: 'espana', label: 'Vivir en España' },
  { id: 'ia', label: 'Inteligencia artificial' },
];

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
    subtitle: 'Sigue a la familia García en su primer año en Londres: 12 módulos con historia y una misión en cada uno.',
    category: 'situaciones',
    level: 'A1 → B1',
    emoji: '🏙️',
    color: DAILY_LEVEL.accent,
    badges: ['Con historia', 'Nuevo'],
    learn: [
      'Presentarte y hablar de tu familia',
      'Comprar, pedir devoluciones y entender recibos',
      'Moverte en transporte y comunicar averías en casa',
      'Pedir cita en el GP y hablar en la farmacia',
      'Buscar empleo, hacer entrevistas e inglés en el trabajo',
      'Llamadas, correos, colegio, servicios públicos y vida social',
    ],
    levels: [DAILY_LEVEL],
    open: { tab: 'english', level: DAILY_LEVEL.id },
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
  ...SPAIN_LEVELS.map(
    (level): CatalogCourse =>
      level.targetLanguage === 'es'
        ? {
            id: 'espana-espanol',
            title: 'Living in Spain · learn Spanish',
            subtitle: 'Every step of settling in Spain explained in English, while you learn the Spanish you need at each office.',
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
            ],
            levels: [level],
            open: { tab: 'english', level: level.id },
          }
        : {
            id: 'espana-ingles',
            title: 'Vivir en España · aprende inglés',
            subtitle: 'Todos los trámites de España, claros y paso a paso, mientras aprendes a decirlos en inglés.',
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
            ],
            levels: [level],
            open: { tab: 'english', level: level.id },
          },
  ),
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
