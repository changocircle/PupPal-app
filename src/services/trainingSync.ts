/**
 * Training Plan Sync Service
 *
 * Bidirectional, local-first sync with Supabase for training plans
 * and exercise completions. Same pattern as dogSync.ts.
 *
 * Conflict resolution: most recent updated_at wins.
 *
 * Architecture:
 * - Local mutations happen instantly via Zustand store
 * - A store subscriber detects changes and marks pending
 * - syncTraining() pushes pending changes, pulls remote state, merges
 * - Supabase Realtime triggers immediate pulls on remote changes
 *
 * Key difference from dogSync: training data is per-dog (one plan per dog).
 * The active dog's training data is in the store; other dogs' data is in
 * AsyncStorage under `puppal-training::{dogId}`.
 */

import { supabase } from "@/services/supabase";
import { useTrainingStore } from "@/stores/trainingStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TrainingPlan, PlanWeek, ExerciseCompletion } from "@/types/training";

// ── Storage Keys ──

const PENDING_KEY = "puppal-training-sync-pending";
const LAST_SYNC_KEY = "puppal-training-sync-last";

// ── Types ──

export type TrainingSyncOpType = "upsert" | "delete";

interface PendingTrainingSyncOp {
  dogId: string;
  type: TrainingSyncOpType;
  timestamp: string;
}

export interface TrainingSyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
}

// ── Lock ──

let isSyncing = false;

// ── Pending Operations Queue ──

async function loadPendingOps(): Promise<PendingTrainingSyncOp[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function savePendingOps(ops: PendingTrainingSyncOp[]): Promise<void> {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(ops));
}

/**
 * Queue a training sync operation.
 * Coalesces: any sequence of upserts stays upsert; upsert + delete = delete.
 */
export async function queueTrainingSyncOp(
  dogId: string,
  type: TrainingSyncOpType,
): Promise<void> {
  const ops = await loadPendingOps();
  const idx = ops.findIndex((o) => o.dogId === dogId);
  const now = new Date().toISOString();

  if (idx >= 0) {
    ops[idx] = { dogId, type, timestamp: now };
  } else {
    ops.push({ dogId, type, timestamp: now });
  }

  await savePendingOps(ops);
  useTrainingStore.getState()._setSyncMeta({ pendingCount: ops.length });
}

// ── Helper: Store State → Supabase Row ──

interface TrainingStoreSnapshot {
  plan: TrainingPlan;
  completions: ExerciseCompletion[];
  totalXp: number;
  streak: number;
  lastCompletionDate: string | null;
}

function stateToRow(
  snapshot: TrainingStoreSnapshot,
  userId: string,
): Record<string, unknown> {
  const { plan, totalXp, streak, lastCompletionDate } = snapshot;
  return {
    id: plan.id,
    user_id: userId,
    dog_id: plan.dogId,
    dog_name: plan.dogName,
    breed: plan.breed,
    status: plan.status,
    current_week: plan.currentWeek,
    current_day: plan.currentDay,
    total_weeks: plan.totalWeeks,
    plan_data: plan.weeks,
    total_xp: totalXp,
    streak,
    last_completion_date: lastCompletionDate,
    generated_at: plan.generatedAt,
    updated_at: new Date().toISOString(),
  };
}

function rowToState(
  row: Record<string, unknown>,
  completions: ExerciseCompletion[],
): TrainingStoreSnapshot {
  const plan: TrainingPlan = {
    id: row.id as string,
    dogId: row.dog_id as string,
    dogName: row.dog_name as string,
    breed: row.breed as string | null,
    generatedAt: row.generated_at as string,
    currentWeek: row.current_week as number,
    currentDay: row.current_day as number,
    totalWeeks: row.total_weeks as number,
    weeks: row.plan_data as PlanWeek[],
    status: row.status as TrainingPlan["status"],
  };

  return {
    plan,
    completions,
    totalXp: row.total_xp as number,
    streak: row.streak as number,
    lastCompletionDate: row.last_completion_date as string | null,
  };
}

