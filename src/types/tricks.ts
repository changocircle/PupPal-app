/**
 * Trick Library Types — PRD-03 §6
 *
 * Types for trick packs, individual tricks, and user progress.
 */

/** Progression levels for each trick (3-star system) */
export type TrickLevel = 'learning' | 'fluent' | 'mastered';

export const TRICK_LEVEL_META: Record<TrickLevel, { label: string; stars: number; emoji: string; xp: number }> = {
  learning: { label: 'Learning', stars: 1, emoji: '⭐', xp: 20 },
  fluent:   { label: 'Fluent',   stars: 2, emoji: '⭐⭐', xp: 25 },
  mastered: { label: 'Mastered', stars: 3, emoji: '⭐⭐⭐', xp: 35 },
};

/** Unlock conditions for trick packs */
export type UnlockCondition = 'plan_week' | 'plan_complete' | 'tricks_completed' | 'manual';

/** Trick Pack from trickPacks.json */
export interface TrickPack {
  id: string;
  name: string;
  description: string;
  slug: string;
  icon: string;
  unlock_condition: UnlockCondition;
  unlock_value: number | null;
  sort_order: number;
  exercises: string[];  // trick IDs
  total_tricks: number;
  active: boolean;
}

/** Breed-specific modifiers */
export interface BreedModifiers {
  brachycephalic: string | null;
  large_breeds: string | null;
  small_breeds: string | null;
  high_energy: string | null;
}

/** Progression level descriptions */
export interface ProgressionLevels {
  level_1: string;
  level_2: string;
  level_3: string;
}

/** Individual Trick from tricks.json */
export interface Trick {
  id: string;
  category: string;
  subcategory: string;
  is_trick: boolean;
  trick_pack_id: string;
  title: string;
  overview: string;
  time_minutes: number;
  difficulty: number;
  supplies: string[];
  steps: string[];
  success_criteria: string;
  pro_tips: string[];
  common_mistakes: string[];
  troubleshooting: string;
  next_step: string | null;
  prerequisites: string[];
  share_moment: string;
  breed_modifiers: BreedModifiers;
  progression_levels: ProgressionLevels;
}

/** User's progress on a single trick */
export interface TrickProgress {
  trickId: string;
  packId: string;
  currentLevel: TrickLevel;
  completedLevels: TrickLevel[];
  startedAt: string;
  lastPracticedAt: string;
  totalPracticeCount: number;
}

/** User's progress on a pack */
export interface PackProgress {
  packId: string;
  unlocked: boolean;
  unlockedAt: string | null;
  tricksCompleted: number;  // tricks with at least level 1
  tricksMastered: number;   // tricks at level 3
}

/** FREE_TRICK_ID — the one trick available to free users (PRD-07 §3) */
export const FREE_TRICK_ID = 'trick-starter-001'; // Shake / Paw
