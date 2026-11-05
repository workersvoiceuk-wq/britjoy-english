import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { LevelId } from '../types';
import {
  MAX_HEARTS,
  nextStreak,
  regenerateHearts,
  toDateKey,
} from '../logic/gamification';
import { hasPlus } from '../lib/backend';
import { grade, type ReviewState } from '../logic/review';
import type { StudyPlan } from '../logic/plan';

export interface LessonRecord {
  stars: 1 | 2 | 3;
  bestXp: number;
  completedAt: number;
}

export interface LevelProgress {
  completedLessons: Record<string, LessonRecord>;
  xp: number;
}

export interface ProgressState {
  /** null until the placement quiz is taken or skipped. */
  placementDone: boolean;
  placementLevel: LevelId | null;
  currentLevel: LevelId;
  levels: Record<LevelId, LevelProgress>;
  xp: number;
  hearts: number;
  /** Timestamp from which the next heart regenerates. */
  heartsSince: number;
  streak: number;
  lastActiveDate: string | null;
  /** Britjoy reads instructions and explanations aloud. */
  voiceOn: boolean;
  /** Sound effects (chimes, correct/wrong). */
  soundOn: boolean;
  /** Section open in the bottom navigation. */
  tab: AppTab;
  /** Interface language chosen by the learner ("I speak…"); null until chosen. */
  uiLang: string | null;
  /** Daily XP goal (Duolingo-style): 10 casual, 20 regular, 30 serious, 50 intense. */
  dailyGoal: number;
  /** XP earned per calendar day (YYYY-MM-DD), kept for the last few weeks. */
  xpByDay: Record<string, number>;
  /** Name printed on course certificates. */
  learnerName: string;
  /** Study plan (goal, days, minutes a day); null until the learner creates one. */
  plan: StudyPlan | null;
  /** Smart review: spaced-repetition state of each word or phrase. */
  review: Record<string, ReviewState>;

  completePlacement: (level: LevelId | null) => void;
  setCurrentLevel: (level: LevelId) => void;
  loseHeart: (now?: number) => void;
  syncHearts: (now?: number) => void;
  completeLesson: (args: { level: LevelId; lessonId: string; xp: number; stars: 1 | 2 | 3; now?: number }) => void;
  reset: () => void;
  setVoiceOn: (on: boolean) => void;
  setSoundOn: (on: boolean) => void;
  setTab: (tab: AppTab) => void;
  setUiLang: (lang: string) => void;
  setDailyGoal: (xp: number) => void;
  setLearnerName: (name: string) => void;
  setPlan: (plan: StudyPlan | null) => void;
  answerReview: (id: string, correct: boolean, now?: number) => void;
}

export type AppTab = 'home' | 'english' | 'life' | 'ai' | 'resources' | 'settings' | 'plus' | 'plan' | 'review';

export const STORAGE_KEY = 'britjoy-english-progress-v1';

const emptyLevel = (): LevelProgress => ({ completedLessons: {}, xp: 0 });

