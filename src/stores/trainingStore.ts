/**
 * Training Plan Store, Zustand
 * PRD-03: manages plan state, exercise completion, day/week progression.
 *
 * Local-first: all state in Zustand + AsyncStorage.
 * Sync-aware: exposes _syncMeta and _mergeTraining for the sync layer.
 * The sync layer (trainingSync.ts) subscribes via useTrainingSync hook,
 * NOT via imports in this file (avoids circular deps).
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  TrainingPlan,
  PlanWeek,
  PlanDay,
  PlanExercise,
  ExerciseCompletion,
  ExerciseStatus,
} from "@/types/training";
import { generateTrainingPlan } from "@/lib/planGenerator";
import {
  adaptPlanForRating,
  adaptPlanForWeekCompletion,
  type AdaptationEvent,
} from "@/lib/planAdaptation";
import { getAllExercises } from "@/data/exerciseData";

// ──────────────────────────────────────────────
// Sync Metadata (transient, not persisted)
// ──────────────────────────────────────────────

export type TrainingSyncStatus = "idle" | "syncing" | "error";

export interface TrainingSyncMeta {
  status: TrainingSyncStatus;
  lastSyncedAt: string | null;
  pendingCount: number;
}

const DEFAULT_SYNC_META: TrainingSyncMeta = {
  status: "idle",
  lastSyncedAt: null,
  pendingCount: 0,
};

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface TrainingState {
  /** The generated training plan (null before onboarding) */
  plan: TrainingPlan | null;
  /** Exercise completion history */
  completions: ExerciseCompletion[];
  /** Total XP earned from training */
  totalXp: number;
  /** Current streak (consecutive days with completions) */
  streak: number;
  /** Last completion date (ISO string, for streak calc) */
  lastCompletionDate: string | null;
  /** Log of all plan adaptation events (persisted) */
  adaptationLog: AdaptationEvent[];
  /** ISO date (YYYY-MM-DD) of last adaptation, null if never adapted (persisted) */
  lastAdaptedAt: string | null;
  /** Sync metadata (transient, not persisted to AsyncStorage) */
  _syncMeta: TrainingSyncMeta;

  // ─── Actions ───
  /** Generate a new plan from onboarding data */
  generatePlan: (input: {
    dogId: string;
    dogName: string;
    breed: string | null;
    ageWeeks: number;
    challenges: string[];
    customChallenges?: string[];
    experience: "first_time" | "some_experience" | "experienced" | null;
  }) => void;

  /** Get today's exercises */
  getTodayExercises: () => PlanExercise[];

  /** Get the current (active) week */
  getCurrentWeek: () => PlanWeek | null;

  /** Get the current day within the active week */
  getCurrentDay: () => PlanDay | null;

  /** Mark an exercise as complete */
  completeExercise: (planExerciseId: string, rating?: number) => number;

  /** Mark an exercise as needing more practice */
  markNeedsPractice: (planExerciseId: string) => void;

  /** Skip an exercise */
  skipExercise: (planExerciseId: string) => void;

  /** Advance to next day (called after completing daily exercises) */
  advanceDay: () => void;

  /** Get completion percentage for a week */
  getWeekProgress: (weekNumber: number) => number;

  /** Get total exercises completed */
  getTotalCompleted: () => number;

  /** Rate a completed exercise (called from CompletionModal after completion) */
  rateExercise: (planExerciseId: string, rating: number) => void;

  /** Reschedule an exercise for practice on a future day (low rating or manual) */
  rescheduleForPractice: (planExerciseId: string) => void;

  /** Reset plan (for testing / re-onboarding) */
  resetPlan: () => void;

  /**
   * Assess week completion and adapt the next week accordingly.
   * Called automatically from advanceDay when transitioning to a new week.
   */
  assessWeekCompletion: (weekNumber: number) => void;

  // ── Sync-layer actions (prefixed with _ to indicate internal use) ──

  /** Update sync metadata (called by trainingSync.ts) */
  _setSyncMeta: (updates: Partial<TrainingSyncMeta>) => void;

  /**
   * Merge training data from sync.
   * Replaces plan, completions, and gamification state.
   * Called by trainingSync.ts during pull phase.
   */
  _mergeTraining: (data: {
    plan: TrainingPlan | null;
    completions: ExerciseCompletion[];
    totalXp: number;
    streak: number;
    lastCompletionDate: string | null;
  }) => void;
}