// ── Completions Sync Helpers ──

async function pushCompletions(
  userId: string,
  dogId: string,
  planId: string,
  completions: ExerciseCompletion[],
): Promise<string[]> {
  const errors: string[] = [];
  if (completions.length === 0) return errors;

  const rows = completions.map((c) => ({
    id: c.id,
    user_id: userId,
    dog_id: dogId,
    plan_id: planId,
    exercise_id: c.exerciseId,
    plan_exercise_id: c.planExerciseId,
    completed_at: c.completedAt,
    rating: c.rating,
    xp_earned: c.xpEarned,
    time_spent_seconds: c.timeSpentSeconds,
  }));

  // Upsert in batches of 50
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase
      .from("exercise_completions")
      .upsert(batch, { onConflict: "id" });

    if (error) {
      errors.push(`completions batch ${i}: ${error.message}`);
    }
  }

  return errors;
}

async function pullCompletions(
  planId: string,
): Promise<ExerciseCompletion[]> {
  const { data, error } = await supabase
    .from("exercise_completions")
    .select("*")
    .eq("plan_id", planId)
    .order("completed_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    exerciseId: row.exercise_id as string,
    planExerciseId: row.plan_exercise_id as string,
    completedAt: row.completed_at as string,
    rating: row.rating as number | null,
    xpEarned: row.xp_earned as number,
    timeSpentSeconds: row.time_spent_seconds as number | null,
  }));
}

// ── Core Sync ──

/**
 * Bidirectional sync for the active dog's training data.
 *
 * 1. Fetch remote training_plans row for this dog
 * 2. If pending local changes: compare timestamps, push or pull
 * 3. Sync completions (upsert local to remote, then pull full set)
 * 4. Update local store
 */
