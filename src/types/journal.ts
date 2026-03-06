/**
 * Growth Journal Types, PRD-10
 * "Timehop for Your Dog"
 *
 * Covers manual entries (photos, notes) and auto-generated entries
 * (milestones, achievements, health events, streaks, etc.)
 */

// ──────────────────────────────────────────────
// Entry Type Enum
// ──────────────────────────────────────────────

export type JournalEntryType =
  | "photo"
  | "note"
  | "weight"
  | "exercise_milestone"
  | "achievement"
  | "streak_milestone"
  | "score_milestone"
  | "level_up"
  | "trick_complete"
  | "health_event"
  | "developmental_milestone"
  | "plan_milestone"
  | "app_milestone";

export type JournalSource = "user" | "system";

/**
 * Which milestone category for color-coding:
 * - coral (#FF6B5C): achievements, streaks
 * - gold (#FFB547): gamification, score, level
 * - sage (#5CB882): health events, developmental
 * - navy (#1B2333): plan, training
 */
export type MilestoneCategory = "coral" | "gold" | "sage" | "navy";

/** Maps entry types to their milestone color category */
export const ENTRY_TYPE_CATEGORY: Record<JournalEntryType, MilestoneCategory> = {
  photo: "coral",
  note: "gold",
  weight: "sage",
  exercise_milestone: "navy",
  achievement: "coral",
  streak_milestone: "coral",
  score_milestone: "gold",
  level_up: "gold",
  trick_complete: "navy",
  health_event: "sage",
  developmental_milestone: "sage",
  plan_milestone: "navy",
  app_milestone: "gold",
};

/** Maps entry types to their display icon */
export const ENTRY_TYPE_ICON: Record<JournalEntryType, string> = {
  photo: "📸",
  note: "📝",
  weight: "⚖️",
  exercise_milestone: "🏋️",
  achievement: "🏆",
  streak_milestone: "🔥",
  score_milestone: "⭐",
  level_up: "🎉",
  trick_complete: "🎯",
  health_event: "💊",
  developmental_milestone: "🌱",
  plan_milestone: "📋",
  app_milestone: "📱",
};

/** Color values for milestone categories */
export const MILESTONE_COLORS: Record<MilestoneCategory, { bg: string; text: string; border: string }> = {
  coral: { bg: "#FFF0EE", text: "#FF6B5C", border: "#FFD0CB" },
  gold: { bg: "#FFF6E5", text: "#F5A623", border: "#FFE0A3" },
  sage: { bg: "#E8F5EE", text: "#5CB882", border: "#B8E0CA" },
  navy: { bg: "#EDF0F5", text: "#1B2333", border: "#C5CCD6" },
};

// ──────────────────────────────────────────────
// Journal Entry
// ──────────────────────────────────────────────

export interface JournalEntry {
  id: string;
  dogId: string;
  entryType: JournalEntryType;
  source: JournalSource;
  title: string;
  body: string | null;
  /** Local URIs for photos (0-5) */
  photoUris: string[];
  /** Entry date (ISO date string, supports backdating) */
  entryDate: string;
  /** Calculated from DOB (e.g. "10 weeks", "4 months") */
  dogAgeLabel: string | null;
  /** Reference to related entity (achievement slug, exercise id, etc.) */
  referenceType: string | null;
  referenceId: string | null;
  /** Whether the date was backdated */
  isBackdated: boolean;
  /** User-pinned */
  isPinned: boolean;
  /** User hid an auto-entry */
  isHidden: boolean;
  /** Soft-deleted */
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────
// Journal Photo
// ──────────────────────────────────────────────

export interface JournalPhoto {
  id: string;
  entryId: string;
  uri: string;
  width: number | null;
  height: number | null;
  sortOrder: number;
  createdAt: string;
}

// ──────────────────────────────────────────────
// Monthly Recap (future)
// ──────────────────────────────────────────────

export interface MonthlyRecap {
  id: string;
  dogId: string;
  month: number;
  year: number;
  exercisesCompleted: number;
  tricksLearned: number;
  streakBest: number;
  scoreStart: number;
  scoreEnd: number;
  scoreChange: number;
  achievementsUnlocked: number;
  photosAdded: number;
  weightStart: number | null;
  weightEnd: number | null;
  highlightEntryIds: string[];
  generatedAt: string;
  viewedAt: string | null;
  sharedAt: string | null;
}

// ──────────────────────────────────────────────
// Filter / Grouping
// ──────────────────────────────────────────────

export type JournalFilter = "all" | "photos" | "milestones";

export interface MonthGroup {
  year: number;
  month: number;
  label: string;
  entries: JournalEntry[];
}

// ──────────────────────────────────────────────
// Age Calculation Helper
// ──────────────────────────────────────────────

/**
 * Calculate a human-readable dog age label from DOB and a target date.
 *
 * Rules from PRD:
 * - Under 12 weeks: "X weeks"
 * - 12 weeks – 6 months: "X weeks" or "X months" (whichever is cleaner)
 * - 6 months – 2 years: "X months"
 * - 2+ years: "X years, Y months"
 *
 * Returns null if DOB is unknown.
 */
export function calculateDogAgeLabel(
  dateOfBirth: string | null | undefined,
  entryDate: string
): string | null {
  if (!dateOfBirth) return null;

  const dob = new Date(dateOfBirth);
  const entry = new Date(entryDate);
  const diffMs = entry.getTime() - dob.getTime();

  if (diffMs < 0) return null;

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths =
    (entry.getFullYear() - dob.getFullYear()) * 12 +
    (entry.getMonth() - dob.getMonth());
  const diffYears = Math.floor(diffMonths / 12);
  const remainingMonths = diffMonths % 12;

  // Under 12 weeks
  if (diffWeeks < 12) {
    return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""}`;
  }

  // 12 weeks – 6 months
  if (diffMonths < 6) {
    return `${diffMonths} month${diffMonths !== 1 ? "s" : ""}`;
  }

  // 6 months – 2 years
  if (diffYears < 2) {
    return `${diffMonths} month${diffMonths !== 1 ? "s" : ""}`;
  }

  // 2+ years
  if (remainingMonths === 0) {
    return `${diffYears} year${diffYears !== 1 ? "s" : ""}`;
  }
  return `${diffYears} year${diffYears !== 1 ? "s" : ""}, ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`;
}

/**
 * Get the DOB from available stores (dog → onboarding).
 * Utility type for callers to know what to pass.
 */
export interface DobSource {
  dogDateOfBirth: string | null | undefined;
  onboardingDateOfBirth: string | null | undefined;
  onboardingAgeMonths: number | null | undefined;
}

/**
 * Resolve the best available DOB from multiple sources.
 */
export function resolveDateOfBirth(sources: DobSource): string | null {
  if (sources.dogDateOfBirth) return sources.dogDateOfBirth;
  if (sources.onboardingDateOfBirth) return sources.onboardingDateOfBirth;

  // Estimate from ageMonths
  if (sources.onboardingAgeMonths != null) {
    const now = new Date();
    now.setMonth(now.getMonth() - sources.onboardingAgeMonths);
    return now.toISOString().split("T")[0]!;
  }

  return null;
}
