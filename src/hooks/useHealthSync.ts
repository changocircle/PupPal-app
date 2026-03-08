/**
 * Health Records Sync Hook
 *
 * Manages the sync lifecycle for all health records:
 * vaccinations, weight logs, medications, medication events,
 * vet visits, milestones, vet contacts, health notes.
 *
 * - Detects local store changes and queues sync operations
 * - Triggers sync on auth, on dog switch, on app foreground, on realtime
 * - Debounces rapid changes (3s)
 * - Exposes sync status and manual sync trigger
 *
 * Usage:
 *   const { status, lastSyncedAt, pendingCount, sync } = useHealthSync();
 */

import { useEffect, useRef, useCallback, useMemo } from "react";
import { AppState } from "react-native";
import { useAuthStore } from "@/stores/authStore";
import { useDogStore } from "@/stores/dogStore";
import { useHealthStore } from "@/stores/healthStore";
import type { HealthSyncMeta } from "@/stores/healthStore";
import {
  syncHealth,
  queueHealthSyncOp,
  subscribeToHealthChanges,
} from "@/services/healthSync";

const SYNC_DEBOUNCE_MS = 3000;

export function useHealthSync(): HealthSyncMeta & { sync: () => Promise<void> } {
  const user = useAuthStore((s) => s.user);
  const activeDogId = useDogStore((s) => s.activeDogId);
  const isSwitching = useDogStore((s) => s.isSwitching);
  const syncMeta = useHealthStore((s) => s._syncMeta);
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

  // ── Snapshot key: tracks changes that need syncing ──
  // Only tracks counts and key fields to avoid expensive deep comparisons
  const vaccinationsCount = useHealthStore((s) => s.vaccinations.length);
  const vaccinationsCompletedCount = useHealthStore(
    (s) => s.vaccinations.filter((v) => v.status === "completed").length,
  );
  const weightEntriesCount = useHealthStore((s) => s.weightEntries.length);
  const medicationsCount = useHealthStore((s) => s.medications.length);
  const medicationEventsCount = useHealthStore((s) => s.medicationEvents.length);
  const vetVisitsCount = useHealthStore((s) => s.vetVisits.length);
  const milestonesCompletedCount = useHealthStore(
    (s) => s.userMilestones.filter((m) => m.status === "completed").length,
  );
  const healthNotesCount = useHealthStore((s) => s.healthNotes.length);
  const healthNotesResolvedCount = useHealthStore(
    (s) => s.healthNotes.filter((n) => n.resolved).length,
  );
  const vetContactsCount = useHealthStore((s) => s.vetContacts.length);

  const snapshotKey = useMemo(
    () =>
      [
        vaccinationsCount,
        vaccinationsCompletedCount,
        weightEntriesCount,
        medicationsCount,
        medicationEventsCount,
        vetVisitsCount,
        milestonesCompletedCount,
        healthNotesCount,
        healthNotesResolvedCount,
        vetContactsCount,
      ].join(":"),
    [
      vaccinationsCount,
      vaccinationsCompletedCount,
      weightEntriesCount,
      medicationsCount,
      medicationEventsCount,
      vetVisitsCount,
      milestonesCompletedCount,
      healthNotesCount,
      healthNotesResolvedCount,
      vetContactsCount,
    ],
  );

  // ── Initial sync on auth + dog ready ──
  useEffect(() => {
    if (!user?.id || !activeDogId || isSwitching) return;

    let cancelled = false;
    const uid = user.id;
    const did = activeDogId;

    async function init() {
      if (cancelled) return;
      await syncHealth(uid, did);
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

    // Set baseline on mount
    prevSnapshotRef.current = snapshotKey;

    const unsub = useHealthStore.subscribe((state) => {
      // Skip during sync (the sync layer is updating the store)
      if (state._syncMeta.status === "syncing") {
        const key = [
          state.vaccinations.length,
          state.vaccinations.filter((v) => v.status === "completed").length,
          state.weightEntries.length,
          state.medications.length,
          state.medicationEvents.length,
          state.vetVisits.length,
          state.userMilestones.filter((m) => m.status === "completed").length,
          state.healthNotes.length,
          state.healthNotes.filter((n) => n.resolved).length,
          state.vetContacts.length,
        ].join(":");
        prevSnapshotRef.current = key;
        return;
      }

      const key = [
        state.vaccinations.length,
        state.vaccinations.filter((v) => v.status === "completed").length,
        state.weightEntries.length,
        state.medications.length,
        state.medicationEvents.length,
        state.vetVisits.length,
        state.userMilestones.filter((m) => m.status === "completed").length,
        state.healthNotes.length,
        state.healthNotes.filter((n) => n.resolved).length,
        state.vetContacts.length,
      ].join(":");

      if (key !== prevSnapshotRef.current) {
        prevSnapshotRef.current = key;

        const did = dogIdRef.current;
        if (!did) return;

        // Queue sync op
        queueHealthSyncOp(did);

        // Debounced auto-sync
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        const uid = userIdRef.current;
        if (uid) {
          syncTimerRef.current = setTimeout(() => {
            syncHealth(uid, did);
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
    const unsubscribe = subscribeToHealthChanges(uid, () => {
      // Remote change detected: sync immediately
      syncHealth(uid, did);
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
        syncHealth(uid, did);
      }
    });

    return () => sub.remove();
  }, [user?.id, activeDogId]);

  // ── Manual sync trigger ──
  const sync = useCallback(async () => {
    if (userIdRef.current && dogIdRef.current) {
      await syncHealth(userIdRef.current, dogIdRef.current);
    }
  }, []);

  return {
    ...syncMeta,
    sync,
  };
}
