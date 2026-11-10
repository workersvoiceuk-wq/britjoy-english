// «Inglés para el día a día»: three visible levels over the same 12 modules (pure; tested in
// tests/vida-diaria-levels.test.ts). Module IDs, lesson IDs (dia-NN-slug) and routes are unchanged, so saved progress
// keeps working: a level is only a grouping and a recommended order. Nothing here grants or removes access.
import type { Exercise } from '../types';
import { isPractice } from './practice';

export type LevelNo = 1 | 2 | 3;

export interface LevelDef { no: LevelNo; modules: readonly string[] }

/**
 * Assignment by situation and by the length of the phrases and answers each module teaches (the private lessons all
 * share one exercise structure, so phrase length is the measurable difference):
 * 1 · First steps: introductions, prices, directions, small talk (shortest phrases).
 * 2 · Solving situations: a fault at home, a health appointment, an interview, public services.
 * 3 · More autonomy: a misunderstanding at work, calls and e-mails, school meetings, opinions (longest phrases).
 */
export const LEVELS: readonly LevelDef[] = [
  { no: 1, modules: ['01-presentaciones', '02-compras', '03-transporte', '11-social'] },
  { no: 2, modules: ['04-vivienda', '05-salud', '06-empleo', '10-servicios'] },
  { no: 3, modules: ['07-trabajo', '08-llamadas', '09-colegio', '12-opiniones'] },
];

/** Lesson IDs are `dia-` + module ID (dia-01-presentaciones …), exactly as stored in the progress store. */
export const lessonIdOf = (moduleId: string) => `dia-${moduleId}`;

export const levelOf = (moduleId: string): LevelNo | null => LEVELS.find((l) => l.modules.includes(moduleId))?.no ?? null;

export const levelDef = (no: LevelNo): LevelDef => LEVELS.find((l) => l.no === no)!;

export interface LevelProgress { done: number; total: number; percent: number; complete: boolean }

export function levelProgress(no: LevelNo, isDone: (moduleId: string) => boolean): LevelProgress {
  const modules = levelDef(no).modules;
  const done = modules.filter(isDone).length;
  return { done, total: modules.length, percent: Math.round((done / modules.length) * 100), complete: done === modules.length };
}

// ── Access: why a module is (not) open ─────────────────────────────────────────────────────────────────────────────

/** Structural subset of AccessView (api.ts), kept here so this file stays free of browser and network imports. */
export type AccessLike =
  | { kind: 'offline' }
  | { kind: 'signed-out' }
  | { kind: 'error' }
  | { kind: 'status'; active: boolean; status: string };

export type AccessReason =
  | 'sample' // module 1: free, no account, no card
  | 'included' // the learner's subscription is active
  | 'checking' // the server has not answered yet
  | 'not-enabled' // this build has no course server: paid content is not enabled yet
  | 'signed-out' // a session is required
  | 'pending' // payment received, waiting for the confirmation
  | 'payment-due' // renewal not paid
  | 'expired' // subscription ended
  | 'no-access' // signed in without an active subscription
  | 'error'; // the server could not be asked

export interface ModuleAccess { open: boolean; reason: AccessReason }

export function moduleAccess(moduleId: string, sampleId: string, access: AccessLike | null): ModuleAccess {
  if (moduleId === sampleId) return { open: true, reason: 'sample' };
  if (access === null) return { open: false, reason: 'checking' };
  switch (access.kind) {
    case 'offline':
      return { open: false, reason: 'not-enabled' };
    case 'signed-out':
      return { open: false, reason: 'signed-out' };
    case 'error':
      return { open: false, reason: 'error' };
    case 'status':
      if (access.active) return { open: true, reason: 'included' };
      if (access.status === 'pending') return { open: false, reason: 'pending' };
      if (access.status === 'past_due') return { open: false, reason: 'payment-due' };
      if (access.status === 'expired') return { open: false, reason: 'expired' };
      return { open: false, reason: 'no-access' };
  }
}

// ── What to do next ────────────────────────────────────────────────────────────────────────────────────────────────

export type Activity =
  | { kind: 'module'; id: string }
  | { kind: 'blocked'; id: string; reason: AccessReason }
  | { kind: 'challenge'; level: LevelNo }
  | { kind: 'level-complete' };

export interface NextInput {
  isDone: (moduleId: string) => boolean;
  accessOf: (moduleId: string) => ModuleAccess;
  challengeDone: (no: LevelNo) => boolean;
}

/** The next available activity of one level: first unfinished module, then the closing challenge. */
export function nextActivity(no: LevelNo, input: NextInput): Activity {
  for (const id of levelDef(no).modules) {
    if (input.isDone(id)) continue;
    const a = input.accessOf(id);
    return a.open ? { kind: 'module', id } : { kind: 'blocked', id, reason: a.reason };
  }
  return input.challengeDone(no) ? { kind: 'level-complete' } : { kind: 'challenge', level: no };
}

/** The level to work on now: the first one whose activities are not all complete. */
export function currentLevel(input: NextInput): LevelNo | null {
  for (const l of LEVELS) if (nextActivity(l.no, input).kind !== 'level-complete') return l.no;
  return null;
}

// ── Closing challenge ──────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The challenge reuses exercises the learner already did in the level's modules (no new lesson text), so it can only
 * be built from lessons the server has served: a paid module that is not served simply cannot be part of it.
 * Level 1 mixes recognition (choice, gap); level 2 builds and listens; level 3 asks for production (typing, building).
 */
export const CHALLENGE_TYPES: Record<LevelNo, readonly Exercise['type'][]> = {
  1: ['multipleChoice', 'fillBlank'],
  2: ['wordBank', 'listening'],
  3: ['typing', 'wordBank'],
};

export function buildChallenge(no: LevelNo, lessons: ReadonlyArray<{ exercises: readonly Exercise[] }>): Exercise[] {
  const out: Exercise[] = [];
  for (const lesson of lessons) {
    for (const type of CHALLENGE_TYPES[no]) {
      const hit = lesson.exercises.find((e) => e.type === type && isPractice(e));
      if (hit) out.push(hit);
    }
  }
  return out;
}

/** Guide panel by level: 1 = phrases open, 2 = situation shown and phrases on request, 3 = neither. */
export const guideFor = (no: LevelNo | null): { phrases: 'open' | 'closed' | 'hidden'; context: boolean } =>
  no === 1 ? { phrases: 'open', context: false } : no === 2 ? { phrases: 'closed', context: true } : { phrases: 'hidden', context: false };
