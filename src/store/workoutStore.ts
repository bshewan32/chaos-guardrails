import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  WorkoutEntry,
  BuiltSession,
  AchievementKey,
  PersonalBests,
  getWeekStart,
  calculateCurrentWeekVolume,
  processWeeklyVolumes,
  getMesocycleAverage,
  getMuscleGroupPriorities,
  getSmartRecommendations,
  getCurrentWeekGrade,
  WeekGrade,
  WeekData,
  MusclePriority,
  ExerciseRecommendation,
  buildSession,
  checkNudge,
  NudgeSuggestion,
  checkFinishWeek,
  FinishWeekPayload,
  calculateStats,
  updatePersonalBests,
  checkNewAchievements,
  AppStats,
} from '../engine';
import { MuscleGroup } from '../data/exercises';

// ─────────────────────────────────────────────────────────────────────────────
// State shape
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkoutStore {
  // ── Persisted ──────────────────────────────────────────────────────────────
  workoutHistory: WorkoutEntry[];
  weekTarget: number; // 5 | 10 | 15
  lastUsedVariantsByExercise: Record<string, string[]>;
  unlockedAchievements: Partial<Record<AchievementKey, boolean>>;
  personalBests: PersonalBests;
  hasOnboarded: boolean;

  // ── Session state (not persisted) ─────────────────────────────────────────
  activeSession: BuiltSession | null;
  sessionProgress: Record<string, boolean>; // exercise name → completed
  sessionStarted: boolean;

  // ── UI state (not persisted) ──────────────────────────────────────────────
  nudgeSuggestions: NudgeSuggestion[];
  nudgeShownThisSession: boolean;
  finishWeekPayload: FinishWeekPayload | null;

  // ── Computed (derived on demand) ──────────────────────────────────────────
  getCurrentWeekStart: () => Date;
  getCurrentWeekVolume: () => Record<MuscleGroup, number>;
  getPriorities: () => MusclePriority[];
  getSmartRecs: () => ExerciseRecommendation[];
  getWeekGrade: () => WeekGrade;
  getWeeklyVolumes: () => WeekData[];
  getStats: () => AppStats;

  // ── Actions ───────────────────────────────────────────────────────────────
  setWeekTarget: (target: number) => void;
  setHasOnboarded: (v: boolean) => void;
  buildNewSession: () => void;
  startSession: () => void;
  clearSession: () => void;
  logWorkout: (exercise: string, variant: string, sets: number) => void;
  dismissNudge: () => void;
  dismissFinishWeek: () => void;
  logQuickFinisher: (exercise: string, variant: string, sets: number) => void;
  exportData: () => string;
  importData: (json: string) => boolean;
  resetWeek: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      // ── Persisted defaults ────────────────────────────────────────────────
      workoutHistory: [],
      weekTarget: 10,
      lastUsedVariantsByExercise: {},
      unlockedAchievements: {},
      personalBests: {},
      hasOnboarded: false,

      // ── Session state ─────────────────────────────────────────────────────
      activeSession: null,
      sessionProgress: {},
      sessionStarted: false,

      // ── UI state ──────────────────────────────────────────────────────────
      nudgeSuggestions: [],
      nudgeShownThisSession: false,
      finishWeekPayload: null,

      // ── Computed ──────────────────────────────────────────────────────────
      getCurrentWeekStart: () => getWeekStart(new Date()),

      getCurrentWeekVolume: () => {
        const { workoutHistory } = get();
        return calculateCurrentWeekVolume(workoutHistory, getWeekStart(new Date()));
      },

      getPriorities: () => {
        const { workoutHistory, weekTarget } = get();
        return getMuscleGroupPriorities(workoutHistory, getWeekStart(new Date()), weekTarget);
      },

      getSmartRecs: () => {
        const { workoutHistory, weekTarget } = get();
        return getSmartRecommendations(workoutHistory, getWeekStart(new Date()), weekTarget);
      },

      getWeekGrade: () => {
        const { workoutHistory, weekTarget } = get();
        return getCurrentWeekGrade(workoutHistory, getWeekStart(new Date()), weekTarget);
      },

      getWeeklyVolumes: () => {
        const { workoutHistory, weekTarget } = get();
        return processWeeklyVolumes(workoutHistory, weekTarget);
      },

      getStats: () => {
        const { workoutHistory, weekTarget } = get();
        const weeklyVolumes = processWeeklyVolumes(workoutHistory, weekTarget);
        return calculateStats(
          workoutHistory,
          weeklyVolumes,
          getWeekStart(new Date()).toISOString(),
          weekTarget,
        );
      },

      // ── Actions ───────────────────────────────────────────────────────────
      setWeekTarget: (target) => set({ weekTarget: target }),

      setHasOnboarded: (v) => set({ hasOnboarded: v }),

      buildNewSession: () => {
        const { workoutHistory, weekTarget, lastUsedVariantsByExercise } = get();
        const session = buildSession(
          workoutHistory,
          getWeekStart(new Date()),
          weekTarget,
          lastUsedVariantsByExercise,
        );
        set({
          activeSession: session,
          sessionProgress: {},
          sessionStarted: false,
          nudgeSuggestions: [],
          nudgeShownThisSession: false,
          finishWeekPayload: null,
        });
      },

      startSession: () => set({ sessionStarted: true }),

      clearSession: () =>
        set({
          activeSession: null,
          sessionProgress: {},
          sessionStarted: false,
          nudgeSuggestions: [],
          nudgeShownThisSession: false,
          finishWeekPayload: null,
        }),

      logWorkout: (exercise, variant, sets) => {
        const state = get();
        const entry: WorkoutEntry = {
          id: Date.now(),
          exercise,
          variant,
          sets,
          date: new Date().toISOString(),
        };

        const newHistory = [...state.workoutHistory, entry];

        // Update variant history (keep last 5)
        const variantHistory = state.lastUsedVariantsByExercise[exercise] || [];
        const updatedVariantHistory = [...variantHistory.slice(-4), variant];

        // Update session progress
        let updatedProgress = { ...state.sessionProgress, [exercise]: true };
        let sessionCompleted = false;

        if (state.activeSession) {
          const allExercises = state.activeSession.exercises.map((e) => e.exercise);
          sessionCompleted = allExercises.every((ex) => updatedProgress[ex]);
        }

        // Check nudge (only once per session)
        let nudgeSuggestions: NudgeSuggestion[] = state.nudgeSuggestions;
        if (!state.nudgeShownThisSession && !sessionCompleted) {
          const suggestions = checkNudge(newHistory, getWeekStart(new Date()), state.weekTarget);
          if (suggestions.length > 0) {
            nudgeSuggestions = suggestions;
          }
        }

        // Check finish week — only at session completion.
        // The card is self-contained once mounted: it tracks logged muscles
        // in local React state and never re-reads from the store.
        // We must NOT clear or re-evaluate finishWeekPayload after the card
        // is showing, or it would unmount and remount (losing local state).
        let finishWeekPayload: FinishWeekPayload | null = state.finishWeekPayload;
        if (sessionCompleted && !state.finishWeekPayload) {
          // First time: run the check and show the card if warranted
          const freshPayload = checkFinishWeek(
            newHistory,
            getWeekStart(new Date()),
            state.weekTarget,
          );
          finishWeekPayload = freshPayload.shouldShow ? freshPayload : null;
        }
        // If the card is already showing (finishWeekPayload !== null), leave it
        // alone — the card component manages its own state from here.

        // Update personal bests
        const weeklyVolumes = processWeeklyVolumes(newHistory, state.weekTarget);
        const newPersonalBests = updatePersonalBests(state.personalBests, weeklyVolumes);

        // Check achievements
        const stats = calculateStats(
          newHistory,
          weeklyVolumes,
          getWeekStart(new Date()).toISOString(),
          state.weekTarget,
        );
        const newlyUnlocked = checkNewAchievements(stats, state.unlockedAchievements);
        const updatedAchievements = { ...state.unlockedAchievements };
        newlyUnlocked.forEach((key) => (updatedAchievements[key] = true));

        set({
          workoutHistory: newHistory,
          lastUsedVariantsByExercise: {
            ...state.lastUsedVariantsByExercise,
            [exercise]: updatedVariantHistory,
          },
          sessionProgress: updatedProgress,
          nudgeSuggestions,
          nudgeShownThisSession: nudgeSuggestions.length > 0 ? true : state.nudgeShownThisSession,
          finishWeekPayload,
          personalBests: newPersonalBests,
          unlockedAchievements: updatedAchievements,
        });
      },

      logQuickFinisher: (exercise, variant, sets) => {
        // Log the workout — this will re-evaluate finishWeekPayload inside logWorkout
        // (sessionCompleted will be false here since this is a finisher, not a main exercise)
        // We only clear nudgeSuggestions; finishWeekPayload is managed by the UI
        // so the card stays open until all finishers are logged or user dismisses.
        get().logWorkout(exercise, variant, sets);
        set({ nudgeSuggestions: [] });
      },

      dismissNudge: () => set({ nudgeSuggestions: [], nudgeShownThisSession: true }),

      dismissFinishWeek: () => set({ finishWeekPayload: null }),

      exportData: () => {
        const { workoutHistory, weekTarget, personalBests, unlockedAchievements } = get();
        return JSON.stringify(
          { workoutHistory, weekTarget, personalBests, unlockedAchievements },
          null,
          2,
        );
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json);
          if (data.workoutHistory) set({ workoutHistory: data.workoutHistory });
          if (data.weekTarget) set({ weekTarget: data.weekTarget });
          if (data.personalBests) set({ personalBests: data.personalBests });
          if (data.unlockedAchievements) set({ unlockedAchievements: data.unlockedAchievements });
          return true;
        } catch {
          return false;
        }
      },

      resetWeek: () => {
        const { workoutHistory } = get();
        const weekStart = getWeekStart(new Date());
        const end = new Date(weekStart);
        end.setDate(end.getDate() + 7);
        const filtered = workoutHistory.filter((w) => {
          const d = new Date(w.date);
          return !(d >= weekStart && d < end);
        });
        set({ workoutHistory: filtered });
      },
    }),
    {
      name: 'chaos-guardrails-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        workoutHistory: state.workoutHistory,
        weekTarget: state.weekTarget,
        lastUsedVariantsByExercise: state.lastUsedVariantsByExercise,
        unlockedAchievements: state.unlockedAchievements,
        personalBests: state.personalBests,
        hasOnboarded: state.hasOnboarded,
      }),
    },
  ),
);
