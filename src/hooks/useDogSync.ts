/**
 * Dog Profile Sync Hook
 *
 * Manages the sync lifecycle for dog profiles:
 * - Detects local store changes and queues sync operations
 * - Triggers sync on auth, on app foreground, and on realtime events
 * - Debounces rapid changes (2s) to avoid spamming Supabase
 * - Exposes sync status and manual sync trigger
 *
 * Usage:
 *   const { status, lastSyncedAt, pendingCount, sync } = useDogSync();
 */

import { useEffect, useRef, useCallback } from "react";
import { AppState } from "react-native";
import { useAuthStore } from "@/stores/authStore";
import { useDogStore } from "@/stores/dogStore";
import type { DogSyncMeta } from "@/stores/dogStore";
import {
  syncDogs,
  queueSyncOp,
  migrateLocalDogs,
  subscribeToDogChanges,
} from "@/services/dogSync";
import type { Dog } from "@/types/database";

const SYNC_DEBOUNCE_MS = 2000;

export function useDogSync(): DogSyncMeta & { sync: () => Promise<void> } {
  const user = useAuthStore((s) => s.user);
  const syncMeta = useDogStore((s) => s._syncMeta);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevDogsRef = useRef<Dog[]>([]);
  const userIdRef = useRef<string | null>(null);

  // Keep userId ref current for use in callbacks
  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

  // ── Initialize sync on auth change ──
  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    async function init() {
      if (!user?.id || cancelled) return;

      // Migrate dogs created before auth
      const migrated = await migrateLocalDogs(user.id);
      if (migrated > 0 && __DEV__) {
        console.log(`[useDogSync] Migrated ${migrated} local dogs`);
      }

      // Initial full sync
      if (!cancelled) {
        await syncDogs(user.id);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // ── Subscribe to local store changes and auto-queue sync ops ──
  useEffect(() => {
    if (!user?.id) return;

    // Capture current dogs as baseline
    prevDogsRef.current = [...useDogStore.getState().dogs];

    const unsub = useDogStore.subscribe((state) => {
      // Skip changes during sync (the sync layer is updating the store)
      if (state._syncMeta.status === "syncing") {
        prevDogsRef.current = [...state.dogs];
        return;
      }

      const newDogs = state.dogs;
      const prevDogs = prevDogsRef.current;
      let changed = false;

      // Detect additions
      for (const dog of newDogs) {
        const existed = prevDogs.find((d) => d.id === dog.id);
        if (!existed) {
          queueSyncOp(dog.id, "create");
          changed = true;
        }
      }

      // Detect removals
      for (const dog of prevDogs) {
        const stillExists = newDogs.find((d) => d.id === dog.id);
        if (!stillExists) {
          queueSyncOp(dog.id, "delete");
          changed = true;
        }
      }

      // Detect updates (compare updated_at)
      for (const dog of newDogs) {
        const prev = prevDogs.find((d) => d.id === dog.id);
        if (prev && prev.updated_at !== dog.updated_at) {
          queueSyncOp(dog.id, "update");
          changed = true;
        }
      }

      // Always update prev reference
      prevDogsRef.current = [...newDogs];

      // Debounced auto-sync after local changes
      if (changed && userIdRef.current) {
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        const uid = userIdRef.current;
        syncTimerRef.current = setTimeout(() => {
          syncDogs(uid);
        }, SYNC_DEBOUNCE_MS);
      }
    });

    return () => {
      unsub();
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };
  }, [user?.id]);

  // ── Supabase Realtime subscription ──
  useEffect(() => {
    if (!user?.id) return;

    const uid = user.id;
    const unsubscribe = subscribeToDogChanges(uid, () => {
      // Remote change detected, sync immediately (no debounce)
      syncDogs(uid);
    });

    return unsubscribe;
  }, [user?.id]);

  // ── Auto-sync on app foreground ──
  useEffect(() => {
    if (!user?.id) return;

    const uid = user.id;
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        syncDogs(uid);
      }
    });

    return () => sub.remove();
  }, [user?.id]);

  // ── Manual sync trigger ──
  const sync = useCallback(async () => {
    if (userIdRef.current) {
      await syncDogs(userIdRef.current);
    }
  }, []);

  return {
    ...syncMeta,
    sync,
  };
}
