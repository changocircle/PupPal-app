/**
 * Training Plan Store, Zustand
 * PRD-03: manages plan state, exercise completion, day/week progression.
 *
 * Local-first: all state in Zustand + AsyncStorage.
 * Supabase sync will be wired up later.
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

  // ─── Actions ───
  /** Generate a new plan from onboarding data */
  generatePlan: (input: {
    dogName: string;
    breed: string | null;
    ageWeeks: number;
    challenges: string[];
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

  /** Reset plan (for testing / re-onboarding) */
  resetPlan: () => void;
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

      resetPlan: () => {
        set({
          plan: null,
          completions: [],
          totalXp: 0,
          streak: 0,
          lastCompletionDate: null,
        });
      },
    }),
    {
      name: "puppal-training",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
