/**
 * Training Plan Generator — PRD-03 §4
 *
 * Generates a personalised 12-week training plan based on:
 *   - breed (learning speed, common issues)
 *   - age in weeks (developmental stage)
 *   - selected challenges (priority focus)
 *   - owner experience level
 *
 * Runs once after onboarding. Produces full plan stored in Zustand.
 * Supabase persistence will be wired up later.
 */

import { nanoid } from "nanoid/non-secure";
import type {
  Exercise,
  ExerciseCategory,
  PlanDay,
  PlanExercise,
  PlanPhase,
  PlanWeek,
  TrainingPlan,
} from "@/types/training";
import { getAllExercises } from "@/data/exerciseData";

// ──────────────────────────────────────────────
// Challenge → Category mapping (PRD-03 §4 Step 2)
// ──────────────────────────────────────────────

const CHALLENGE_CATEGORY_MAP: Record<
  string,
  Array<{ category: ExerciseCategory; weight: number }>
> = {
  potty_training: [{ category: "potty_training", weight: 1.0 }],
  biting_nipping: [
    { category: "bite_inhibition", weight: 1.0 },
    { category: "impulse_control", weight: 0.5 },
  ],
  basic_commands: [{ category: "basic_commands", weight: 1.0 }],
  leash_walking: [
    { category: "leash_skills", weight: 1.0 },
    { category: "impulse_control", weight: 0.3 },
  ],
  separation_anxiety: [
    { category: "crate_training", weight: 1.0 },
    { category: "impulse_control", weight: 0.5 },
  ],
  socializing: [{ category: "socialization", weight: 1.0 }],
  sleeping: [{ category: "crate_training", weight: 1.0 }],
  feeding: [
    { category: "impulse_control", weight: 0.7 },
    { category: "health_habits", weight: 0.5 },
  ],
};

// ──────────────────────────────────────────────
// Breed learning speed profiles (PRD-03 §4 Step 3)
// ──────────────────────────────────────────────

type LearningSpeed = "very_fast" | "fast" | "average" | "slow";

const BREED_SPEED: Record<string, LearningSpeed> = {
  "Border Collie": "very_fast",
  "Australian Shepherd": "very_fast",
  Poodle: "fast",
  "Golden Retriever": "fast",
  "Labrador Retriever": "fast",
  "German Shepherd": "fast",
  "Cavalier King Charles Spaniel": "fast",
  Beagle: "average",
  "French Bulldog": "slow",
  Bulldog: "slow",
  "Shih Tzu": "average",
  Pomeranian: "average",
  Dachshund: "average",
  "Siberian Husky": "fast",
  Rottweiler: "average",
  Boxer: "average",
  "Great Dane": "average",
  Chihuahua: "average",
  Corgi: "fast",
  "Cocker Spaniel": "fast",
};

function getBreedSpeed(breed: string | null): LearningSpeed {
  if (!breed) return "average";
  return BREED_SPEED[breed] ?? "average";
}

// ──────────────────────────────────────────────
// Phase definitions (PRD-03 §3)
// ──────────────────────────────────────────────

/** Categories prioritised per phase */
const PHASE_CATEGORIES: Record<PlanPhase, ExerciseCategory[]> = {
  foundation: [
    "potty_training",
    "bite_inhibition",
    "crate_training",
    "socialization",
    "basic_commands",
  ],
  building: [
    "basic_commands",
    "leash_skills",
    "impulse_control",
    "socialization",
    "mental_stimulation",
  ],
  advanced: [
    "advanced_commands",
    "real_world",
    "leash_skills",
    "impulse_control",
    "health_habits",
  ],
  ongoing: ["tricks", "mental_stimulation", "advanced_commands"],
};

function getPhaseForWeek(week: number): PlanPhase {
  if (week <= 4) return "foundation";
  if (week <= 8) return "building";
  return "advanced";
}

// ──────────────────────────────────────────────
// Week theme / title generation
// ──────────────────────────────────────────────

