// «Inglés para el día a día» · tres niveles, motivos de acceso, siguiente paso, reto de cierre y textos ES/EN.
// Puro: sin navegador, sin servidor y sin contenido de pago (los ejercicios de los módulos de pago son de prueba).
import { describe, expect, it } from 'vitest';
import { OUTLINE_MODULES } from '../src/data/vida-diaria/outline';
import type { Exercise } from '../src/types';
import {
  CHALLENGE_TYPES, LEVELS, buildChallenge, currentLevel, guideFor, levelOf, levelProgress, lessonIdOf, moduleAccess, nextActivity,
  type AccessLike, type NextInput,
} from '../src/vida-diaria/levels';
import { MODULE_EN, T, moduleText } from '../src/vida-diaria/i18n';
import { lessonPhraseList, lessonPhrases } from '../src/vida-diaria/practice';

const SAMPLE = '01-presentaciones';
const ids = OUTLINE_MODULES.map((m) => m.id);
const input = (done: string[], access: AccessLike | null, challenges: number[] = []): NextInput => ({
  isDone: (id) => done.includes(id),
  accessOf: (id) => moduleAccess(id, SAMPLE, access),
  challengeDone: (no) => challenges.includes(no),
});
const ACTIVE: AccessLike = { kind: 'status', active: true, status: 'active' };

describe('niveles', () => {
  it('los 12 módulos están en un solo nivel, en tres niveles de 4, y los IDs no cambian', () => {
    expect(LEVELS.map((l) => l.no)).toEqual([1, 2, 3]);
    expect(LEVELS.flatMap((l) => [...l.modules]).sort()).toEqual([...ids].sort());
    for (const l of LEVELS) expect(l.modules).toHaveLength(4);
    expect(ids.map(lessonIdOf)).toEqual(OUTLINE_MODULES.map((m) => m.lessons[0].id));
  });

  it('asigna cada situación del encargo a su nivel', () => {
    for (const id of ['01-presentaciones', '02-compras', '03-transporte']) expect(levelOf(id)).toBe(1); // presentarte, precio, cómo llegar
    for (const id of ['04-vivienda', '05-salud', '06-empleo']) expect(levelOf(id)).toBe(2); // avería, cita, entrevista
    for (const id of ['07-trabajo', '08-llamadas', '12-opiniones']) expect(levelOf(id)).toBe(3); // malentendido, llamada, opinión
  });

  it('el historial de la captura: Presentaciones completado = 1 de 12 (8 %), nivel 1 = 1 de 4', () => {
    const done = ['01-presentaciones'];
    expect(OUTLINE_MODULES.filter((m) => done.includes(m.id)).length).toBe(1);
    expect(Math.round((1 / OUTLINE_MODULES.length) * 100)).toBe(8);
    expect(levelProgress(1, input(done, null).isDone)).toEqual({ done: 1, total: 4, percent: 25, complete: false });
    expect(levelProgress(2, input(done, null).isDone).done).toBe(0);
  });
});

describe('motivo real del bloqueo', () => {
  it('Presentaciones es gratis para cualquiera, incluso sin respuesta del servidor', () => {
    for (const a of [null, { kind: 'offline' }, { kind: 'signed-out' }, { kind: 'error' }] as Array<AccessLike | null>)
      expect(moduleAccess(SAMPLE, SAMPLE, a)).toEqual({ open: true, reason: 'sample' });
  });

  it('cada estado de acceso da su propio motivo y solo la suscripción activa abre Compras', () => {
    const r = (a: AccessLike | null) => moduleAccess('02-compras', SAMPLE, a);
    expect(r(null)).toEqual({ open: false, reason: 'checking' });
    expect(r({ kind: 'offline' })).toEqual({ open: false, reason: 'not-enabled' });
    expect(r({ kind: 'signed-out' })).toEqual({ open: false, reason: 'signed-out' });
    expect(r({ kind: 'error' })).toEqual({ open: false, reason: 'error' });
    expect(r({ kind: 'status', active: false, status: 'none' })).toEqual({ open: false, reason: 'no-access' });
    expect(r({ kind: 'status', active: false, status: 'expired' })).toEqual({ open: false, reason: 'expired' });
    expect(r({ kind: 'status', active: false, status: 'pending' })).toEqual({ open: false, reason: 'pending' });
    expect(r({ kind: 'status', active: false, status: 'past_due' })).toEqual({ open: false, reason: 'payment-due' });
    expect(r(ACTIVE)).toEqual({ open: true, reason: 'included' });
  });

  it('el acceso nunca depende del progreso ni del nivel: terminar Presentaciones no abre Compras', () => {
    expect(moduleAccess('02-compras', SAMPLE, { kind: 'signed-out' }).open).toBe(false);
    expect(nextActivity(1, input([SAMPLE], { kind: 'signed-out' }))).toEqual({ kind: 'blocked', id: '02-compras', reason: 'signed-out' });
  });

  it('hay texto ES y EN para cada motivo', () => {
    const reasons = ['sample', 'included', 'checking', 'not-enabled', 'signed-out', 'pending', 'payment-due', 'expired', 'no-access', 'error'] as const;
    for (const lang of ['es', 'en'] as const) for (const k of reasons) {
      expect(T[lang].reasonShort[k]).toBeTruthy();
      expect(T[lang].reasonLong[k]).toBeTruthy();
    }
  });
});

