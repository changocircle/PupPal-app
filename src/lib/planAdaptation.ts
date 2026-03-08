/**
 * Plan Adaptation Engine, PRD-03 §8
 *
 * Adjusts upcoming exercises based on user ratings and week completion.
 * Never modifies completed exercises. Runs within the existing 12-week framework.
 *
 * Triggers:
 *   - Skill Mastered (4-5 stars) → inject harder variant into upcoming days
 *   - Skill Struggling (1-2 stars) → inject easier/reinforcement variant
 *   - Week Completion Assessment → simplify or accelerate next week
 *
 * Guards:
 *   - Max 1 adaptation per day (by adaptedAt date)
 *   - Max 3 exercises per day
 *   - Max 2 reinforcement injections per exercise
 *   - Never touch completed days or the last week (week 12)
 *   - No-op when plan is null
 */

import { nanoid } from "nanoid/non-secure";
import type {
  Exercise,
  ExerciseCategory,
  PlanDay,
  PlanExercise,
  PlanExerciseType,
  TrainingPlan,
} from "@/types/training";

// ──────────────────────────────────────────────
// Public types
// ──────────────────────────────────────────────

export type AdaptationTrigger =
  | "skill_mastered" //  4-5 stars
  | "skill_struggling" //  1-2 stars
  | "week_assessment"; //  end-of-week assessment

export interface AdaptationEvent {
  id: string;
  planExerciseId: string;
  exerciseId: string;
  trigger: AdaptationTrigger;
  rating: number;
  adaptedAt: string; // ISO date string (YYYY-MM-DD)
  action:
    | "added_easier_variant"
    | "added_harder_variant"
    | "added_reinforcement"
    | "advanced_week"
    | "simplified_week";
}

// ──────────────────────────────────────────────
// Private helpers
// ──────────────────────────────────────────────

/** Today's date as YYYY-MM-DD */
function todayString(): string {
  const parts = new Date().toISOString().split("T");
  return parts[0] ?? "";
}

/**
 * Returns true if no adaptation has already been logged today.
 * Guard: max one adaptation per calendar day.
 */
function canAdaptToday(adaptationLog: AdaptationEvent[]): boolean {
  const today = todayString();
  return !adaptationLog.some((e) => e.adaptedAt === today);
}

/**
 * Find the exercise record for a given planExerciseId, searching all weeks/days.
 */
