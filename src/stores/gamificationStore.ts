/**
 * Gamification Store, Zustand + AsyncStorage
 * PRD-04: XP events, levels, GBS, achievements, streaks, weekly challenges.
 *
 * Local-first: all state persisted via AsyncStorage.
 * Reads exercise data from trainingStore for GBS/achievement calculations.
 *
 * Sync-aware: exposes _syncMeta and _mergeGamification for the sync layer.
 * The sync layer (gamificationSync.ts) is bridged via useGamificationSync hook
 * to avoid circular dependencies.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  XpEvent,
  XpSource,
  LevelDefinition,
  GbsDimensions,
  UnlockedAchievement,
  AchievementProgress,
  UserChallenge,
  StreakData,
} from "@/types/gamification";
import {
  LEVEL_DEFINITIONS,
  DAILY_XP_TARGET,
  WEEKLY_CHALLENGES,
  STREAK_MILESTONES,
} from "@/types/gamification";
import type { Achievement } from "@/types/gamification";

// ──────────────────────────────────────────────
// Sync Metadata (transient, not persisted)
// ──────────────────────────────────────────────

export type GamificationSyncStatus = "idle" | "syncing" | "error";

export interface GamificationSyncMeta {
  status: GamificationSyncStatus;
  lastSyncedAt: string | null;
  pendingCount: number;
}

const DEFAULT_SYNC_META: GamificationSyncMeta = {
  status: "idle",
  lastSyncedAt: null,
  pendingCount: 0,
};

// ──────────────────────────────────────────────
// State Shape
// ──────────────────────────────────────────────

interface GamificationState {
  // ── XP ──
  totalXp: number;
  dailyXp: number;
  dailyXpDate: string | null; // ISO date
  xpEvents: XpEvent[];

  // ── Level ──
  currentLevel: number;
  currentLevelTitle: string;

  // ── Good Boy Score ──
  goodBoyScore: number;
  gbsDimensions: GbsDimensions;
  gbsLastCalculated: string | null;

  // ── Streak (enhanced from trainingStore) ──
  streak: StreakData;

  // ── Achievements ──
  unlockedAchievements: UnlockedAchievement[];
  achievementProgress: AchievementProgress[];
  /** Queue of newly unlocked achievements to show celebrations */
  pendingCelebrations: Achievement[];

  // ── Weekly Challenges ──
  activeChallenge: UserChallenge | null;

  // ── Level-up pending ──
  pendingLevelUp: LevelDefinition | null;

  // ─── Actions ───

  /** Add XP from any source. Returns new total. */
  earnXp: (
    amount: number,
    source: XpSource,
    sourceId?: string,
    label?: string
  ) => number;

  /** Check and reset daily XP if it's a new day. */
  checkDailyReset: () => void;

  /** Get daily XP progress (0-1) */
  getDailyXpProgress: () => number;

  /** Get current level info */
  getLevelInfo: () => {
    level: number;
    title: string;
    currentXp: number;
    xpForNextLevel: number;
    progress: number; // 0-1
    isMaxLevel: boolean;
  };

  /** Update GBS score */
  updateGbs: (
    score: number,
    dimensions: GbsDimensions
  ) => void;

  /** Update streak data (called from training completions) */
  updateStreak: (currentStreak: number, lastActiveDate: string) => void;

  /** Use a streak freeze */
  useStreakFreeze: () => boolean;

  /** Reset weekly freezes (called on Monday) */
  resetWeeklyFreezes: () => void;

  /** Unlock an achievement */
  unlockAchievement: (achievement: Achievement) => void;

  /** Update progress for a specific achievement */
  updateAchievementProgress: (
    slug: string,
    current: number,
    target: number
  ) => void;

  /** Pop the next celebration from queue */
  popCelebration: () => Achievement | null;

  /** Pop pending level-up */
  popLevelUp: () => LevelDefinition | null;

  /** Check if an achievement is unlocked */
  isAchievementUnlocked: (slug: string) => boolean;

  /** Get progress for an achievement */
  getAchievementProgress: (
    slug: string
  ) => AchievementProgress | undefined;

  /** Set active weekly challenge */
  setActiveChallenge: (weekNumber: number) => void;

  /** Increment challenge progress */
  incrementChallengeProgress: (amount?: number) => void;

  /** Complete the active challenge */
  completeChallenge: () => void;

  /** Get all unlocked achievement slugs (Set) */
  getUnlockedSlugs: () => Set<string>;

  /** Reset (for testing) */
  resetGamification: () => void;

  // ── Sync-layer actions (prefixed with _ to indicate internal use) ──

  _syncMeta: GamificationSyncMeta;
  _setSyncMeta: (updates: Partial<GamificationSyncMeta>) => void;

  /**
   * Merge gamification data from sync.
   * Called by gamificationSync.ts during pull phase.
   * XP and streak values use max-wins logic to never lose progress.
   */
  _mergeGamification: (data: {
    totalXp: number;
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string | null;
    totalActiveDays: number;
    goodBoyScore: number;
    gbsDimensions: GbsDimensions;
    gbsLastCalculated: string | null;
    xpEvents: XpEvent[];
    unlockedAchievements: UnlockedAchievement[];
    achievementProgress: AchievementProgress[];
    activeChallenge: UserChallenge | null;
  }) => void;
}

