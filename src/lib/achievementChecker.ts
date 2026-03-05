/**
 * Achievement Checker — PRD-04 §6
 *
 * Evaluates all achievement triggers against current user state.
 * Called after every exercise completion, streak update, and score change.
 * Returns newly unlocked achievements (idempotent — skips already unlocked).
 */

import type {
  Achievement,
  UnlockedAchievement,
} from "@/types/gamification";
import type { ExerciseCompletion, ExerciseCategory } from "@/types/training";
import { ALL_ACHIEVEMENTS } from "@/data/achievementData";

// ── Context passed to the checker ──
export interface AchievementContext {
  // Training progress
  totalExercisesCompleted: number;
  completions: ExerciseCompletion[];
  exerciseCategories: Map<string, ExerciseCategory>; // exerciseId → category
  planComplete: boolean;
  planProgressPercent: number; // 0–100

  // Streaks
  currentStreak: number;

  // Good Boy Score
  goodBoyScore: number;

  // Engagement counts
  totalChatMessages: number;
  totalPhotos: number;
  totalNotes: number;
  totalRatings: number;
  totalShares: number;
  totalReferrals: number;

  // Challenges
  totalChallengesCompleted: number;
  consecutiveChallenges: number;

  // Time-based
  currentHour: number; // 0–23

  // Daily counts
  exercisesCompletedToday: number;

  // Breed (optional)
  breed: string | null;

  // Already unlocked (slugs)
  unlockedSlugs: Set<string>;
}

export interface CheckResult {
  newlyUnlocked: Achievement[];
  progressUpdates: Array<{
    slug: string;
    current: number;
    target: number;
  }>;
}

/**
 * Check all achievements against current context.
 * Returns only newly unlocked achievements (not already in unlockedSlugs).
 */
export function checkAchievements(ctx: AchievementContext): CheckResult {
  const newlyUnlocked: Achievement[] = [];
  const progressUpdates: CheckResult["progressUpdates"] = [];

  for (const achievement of ALL_ACHIEVEMENTS) {
    // Skip already unlocked
    if (ctx.unlockedSlugs.has(achievement.slug)) continue;

    const result = evaluateTrigger(achievement, ctx);

    if (result.unlocked) {
      newlyUnlocked.push(achievement);
    } else if (result.progress !== undefined) {
      progressUpdates.push({
        slug: achievement.slug,
        current: result.progress.current,
        target: result.progress.target,
      });
    }
  }

  return { newlyUnlocked, progressUpdates };
}

// ── Trigger Evaluation ──

interface TriggerResult {
  unlocked: boolean;
  progress?: { current: number; target: number };
}

