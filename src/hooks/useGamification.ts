/**
 * useGamification Hook — PRD-04
 *
 * Orchestrates XP, levels, GBS, achievements, and challenges.
 * Bridges trainingStore completions → gamification effects.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useGamificationStore } from "@/stores/gamificationStore";
import { useTrainingStore } from "@/stores/trainingStore";
import { useChatStore } from "@/stores/chatStore";
import { useDogStore } from "@/stores/dogStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { calculateGBS } from "@/lib/gbsCalculator";
import {
  checkAchievements,
  type AchievementContext,
} from "@/lib/achievementChecker";
import type { ExerciseCategory } from "@/types/training";
import type { Achievement, LevelDefinition } from "@/types/gamification";
import { XP_VALUES, getGbsLabel, WEEKLY_CHALLENGES } from "@/types/gamification";
import { ALL_ACHIEVEMENTS } from "@/data/achievementData";

// Build exerciseId → category map from exercises.json
import exercisesData from "@/data/exercises.json";

const exerciseCategoryMap = new Map<string, ExerciseCategory>();
for (const ex of exercisesData as Array<{ id: string; category: string }>) {
  exerciseCategoryMap.set(ex.id, ex.category as ExerciseCategory);
}

interface UseGamificationReturn {
  // XP
  totalXp: number;
  dailyXp: number;
  dailyXpProgress: number;
  dailyXpTarget: number;

  // Level
  level: number;
  levelTitle: string;
  levelProgress: number;
  isMaxLevel: boolean;

  // GBS
  goodBoyScore: number;
  gbsLabel: string;
  gbsDimensions: {
    obedience: number;
    behavior: number;
    socialization: number;
    leashRealWorld: number;
    consistency: number;
  };

  // Streak
  currentStreak: number;
  longestStreak: number;
  freezesAvailable: number;

  // Achievements
  totalAchievements: number;
  unlockedCount: number;

  // Challenge
  activeChallenge: {
    title: string;
    description: string;
    progress: number;
    target: number;
    xpReward: number;
    completed: boolean;
  } | null;

  // Celebrations
  pendingCelebration: Achievement | null;
  pendingLevelUp: LevelDefinition | null;
  dismissCelebration: () => void;
  dismissLevelUp: () => void;

  // Actions
  onExerciseCompleted: (
    exerciseId: string,
    planExerciseId: string,
    xpEarned: number,
    rating?: number
  ) => void;
  recalculateGbs: () => void;
}

export function useGamification(): UseGamificationReturn {
  // Individual selectors → stable refs, prevents render loops
  const activeDogId = useDogStore((s) => s.activeDogId);
  const dogs = useDogStore((s) => s.dogs);
  const dog = useMemo(
    () => dogs.find((d) => d.id === activeDogId) ?? null,
    [dogs, activeDogId]
  );
  const onboarding = useOnboardingStore((s) => s.data);

  // Training store
  const completions = useTrainingStore((s) => s.completions);
  const streak = useTrainingStore((s) => s.streak);
  const plan = useTrainingStore((s) => s.plan);

  // Chat store
  const chatMessages = useChatStore((s) => s.messages);

  // Gamification store
  const totalXp = useGamificationStore((s) => s.totalXp);
  const dailyXp = useGamificationStore((s) => s.dailyXp);
  const getDailyXpProgress = useGamificationStore((s) => s.getDailyXpProgress);
  const getLevelInfo = useGamificationStore((s) => s.getLevelInfo);
  const goodBoyScore = useGamificationStore((s) => s.goodBoyScore);
  const gbsDimensions = useGamificationStore((s) => s.gbsDimensions);
  const streakData = useGamificationStore((s) => s.streak);
  const unlockedAchievements = useGamificationStore(
    (s) => s.unlockedAchievements
  );
  const activeChallenge = useGamificationStore((s) => s.activeChallenge);
  const pendingCelebrations = useGamificationStore(
    (s) => s.pendingCelebrations
  );
  const pendingLevelUp = useGamificationStore((s) => s.pendingLevelUp);

  const earnXp = useGamificationStore((s) => s.earnXp);
  const updateGbs = useGamificationStore((s) => s.updateGbs);
  const updateStreak = useGamificationStore((s) => s.updateStreak);
  const unlockAchievement = useGamificationStore((s) => s.unlockAchievement);
  const updateAchievementProgress = useGamificationStore(
    (s) => s.updateAchievementProgress
  );
  const popCelebration = useGamificationStore((s) => s.popCelebration);
  const popLevelUpAction = useGamificationStore((s) => s.popLevelUp);
  const checkDailyReset = useGamificationStore((s) => s.checkDailyReset);
  const setActiveChallenge = useGamificationStore((s) => s.setActiveChallenge);
  const getUnlockedSlugs = useGamificationStore((s) => s.getUnlockedSlugs);

  // Reset daily XP on mount and when navigating
  useEffect(() => {
    checkDailyReset();
  }, []);

  // Sync streak from trainingStore → gamificationStore
  const prevStreakRef = useRef(streak);
  useEffect(() => {
    if (streak !== prevStreakRef.current) {
      const today = new Date().toISOString().split("T")[0]!;
      updateStreak(streak, today);
      prevStreakRef.current = streak;
    }
  }, [streak]);

  // Set weekly challenge when plan week changes
  useEffect(() => {
    if (plan?.currentWeek && !activeChallenge) {
      setActiveChallenge(plan.currentWeek);
    }
  }, [plan?.currentWeek]);

  // ── Level info ──
  const levelInfo = getLevelInfo();

  // ── GBS label ──
  const gbsLabel = getGbsLabel(goodBoyScore);

  // ── Active challenge info ──
  const challengeInfo = activeChallenge
    ? (() => {
        const def = WEEKLY_CHALLENGES.find(
          (c) => c.id === activeChallenge.challengeId
        );
        if (!def) return null;
        return {
          title: def.title,
          description: def.description,
          progress: activeChallenge.progress,
          target: activeChallenge.target,
          xpReward: def.xpReward,
          completed: activeChallenge.status === "completed",
        };
      })()
    : null;

  // ── All achievements count ──
  const totalAchievements = ALL_ACHIEVEMENTS.length;

  // ── Exercise completed handler ──
  const onExerciseCompleted = useCallback(
    (
      exerciseId: string,
      planExerciseId: string,
      xpEarned: number,
      rating?: number
    ) => {
      // 1. Earn XP
      earnXp(xpEarned, "exercise", planExerciseId, `+${xpEarned} XP`);

      // 2. Earn rating XP
      if (rating) {
        earnXp(
          XP_VALUES.rate_exercise,
          "rating",
          `rating-${planExerciseId}`,
          `+${XP_VALUES.rate_exercise} XP`
        );
      }

      // 3. Check daily completion bonus
      const todayCompletions = completions.filter((c) => {
        const date = c.completedAt.split("T")[0];
        const today = new Date().toISOString().split("T")[0];
        return date === today;
      });
      // +1 because the current completion may not be in the store yet
      const todayExercises = useTrainingStore.getState().getTodayExercises();
      const allDone = todayExercises.every(
        (e) => e.status === "completed"
      );
      if (allDone && todayExercises.length > 0) {
        earnXp(
          XP_VALUES.daily_complete,
          "daily_bonus",
          `daily-${new Date().toISOString().split("T")[0]}`,
          `+${XP_VALUES.daily_complete} XP Daily Bonus!`
        );
      }

      // 4. Recalculate GBS
      recalculateGbs();

      // 5. Check achievements
      runAchievementCheck();
    },
    [completions]
  );

  // ── Recalculate GBS ──
  const recalculateGbs = useCallback(() => {
    const currentCompletions = useTrainingStore.getState().completions;
    const currentStreak = useTrainingStore.getState().streak;
    const currentPlan = useTrainingStore.getState().plan;

    const result = calculateGBS(
      {
        completions: currentCompletions,
        exerciseCategories: exerciseCategoryMap,
        streak: currentStreak,
        totalActiveDays: streakData.totalActiveDays,
        planWeek: currentPlan?.currentWeek ?? 1,
      },
      goodBoyScore
    );

    updateGbs(result.score, result.dimensions);
  }, [goodBoyScore, streakData.totalActiveDays]);

  // ── Achievement check ──
  const runAchievementCheck = useCallback(() => {
    const state = useTrainingStore.getState();
    const gamState = useGamificationStore.getState();
    const chatState = useChatStore.getState();

    const today = new Date().toISOString().split("T")[0];
    const exercisesCompletedToday = state.completions.filter(
      (c) => c.completedAt.split("T")[0] === today
    ).length;

    const ctx: AchievementContext = {
      totalExercisesCompleted: state.completions.length,
      completions: state.completions,
      exerciseCategories: exerciseCategoryMap,
      planComplete: state.plan?.status === "completed",
      planProgressPercent: state.plan
        ? Math.round(
            (state.completions.length /
              Math.max(
                state.plan.weeks.reduce(
                  (sum, w) =>
                    sum +
                    w.days.reduce((ds, d) => ds + d.exercises.length, 0),
                  0
                ),
                1
              )) *
              100
          )
        : 0,
      currentStreak: state.streak,
      goodBoyScore: gamState.goodBoyScore,
      totalChatMessages: chatState.messages.filter(
        (m) => m.role === "user"
      ).length,
      totalPhotos: 0,
      totalNotes: 0,
      totalRatings: state.completions.filter(
        (c) => c.rating != null
      ).length,
      totalShares: 0,
      totalReferrals: 0,
      totalChallengesCompleted: gamState.activeChallenge?.status === "completed" ? 1 : 0,
      consecutiveChallenges: 0,
      currentHour: new Date().getHours(),
      exercisesCompletedToday,
      breed: dog?.breed ?? onboarding?.breed ?? null,
      unlockedSlugs: gamState.getUnlockedSlugs(),
    };

    const result = checkAchievements(ctx);

    // Unlock new achievements
    for (const achievement of result.newlyUnlocked) {
      unlockAchievement(achievement);
    }

    // Update progress
    for (const prog of result.progressUpdates) {
      updateAchievementProgress(prog.slug, prog.current, prog.target);
    }
  }, []);

  // ── Celebration handlers ──
  const dismissCelebration = useCallback(() => {
    popCelebration();
  }, []);

  const dismissLevelUp = useCallback(() => {
    popLevelUpAction();
  }, []);

  return {
    totalXp,
    dailyXp,
    dailyXpProgress: getDailyXpProgress(),
    dailyXpTarget: 50,

    level: levelInfo.level,
    levelTitle: levelInfo.title,
    levelProgress: levelInfo.progress,
    isMaxLevel: levelInfo.isMaxLevel,

    goodBoyScore,
    gbsLabel,
    gbsDimensions,

    currentStreak: streakData.currentStreak,
    longestStreak: streakData.longestStreak,
    freezesAvailable: streakData.freezesAvailable,

    totalAchievements,
    unlockedCount: unlockedAchievements.length,

    activeChallenge: challengeInfo,

    pendingCelebration: pendingCelebrations.length > 0
      ? pendingCelebrations[0] ?? null
      : null,
    pendingLevelUp,
    dismissCelebration,
    dismissLevelUp,

    onExerciseCompleted,
    recalculateGbs,
  };
}
