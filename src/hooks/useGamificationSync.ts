/**
 * Gamification Sync Hook
 *
 * Manages the sync lifecycle for XP, streaks, GBS, achievements,
 * and weekly challenges:
 * - Detects local store changes and queues sync operations
 * - Triggers sync on auth, dog switch, app foreground, and realtime events
 * - Debounces rapid changes (3s, matching other sync hooks)
 * - Exposes sync status and manual sync trigger
 *
 * Usage:
 *   const { status, lastSyncedAt, pendingCount, sync } = useGamificationSync();
 */

import { useEffect, useRef, useCallback, useMemo } from "react";
import { AppState } from "react-native";
import { useAuthStore } from "@/stores/authStore";
import { useDogStore } from "@/stores/dogStore";
import { useGamificationStore } from "@/stores/gamificationStore";
import type { GamificationSyncMeta } from "@/stores/gamificationStore";
import {
  syncGamification,
  queueGamificationSyncOp,
  subscribeToGamificationChanges,
} from "@/services/gamificationSync";

const SYNC_DEBOUNCE_MS = 3000;

export function useGamificationSync(): GamificationSyncMeta & { sync: () => Promise<void> } {
  const user = useAuthStore((s) => s.user);
  const activeDogId = useDogStore((s) => s.activeDogId);
  const isSwitching = useDogStore((s) => s.isSwitching);
  const syncMeta = useGamificationStore((s) => s._syncMeta);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSnapshotRef = useRef<string>("");
  const userIdRef = useRef<string | null>(null);
  const dogIdRef = useRef<string | null>(null);

  // Keep refs current
  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    dogIdRef.current = activeDogId;
  }, [activeDogId]);

  // ── Build a snapshot key to detect meaningful local changes ──
  // Tracks XP, streak, GBS, achievement count, and challenge state.
  const totalXp = useGamificationStore((s) => s.totalXp);
  const currentStreak = useGamificationStore((s) => s.streak.currentStreak);
  const goodBoyScore = useGamificationStore((s) => s.goodBoyScore);
  const achievementsLength = useGamificationStore((s) => s.unlockedAchievements.length);
  const progressLength = useGamificationStore((s) => s.achievementProgress.length);
  const xpEventsLength = useGamificationStore((s) => s.xpEvents.length);
  const challengeStatus = useGamificationStore((s) => s.activeChallenge?.status ?? "none");
  const challengeProgress = useGamificationStore((s) => s.activeChallenge?.progress ?? 0);

  const snapshotKey = useMemo(
    () =>
      `${totalXp}:${currentStreak}:${goodBoyScore}:${achievementsLength}:${progressLength}:${xpEventsLength}:${challengeStatus}:${challengeProgress}`,
    [totalXp, currentStreak, goodBoyScore, achievementsLength, progressLength, xpEventsLength, challengeStatus, challengeProgress],
  );

  // ── Initial sync on auth + dog ready ──
  useEffect(() => {
    if (!user?.id || !activeDogId || isSwitching) return;

    let cancelled = false;
    const uid = user.id;
    const did = activeDogId;

    async function init() {
      if (cancelled) return;
      await syncGamification(uid, did);
    }

    // Small delay to let per-dog store rehydration finish after dog switch
    const timer = setTimeout(init, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [user?.id, activeDogId, isSwitching]);

  // ── Detect local store changes and auto-queue sync ops ──
  useEffect(() => {
    if (!user?.id || !activeDogId || isSwitching) return;

    // Set baseline
    prevSnapshotRef.current = snapshotKey;

    const unsub = useGamificationStore.subscribe((state) => {
      // Skip during sync (the sync layer is updating the store)
      if (state._syncMeta.status === "syncing") {
        const key =
          `${state.totalXp}:${state.streak.currentStreak}:${state.goodBoyScore}:` +
          `${state.unlockedAchievements.length}:${state.achievementProgress.length}:` +
          `${state.xpEvents.length}:${state.activeChallenge?.status ?? "none"}:${state.activeChallenge?.progress ?? 0}`;
        prevSnapshotRef.current = key;
        return;
      }

      const key =
        `${state.totalXp}:${state.streak.currentStreak}:${state.goodBoyScore}:` +
        `${state.unlockedAchievements.length}:${state.achievementProgress.length}:` +
        `${state.xpEvents.length}:${state.activeChallenge?.status ?? "none"}:${state.activeChallenge?.progress ?? 0}`;

      if (key !== prevSnapshotRef.current) {
        prevSnapshotRef.current = key;

        const did = dogIdRef.current;
        if (!did) return;

        queueGamificationSyncOp(did, "upsert");

        // Debounced auto-sync
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        const uid = userIdRef.current;
        if (uid) {
          syncTimerRef.current = setTimeout(() => {
            syncGamification(uid, did);
          }, SYNC_DEBOUNCE_MS);
        }
      }
    });

    return () => {
      unsub();
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };
  }, [user?.id, activeDogId, isSwitching]);

  // ── Supabase Realtime subscription ──
  useEffect(() => {
    if (!user?.id || !activeDogId) return;

    const uid = user.id;
    const did = activeDogId;
    const unsubscribe = subscribeToGamificationChanges(uid, () => {
      // Remote change detected: sync immediately
      syncGamification(uid, did);
    });

    return unsubscribe;
  }, [user?.id, activeDogId]);

  // ── Auto-sync on app foreground ──
  useEffect(() => {
    if (!user?.id || !activeDogId) return;

    const uid = user.id;
    const did = activeDogId;
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        syncGamification(uid, did);
      }
    });

    return () => sub.remove();
  }, [user?.id, activeDogId]);

  // ── Manual sync trigger ──
  const sync = useCallback(async () => {
    if (userIdRef.current && dogIdRef.current) {
      await syncGamification(userIdRef.current, dogIdRef.current);
    }
  }, []);

  return {
    ...syncMeta,
    sync,
  };
}