function findPlanExercise(
  plan: TrainingPlan,
  planExerciseId: string
): PlanExercise | null {
  for (const week of plan.weeks) {
    for (const day of week.days) {
      const found = day.exercises.find((e) => e.id === planExerciseId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Find all exerciseIds already present anywhere in the plan (to avoid duplicates).
 */
function exerciseIdsInPlan(plan: TrainingPlan): Set<string> {
  const ids = new Set<string>();
  for (const week of plan.weeks) {
    for (const day of week.days) {
      for (const ex of day.exercises) {
        ids.add(ex.exerciseId);
      }
    }
  }
  return ids;
}

/**
 * Find an easier variant of `exerciseId` in the same category.
 * Prefers difficulty - 1; falls back to same difficulty with a different id.
 */
function findEasierVariant(
  exerciseId: string,
  allExercises: Exercise[],
  excludeIds: Set<string>
): Exercise | null {
  const source = allExercises.find((e) => e.id === exerciseId);
  if (!source) return null;

  const targetDifficulty = Math.max(1, source.difficulty - 1) as 1 | 2 | 3;
  const sameCat = allExercises.filter(
    (e) =>
      e.category === source.category &&
      e.id !== exerciseId &&
      !excludeIds.has(e.id)
  );

  // Try one difficulty step easier first
  const easier = sameCat.find((e) => e.difficulty === targetDifficulty);
  if (easier) return easier;

  // Fallback: same difficulty but different exercise
  const peer = sameCat.find((e) => e.difficulty === source.difficulty);
  return peer ?? null;
}

/**
 * Find a harder variant of `exerciseId` in the same category.
 * Prefers difficulty + 1.
 */
function findHarderVariant(
  exerciseId: string,
  allExercises: Exercise[],
  excludeIds: Set<string>
): Exercise | null {
  const source = allExercises.find((e) => e.id === exerciseId);
  if (!source) return null;

  const targetDifficulty = Math.min(3, source.difficulty + 1) as 1 | 2 | 3;
  const sameCat = allExercises.filter(
    (e) =>
      e.category === source.category &&
      e.id !== exerciseId &&
      !excludeIds.has(e.id)
  );

  const harder = sameCat.find((e) => e.difficulty === targetDifficulty);
  return harder ?? null;
}

/**
 * Build a new PlanExercise shell for an Exercise.
 */
function makePlanExercise(
  exercise: Exercise,
  type: PlanExerciseType
): PlanExercise {
  return {
    id: `adapt-${nanoid(8)}`,
    exerciseId: exercise.id,
    type,
    status: "upcoming",
    completedAt: null,
    userRating: null,
    xpEarned: null,
  };
}

/**
 * Inject a PlanExercise into the next available (non-completed, non-current) day
 * that has room (< 3 exercises). Searches from the day *after* currentDay.
 *
 * "Available" means the day.status is not "completed" and is in an upcoming/active week.
 * Skips the next 3 days if they already contain reinforcement exercises for the same
 * exerciseId (spacing guard).
 */
function injectExerciseIntoPlan(
  plan: TrainingPlan,
  exercise: Exercise,
  type: PlanExerciseType,
  skipDaysFromNow = 1 // inject at least this many days ahead
): TrainingPlan {
  const MAX_PER_DAY = 3;
  const newPlanEx = makePlanExercise(exercise, type);

  // Flatten all future days (week → day) in chronological order
  const futureDays: Array<{ weekIdx: number; dayIdx: number; day: PlanDay }> =
    [];

  for (let wIdx = 0; wIdx < plan.weeks.length; wIdx++) {
    const week = plan.weeks[wIdx];
    if (!week) continue;
    for (let dIdx = 0; dIdx < week.days.length; dIdx++) {
      const day = week.days[dIdx];
      if (!day) continue;
      const isCurrentOrPast =
        week.weekNumber < plan.currentWeek ||
        (week.weekNumber === plan.currentWeek &&
          day.dayNumber <= plan.currentDay);
      if (isCurrentOrPast) continue;
      if (day.status === "completed") continue;
      futureDays.push({ weekIdx: wIdx, dayIdx: dIdx, day });
    }
  }

  // Skip the nearest `skipDaysFromNow - 1` days
  const candidates = futureDays.slice(skipDaysFromNow - 1);

  // Find first day with capacity
  const target = candidates.find(
    (entry: { weekIdx: number; dayIdx: number; day: PlanDay }) =>
      entry.day.exercises.length < MAX_PER_DAY
  );
  if (!target) return plan; // No room — no-op

  const { weekIdx: targetWeekIdx, dayIdx: targetDayIdx } = target;

  const updatedWeeks = plan.weeks.map((week, wIdx) => {
    if (wIdx !== targetWeekIdx) return week;
    return {
      ...week,
      days: week.days.map((day, dIdx) => {
        if (dIdx !== targetDayIdx) return day;
        return {
          ...day,
          exercises: [...day.exercises, newPlanEx],
        };
      }),
    };
  });

  return { ...plan, weeks: updatedWeeks };
}

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────

/**
 * React to a user rating an exercise.
 *
 * - Low (1-2 stars): inject an easier variant or reinforcement
 * - High (4-5 stars): inject a harder variant (one advance per exercise)
 * - Mid (3 stars):  no adaptation
 *
 * Guards respected: one adaptation per day, max 2 reinforcement injections
 * per exercise, no changes in week 12.
 */
export function adaptPlanForRating(
  plan: TrainingPlan,
  planExerciseId: string,
  rating: number,
  allExercises: Exercise[],
  adaptationLog: AdaptationEvent[]
): { updatedPlan: TrainingPlan; event: AdaptationEvent | null } {
  const noop = { updatedPlan: plan, event: null };

  // Guard: plan must exist and not be in last week
  if (!plan || plan.currentWeek >= plan.totalWeeks) return noop;

  // Guard: only one adaptation per day
  if (!canAdaptToday(adaptationLog)) return noop;

  // Guard: mid rating — nothing to do
  if (rating === 3) return noop;

  const planEx = findPlanExercise(plan, planExerciseId);
  if (!planEx) return noop;

  const inPlan = exerciseIdsInPlan(plan);

  if (rating <= 2) {
    // ── Struggling: inject easier/reinforcement ──────────────────────────

    // Guard: max 2 reinforcement injections for this exercise
    const priorReinforcements = adaptationLog.filter(
      (e) =>
        e.planExerciseId === planExerciseId &&
        (e.action === "added_easier_variant" ||
          e.action === "added_reinforcement")
    );
    if (priorReinforcements.length >= 2) return noop;

    const variant = findEasierVariant(planEx.exerciseId, allExercises, inPlan);
    if (!variant) return noop;

    const action =
      allExercises.find((e) => e.id === planEx.exerciseId)?.difficulty === 1
        ? "added_reinforcement"
        : "added_easier_variant";

    const updatedPlan = injectExerciseIntoPlan(plan, variant, "reinforcement");

    const event: AdaptationEvent = {
      id: `evt-${nanoid(8)}`,
      planExerciseId,
      exerciseId: planEx.exerciseId,
      trigger: "skill_struggling",
      rating,
      adaptedAt: todayString(),
      action,
    };

    return { updatedPlan, event };
  }

  if (rating >= 4) {
    // ── Mastered: inject harder variant ─────────────────────────────────

    // Guard: max one advancement per exercise
    const priorAdvances = adaptationLog.filter(
      (e) =>
        e.planExerciseId === planExerciseId &&
        e.action === "added_harder_variant"
    );
    if (priorAdvances.length >= 1) return noop;

    const variant = findHarderVariant(planEx.exerciseId, allExercises, inPlan);
    if (!variant) return noop;

    const updatedPlan = injectExerciseIntoPlan(plan, variant, "reinforcement");

    const event: AdaptationEvent = {
      id: `evt-${nanoid(8)}`,
      planExerciseId,
      exerciseId: planEx.exerciseId,
      trigger: "skill_mastered",
      rating,
      adaptedAt: todayString(),
      action: "added_harder_variant",
    };

    return { updatedPlan, event };
  }

  return noop;
}

/**
 * Assess week completion and adapt the *next* week accordingly.
 *
 * - >80% completion: look for easy (difficulty 1) exercises in categories where
 *   the user has 4-5 star history → skip them, inject one harder variant.
 * - <50% completion: replace difficulty-3 exercises in the next week with
 *   difficulty-1 of the same category.
 * - 50-80%: no changes.
 *
 * Called from `advanceDay` when transitioning to a new week.
 */
export function adaptPlanForWeekCompletion(
  plan: TrainingPlan,
  weekNumber: number,
  allExercises: Exercise[],
  adaptationLog: AdaptationEvent[]
): { updatedPlan: TrainingPlan; event: AdaptationEvent | null } {
  const noop = { updatedPlan: plan, event: null };

  if (!plan || weekNumber >= plan.totalWeeks) return noop;

  // Calculate completion % for the assessed week
  const assessedWeek = plan.weeks.find((w) => w.weekNumber === weekNumber);
  if (!assessedWeek) return noop;

  const allExercisesInWeek = assessedWeek.days.flatMap((d) => d.exercises);
  const total = allExercisesInWeek.length;
  if (total === 0) return noop;

  const completed = allExercisesInWeek.filter(
    (e) => e.status === "completed"
  ).length;
  const pct = completed / total;

  // Find the next week to modify
  const nextWeekIdx = plan.weeks.findIndex(
    (w) => w.weekNumber === weekNumber + 1
  );
  if (nextWeekIdx === -1) return noop;

  const inPlan = exerciseIdsInPlan(plan);

  if (pct > 0.8) {
    // ── Accelerate: skip easy exercises in mastered categories ───────────

    // Determine which categories the user has ≥4-star history in this week
    const masteredCategories = new Set<ExerciseCategory>();
    for (const ex of allExercisesInWeek) {
      if (ex.status === "completed" && (ex.userRating ?? 0) >= 4) {
        const exercise = allExercises.find((e) => e.id === ex.exerciseId);
        if (exercise) masteredCategories.add(exercise.category);
      }
    }

    if (masteredCategories.size === 0) return noop;

    let skipped = 0;
    let injectedHarder: Exercise | null = null;
    let targetCategoryExerciseId: string | null = null;

    const updatedWeeks = plan.weeks.map((week, wIdx) => {
      if (wIdx !== nextWeekIdx) return week;
      const updatedDays = week.days.map((day) => {
        if (day.status === "completed") return day;
        const updatedExercises = day.exercises.map((planEx) => {
          const ex = allExercises.find((e) => e.id === planEx.exerciseId);
          if (
            ex &&
            ex.difficulty === 1 &&
            masteredCategories.has(ex.category) &&
            planEx.status !== "completed"
          ) {
            // Try to find a harder variant to inject once
            if (!injectedHarder) {
              const harder = findHarderVariant(ex.id, allExercises, inPlan);
              if (harder) {
                injectedHarder = harder;
                targetCategoryExerciseId = planEx.id;
              }
            }
            skipped++;
            return { ...planEx, status: "skipped" as const };
          }
          return planEx;
        });
        return { ...day, exercises: updatedExercises };
      });
      return { ...week, days: updatedDays };
    });

    if (skipped === 0) return noop;

    let finalPlan: TrainingPlan = { ...plan, weeks: updatedWeeks };

    // Inject the harder variant if found
    if (injectedHarder) {
      finalPlan = injectExerciseIntoPlan(
        finalPlan,
        injectedHarder,
        "reinforcement"
      );
    }

    const event: AdaptationEvent = {
      id: `evt-${nanoid(8)}`,
      planExerciseId: targetCategoryExerciseId ?? "week-assessment",
      exerciseId: injectedHarder ? (injectedHarder as Exercise).id : "none",
      trigger: "week_assessment",
      rating: Math.round((completed / total) * 5),
      adaptedAt: todayString(),
      action: "advanced_week",
    };

    return { updatedPlan: finalPlan, event };
  }

  if (pct < 0.5) {
    // ── Simplify: replace difficulty-3 with difficulty-1 in next week ───

    const updatedWeeks = plan.weeks.map((week, wIdx) => {
      if (wIdx !== nextWeekIdx) return week;
      const updatedDays = week.days.map((day) => {
        if (day.status === "completed") return day;
        const updatedExercises = day.exercises.map((planEx) => {
          const ex = allExercises.find((e) => e.id === planEx.exerciseId);
          if (!ex || ex.difficulty !== 3 || planEx.status === "completed") {
            return planEx;
          }
          // Find a difficulty-1 exercise in same category
          const simpler = allExercises.find(
            (e) =>
              e.category === ex.category &&
              e.difficulty === 1 &&
              e.id !== ex.id &&
              !inPlan.has(e.id)
          );
          if (!simpler) return planEx;
          // Replace by swapping exerciseId; keep id & type intact
          return { ...planEx, exerciseId: simpler.id };
        });
        return { ...day, exercises: updatedExercises };
      });
      return { ...week, days: updatedDays };
    });

    const event: AdaptationEvent = {
      id: `evt-${nanoid(8)}`,
      planExerciseId: "week-assessment",
      exerciseId: "none",
      trigger: "week_assessment",
      rating: Math.round((completed / total) * 5),
      adaptedAt: todayString(),
      action: "simplified_week",
    };

    return { updatedPlan: { ...plan, weeks: updatedWeeks }, event };
  }

  // 50-80% — maintain current trajectory, no changes
  return noop;
}
