/**
 * Training Plan Sync Hook
 *
 * Manages the sync lifecycle for training plans + exercise completions:
 * - Detects local store changes and queues sync operations
 * - Triggers sync on auth, on dog switch, on app foreground, on realtime
 * - Debounces rapid changes (3s, slightly longer than dog sync since
 *   training data is bigger)
 * - Exposes sync status and manual sync trigger
 *
 * Usage:
 *   const { status, lastSyncedAt, pendingCount, sync } = useTrainingSync();
 */

import { useEffect, useRef, useCallback, useMemo } from "react";
import { AppState } from "react-native";
import { useAuthStore } from "@/stores/authStore";
import { useDogStore } from "@/stores/dogStore";
import { useTrainingStore } from "@/stores/trainingStore";
import type { TrainingSyncMeta } from "@/stores/trainingStore";
import {
  syncTraining,
  queueTrainingSyncOp,
  subscribeToTrainingChanges,
} from "@/services/trainingSync";

const SYNC_DEBOUNCE_MS = 3000;

export function useTrainingSync(): TrainingSyncMeta & { sync: () => Promise<void> } {
  const user = useAuthStore((s) => s.user);
  const activeDogId = useDogStore((s) => s.activeDogId);
  const isSwitching = useDogStore((s) => s.isSwitching);
  const syncMeta = useTrainingStore((s) => s._syncMeta);
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

  // ── Create a stable snapshot key from training state ──
  // Only tracks fields that matter for sync detection
  const plan = useTrainingStore((s) => s.plan);
  const completionsLength = useTrainingStore((s) => s.completions.length);
  const totalXp = useTrainingStore((s) => s.totalXp);
  const streak = useTrainingStore((s) => s.streak);
  const lastCompletionDate = useTrainingStore((s) => s.lastCompletionDate);

  const snapshotKey = useMemo(() => {
    if (!plan) return "no-plan";
    return `${plan.id}:${plan.currentWeek}:${plan.currentDay}:${plan.status}:${completionsLength}:${totalXp}:${streak}:${lastCompletionDate}`;
  }, [plan, completionsLength, totalXp, streak, lastCompletionDate]);

  // ── Initial sync on auth + dog ready ──
  useEffect(() => {
    if (!user?.id || !activeDogId || isSwitching) return;

    let cancelled = false;
    const uid = user.id;
    const did = activeDogId;

    async function init() {
      if (cancelled) return;
      await syncTraining(uid, did);
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

    const unsub = useTrainingStore.subscribe((state) => {
      // Skip during sync (the sync layer is updating the store)
      if (state._syncMeta.status === "syncing") {
        // Update baseline so we don't trigger a sync for sync-caused changes
        const key = !state.plan
          ? "no-plan"
          : `${state.plan.id}:${state.plan.currentWeek}:${state.plan.currentDay}:${state.plan.status}:${state.completions.length}:${state.totalXp}:${state.streak}:${state.lastCompletionDate}`;
        prevSnapshotRef.current = key;
        return;
      }

      const key = !state.plan
        ? "no-plan"
        : `${state.plan.id}:${state.plan.currentWeek}:${state.plan.currentDay}:${state.plan.status}:${state.completions.length}:${state.totalXp}:${state.streak}:${state.lastCompletionDate}`;

      if (key !== prevSnapshotRef.current) {
        prevSnapshotRef.current = key;

        const did = dogIdRef.current;
        if (!did) return;

        // Queue sync op
        const opType = key === "no-plan" ? "delete" : "upsert";
        queueTrainingSyncOp(did, opType);

        // Debounced auto-sync
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        const uid = userIdRef.current;
        if (uid) {
          syncTimerRef.current = setTimeout(() => {
            syncTraining(uid, did);
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
    const unsubscribe = subscribeToTrainingChanges(uid, () => {
      // Remote change detected: sync immediately
      syncTraining(uid, did);
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
        syncTraining(uid, did);
      }
    });

    return () => sub.remove();
  }, [user?.id, activeDogId]);

  // ── Manual sync trigger ──
  const sync = useCallback(async () => {
    if (userIdRef.current && dogIdRef.current) {
      await syncTraining(userIdRef.current, dogIdRef.current);
    }
  }, []);

  return {
    ...syncMeta,
    sync,
  };
}