describe('siguiente paso y Continuar', () => {
  it('visitante con Presentaciones hecha: el siguiente paso es Compras y dice por qué no se abre', () => {
    const a = nextActivity(1, input([SAMPLE], { kind: 'signed-out' }));
    expect(a).toEqual({ kind: 'blocked', id: '02-compras', reason: 'signed-out' });
  });

  it('cuenta de prueba con acceso: Continuar lleva al primer módulo sin hacer del nivel, en orden', () => {
    expect(nextActivity(1, input([SAMPLE], ACTIVE))).toEqual({ kind: 'module', id: '02-compras' });
    expect(nextActivity(1, input([SAMPLE, '02-compras'], ACTIVE))).toEqual({ kind: 'module', id: '03-transporte' });
  });

  it('al terminar los 4 módulos del nivel llega el reto; con el reto hecho, el nivel está completo', () => {
    const l1 = LEVELS[0].modules as string[];
    expect(nextActivity(1, input(l1, ACTIVE))).toEqual({ kind: 'challenge', level: 1 });
    expect(nextActivity(1, input(l1, ACTIVE, [1]))).toEqual({ kind: 'level-complete' });
  });

  it('el nivel actual es el primero no completado; con todo hecho no queda ninguno', () => {
    expect(currentLevel(input([SAMPLE], null))).toBe(1);
    const l1 = LEVELS[0].modules as string[];
    expect(currentLevel(input(l1, ACTIVE, [1]))).toBe(2);
    expect(currentLevel(input(ids, ACTIVE, [1, 2, 3]))).toBeNull();
  });
});

describe('reto de cierre', () => {
  const ex = (type: Exercise['type'], tag: string) => ({ type, tag }) as unknown as Exercise;
  const lesson = (tag: string) => ({
    exercises: [ex('explain', tag), ex('multipleChoice', tag), ex('wordBank', tag), ex('listening', tag), ex('fillBlank', tag), ex('typing', tag), ex('speak', tag)],
  });

  it('reutiliza ejercicios de los módulos del nivel, de práctica, y ninguno nuevo', () => {
    const lessons = [lesson('a'), lesson('b'), lesson('c'), lesson('d')];
    for (const no of [1, 2, 3] as const) {
      const out = buildChallenge(no, lessons) as unknown as Array<{ type: string; tag: string }>;
      expect(out).toHaveLength(8);
      expect(out.every((e) => CHALLENGE_TYPES[no].includes(e.type as Exercise['type']))).toBe(true);
      expect(out.map((e) => e.tag).filter((t, i, a) => a.indexOf(t) === i)).toEqual(['a', 'b', 'c', 'd']);
    }
  });

  it('sube de dificultad: reconocer, construir y producir', () => {
    expect(CHALLENGE_TYPES[1]).toEqual(['multipleChoice', 'fillBlank']);
    expect(CHALLENGE_TYPES[2]).toEqual(['wordBank', 'listening']);
    expect(CHALLENGE_TYPES[3]).toEqual(['typing', 'wordBank']);
  });

  it('con un módulo sin ejercicios del tipo, no inventa nada', () => {
    expect(buildChallenge(3, [{ exercises: [] }])).toEqual([]);
  });
});

describe('ayuda según el nivel', () => {
  it('nivel 1 frases abiertas; nivel 2 situación y frases a petición; nivel 3 sin frases ni situación', () => {
    expect(guideFor(1)).toEqual({ phrases: 'open', context: false });
    expect(guideFor(2)).toEqual({ phrases: 'closed', context: true });
    expect(guideFor(3)).toEqual({ phrases: 'hidden', context: false });
  });

  it('las frases guía conservan el inglés tal como se enseña y no se repiten', () => {
    const lesson = {
      id: 'x', title: 'x',
      exercises: [
        { type: 'explain', title: 'a', phrases: [{ en: 'How much is it?', es: '¿Cuánto cuesta?' }, { en: 'How much is it?', es: 'otra' }] },
        { type: 'explain', title: 'b', phrases: [{ en: 'Can I pay by card?', es: '¿Puedo pagar con tarjeta?' }] },
      ],
    } as unknown as Parameters<typeof lessonPhraseList>[0];
    expect(lessonPhraseList(lesson)).toEqual([{ en: 'How much is it?', es: '¿Cuánto cuesta?' }, { en: 'Can I pay by card?', es: '¿Puedo pagar con tarjeta?' }]);
    expect(lessonPhrases(lesson).get('how much is it')).toBe('¿Cuánto cuesta?');
  });
});

describe('ES / EN', () => {
  it('los 12 módulos tienen título, lección y objetivo en inglés', () => {
    for (const m of OUTLINE_MODULES) {
      const en = MODULE_EN[m.id];
      expect(en?.title && en.lesson && en.objective, m.id).toBeTruthy();
    }
    expect(Object.keys(MODULE_EN).sort()).toEqual([...ids].sort());
  });

  it('el título cambia con el idioma de la interfaz y el módulo conserva su ID', () => {
    const compras = OUTLINE_MODULES.find((m) => m.id === '02-compras')!;
    expect(moduleText(compras, 'es')).toMatchObject({ unit: 'Módulo 2', title: 'Compras' });
    expect(moduleText(compras, 'en')).toMatchObject({ unit: 'Module 2', title: 'Shopping' });
  });

  it('cada texto de la interfaz existe en los dos idiomas, con la misma forma', () => {
    const shape = (v: unknown): unknown => (typeof v === 'function' ? 'fn' : Array.isArray(v) ? v.map(shape) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x)])) : 'str');
    expect(shape(T.en)).toEqual(shape(T.es));
    const empty = (v: unknown): boolean => (typeof v === 'string' ? v.trim() === '' : Array.isArray(v) ? v.some(empty) : v && typeof v === 'object' ? Object.values(v).some(empty) : false);
    expect(empty(T.es)).toBe(false);
    expect(empty(T.en)).toBe(false);
  });
});
