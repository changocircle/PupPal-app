/**
 * Exercise data layer — loads & provides typed access to exercises.
 * Source: exercises.json (164 exercises, 12 categories)
 *
 * Personalises content by substituting {dog_name}, {breed_tip}, etc.
 */

import type { Exercise, ExerciseCategory } from "@/types/training";
import rawExercises from "./exercises.json";

// Cast once at module level
const ALL_EXERCISES: Exercise[] = rawExercises as unknown as Exercise[];

/** Get all exercises */
export function getAllExercises(): Exercise[] {
  return ALL_EXERCISES;
}

/** Get a single exercise by id */
export function getExerciseById(id: string): Exercise | undefined {
  return ALL_EXERCISES.find((e) => e.id === id);
}

/** Get exercises by category */
export function getExercisesByCategory(
  category: ExerciseCategory
): Exercise[] {
  return ALL_EXERCISES.filter((e) => e.category === category);
}

/** Get exercises by difficulty */
export function getExercisesByDifficulty(difficulty: 1 | 2 | 3): Exercise[] {
  return ALL_EXERCISES.filter((e) => e.difficulty === difficulty);
}

/** Get all tricks */
export function getTricks(): Exercise[] {
  return ALL_EXERCISES.filter((e) => e.is_trick === true);
}

/** Get exercises suitable for a given age (in weeks) */
export function getAgeAppropriateExercises(ageWeeks: number): Exercise[] {
  return ALL_EXERCISES.filter((e) => {
    const minOk = !e.min_age_weeks || ageWeeks >= e.min_age_weeks;
    const maxOk = !e.max_age_weeks || ageWeeks <= e.max_age_weeks;
    return minOk && maxOk;
  });
}

/**
 * Personalise exercise text — replaces template tokens with real values.
 * Per PRD-03 section 5: {dog_name}, {breed}, {breed_tip}
 */
export function personaliseExercise(
  exercise: Exercise,
  dogName: string,
  breed?: string | null
): Exercise {
  const replace = (text: string): string =>
    text
      .replace(/\{dog_name\}/g, dogName)
      .replace(/\{breed\}/g, breed ?? "your pup")
      .replace(/\{breed_tip\}/g, "")
      .replace(/\{age_tip\}/g, "")
      .replace(/\{experience_tip\}/g, "");

  return {
    ...exercise,
    title: replace(exercise.title),
    overview: replace(exercise.overview),
    steps: exercise.steps.map(replace),
    success_criteria: replace(exercise.success_criteria),
    pro_tips: exercise.pro_tips.map(replace),
    common_mistakes: exercise.common_mistakes.map(replace),
  };
}

/** Category stats for progress displays */
export function getCategoryStats(): Record<
  ExerciseCategory,
  { total: number; easy: number; medium: number; hard: number }
> {
  const stats = {} as Record<
    ExerciseCategory,
    { total: number; easy: number; medium: number; hard: number }
  >;
  for (const ex of ALL_EXERCISES) {
    if (!stats[ex.category]) {
      stats[ex.category] = { total: 0, easy: 0, medium: 0, hard: 0 };
    }
    stats[ex.category].total++;
    if (ex.difficulty === 1) stats[ex.category].easy++;
    else if (ex.difficulty === 2) stats[ex.category].medium++;
    else stats[ex.category].hard++;
  }
  return stats;
}
