/**
 * Gamification system types — PRD-04
 * XP, streaks, GBS, achievements, levels, weekly challenges.
 */

// ──────────────────────────────────────────────
// XP System
// ──────────────────────────────────────────────

export type XpSource =
  | "exercise"
  | "daily_bonus"
  | "rating"
  | "notes"
  | "photo"
  | "chat"
  | "challenge"
  | "milestone"
  | "health"
  | "referral"
  | "streak_milestone"
  | "achievement";

export interface XpEvent {
  id: string;
  amount: number;
  source: XpSource;
  sourceId: string | null;
  earnedAt: string;
  label: string; // "+15 XP" display text
}

export const DAILY_XP_TARGET = 50;
export const MAX_CHAT_XP_PER_DAY = 3;

/** XP values per action (PRD-04 §3) */
export const XP_VALUES = {
  exercise_primary: 15,
  exercise_reinforcement: 10,
  exercise_bonus: 20,
  exercise_trick: 20,
  daily_complete: 25,
  rate_exercise: 2,
  add_notes: 3,
  upload_photo: 5,
  chat_question: 3,
  weekly_challenge: 50,
  weekly_milestone: 75,
  log_health: 5,
  referral: 100,
} as const;

// ──────────────────────────────────────────────
// Level System
// ──────────────────────────────────────────────

export interface LevelDefinition {
  level: number;
  title: string;
  xpRequired: number;
  cumulativeXp: number;
}

export const LEVEL_DEFINITIONS: LevelDefinition[] = [
  { level: 1, title: "Puppy Newbie", xpRequired: 0, cumulativeXp: 0 },
  { level: 2, title: "Puppy Apprentice", xpRequired: 100, cumulativeXp: 100 },
  { level: 3, title: "Puppy Student", xpRequired: 250, cumulativeXp: 350 },
  { level: 4, title: "Junior Trainer", xpRequired: 500, cumulativeXp: 850 },
  { level: 5, title: "Trainer", xpRequired: 750, cumulativeXp: 1600 },
  { level: 6, title: "Senior Trainer", xpRequired: 1000, cumulativeXp: 2600 },
  { level: 7, title: "Expert Trainer", xpRequired: 1500, cumulativeXp: 4100 },
  { level: 8, title: "Master Trainer", xpRequired: 2000, cumulativeXp: 6100 },
  { level: 9, title: "Pack Leader", xpRequired: 3000, cumulativeXp: 9100 },
  { level: 10, title: "PupPal Legend", xpRequired: 5000, cumulativeXp: 14100 },
];

// ──────────────────────────────────────────────
// Streak System
// ──────────────────────────────────────────────

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null; // ISO date (YYYY-MM-DD)
  freezesAvailable: number;
  freezesUsedThisWeek: number;
  freezeLastReset: string | null; // ISO date
  totalActiveDays: number;
}

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90, 180, 365] as const;

export type StreakTier =
  | "none"
  | "starter"   // 1–6
  | "weekly"    // 7–13
  | "biweekly"  // 14–29
  | "monthly"   // 30–59
  | "rare"      // 60–89
  | "elite";    // 90+

export function getStreakTier(streak: number): StreakTier {
  if (streak <= 0) return "none";
  if (streak < 7) return "starter";
  if (streak < 14) return "weekly";
  if (streak < 30) return "biweekly";
  if (streak < 60) return "monthly";
  if (streak < 90) return "rare";
  return "elite";
}

// ──────────────────────────────────────────────
// Good Boy Score (GBS)
// ──────────────────────────────────────────────

export interface GbsDimensions {
  obedience: number;    // 0–100, weight 30%
  behavior: number;     // 0–100, weight 25%
  socialization: number; // 0–100, weight 15%
  leashRealWorld: number; // 0–100, weight 15%
  consistency: number;  // 0–100, weight 15%
}

export const GBS_WEIGHTS: Record<keyof GbsDimensions, number> = {
  obedience: 0.30,
  behavior: 0.25,
  socialization: 0.15,
  leashRealWorld: 0.15,
  consistency: 0.15,
};

export type GbsLabel =
  | "Getting Started"
  | "Making Progress"
  | "Looking Good"
  | "Well-Trained Pup"
  | "Good Boy Champion";

