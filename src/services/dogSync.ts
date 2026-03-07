/**
 * Dog Profile Sync Service
 *
 * Bidirectional, local-first sync with Supabase.
 * Conflict resolution: most recent updated_at wins.
 *
 * Architecture:
 * - Local mutations happen instantly via Zustand store
 * - A store subscriber detects changes and queues pending sync ops
 * - syncDogs() pushes pending changes, pulls remote state, and merges
 * - Supabase Realtime triggers immediate pulls on remote changes
 *
 * No circular dependencies: this file imports dogStore, but dogStore
 * does NOT import this file. The useDogSync hook bridges them.
 */

import { supabase } from "@/services/supabase";
import { useDogStore } from "@/stores/dogStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Dog } from "@/types/database";

// ── Storage Keys ──

const PENDING_KEY = "puppal-dog-sync-pending";
const SYNCED_IDS_KEY = "puppal-dog-sync-ids";
const LAST_SYNC_KEY = "puppal-dog-sync-last";

// ── Types ──

export type SyncOpType = "create" | "update" | "delete";

interface PendingSyncOp {
  dogId: string;
  type: SyncOpType;
  timestamp: string;
}

export interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
}

// ── Lock ──

let isSyncing = false;

// ── Pending Operations Queue ──

async function loadPendingOps(): Promise<PendingSyncOp[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function savePendingOps(ops: PendingSyncOp[]): Promise<void> {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(ops));
}

/**
 * Queue a sync operation. Coalesces intelligently:
 * - create + update = stays create (latest timestamp)
 * - create + delete = removed entirely (never synced, just forget it)
 * - update + update = latest update wins
 * - update + delete = becomes delete
 */
export async function queueSyncOp(
  dogId: string,
  type: SyncOpType,
): Promise<void> {
  const ops = await loadPendingOps();
  const idx = ops.findIndex((o) => o.dogId === dogId);
  const now = new Date().toISOString();

  if (idx >= 0) {
    const existing = ops[idx]!;

    if (existing.type === "create" && type === "update") {
      // Still a create, just bump timestamp
      ops[idx] = { dogId, type: "create", timestamp: now };
    } else if (existing.type === "create" && type === "delete") {
      // Never reached server, drop the whole thing
      ops.splice(idx, 1);
    } else {
      // All other combos: replace with new op
      ops[idx] = { dogId, type, timestamp: now };
    }
  } else {
    ops.push({ dogId, type, timestamp: now });
  }

  await savePendingOps(ops);

  // Update pending count in store
  useDogStore.getState()._setSyncMeta({ pendingCount: ops.length });
}

// ── Synced IDs Tracking ──