const WEEK_THEMES: Array<{ title: string; description: string; milestone: string }> = [
  {
    title: "Getting Started",
    description: "Building trust, routines, and tackling your top priorities.",
    milestone: "Complete 3 exercises",
  },
  {
    title: "Building Habits",
    description: "Reinforcing foundations and introducing new skills.",
    milestone: "Complete all daily exercises for 3 days",
  },
  {
    title: "Finding Your Rhythm",
    description: "Consistency is paying off — time to expand your pup's skills.",
    milestone: "Master your first skill category",
  },
  {
    title: "Foundation Mastery",
    description: "Your pup has the basics down. Time to level up!",
    milestone: "Complete all Week 4 exercises",
  },
  {
    title: "Core Obedience",
    description: "Sit, stay, come, down — the commands that make life easier.",
    milestone: "Complete 5 command exercises",
  },
  {
    title: "Leash & Impulse",
    description: "Building calm behaviour on and off the leash.",
    milestone: "Complete a leash session without pulling",
  },
  {
    title: "Social Skills",
    description: "Expanding your pup's comfort zone with new experiences.",
    milestone: "Complete 3 socialization exercises",
  },
  {
    title: "Putting It Together",
    description: "All the building blocks come together into reliable behaviours.",
    milestone: "Practice in a new environment",
  },
  {
    title: "Real World Ready",
    description: "Taking training from the living room to the real world.",
    milestone: "Complete a real-world exercise",
  },
  {
    title: "Distraction Training",
    description: "Can your pup perform with distractions? Let's find out!",
    milestone: "Successful recall with a distraction",
  },
  {
    title: "Advanced Skills",
    description: "Polishing commands and building impressive reliability.",
    milestone: "Complete 3 advanced exercises",
  },
  {
    title: "Graduation Week",
    description: "Celebrate everything you and your pup have accomplished!",
    milestone: "Complete the 12-week plan! 🎓",
  },
];

// ──────────────────────────────────────────────
// XP values (PRD-03 §6 + PRD-04)
// ──────────────────────────────────────────────

function getXpForExercise(difficulty: number, isTrick: boolean): number {
  if (isTrick) return 20; // Trick Level 1 = 20 XP
  const base = { 1: 10, 2: 15, 3: 20 };
  return base[difficulty as 1 | 2 | 3] ?? 10;
}

// ──────────────────────────────────────────────
// Main generator
// ──────────────────────────────────────────────

interface GeneratorInput {
  dogName: string;
  breed: string | null;
  ageWeeks: number;
  challenges: string[];
  experience: "first_time" | "some_experience" | "experienced" | null;
}

