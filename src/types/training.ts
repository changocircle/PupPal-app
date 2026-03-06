/**
 * Training system types, PRD-03
 * Covers exercises, training plans, weeks, days, and completion tracking.
 */

// ──────────────────────────────────────────────
// Exercise types
// ──────────────────────────────────────────────

export type ExerciseCategory =
  | "potty_training"
  | "bite_inhibition"
  | "basic_commands"
  | "leash_skills"
  | "crate_training"
  | "socialization"
  | "impulse_control"
  | "advanced_commands"
  | "real_world"
  | "mental_stimulation"
  | "health_habits"
  | "tricks";

export interface Exercise {
  id: string;
  category: ExerciseCategory;
  subcategory?: string;
  title: string;
  overview: string;
  time_minutes: number;
  difficulty: 1 | 2 | 3;
  supplies: string[];
  steps: string[];
  success_criteria: string;
  pro_tips: string[];
  common_mistakes: string[];
  troubleshooting?: Array<{ problem: string; solution: string }>;
  is_trick?: boolean;
  trick_pack_id?: string;
  share_prompt?: string;
  min_age_weeks?: number;
  max_age_weeks?: number;
  prerequisites?: string[];
  tags?: string[];
  xp_reward?: number;
}

// ──────────────────────────────────────────────
// Training plan types
// ──────────────────────────────────────────────

export type PlanPhase = "foundation" | "building" | "advanced" | "ongoing";

export type ExerciseStatus =
  | "upcoming"
  | "available"
  | "completed"
  | "skipped"
  | "needs_practice";

export type PlanExerciseType =
  | "primary"
  | "reinforcement"
  | "bonus"
  | "trick_bonus";

export interface PlanExercise {
  id: string;
  exerciseId: string;
  type: PlanExerciseType;
  status: ExerciseStatus;
  completedAt: string | null;
  userRating: number | null;
  xpEarned: number | null;
}

export interface PlanDay {
  dayNumber: number;
  estimatedMinutes: number;
  exercises: PlanExercise[];
  status: "upcoming" | "available" | "completed" | "skipped";
}

export interface PlanWeek {
  weekNumber: number;
  phase: PlanPhase;
  title: string;
  description: string;
  milestone: string;
  days: PlanDay[];
  status: "locked" | "active" | "completed";
  startedAt: string | null;
  completedAt: string | null;
}

export interface TrainingPlan {
  id: string;
  dogName: string;
  breed: string | null;
  generatedAt: string;
  currentWeek: number;
  currentDay: number;
  totalWeeks: number;
  weeks: PlanWeek[];
  status: "active" | "completed" | "paused";
}

// ──────────────────────────────────────────────
// Completion tracking
// ──────────────────────────────────────────────

export interface ExerciseCompletion {
  id: string;
  exerciseId: string;
  planExerciseId: string;
  completedAt: string;
  rating: number | null;
  xpEarned: number;
  timeSpentSeconds: number | null;
}

// ──────────────────────────────────────────────
// Category display helpers
// ──────────────────────────────────────────────

export const CATEGORY_META: Record<
  ExerciseCategory,
  { label: string; emoji: string; color: string }
> = {
  potty_training: { label: "Potty", emoji: "🚽", color: "#5CB882" },
  bite_inhibition: { label: "Biting", emoji: "🦷", color: "#EF6461" },
  basic_commands: { label: "Commands", emoji: "🎯", color: "#5B9BD5" },
  leash_skills: { label: "Leash", emoji: "🦮", color: "#FFB547" },
  crate_training: { label: "Crate", emoji: "🏠", color: "#9B59B6" },
  socialization: { label: "Social", emoji: "🐕‍🦺", color: "#FF6B5C" },
  impulse_control: { label: "Impulse", emoji: "✋", color: "#F39C12" },
  advanced_commands: { label: "Advanced", emoji: "🌟", color: "#1B2333" },
  real_world: { label: "Real World", emoji: "🌍", color: "#2ECC71" },
  mental_stimulation: { label: "Mental", emoji: "🧩", color: "#8E44AD" },
  health_habits: { label: "Health", emoji: "💊", color: "#E74C3C" },
  tricks: { label: "Tricks", emoji: "🎭", color: "#FF6B5C" },
};

export const DIFFICULTY_LABELS: Record<number, { label: string; paws: string }> = {
  1: { label: "Easy", paws: "🐾" },
  2: { label: "Medium", paws: "🐾🐾" },
  3: { label: "Hard", paws: "🐾🐾🐾" },
};