// ──────────────────────────────────────────────
// Initial State
// ──────────────────────────────────────────────

const INITIAL_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  freezesAvailable: 1,
  freezesUsedThisWeek: 0,
  freezeLastReset: null,
  totalActiveDays: 0,
};

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function computeLevel(totalXp: number): LevelDefinition {
  let found: LevelDefinition = LEVEL_DEFINITIONS[0]!;
  for (const def of LEVEL_DEFINITIONS) {
    if (totalXp >= def.cumulativeXp) {
      found = def;
    } else {
      break;
    }
  }
  return found;
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0]!;
}

// ──────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      totalXp: 0,
      dailyXp: 0,
      dailyXpDate: null,
      xpEvents: [],
      currentLevel: 1,
      currentLevelTitle: "Puppy Newbie",
      goodBoyScore: 0,
      gbsDimensions: {
        obedience: 0,
        behavior: 0,
        socialization: 0,
        leashRealWorld: 0,
        consistency: 0,
      },
      gbsLastCalculated: null,
      streak: { ...INITIAL_STREAK },
      unlockedAchievements: [],
      achievementProgress: [],
      pendingCelebrations: [],
      activeChallenge: null,
      pendingLevelUp: null,
      _syncMeta: { ...DEFAULT_SYNC_META },

      // ── XP ──
      earnXp: (amount, source, sourceId, label) => {
        const state = get();

        // Check for idempotency (same sourceId shouldn't double-earn)
        if (
          sourceId &&
          state.xpEvents.some(
            (e) => e.sourceId === sourceId && e.source === source
          )
        ) {
          return state.totalXp;
        }

        // Reset daily XP if new day
        const today = todayISO();
        const isNewDay = state.dailyXpDate !== today;

        const event: XpEvent = {
          id: `xp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          amount,
          source,
          sourceId: sourceId ?? null,
          earnedAt: new Date().toISOString(),
          label: label ?? `+${amount} points`,
        };

        const newTotal = state.totalXp + amount;
        const newDaily = (isNewDay ? 0 : state.dailyXp) + amount;

        // Check for level up
        const oldLevel: LevelDefinition = computeLevel(state.totalXp);
        const newLevel: LevelDefinition = computeLevel(newTotal);
        const leveledUp = newLevel.level > oldLevel.level;

        // Keep last 200 XP events
        const events = [...state.xpEvents, event].slice(-200);

        set({
          totalXp: newTotal,
          dailyXp: newDaily,
          dailyXpDate: today,
          xpEvents: events,
          currentLevel: newLevel.level,
          currentLevelTitle: newLevel.title,
          pendingLevelUp: leveledUp ? newLevel : state.pendingLevelUp,
        });

        return newTotal;
      },

      checkDailyReset: () => {
        const today = todayISO();
        if (get().dailyXpDate !== today) {
          set({ dailyXp: 0, dailyXpDate: today });
        }
      },

      getDailyXpProgress: () => {
        const state = get();
        const today = todayISO();
        if (state.dailyXpDate !== today) return 0;
        return Math.min(state.dailyXp / DAILY_XP_TARGET, 1.0);
      },

      getLevelInfo: () => {
        const { totalXp, currentLevel } = get();
        const currentDef =
          LEVEL_DEFINITIONS.find((d) => d.level === currentLevel) ??
          LEVEL_DEFINITIONS[0]!;
        const nextDef = LEVEL_DEFINITIONS.find(
          (d) => d.level === currentLevel + 1
        );
        const isMaxLevel = !nextDef;

        const xpIntoLevel = totalXp - currentDef!.cumulativeXp;
        const xpForNext = nextDef
          ? nextDef.cumulativeXp - currentDef!.cumulativeXp
          : 1;
        const progress = isMaxLevel
          ? 1
          : Math.min(xpIntoLevel / xpForNext, 1);

        return {
          level: currentLevel,
          title: currentDef!.title,
          currentXp: xpIntoLevel,
          xpForNextLevel: xpForNext,
          progress,
          isMaxLevel,
        };
      },

      // ── GBS ──
      updateGbs: (score, dimensions) => {
        set({
          goodBoyScore: score,
          gbsDimensions: dimensions,
          gbsLastCalculated: new Date().toISOString(),
        });
      },

      // ── Streak ──
      updateStreak: (currentStreak, lastActiveDate) => {
        const { streak } = get();
        const newLongest = Math.max(streak.longestStreak, currentStreak);
        const newActiveDays =
          lastActiveDate !== streak.lastActiveDate
            ? streak.totalActiveDays + 1
            : streak.totalActiveDays;

        set({
          streak: {
            ...streak,
            currentStreak,
            longestStreak: newLongest,
            lastActiveDate,
            totalActiveDays: newActiveDays,
          },
        });
      },

      useStreakFreeze: () => {
        const { streak } = get();
        if (streak.freezesAvailable <= 0) return false;

        set({
          streak: {
            ...streak,
            freezesAvailable: streak.freezesAvailable - 1,
            freezesUsedThisWeek: streak.freezesUsedThisWeek + 1,
          },
        });
        return true;
      },

      resetWeeklyFreezes: () => {
        set({
          streak: {
            ...get().streak,
            freezesAvailable: 1,
            freezesUsedThisWeek: 0,
            freezeLastReset: todayISO(),
          },
        });
      },

      // ── Achievements ──
      unlockAchievement: (achievement) => {
        const state = get();
        if (
          state.unlockedAchievements.some(
            (a) => a.slug === achievement.slug
          )
        ) {
          return; // idempotent
        }

        const unlocked: UnlockedAchievement = {
          slug: achievement.slug,
          unlockedAt: new Date().toISOString(),
          xpEarned: achievement.xpBonus,
          shared: false,
        };

        set({
          unlockedAchievements: [
            ...state.unlockedAchievements,
            unlocked,
          ],
          pendingCelebrations: [
            ...state.pendingCelebrations,
            achievement,
          ],
        });

        // Earn achievement XP
        state.earnXp(
          achievement.xpBonus,
          "achievement",
          `achievement-${achievement.slug}`,
          `+${achievement.xpBonus} points`
        );
      },

      updateAchievementProgress: (slug, current, target) => {
        const { achievementProgress } = get();
        const existing = achievementProgress.findIndex(
          (p) => p.slug === slug
        );

        const updated = [...achievementProgress];
        if (existing >= 0) {
          updated[existing] = { slug, current, target };
        } else {
          updated.push({ slug, current, target });
        }

        set({ achievementProgress: updated });
      },

      popCelebration: () => {
        const { pendingCelebrations } = get();
        if (pendingCelebrations.length === 0) return null;

        const [next, ...rest] = pendingCelebrations;
        set({ pendingCelebrations: rest });
        return next ?? null;
      },

      popLevelUp: () => {
        const { pendingLevelUp } = get();
        set({ pendingLevelUp: null });
        return pendingLevelUp;
      },

      isAchievementUnlocked: (slug) =>
        get().unlockedAchievements.some((a) => a.slug === slug),

      getAchievementProgress: (slug) =>
        get().achievementProgress.find((p) => p.slug === slug),

      getUnlockedSlugs: () =>
        new Set(get().unlockedAchievements.map((a) => a.slug)),

      // ── Weekly Challenges ──
      setActiveChallenge: (weekNumber) => {
        const challenge = WEEKLY_CHALLENGES.find(
          (c) => c.weekNumber === weekNumber
        );
        if (!challenge) return;

        set({
          activeChallenge: {
            challengeId: challenge.id,
            progress: 0,
            target: challenge.target,
            status: "active",
            completedAt: null,
            xpEarned: null,
          },
        });
      },

      incrementChallengeProgress: (amount = 1) => {
        const { activeChallenge } = get();
        if (!activeChallenge || activeChallenge.status !== "active") return;

        const newProgress = Math.min(
          activeChallenge.progress + amount,
          activeChallenge.target
        );
        const completed = newProgress >= activeChallenge.target;

        set({
          activeChallenge: {
            ...activeChallenge,
            progress: newProgress,
            status: completed ? "completed" : "active",
            completedAt: completed ? new Date().toISOString() : null,
          },
        });

        if (completed) {
          get().completeChallenge();
        }
      },

      completeChallenge: () => {
        const { activeChallenge, earnXp } = get();
        if (!activeChallenge) return;

        const challenge = WEEKLY_CHALLENGES.find(
          (c) => c.id === activeChallenge.challengeId
        );
        if (!challenge) return;

        set({
          activeChallenge: {
            ...activeChallenge,
            status: "completed",
            completedAt: new Date().toISOString(),
            xpEarned: challenge.xpReward,
          },
        });

        earnXp(
          challenge.xpReward,
          "challenge",
          `challenge-${challenge.id}`,
          `+${challenge.xpReward} XP`
        );
      },

      // ── Sync-layer ──

      _setSyncMeta: (updates) =>
        set((state) => ({
          _syncMeta: { ...state._syncMeta, ...updates },
        })),

      _mergeGamification: (data) => {
        const state = get();

        // XP: max-wins so we never lose progress
        const newTotalXp = Math.max(state.totalXp, data.totalXp);
        const levelDef = computeLevel(newTotalXp);

        // Streak: max-wins for counts to prevent rollback
        const newCurrentStreak = Math.max(
          state.streak.currentStreak,
          data.currentStreak
        );
        const newLongestStreak = Math.max(
          state.streak.longestStreak,
          data.longestStreak
        );
        const newTotalActiveDays = Math.max(
          state.streak.totalActiveDays,
          data.totalActiveDays
        );

        // Last active date: pick the more recent one
        const localLastActive = state.streak.lastActiveDate;
        const remoteLastActive = data.lastActiveDate;
        let newLastActiveDate = localLastActive;
        if (remoteLastActive && (!localLastActive || remoteLastActive > localLastActive)) {
          newLastActiveDate = remoteLastActive;
        }

        // GBS: most recent calculated wins
        let newGbs = state.goodBoyScore;
        let newGbsDimensions = state.gbsDimensions;
        let newGbsLastCalculated = state.gbsLastCalculated;
        if (
          data.gbsLastCalculated &&
          (!state.gbsLastCalculated || data.gbsLastCalculated > state.gbsLastCalculated)
        ) {
          newGbs = data.goodBoyScore;
          newGbsDimensions = data.gbsDimensions;
          newGbsLastCalculated = data.gbsLastCalculated;
        }

        // XP events: merge by id, keep last 200
        const localEventIds = new Set(state.xpEvents.map((e) => e.id));
        const newEvents = [...state.xpEvents];
        for (const e of data.xpEvents) {
          if (!localEventIds.has(e.id)) {
            newEvents.push(e);
          }
        }
        newEvents.sort(
          (a, b) => new Date(a.earnedAt).getTime() - new Date(b.earnedAt).getTime()
        );
        const mergedEvents = newEvents.slice(-200);

        // Achievements: merge by slug (local wins for pending celebrations)
        const localSlugs = new Set(state.unlockedAchievements.map((a) => a.slug));
        const mergedAchievements = [...state.unlockedAchievements];
        for (const a of data.unlockedAchievements) {
          if (!localSlugs.has(a.slug)) {
            mergedAchievements.push(a);
          }
        }

        // Achievement progress: remote wins if current is higher
        const localProgressMap = new Map(
          state.achievementProgress.map((p) => [p.slug, p])
        );
        const mergedProgress = [...state.achievementProgress];
        for (const remote of data.achievementProgress) {
          const local = localProgressMap.get(remote.slug);
          if (!local) {
            mergedProgress.push(remote);
          } else if (remote.current > local.current) {
            const idx = mergedProgress.findIndex((p) => p.slug === remote.slug);
            if (idx >= 0) {
              mergedProgress[idx] = remote;
            }
          }
        }

        // Active challenge: local wins if active, otherwise take remote
        const mergedChallenge =
          state.activeChallenge?.status === "active"
            ? state.activeChallenge
            : (data.activeChallenge ?? state.activeChallenge);

        set({
          totalXp: newTotalXp,
          currentLevel: levelDef.level,
          currentLevelTitle: levelDef.title,
          streak: {
            ...state.streak,
            currentStreak: newCurrentStreak,
            longestStreak: newLongestStreak,
            lastActiveDate: newLastActiveDate,
            totalActiveDays: newTotalActiveDays,
          },
          goodBoyScore: newGbs,
          gbsDimensions: newGbsDimensions,
          gbsLastCalculated: newGbsLastCalculated,
          xpEvents: mergedEvents,
          unlockedAchievements: mergedAchievements,
          achievementProgress: mergedProgress,
          activeChallenge: mergedChallenge,
        });
      },

      resetGamification: () => {
        set({
          totalXp: 0,
          dailyXp: 0,
          dailyXpDate: null,
          xpEvents: [],
          currentLevel: 1,
          currentLevelTitle: "Puppy Newbie",
          goodBoyScore: 0,
          gbsDimensions: {
            obedience: 0,
            behavior: 0,
            socialization: 0,
            leashRealWorld: 0,
            consistency: 0,
          },
          gbsLastCalculated: null,
          streak: { ...INITIAL_STREAK },
          unlockedAchievements: [],
          achievementProgress: [],
          pendingCelebrations: [],
          activeChallenge: null,
          pendingLevelUp: null,
        });
      },
    }),
    {
      name: "puppal-gamification",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        totalXp: state.totalXp,
        dailyXp: state.dailyXp,
        dailyXpDate: state.dailyXpDate,
        xpEvents: state.xpEvents,
        currentLevel: state.currentLevel,
        currentLevelTitle: state.currentLevelTitle,
        goodBoyScore: state.goodBoyScore,
        gbsDimensions: state.gbsDimensions,
        gbsLastCalculated: state.gbsLastCalculated,
        streak: state.streak,
        unlockedAchievements: state.unlockedAchievements,
        achievementProgress: state.achievementProgress,
        pendingCelebrations: state.pendingCelebrations,
        activeChallenge: state.activeChallenge,
        pendingLevelUp: state.pendingLevelUp,
        // _syncMeta is NOT persisted (resets to defaults on restart)
      }),
    }
  )
);