// ──────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────

export const useTrainingStore = create<TrainingState>()(
  persist(
    (set, get) => ({
      plan: null,
      completions: [],
      totalXp: 0,
      streak: 0,
      lastCompletionDate: null,
      adaptationLog: [],
      lastAdaptedAt: null,
      _syncMeta: { ...DEFAULT_SYNC_META },

      generatePlan: (input) => {
        const plan = generateTrainingPlan(input);
        // Make the first day's exercises available
        if (plan.weeks[0]?.days[0]) {
          plan.weeks[0].days[0].status = "available";
          for (const ex of plan.weeks[0].days[0].exercises) {
            ex.status = "available";
          }
        }
        set({ plan, completions: [], totalXp: 0, streak: 0 });
      },

      getTodayExercises: () => {
        const { plan } = get();
        if (!plan) return [];
        const week = plan.weeks.find((w) => w.weekNumber === plan.currentWeek);
        if (!week) return [];
        const day = week.days.find((d) => d.dayNumber === plan.currentDay);
        if (!day) return [];
        return day.exercises;
      },

      getCurrentWeek: () => {
        const { plan } = get();
        if (!plan) return null;
        return plan.weeks.find((w) => w.weekNumber === plan.currentWeek) ?? null;
      },

      getCurrentDay: () => {
        const { plan } = get();
        if (!plan) return null;
        const week = plan.weeks.find((w) => w.weekNumber === plan.currentWeek);
        if (!week) return null;
        return week.days.find((d) => d.dayNumber === plan.currentDay) ?? null;
      },

      completeExercise: (planExerciseId, rating) => {
        const { plan } = get();
        if (!plan) return 0;

        // Guard: prevent duplicate completion (re-completing awards no XP)
        const alreadyCompleted = plan.weeks.some((w) =>
          w.days.some((d) =>
            d.exercises.some(
              (ex) => ex.id === planExerciseId && ex.status === "completed"
            )
          )
        );
        if (alreadyCompleted) return 0;

        let xpEarned = 0;

        // Find the exercise across all weeks/days
        const updatedWeeks = plan.weeks.map((week) => ({
          ...week,
          days: week.days.map((day) => ({
            ...day,
            exercises: day.exercises.map((ex) => {
              if (ex.id !== planExerciseId) return ex;
              // Determine XP based on exercise type
              xpEarned = ex.type === "trick_bonus" ? 20 : 15;
              return {
                ...ex,
                status: "completed" as ExerciseStatus,
                completedAt: new Date().toISOString(),
                userRating: rating ?? null,
                xpEarned,
              };
            }),
          })),
        }));

        const today = new Date().toISOString().split("T")[0];
        const lastDate = get().lastCompletionDate;
        const yesterday = new Date(Date.now() - 86400000)
          .toISOString()
          .split("T")[0];

        const newStreak =
          lastDate === yesterday
            ? get().streak + 1
            : lastDate === today
              ? get().streak
              : 1;

        const completion: ExerciseCompletion = {
          id: `comp-${Date.now()}`,
          exerciseId: planExerciseId,
          planExerciseId,
          completedAt: new Date().toISOString(),
          rating: rating ?? null,
          xpEarned,
          timeSpentSeconds: null,
        };

        set({
          plan: { ...plan, weeks: updatedWeeks },
          completions: [...get().completions, completion],
          totalXp: get().totalXp + xpEarned,
          streak: newStreak,
          lastCompletionDate: today,
        });

        return xpEarned;
      },

      markNeedsPractice: (planExerciseId) => {
        const { plan } = get();
        if (!plan) return;

        const updatedWeeks = plan.weeks.map((week) => ({
          ...week,
          days: week.days.map((day) => ({
            ...day,
            exercises: day.exercises.map((ex) =>
              ex.id === planExerciseId
                ? { ...ex, status: "needs_practice" as ExerciseStatus }
                : ex
            ),
          })),
        }));

        set({ plan: { ...plan, weeks: updatedWeeks } });
      },

      skipExercise: (planExerciseId) => {
        const { plan } = get();
        if (!plan) return;

        const updatedWeeks = plan.weeks.map((week) => ({
          ...week,
          days: week.days.map((day) => ({
            ...day,
            exercises: day.exercises.map((ex) =>
              ex.id === planExerciseId
                ? { ...ex, status: "skipped" as ExerciseStatus }
                : ex
            ),
          })),
        }));

        set({ plan: { ...plan, weeks: updatedWeeks } });
      },

      advanceDay: () => {
        const { plan } = get();
        if (!plan) return;

        const currentWeek = plan.weeks.find(
          (w) => w.weekNumber === plan.currentWeek
        );
        if (!currentWeek) return;

        const maxDay = currentWeek.days.length;
        let nextDay = plan.currentDay + 1;
        let nextWeek = plan.currentWeek;

        if (nextDay > maxDay) {
          // Move to next week
          nextDay = 1;
          nextWeek = plan.currentWeek + 1;

          if (nextWeek > plan.totalWeeks) {
            // Plan complete!
            set({
              plan: {
                ...plan,
                status: "completed",
                weeks: plan.weeks.map((w) =>
                  w.weekNumber === plan.currentWeek
                    ? { ...w, status: "completed", completedAt: new Date().toISOString() }
                    : w
                ),
              },
            });
            return;
          }

          // Week completed — run adaptation assessment before advancing
          // We call this after set() so the completed week state is visible
          // Note: assessWeekCompletion reads from get() so we schedule it after state update
          const completingWeek = plan.currentWeek;
          // We'll trigger it at the end of this action after the state is updated
          setTimeout(() => get().assessWeekCompletion(completingWeek), 0);
        }

        // Update week statuses and make next day's exercises available
        const updatedWeeks = plan.weeks.map((week) => {
          if (week.weekNumber === plan.currentWeek && nextWeek > plan.currentWeek) {
            return { ...week, status: "completed" as const, completedAt: new Date().toISOString() };
          }
          if (week.weekNumber === nextWeek) {
            const updatedDays = week.days.map((day) => {
              if (day.dayNumber === nextDay) {
                return {
                  ...day,
                  status: "available" as const,
                  exercises: day.exercises.map((ex) => ({
                    ...ex,
                    status: "available" as ExerciseStatus,
                  })),
                };
              }
              return day;
            });
            return {
              ...week,
              days: updatedDays,
              status: "active" as const,
              startedAt: week.startedAt ?? new Date().toISOString(),
            };
          }
          return week;
        });

        set({
          plan: {
            ...plan,
            currentWeek: nextWeek,
            currentDay: nextDay,
            weeks: updatedWeeks,
          },
        });
      },

      getWeekProgress: (weekNumber) => {
        const { plan } = get();
        if (!plan) return 0;
        const week = plan.weeks.find((w) => w.weekNumber === weekNumber);
        if (!week) return 0;
        const totalExercises = week.days.reduce(
          (sum, d) => sum + d.exercises.length,
          0
        );
        if (totalExercises === 0) return 0;
        const completed = week.days.reduce(
          (sum, d) =>
            sum + d.exercises.filter((e) => e.status === "completed").length,
          0
        );
        return Math.round((completed / totalExercises) * 100);
      },

      getTotalCompleted: () => {
        return get().completions.length;
      },

      rateExercise: (planExerciseId, rating) => {
        // PLAN-02: log so plan adaptation can be verified in dev
        console.log('[trainingStore/rateExercise] firing', { planExerciseId, rating });
        const { plan, adaptationLog } = get();
        if (!plan) return;

        // 1. Persist the rating on the plan exercise + completion record
        const ratedWeeks = plan.weeks.map((week) => ({
          ...week,
          days: week.days.map((day) => ({
            ...day,
            exercises: day.exercises.map((ex) =>
              ex.id === planExerciseId ? { ...ex, userRating: rating } : ex
            ),
          })),
        }));

        const updatedCompletions = get().completions.map((c) =>
          c.planExerciseId === planExerciseId ? { ...c, rating } : c
        );

        const ratedPlan: TrainingPlan = { ...plan, weeks: ratedWeeks };

        // 2. PRD-03: low rating (1-2 stars) auto-reschedules for practice
        //    (separate mechanism from adaptation — reschedules the same exercise)
        if (rating <= 2) {
          // Apply reschedule on ratedPlan so we don't lose the rating update
          set({ plan: ratedPlan, completions: updatedCompletions });
          get().rescheduleForPractice(planExerciseId);
        } else {
          set({ plan: ratedPlan, completions: updatedCompletions });
        }

        // 3. Adaptation engine — injects easier/harder variant as appropriate
        const currentPlan = get().plan!;
        const { updatedPlan, event } = adaptPlanForRating(
          currentPlan,
          planExerciseId,
          rating,
          getAllExercises(),
          adaptationLog
        );

        if (event) {
          const today = new Date().toISOString().split("T")[0];
          set({
            plan: { ...updatedPlan, lastAdaptedAt: today },
            adaptationLog: [...adaptationLog, event],
            lastAdaptedAt: today,
          });
        }
      },

      rescheduleForPractice: (planExerciseId) => {
        const { plan } = get();
        if (!plan) return;

        // Find the original exercise
        let originalExercise: PlanExercise | null = null;
        for (const week of plan.weeks) {
          for (const day of week.days) {
            const found = day.exercises.find((e) => e.id === planExerciseId);
            if (found) {
              originalExercise = found;
              break;
            }
          }
          if (originalExercise) break;
        }
        if (!originalExercise) return;

        // Find the next available day to add it to (current day + 1, or next week)
        const currentWeek = plan.weeks.find((w) => w.weekNumber === plan.currentWeek);
        if (!currentWeek) return;

        let targetWeekIdx = plan.weeks.findIndex((w) => w.weekNumber === plan.currentWeek);
        let targetDayIdx = -1;

        // Look for a future day in the current week first
        for (let i = 0; i < currentWeek.days.length; i++) {
          if (currentWeek.days[i].dayNumber > plan.currentDay) {
            targetDayIdx = i;
            break;
          }
        }

        // If no future day in current week, use first day of next week
        if (targetDayIdx === -1 && targetWeekIdx + 1 < plan.weeks.length) {
          targetWeekIdx += 1;
          targetDayIdx = 0;
        }

        if (targetDayIdx === -1) return; // No future day available

        // Clone exercise as a practice re-do
        const practiceExercise: PlanExercise = {
          id: `${originalExercise.exerciseId}-practice-${Date.now()}`,
          exerciseId: originalExercise.exerciseId,
          type: "reinforcement" as const,
          status: "needs_practice" as ExerciseStatus,
          completedAt: null,
          userRating: null,
          xpEarned: null,
        };

        const updatedWeeks = plan.weeks.map((week, wIdx) => {
          if (wIdx !== targetWeekIdx) return week;
          return {
            ...week,
            days: week.days.map((day, dIdx) => {
              if (dIdx !== targetDayIdx) return day;
              return {
                ...day,
                exercises: [...day.exercises, practiceExercise],
              };
            }),
          };
        });

        set({ plan: { ...plan, weeks: updatedWeeks } });
      },

      assessWeekCompletion: (weekNumber) => {
        const { plan, adaptationLog } = get();
        if (!plan) return;

        const { updatedPlan, event } = adaptPlanForWeekCompletion(
          plan,
          weekNumber,
          getAllExercises(),
          adaptationLog
        );

        if (event) {
          const today = new Date().toISOString().split("T")[0];
          set({
            plan: { ...updatedPlan, lastAdaptedAt: today },
            adaptationLog: [...adaptationLog, event],
            lastAdaptedAt: today,
          });
        }
      },

      resetPlan: () => {
        set({
          plan: null,
          completions: [],
          totalXp: 0,
          streak: 0,
          lastCompletionDate: null,
          adaptationLog: [],
          lastAdaptedAt: null,
        });
      },

      // ── Sync Actions ──

      _setSyncMeta: (updates) =>
        set((state) => ({
          _syncMeta: { ...state._syncMeta, ...updates },
        })),

      _mergeTraining: (data) => {
        set({
          plan: data.plan,
          completions: data.completions,
          totalXp: data.totalXp,
          streak: data.streak,
          lastCompletionDate: data.lastCompletionDate,
        });
      },
    }),
    {
      name: "puppal-training",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        plan: state.plan,
        completions: state.completions,
        totalXp: state.totalXp,
        streak: state.streak,
        lastCompletionDate: state.lastCompletionDate,
        adaptationLog: state.adaptationLog,
        lastAdaptedAt: state.lastAdaptedAt,
        // _syncMeta is NOT persisted (resets to defaults on restart)
      }),
    }
  )
);