const initialState = () => ({
  placementDone: false,
  placementLevel: null as LevelId | null,
  currentLevel: 'A1' as LevelId,
  levels: {} as Record<LevelId, LevelProgress>,
  xp: 0,
  hearts: MAX_HEARTS,
  heartsSince: Date.now(),
  streak: 0,
  lastActiveDate: null as string | null,
  voiceOn: true,
  soundOn: true,
  tab: 'home' as AppTab,
  uiLang: null as string | null,
  dailyGoal: 20,
  xpByDay: {} as Record<string, number>,
  learnerName: '',
  plan: null as StudyPlan | null,
  review: {} as Record<string, ReviewState>,
});

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...initialState(),

      completePlacement: (level) =>
        set({
          placementDone: true,
          placementLevel: level,
          currentLevel: level ?? get().currentLevel,
          tab: 'english',
        }),

      setCurrentLevel: (level) => set({ currentLevel: level }),

      syncHearts: (now = Date.now()) => {
        const { hearts, heartsSince } = get();
        const next = regenerateHearts(hearts, heartsSince, now);
        if (next.hearts !== hearts || next.since !== heartsSince) {
          set({ hearts: next.hearts, heartsSince: next.since });
        }
      },

      loseHeart: (now = Date.now()) => {
        if (hasPlus()) return; // VUM Academy: unlimited hearts
        get().syncHearts(now);
        const { hearts, heartsSince } = get();
        if (hearts <= 0) return;
        // When dropping from full, the regeneration clock starts now.
        set({ hearts: hearts - 1, heartsSince: hearts >= MAX_HEARTS ? now : heartsSince });
      },

      completeLesson: ({ level, lessonId, xp, stars, now = Date.now() }) => {
        const state = get();
        const levelProgress = state.levels[level] ?? emptyLevel();
        const previous = levelProgress.completedLessons[lessonId];
        const record: LessonRecord = {
          stars: previous ? (Math.max(previous.stars, stars) as 1 | 2 | 3) : stars,
          bestXp: Math.max(previous?.bestXp ?? 0, xp),
          completedAt: now,
        };
        const today = toDateKey(new Date(now));
        // Keep about five weeks of daily XP for the daily goal and streak calendar.
        const xpByDay = Object.fromEntries(
          Object.entries({ ...state.xpByDay, [today]: (state.xpByDay[today] ?? 0) + xp })
            .sort(([a], [b]) => (a < b ? 1 : -1))
            .slice(0, 35),
        );
        set({
          xpByDay,
          xp: state.xp + xp,
          streak: nextStreak(state.streak, state.lastActiveDate, today),
          lastActiveDate: today,
          levels: {
            ...state.levels,
            [level]: {
              xp: levelProgress.xp + xp,
              completedLessons: { ...levelProgress.completedLessons, [lessonId]: record },
            },
          },
        });
      },

      reset: () => set(initialState()),
      setVoiceOn: (on) => set({ voiceOn: on }),
      setSoundOn: (on) => set({ soundOn: on }),
      setTab: (tab) => set({ tab }),
      setUiLang: (lang) => set({ uiLang: lang }),
      setDailyGoal: (xp) => set({ dailyGoal: xp }),
      setLearnerName: (name) => set({ learnerName: name.slice(0, 60) }),
      setPlan: (plan) => set({ plan }),
      answerReview: (id, correct, now = Date.now()) =>
        set((s) => ({ review: { ...s.review, [id]: grade(s.review[id], correct, now) } })),
    }),
    {
      name: STORAGE_KEY,
      version: 4,
      // v1 → v2 added voice/sound settings and the open tab; v2 → v3 adds the interface
      // language (existing learners keep Spanish), daily goal, daily XP and name;
      // v3 → v4 adds the study plan and smart review.
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as Partial<ProgressState>;
        return {
          voiceOn: true,
          soundOn: true,
          tab: 'english',
          dailyGoal: 20,
          xpByDay: {},
          learnerName: '',
          plan: null,
          review: {},
          ...p,
          uiLang: p.uiLang ?? (version < 3 && p.placementDone ? 'es' : null),
        } as ProgressState;
      },
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        placementDone: s.placementDone,
        placementLevel: s.placementLevel,
        currentLevel: s.currentLevel,
        levels: s.levels,
        xp: s.xp,
        hearts: s.hearts,
        heartsSince: s.heartsSince,
        streak: s.streak,
        lastActiveDate: s.lastActiveDate,
        voiceOn: s.voiceOn,
        soundOn: s.soundOn,
        tab: s.tab,
        uiLang: s.uiLang,
        dailyGoal: s.dailyGoal,
        xpByDay: s.xpByDay,
        learnerName: s.learnerName,
        plan: s.plan,
        review: s.review,
      }),
    },
  ),
);

/** Completed lessons per level, in the shape the unlock rules expect. */
export function completedByLevel(levels: Record<LevelId, LevelProgress>): Record<LevelId, Record<string, LessonRecord>> {
  return Object.fromEntries(Object.entries(levels).map(([id, p]) => [id, p.completedLessons]));
}