export function getGbsLabel(score: number): GbsLabel {
  if (score < 15) return "Getting Started";
  if (score < 35) return "Making Progress";
  if (score < 60) return "Looking Good";
  if (score < 80) return "Well-Trained Pup";
  return "Good Boy Champion";
}

// ──────────────────────────────────────────────
// Achievement System
// ──────────────────────────────────────────────

export type AchievementCategory =
  | "training"
  | "streak"
  | "score"
  | "engagement"
  | "challenge"
  | "tricks"
  | "breed"
  | "health"
  | "secret";

export type AchievementTriggerType =
  | "exercise_complete"
  | "skill_mastery"
  | "category_complete"
  | "plan_complete"
  | "streak_length"
  | "score_threshold"
  | "count_threshold"
  | "referral"
  | "plan_progress"
  | "breed_percentile"
  | "health_compliance"
  | "time_based"
  | "daily_count";

export type AchievementRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary";

export interface Achievement {
  slug: string;
  name: string;
  description: string;
  category: AchievementCategory;
  iconName: string;
  xpBonus: number;
  triggerType: AchievementTriggerType;
  triggerConfig: Record<string, unknown>;
  isBreedSpecific: boolean;
  breedTemplate: string | null;
  sortOrder: number;
  buddyMessage: string;
  shareText: string;
  rarity: AchievementRarity;
  progressLabel: string | null;
}

export interface UnlockedAchievement {
  slug: string;
  unlockedAt: string;
  xpEarned: number;
  shared: boolean;
}

export interface AchievementProgress {
  slug: string;
  current: number;
  target: number;
}

// ──────────────────────────────────────────────
// Weekly Challenges
// ──────────────────────────────────────────────

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  targetUnit: string;
  xpReward: number;
  weekNumber: number; // maps to plan week
}

export interface UserChallenge {
  challengeId: string;
  progress: number;
  target: number;
  status: "active" | "completed" | "expired";
  completedAt: string | null;
  xpEarned: number | null;
}

export const WEEKLY_CHALLENGES: WeeklyChallenge[] = [
  { id: "wc-01", title: "First Week Hero", description: "Complete every daily exercise this week", target: 7, targetUnit: "days", xpReward: 75, weekNumber: 1 },
  { id: "wc-02", title: "Sit-a-thon", description: "Practice sit in 5 different locations", target: 5, targetUnit: "locations", xpReward: 50, weekNumber: 2 },
  { id: "wc-03", title: "Patience Builder", description: "Hold a 10+ second stay 3 times", target: 3, targetUnit: "stays", xpReward: 50, weekNumber: 3 },
  { id: "wc-04", title: "Social Hour", description: "Expose to 3 new people or environments", target: 3, targetUnit: "exposures", xpReward: 50, weekNumber: 4 },
  { id: "wc-05", title: "Leash Legend", description: "Complete 4 leash training exercises", target: 4, targetUnit: "exercises", xpReward: 50, weekNumber: 5 },
  { id: "wc-06", title: "Photo Week", description: "Upload 5 progress photos", target: 5, targetUnit: "photos", xpReward: 50, weekNumber: 6 },
  { id: "wc-07", title: "Buddy's Challenge", description: "Ask Buddy 5 training questions", target: 5, targetUnit: "questions", xpReward: 50, weekNumber: 7 },
  { id: "wc-08", title: "Recall Rally", description: "Practice recall in 5 different rooms", target: 5, targetUnit: "rooms", xpReward: 50, weekNumber: 8 },
  { id: "wc-09", title: "Impulse Master", description: "Complete 3 impulse control exercises", target: 3, targetUnit: "exercises", xpReward: 50, weekNumber: 9 },
  { id: "wc-10", title: "Real World Test", description: "Try 1 exercise in a new public place", target: 1, targetUnit: "sessions", xpReward: 75, weekNumber: 10 },
  { id: "wc-11", title: "Trick Week", description: "Teach your pup 1 fun trick", target: 1, targetUnit: "tricks", xpReward: 50, weekNumber: 11 },
  { id: "wc-12", title: "Graduation", description: "Reach a GBS of 70+", target: 70, targetUnit: "points", xpReward: 100, weekNumber: 12 },
];
