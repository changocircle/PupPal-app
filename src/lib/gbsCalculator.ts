/**
 * Good Boy Score Calculator, PRD-04 §5
 *
 * Composite 0-100 score from 5 weighted dimensions.
 * Calculated from exercise completions + training data.
 */

import type { GbsDimensions, GbsLabel } from "@/types/gamification";
import type { ExerciseCompletion, ExerciseCategory } from "@/types/training";
import { GBS_WEIGHTS, getGbsLabel } from "@/types/gamification";

// ── Category → GBS dimension mapping ──
const DIMENSION_CATEGORIES: Record<keyof GbsDimensions, ExerciseCategory[]> = {
  obedience: ["basic_commands", "advanced_commands"],
  behavior: ["potty_training", "bite_inhibition", "impulse_control"],
  socialization: ["socialization"],
  leashRealWorld: ["leash_skills", "real_world"],
  consistency: [], // computed from training frequency, not exercise categories
};

// Total exercises per category (approximate, from 164 exercises in data)
const CATEGORY_TOTALS: Partial<Record<ExerciseCategory, number>> = {
  basic_commands: 20,
  advanced_commands: 10,
  potty_training: 12,
  bite_inhibition: 10,
  impulse_control: 12,
  socialization: 15,
  leash_skills: 15,
  real_world: 10,
  crate_training: 10,
  mental_stimulation: 10,
  health_habits: 10,
  tricks: 30,
};

interface GbsInput {
  completions: ExerciseCompletion[];
  exerciseCategories: Map<string, ExerciseCategory>; // exerciseId → category
  streak: number;
  totalActiveDays: number;
  planWeek: number;
}

export interface GbsResult {
  score: number;
  dimensions: GbsDimensions;
  label: GbsLabel;
  delta: number; // change from previous
}

/**
 * Calculate GBS from current training data.
 *
 * Each dimension (0-100) = weighted composite of:
 *   - Completion rate (60%): exercises done / total in category
 *   - Quality (25%): average rating / 5
 *   - Milestone bonus (15%): bonus for completing milestones
 */
export function calculateGBS(
  input: GbsInput,
  previousScore: number = 0
): GbsResult {
  const { completions, exerciseCategories, streak, totalActiveDays, planWeek } =
    input;

  // ── Group completions by category ──
  const categoryCompletions = new Map<ExerciseCategory, ExerciseCompletion[]>();
  for (const comp of completions) {
    const cat = exerciseCategories.get(comp.exerciseId);
    if (!cat) continue;
    const existing = categoryCompletions.get(cat) ?? [];
    existing.push(comp);
    categoryCompletions.set(cat, existing);
  }

  // ── Calculate each dimension ──
  function calcDimension(categories: ExerciseCategory[]): number {
    if (categories.length === 0) return 0;

    let totalExercises = 0;
    let completedExercises = 0;
    let ratingSum = 0;
    let ratingCount = 0;
    let milestoneBonus = 0;

    for (const cat of categories) {
      const total = CATEGORY_TOTALS[cat] ?? 10;
      totalExercises += total;

      const comps = categoryCompletions.get(cat) ?? [];
      // Deduplicate by exerciseId (same exercise done multiple days doesn't double-count)
      const uniqueCompleted = new Set(comps.map((c) => c.exerciseId));
      completedExercises += uniqueCompleted.size;

      for (const c of comps) {
        if (c.rating != null && c.rating > 0) {
          ratingSum += c.rating;
          ratingCount++;
        }
      }

      // Milestone bonus: 15% scaled by how far through the category
      const categoryProgress = uniqueCompleted.size / total;
      if (categoryProgress >= 1.0) milestoneBonus += 100;
      else if (categoryProgress >= 0.75) milestoneBonus += 75;
      else if (categoryProgress >= 0.5) milestoneBonus += 50;
      else if (categoryProgress >= 0.25) milestoneBonus += 25;
    }

    if (totalExercises === 0) return 0;

    const completionScore =
      Math.min(completedExercises / totalExercises, 1.0) * 100;
    const qualityScore =
      ratingCount > 0 ? (ratingSum / ratingCount / 5.0) * 100 : 50; // default 50% if no ratings
    const milestoneScore = milestoneBonus / categories.length;

    // PRD-04 formula: completion * 60% + quality * 25% + milestone * 15%
    return Math.min(
      completionScore * 0.6 + qualityScore * 0.25 + milestoneScore * 0.15,
      100
    );
  }

  // ── Consistency dimension (computed differently) ──
  function calcConsistency(): number {
    // Based on: streak strength, total active days, regularity
    const streakScore = Math.min(streak / 30, 1.0) * 100; // 30-day streak = 100%
    const expectedDays = Math.max(planWeek * 5, 7); // ~5 training days per week
    const activityScore = Math.min(totalActiveDays / expectedDays, 1.0) * 100;

    // 60% activity regularity + 40% streak
    return Math.min(activityScore * 0.6 + streakScore * 0.4, 100);
  }

  const dimensions: GbsDimensions = {
    obedience: Math.round(calcDimension(DIMENSION_CATEGORIES.obedience)),
    behavior: Math.round(calcDimension(DIMENSION_CATEGORIES.behavior)),
    socialization: Math.round(calcDimension(DIMENSION_CATEGORIES.socialization)),
    leashRealWorld: Math.round(calcDimension(DIMENSION_CATEGORIES.leashRealWorld)),
    consistency: Math.round(calcConsistency()),
  };

  // ── Weighted composite score ──
  const score = Math.round(
    dimensions.obedience * GBS_WEIGHTS.obedience +
      dimensions.behavior * GBS_WEIGHTS.behavior +
      dimensions.socialization * GBS_WEIGHTS.socialization +
      dimensions.leashRealWorld * GBS_WEIGHTS.leashRealWorld +
      dimensions.consistency * GBS_WEIGHTS.consistency
  );

  // Score never decreases more than 2 per week (PRD-04 §5)
  const finalScore = Math.max(score, previousScore - 2);

  return {
    score: Math.min(finalScore, 100),
    dimensions,
    label: getGbsLabel(finalScore),
    delta: finalScore - previousScore,
  };
}
