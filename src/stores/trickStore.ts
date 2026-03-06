/**
 * Trick Library Store, PRD-03 §6
 *
 * Manages trick progress (per-trick 3-level system) and pack unlock state.
 * Persists to AsyncStorage under 'puppal-tricks'.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TrickProgress, PackProgress, TrickLevel, UnlockCondition } from '@/types/tricks';
import { TRICK_LEVEL_META } from '@/types/tricks';
import { getAllPacks, getTricksForPack } from '@/data/trickData';

interface TrickStore {
  /** Per-trick progress keyed by trick ID */
  trickProgress: Record<string, TrickProgress>;

  /** Per-pack progress keyed by pack ID */
  packProgress: Record<string, PackProgress>;

  /** Total tricks completed (at least level 1) across all packs */
  totalTricksCompleted: number;

  /** Total tricks mastered (level 3) */
  totalTricksMastered: number;

  /* ── Actions ── */

  /** Start a trick (creates progress entry if not exists) */
  startTrick: (trickId: string, packId: string) => void;

  /** Complete a level for a trick. Returns XP earned. */
  completeTrickLevel: (trickId: string, level: TrickLevel) => number;

  /** Record a practice session on a trick */
  recordPractice: (trickId: string) => void;

  /** Check and unlock packs based on current progress / plan state */
  refreshPackUnlocks: (currentWeek: number, planComplete: boolean) => void;

  /** Get progress for a specific trick */
  getTrickProgress: (trickId: string) => TrickProgress | undefined;

  /** Get progress for a specific pack */
  getPackProgress: (packId: string) => PackProgress;

  /** Check if a pack is unlocked */
  isPackUnlocked: (packId: string) => boolean;

  /** Get completed trick count for a pack */
  getPackCompletedCount: (packId: string) => number;

  /** Reset all trick progress (for testing / dog switch) */
  resetProgress: () => void;
}

const NEXT_LEVEL: Record<TrickLevel, TrickLevel | null> = {
  learning: 'fluent',
  fluent: 'mastered',
  mastered: null,
};

export const useTrickStore = create<TrickStore>()(
  persist(
    (set, get) => ({
      trickProgress: {},
      packProgress: {},
      totalTricksCompleted: 0,
      totalTricksMastered: 0,

      startTrick: (trickId, packId) => {
        const existing = get().trickProgress[trickId];
        if (existing) return; // already started

        const now = new Date().toISOString();
        set((state) => ({
          trickProgress: {
            ...state.trickProgress,
            [trickId]: {
              trickId,
              packId,
              currentLevel: 'learning',
              completedLevels: [],
              startedAt: now,
              lastPracticedAt: now,
              totalPracticeCount: 0,
            },
          },
        }));
      },

      completeTrickLevel: (trickId, level) => {
        const state = get();
        const progress = state.trickProgress[trickId];
        if (!progress) return 0;

        // Already completed this level
        if (progress.completedLevels.includes(level)) return 0;

        const xp = TRICK_LEVEL_META[level].xp;
        const now = new Date().toISOString();
        const newCompletedLevels = [...progress.completedLevels, level];
        const nextLevel = NEXT_LEVEL[level];

        const updatedProgress: TrickProgress = {
          ...progress,
          completedLevels: newCompletedLevels,
          currentLevel: nextLevel ?? 'mastered',
          lastPracticedAt: now,
          totalPracticeCount: progress.totalPracticeCount + 1,
        };

        // Update pack progress
        const packId = progress.packId;
        const packTricks = Object.values(state.trickProgress).filter(
          (t) => t.packId === packId
        );

        // Count completions for this pack (trick with at least 'learning' completed)
        const isNewCompletion = level === 'learning';
        const isNewMastery = level === 'mastered';

        const currentPackProgress = state.packProgress[packId] ?? {
          packId,
          unlocked: true,
          unlockedAt: null,
          tricksCompleted: 0,
          tricksMastered: 0,
        };

        const updatedPackProgress: PackProgress = {
          ...currentPackProgress,
          tricksCompleted: currentPackProgress.tricksCompleted + (isNewCompletion ? 1 : 0),
          tricksMastered: currentPackProgress.tricksMastered + (isNewMastery ? 1 : 0),
        };

        set({
          trickProgress: {
            ...state.trickProgress,
            [trickId]: updatedProgress,
          },
          packProgress: {
            ...state.packProgress,
            [packId]: updatedPackProgress,
          },
          totalTricksCompleted: state.totalTricksCompleted + (isNewCompletion ? 1 : 0),
          totalTricksMastered: state.totalTricksMastered + (isNewMastery ? 1 : 0),
        });

        return xp;
      },

      recordPractice: (trickId) => {
        const state = get();
        const progress = state.trickProgress[trickId];
        if (!progress) return;

        set({
          trickProgress: {
            ...state.trickProgress,
            [trickId]: {
              ...progress,
              totalPracticeCount: progress.totalPracticeCount + 1,
              lastPracticedAt: new Date().toISOString(),
            },
          },
        });
      },

      refreshPackUnlocks: (currentWeek, planComplete) => {
        const state = get();
        const packs = getAllPacks();
        const now = new Date().toISOString();
        const updatedPackProgress = { ...state.packProgress };

        for (const pack of packs) {
          const existing = updatedPackProgress[pack.id];
          if (existing?.unlocked) continue; // already unlocked

          let shouldUnlock = false;

          switch (pack.unlock_condition) {
            case 'plan_week':
              shouldUnlock = currentWeek >= (pack.unlock_value ?? 999);
              break;
            case 'plan_complete':
              shouldUnlock = planComplete;
              break;
            case 'tricks_completed':
              shouldUnlock = state.totalTricksCompleted >= (pack.unlock_value ?? 999);
              break;
            case 'manual':
              // Only unlocked manually
              break;
          }

          if (shouldUnlock) {
            updatedPackProgress[pack.id] = {
              packId: pack.id,
              unlocked: true,
              unlockedAt: now,
              tricksCompleted: existing?.tricksCompleted ?? 0,
              tricksMastered: existing?.tricksMastered ?? 0,
            };
          }
        }

        set({ packProgress: updatedPackProgress });
      },

      getTrickProgress: (trickId) => {
        return get().trickProgress[trickId];
      },

      getPackProgress: (packId) => {
        return get().packProgress[packId] ?? {
          packId,
          unlocked: false,
          unlockedAt: null,
          tricksCompleted: 0,
          tricksMastered: 0,
        };
      },

      isPackUnlocked: (packId) => {
        return get().packProgress[packId]?.unlocked ?? false;
      },

      getPackCompletedCount: (packId) => {
        return get().packProgress[packId]?.tricksCompleted ?? 0;
      },

      resetProgress: () => {
        set({
          trickProgress: {},
          packProgress: {},
          totalTricksCompleted: 0,
          totalTricksMastered: 0,
        });
      },
    }),
    {
      name: 'puppal-tricks',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