async function loadSyncedIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(SYNCED_IDS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

async function saveSyncedIds(ids: Set<string>): Promise<void> {
  await AsyncStorage.setItem(SYNCED_IDS_KEY, JSON.stringify([...ids]));
}

// ── Helper: Dog → Supabase Row ──

function dogToRow(dog: Dog, userId: string): Record<string, unknown> {
  return {
    id: dog.id,
    user_id: userId,
    name: dog.name,
    breed: dog.breed,
    breed_detected: dog.breed_detected,
    breed_confidence: dog.breed_confidence,
    photo_url: dog.photo_url,
    date_of_birth: dog.date_of_birth,
    gotcha_date: dog.gotcha_date ?? null,
    age_months_at_creation: dog.age_months_at_creation,
    gender: dog.gender,
    weight_kg: dog.weight_kg,
    size_category: dog.size_category,
    challenges: dog.challenges,
    owner_experience: dog.owner_experience,
    is_active: dog.is_active,
    onboarding_completed: dog.onboarding_completed ?? true,
    archived_at: dog.archived_at,
    created_at: dog.created_at,
    updated_at: dog.updated_at,
  };
}

// ── Core Sync ──

/**
 * Full bidirectional sync for dog profiles.
 *
 * 1. Fetch all remote dogs (single query)
 * 2. Push pending local changes (skip if remote is newer)
 * 3. Pull remote state into local store (merge)
 * 4. Clean up resolved pending ops
 *
 * Conflict resolution: compares updated_at timestamps.
 * Most recent updated_at wins, regardless of which side it came from.
 */
export async function syncDogs(userId: string): Promise<SyncResult> {
  // Prevent concurrent syncs
  if (isSyncing) {
    return { pushed: 0, pulled: 0, conflicts: 0, errors: ["Sync already in progress"] };
  }

  isSyncing = true;
  const store = useDogStore.getState();
  store._setSyncMeta({ status: "syncing" });

  const result: SyncResult = { pushed: 0, pulled: 0, conflicts: 0, errors: [] };

  try {
    // ── Step 1: Fetch all remote dogs ──

    const { data: remoteRows, error: fetchError } = await supabase
      .from("dogs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (fetchError) throw fetchError;

    const remoteDogs = (remoteRows ?? []) as Dog[];
    const remoteMap = new Map(remoteDogs.map((d) => [d.id, d]));

    // ── Step 2: Load local state ──

    const localDogs = store.dogs;
    const localMap = new Map(localDogs.map((d) => [d.id, d]));
    const pendingOps = await loadPendingOps();
    const syncedIds = await loadSyncedIds();
    const resolvedIds: string[] = [];

    // ── Step 3: Push phase ──

    for (const op of pendingOps) {
      try {
        if (op.type === "delete") {
          if (remoteMap.has(op.dogId)) {
            const { error } = await supabase
              .from("dogs")
              .delete()
              .eq("id", op.dogId)
              .eq("user_id", userId);
            if (error) throw error;
            remoteMap.delete(op.dogId);
          }
          syncedIds.delete(op.dogId);
          resolvedIds.push(op.dogId);
          result.pushed++;
          continue;
        }

        const local = localMap.get(op.dogId);
        if (!local) {
          // Dog was removed locally without a delete op, clean up
          resolvedIds.push(op.dogId);
          continue;
        }

        const remote = remoteMap.get(op.dogId);

        if (remote && new Date(remote.updated_at) > new Date(local.updated_at)) {
          // Remote is newer, remote wins. Pull phase will handle it.
          result.conflicts++;
          resolvedIds.push(op.dogId);
          continue;
        }

        // Local is newer (or no remote version), push it
        const { error } = await supabase.from("dogs").upsert(
          dogToRow(local, userId),
          { onConflict: "id" },
        );
        if (error) throw error;

        syncedIds.add(op.dogId);
        resolvedIds.push(op.dogId);
        result.pushed++;

        // Update remote map so pull phase sees our pushed version
        remoteMap.set(op.dogId, { ...local, user_id: userId });
        if (remote) result.conflicts++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        result.errors.push(`${op.type} ${op.dogId}: ${msg}`);
      }
    }

    // Clear resolved pending ops
    const remaining = pendingOps.filter((o) => !resolvedIds.includes(o.dogId));
    await savePendingOps(remaining);
    const stillPendingIds = new Set(remaining.map((o) => o.dogId));

    // ── Step 4: Pull phase (merge) ──

    const merged: Dog[] = [];
    const processedIds = new Set<string>();

    // Process all remote dogs
    for (const [id, remote] of remoteMap) {
      processedIds.add(id);
      const local = localMap.get(id);

      if (stillPendingIds.has(id) && local) {
        // Still has pending changes that failed to push, keep local
        merged.push(local);
      } else {
        // Take remote version
        merged.push(remote);
        syncedIds.add(id);

        // Count as pulled only if different from local
        if (!local || local.updated_at !== remote.updated_at) {
          result.pulled++;
        }
      }
    }

    // Handle local-only dogs
    for (const [id, local] of localMap) {
      if (processedIds.has(id)) continue;

      if (stillPendingIds.has(id)) {
        // Pending create/update that failed, keep local
        merged.push(local);
      } else if (!syncedIds.has(id)) {
        // Never been synced and no pending op (edge case, auto-queue)
        merged.push(local);
        await queueSyncOp(id, "create");
      }
      // If previously synced but gone from remote and no pending op,
      // it was deleted on another device. Drop it.
    }

    // ── Step 5: Update store ──

    store._mergeDogs(merged);
    await saveSyncedIds(syncedIds);

    const now = new Date().toISOString();
    await AsyncStorage.setItem(LAST_SYNC_KEY, now);

    store._setSyncMeta({
      status: "idle",
      lastSyncedAt: now,
      pendingCount: remaining.length,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    result.errors.push(`Sync failed: ${msg}`);
    console.error("[dogSync] Sync error:", msg);
    store._setSyncMeta({ status: "error" });
  } finally {
    isSyncing = false;
  }

  if (__DEV__ && (result.pushed > 0 || result.pulled > 0 || result.conflicts > 0)) {
    console.log(
      `[dogSync] Pushed: ${result.pushed}, Pulled: ${result.pulled}, ` +
      `Conflicts: ${result.conflicts}, Errors: ${result.errors.length}`,
    );
  }

  return result;
}

// ── Migration ──

/**
 * Migrate dogs created before auth (user_id = "local") to the real user.
 * Call once after first successful sign-in.
 */
export async function migrateLocalDogs(userId: string): Promise<number> {
  const store = useDogStore.getState();
  const localOnly = store.dogs.filter((d) => d.user_id === "local");

  if (localOnly.length === 0) return 0;

  // Update user_id on each local dog and queue for sync
  for (const dog of localOnly) {
    store.updateDog(dog.id, { user_id: userId } as Partial<Dog>);
    await queueSyncOp(dog.id, "create");
  }

  if (__DEV__) {
    console.log(`[dogSync] Migrated ${localOnly.length} local dogs to user ${userId}`);
  }

  return localOnly.length;
}

// ── Realtime Subscription ──

/**
 * Subscribe to Supabase Realtime changes on the dogs table.
 * Any insert/update/delete from another device triggers a callback.
 * Returns an unsubscribe function.
 */
export function subscribeToDogChanges(
  userId: string,
  onRemoteChange: () => void,
): () => void {
  const channel = supabase
    .channel("dogs-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "dogs",
        filter: `user_id=eq.${userId}`,
      },
      () => {
        onRemoteChange();
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ── Utilities ──

export async function getLastSyncTime(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_SYNC_KEY);
}

export async function getPendingCount(): Promise<number> {
  const ops = await loadPendingOps();
  return ops.length;
}

/**
 * Clear all sync data. Call on sign-out.
 */
export async function clearSyncData(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(PENDING_KEY),
    AsyncStorage.removeItem(SYNCED_IDS_KEY),
    AsyncStorage.removeItem(LAST_SYNC_KEY),
  ]);
  useDogStore.getState()._setSyncMeta({
    status: "idle",
    lastSyncedAt: null,
    pendingCount: 0,
  });
}