export function generateTrainingPlan(input: GeneratorInput): TrainingPlan {
  const allExercises = getAllExercises();
  const speed = getBreedSpeed(input.breed);

  // Step 1: build category priority from challenges
  const categoryPriority = buildCategoryPriority(input.challenges);

  // Step 2: bucket exercises by category
  const byCategory = new Map<ExerciseCategory, Exercise[]>();
  for (const ex of allExercises) {
    if (ex.is_trick) continue; // tricks handled separately
    const list = byCategory.get(ex.category) ?? [];
    list.push(ex);
    byCategory.set(ex.category, list);
  }

  // Sort each bucket by difficulty (easy first)
  for (const [, list] of byCategory) {
    list.sort((a, b) => a.difficulty - b.difficulty);
  }

  // Trick pool (for bonus slots weeks 4+)
  const trickPool = allExercises
    .filter((e) => e.is_trick)
    .sort((a, b) => a.difficulty - b.difficulty);

  // Step 3: generate weeks
  const usedExerciseIds = new Set<string>();
  const weeks: PlanWeek[] = [];

  // Adjust exercises per day based on experience
  const exercisesPerDay =
    input.experience === "first_time" ? 2 : input.experience === "experienced" ? 3 : 3;

  // Adjust days per week based on breed speed
  const daysPerWeek = speed === "slow" ? 5 : speed === "very_fast" ? 7 : 6;

  for (let w = 1; w <= 12; w++) {
    const phase = getPhaseForWeek(w);
    const theme = WEEK_THEMES[w - 1] ?? { title: `Week ${w}`, description: "Continue training", milestone: "Keep progressing" };
    const phaseCategories = PHASE_CATEGORIES[phase];

    // Merge phase categories with user priorities
    const weekCategories = mergeWithPriority(phaseCategories, categoryPriority);

    // Build days
    const days: PlanDay[] = [];
    let trickIdx = 0;

    for (let d = 1; d <= daysPerWeek; d++) {
      const dayExercises: PlanExercise[] = [];
      let dayMinutes = 0;

      // Primary exercise from highest priority category
      const primaryCat = weekCategories[d % weekCategories.length] ?? "basic_commands";
      const primary = pickExercise(byCategory, primaryCat, usedExerciseIds, input.ageWeeks);
      if (primary) {
        dayExercises.push(makePlanExercise(primary, "primary"));
        dayMinutes += primary.time_minutes;
        usedExerciseIds.add(primary.id);
      }

      // Reinforcement from a different category (review)
      if (exercisesPerDay >= 2) {
        const reinfCandidateA = weekCategories[(d + 2) % weekCategories.length] ?? "socialization";
        const reinfCandidateB = weekCategories[(d + 3) % weekCategories.length] ?? "impulse_control";
        const reinfCat = reinfCandidateA !== primaryCat ? reinfCandidateA : reinfCandidateB;
        const reinforcement = pickExercise(
          byCategory,
          reinfCat,
          usedExerciseIds,
          input.ageWeeks
        );
        if (reinforcement) {
          dayExercises.push(makePlanExercise(reinforcement, "reinforcement"));
          dayMinutes += reinforcement.time_minutes;
          usedExerciseIds.add(reinforcement.id);
        }
      }

      // Bonus exercise (or trick bonus for week 4+)
      if (exercisesPerDay >= 3 || (w >= 4 && d === 1)) {
        const trick = w >= 4 && trickPool.length > trickIdx ? trickPool[trickIdx] : undefined;
        if (w >= 4 && trick) {
          // Trick bonus starting week 4
          trickIdx++;
          dayExercises.push(makePlanExercise(trick, "trick_bonus"));
          dayMinutes += trick.time_minutes;
        } else if (exercisesPerDay >= 3) {
          // Regular bonus from mental stimulation or lower-priority cat
          const bonusCat =
            weekCategories[(d + 4) % weekCategories.length] ?? "mental_stimulation";
          const bonus = pickExercise(byCategory, bonusCat, usedExerciseIds, input.ageWeeks);
          if (bonus) {
            dayExercises.push(makePlanExercise(bonus, "bonus"));
            dayMinutes += bonus.time_minutes;
            usedExerciseIds.add(bonus.id);
          }
        }
      }

      days.push({
        dayNumber: d,
        estimatedMinutes: dayMinutes,
        exercises: dayExercises,
        status: w === 1 && d === 1 ? "available" : "upcoming",
      });
    }

    weeks.push({
      weekNumber: w,
      phase,
      title: theme.title,
      description: theme.description,
      milestone: theme.milestone,
      days,
      status: w === 1 ? "active" : "locked",
      startedAt: w === 1 ? new Date().toISOString() : null,
      completedAt: null,
    });
  }

  return {
    id: nanoid(12),
    dogName: input.dogName,
    breed: input.breed,
    generatedAt: new Date().toISOString(),
    currentWeek: 1,
    currentDay: 1,
    totalWeeks: 12,
    weeks,
    status: "active",
  };
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function buildCategoryPriority(
  challenges: string[]
): ExerciseCategory[] {
  const priorityMap = new Map<ExerciseCategory, number>();

  challenges.forEach((challenge, idx) => {
    const mappings = CHALLENGE_CATEGORY_MAP[challenge] ?? [];
    for (const { category, weight } of mappings) {
      const current = priorityMap.get(category) ?? 0;
      // Earlier challenges get higher priority (lower index = higher weight)
      priorityMap.set(category, current + weight * (challenges.length - idx));
    }
  });

  return [...priorityMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);
}

function mergeWithPriority(
  phaseCategories: ExerciseCategory[],
  userPriority: ExerciseCategory[]
): ExerciseCategory[] {
  // User priority first, then phase categories (deduped)
  const seen = new Set<ExerciseCategory>();
  const result: ExerciseCategory[] = [];

  for (const cat of [...userPriority, ...phaseCategories]) {
    if (!seen.has(cat)) {
      seen.add(cat);
      result.push(cat);
    }
  }
  return result;
}

function pickExercise(
  byCategory: Map<ExerciseCategory, Exercise[]>,
  category: ExerciseCategory,
  usedIds: Set<string>,
  ageWeeks: number
): Exercise | null {
  const pool = byCategory.get(category) ?? [];
  // Find first unused, age-appropriate exercise
  const match = pool.find((e) => {
    if (usedIds.has(e.id)) return false;
    if (e.min_age_weeks && ageWeeks < e.min_age_weeks) return false;
    if (e.max_age_weeks && ageWeeks > e.max_age_weeks) return false;
    return true;
  });

  // If all used, allow re-use (reinforcement) — pick easiest unused
  if (!match) {
    return pool.find((e) => {
      if (e.min_age_weeks && ageWeeks < e.min_age_weeks) return false;
      if (e.max_age_weeks && ageWeeks > e.max_age_weeks) return false;
      return true;
    }) ?? null;
  }

  return match;
}

function makePlanExercise(
  exercise: Exercise,
  type: PlanExercise["type"]
): PlanExercise {
  return {
    id: nanoid(10),
    exerciseId: exercise.id,
    type,
    status: "upcoming",
    completedAt: null,
    userRating: null,
    xpEarned: null,
  };
}