function evaluateTrigger(
  achievement: Achievement,
  ctx: AchievementContext
): TriggerResult {
  const config = achievement.triggerConfig;

  switch (achievement.triggerType) {
    case "exercise_complete": {
      const target = (config.exercise_count as number) ?? 1;
      return {
        unlocked: ctx.totalExercisesCompleted >= target,
        progress: { current: ctx.totalExercisesCompleted, target },
      };
    }

    case "skill_mastery": {
      // Check if all exercises in a specific skill/category are completed with avg rating ≥ min
      const keyword = (config.keyword as string) ?? "";
      const minRating = (config.min_avg_rating as number) ?? 4;

      // Find completions whose exerciseId maps to the right category and has the keyword
      const relevantCompletions = ctx.completions.filter((c) => {
        const cat = ctx.exerciseCategories.get(c.exerciseId);
        return cat && c.exerciseId.toLowerCase().includes(keyword.toLowerCase());
      });

      const avgRating =
        relevantCompletions.length > 0
          ? relevantCompletions.reduce((sum, c) => sum + (c.rating ?? 3), 0) /
            relevantCompletions.length
          : 0;

      // Need at least 3 exercises to "master" a skill
      const minCount = 3;
      const unlocked =
        relevantCompletions.length >= minCount && avgRating >= minRating;

      return {
        unlocked,
        progress: { current: relevantCompletions.length, target: minCount },
      };
    }

    case "category_complete": {
      const category = config.category as ExerciseCategory | undefined;
      if (!category) return { unlocked: false };

      // Count unique completed exercises in category
      const completedInCategory = new Set<string>();
      for (const c of ctx.completions) {
        if (ctx.exerciseCategories.get(c.exerciseId) === category) {
          completedInCategory.add(c.exerciseId);
        }
      }

      // Need significant coverage (~80% of category exercises)
      const target = Math.max(
        Math.round(getCategoryTotal(category) * 0.8),
        3
      );

      return {
        unlocked: completedInCategory.size >= target,
        progress: { current: completedInCategory.size, target },
      };
    }

    case "plan_complete":
      return { unlocked: ctx.planComplete };

    case "streak_length": {
      const target = (config.streak_days as number) ?? 7;
      return {
        unlocked: ctx.currentStreak >= target,
        progress: { current: ctx.currentStreak, target },
      };
    }

    case "score_threshold": {
      const target = (config.score as number) ?? 50;
      return {
        unlocked: ctx.goodBoyScore >= target,
        progress: { current: ctx.goodBoyScore, target },
      };
    }

    case "count_threshold": {
      const { metric, count: target } = config as {
        metric?: string;
        count?: number;
      };
      const targetCount = target ?? 1;
      const current = getMetricCount(metric ?? "", ctx);

      return {
        unlocked: current >= targetCount,
        progress: { current, target: targetCount },
      };
    }

    case "referral": {
      const target = (config.count as number) ?? 1;
      return {
        unlocked: ctx.totalReferrals >= target,
        progress: { current: ctx.totalReferrals, target },
      };
    }

    case "plan_progress": {
      const target = (config.percent as number) ?? 50;
      return {
        unlocked: ctx.planProgressPercent >= target,
        progress: {
          current: Math.round(ctx.planProgressPercent),
          target,
        },
      };
    }

    case "breed_percentile":
      // Requires server-side breed comparison — not achievable locally
      return { unlocked: false };

    case "health_compliance":
      // Will be wired in Phase 5 (Health)
      return { unlocked: false };

    case "time_based": {
      const requiredHour = config.hour_range as
        | { start: number; end: number }
        | undefined;
      if (!requiredHour) return { unlocked: false };
      const { start, end } = requiredHour;
      const h = ctx.currentHour;

      // Handle overnight ranges (e.g. 23–5)
      const inRange =
        start <= end ? h >= start && h < end : h >= start || h < end;

      // Must have completed an exercise during this time
      return {
        unlocked:
          inRange && ctx.exercisesCompletedToday > 0,
      };
    }

    case "daily_count": {
      const target = (config.count as number) ?? 5;
      return {
        unlocked: ctx.exercisesCompletedToday >= target,
        progress: { current: ctx.exercisesCompletedToday, target },
      };
    }

    default:
      return { unlocked: false };
  }
}

// ── Helpers ──

function getMetricCount(metric: string, ctx: AchievementContext): number {
  switch (metric) {
    case "chat_messages":
      return ctx.totalChatMessages;
    case "photos":
      return ctx.totalPhotos;
    case "notes":
      return ctx.totalNotes;
    case "ratings":
      return ctx.totalRatings;
    case "shares":
      return ctx.totalShares;
    case "referrals":
      return ctx.totalReferrals;
    case "challenges_completed":
      return ctx.totalChallengesCompleted;
    case "consecutive_challenges":
      return ctx.consecutiveChallenges;
    case "exercises":
      return ctx.totalExercisesCompleted;
    case "tricks":
      // Count trick exercises completed
      return ctx.completions.filter((c) => {
        const cat = ctx.exerciseCategories.get(c.exerciseId);
        return cat === "tricks";
      }).length;
    case "trick_packs":
      // Placeholder — trick pack completion tracking
      return 0;
    default:
      return 0;
  }
}

function getCategoryTotal(category: ExerciseCategory): number {
  const totals: Partial<Record<ExerciseCategory, number>> = {
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
  return totals[category] ?? 10;
}