export async function syncTraining(
  userId: string,
  dogId: string,
): Promise<TrainingSyncResult> {
  if (isSyncing) {
    return { pushed: 0, pulled: 0, conflicts: 0, errors: ["Sync already in progress"] };
  }

  isSyncing = true;
  const store = useTrainingStore.getState();
  store._setSyncMeta({ status: "syncing" });

  const result: TrainingSyncResult = { pushed: 0, pulled: 0, conflicts: 0, errors: [] };

  try {
    // ── Step 1: Fetch remote plan for this dog ──

    const { data: remoteRows, error: fetchError } = await supabase
      .from("training_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("dog_id", dogId)
      .limit(1);

    if (fetchError) throw fetchError;

    const remoteRow = (remoteRows ?? [])[0] as Record<string, unknown> | undefined;

    // ── Step 2: Load local state ──

    const localPlan = store.plan;
    const localCompletions = store.completions;
    const pendingOps = await loadPendingOps();
    const dogOp = pendingOps.find((o) => o.dogId === dogId);

    // ── Step 3: Sync logic ──

    // ── Backfill dogId for plans created before training sync ──
    if (localPlan && !localPlan.dogId) {
      store._mergeTraining({
        plan: { ...localPlan, dogId: dogId },
        completions: localCompletions,
        totalXp: store.totalXp,
        streak: store.streak,
        lastCompletionDate: store.lastCompletionDate,
      });
      if (__DEV__) {
        console.log("[trainingSync] Backfilled dogId on existing plan");
      }
    }

    if (dogOp?.type === "delete") {
      // Local delete: remove from Supabase
      if (remoteRow) {
        const { error } = await supabase
          .from("training_plans")
          .delete()
          .eq("id", remoteRow.id as string)
          .eq("user_id", userId);
        if (error) {
          result.errors.push(`delete plan: ${error.message}`);
        } else {
          result.pushed++;
        }
      }
    } else if (localPlan && localPlan.dogId === dogId) {
      // Local plan exists for this dog
      const localSnapshot: TrainingStoreSnapshot = {
        plan: localPlan,
        completions: localCompletions,
        totalXp: store.totalXp,
        streak: store.streak,
        lastCompletionDate: store.lastCompletionDate,
      };

      if (!remoteRow) {
        // No remote version: push local
        const row = stateToRow(localSnapshot, userId);
        const { error } = await supabase
          .from("training_plans")
          .upsert(row, { onConflict: "id" });

        if (error) {
          result.errors.push(`push plan: ${error.message}`);
        } else {
          // Push completions
          const compErrors = await pushCompletions(
            userId, dogId, localPlan.id, localCompletions,
          );
          result.errors.push(...compErrors);
          result.pushed++;
        }
      } else if (dogOp) {
        // Both local and remote exist, and we have pending changes
        const remoteUpdated = new Date(remoteRow.updated_at as string);
        const localUpdated = new Date(dogOp.timestamp);

        if (localUpdated >= remoteUpdated) {
          // Local is newer or same: push
          const row = stateToRow(localSnapshot, userId);
          row.id = remoteRow.id; // Keep the remote ID
          const { error } = await supabase
            .from("training_plans")
            .upsert(row, { onConflict: "id" });

          if (error) {
            result.errors.push(`push plan: ${error.message}`);
          } else {
            const compErrors = await pushCompletions(
              userId, dogId, remoteRow.id as string, localCompletions,
            );
            result.errors.push(...compErrors);
            result.pushed++;
            result.conflicts++;
          }
        } else {
          // Remote is newer: pull
          const remoteCompletions = await pullCompletions(remoteRow.id as string);
          const remoteState = rowToState(remoteRow, remoteCompletions);
          store._mergeTraining(remoteState);
          result.pulled++;
          result.conflicts++;
        }
      } else {
        // Both exist, no pending changes: pull remote if different
        const remoteUpdated = remoteRow.updated_at as string;
        // Check if plan IDs match (same plan) or not
        if (localPlan.id !== remoteRow.id) {
          // Different plan IDs: remote may be from another device
          const remoteCompletions = await pullCompletions(remoteRow.id as string);
          const remoteState = rowToState(remoteRow, remoteCompletions);
          store._mergeTraining(remoteState);
          result.pulled++;
        }
      }
    } else if (remoteRow && (!localPlan || localPlan.dogId !== dogId)) {
      // No local plan for this dog, but remote exists: pull
      const remoteCompletions = await pullCompletions(remoteRow.id as string);
      const remoteState = rowToState(remoteRow, remoteCompletions);
      store._mergeTraining(remoteState);
      result.pulled++;
    }

    // ── Step 4: Clean up resolved pending ops ──

    const remaining = pendingOps.filter((o) => o.dogId !== dogId);
    await savePendingOps(remaining);

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
    console.error("[trainingSync] Sync error:", msg);
    store._setSyncMeta({ status: "error" });
  } finally {
    isSyncing = false;
  }

  if (__DEV__ && (result.pushed > 0 || result.pulled > 0 || result.conflicts > 0)) {
    console.log(
      `[trainingSync] Dog: ${dogId}, Pushed: ${result.pushed}, Pulled: ${result.pulled}, ` +
      `Conflicts: ${result.conflicts}, Errors: ${result.errors.length}`,
    );
  }

  return result;
}

// ── Realtime Subscription ──

/**
 * Subscribe to Supabase Realtime changes on training_plans.
 * Any insert/update/delete from another device triggers a callback.
 */
export function subscribeToTrainingChanges(
  userId: string,
  onRemoteChange: () => void,
): () => void {
  const channel = supabase
    .channel("training-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "training_plans",
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

export async function getLastTrainingSyncTime(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_SYNC_KEY);
}

export async function getTrainingPendingCount(): Promise<number> {
  const ops = await loadPendingOps();
  return ops.length;
}

/**
 * Clear all training sync data. Call on sign-out.
 */
export async function clearTrainingSyncData(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(PENDING_KEY),
    AsyncStorage.removeItem(LAST_SYNC_KEY),
  ]);
  useTrainingStore.getState()._setSyncMeta({
    status: "idle",
    lastSyncedAt: null,
    pendingCount: 0,
  });
}
