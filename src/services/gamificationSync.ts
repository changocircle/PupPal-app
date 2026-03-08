/**
 * Gamification Sync Service
 *
 * Bidirectional, local-first sync with Supabase for XP events,
 * streaks, Good Boy Score, achievements, and weekly challenges.
 * Same pattern as dogSync.ts, trainingSync.ts, and chatSync.ts.
 *
 * Conflict resolution:
 * - XP totals and streak counts: max-wins (we never want to lose progress)
 * - GBS: most recently calculated value wins
 * - XP events: merge by id (append-only, never delete)
 * - Achievements: merge by slug (once unlocked, stays unlocked)
 * - Achievement progress: max current value wins
 * - Active challenge: local "active" status wins; otherwise remote
 *
 * Architecture:
 * - Local mutations happen instantly via Zustand store
 * - A store subscriber detects changes and marks pending
 * - syncGamification() pushes pending changes, pulls remote state, merges
 * - Supabase Realtime triggers immediate pulls on remote changes
 *
 * Per-dog isolation: all tables scoped by dog_id.
 * Upsert in batches of 50.
 */

import { supabase } from "@/services/supabase";
import { useGamificationStore } from "@/stores/gamificationStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  XpEvent,
  UnlockedAchievement,
  AchievementProgress,
  UserChallenge,
  GbsDimensions,
} from "@/types/gamification";

// ── Storage Keys ──

const PENDING_KEY = "puppal-gamification-sync-pending";
const LAST_SYNC_KEY = "puppal-gamification-sync-last";

// ── Types ──

export type GamificationSyncOpType = "upsert" | "delete";

interface PendingGamificationSyncOp {
  dogId: string;
  type: GamificationSyncOpType;
  timestamp: string;
}

export interface GamificationSyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
}

// ── Lock ──

let isSyncing = false;

// ── Pending Operations Queue ──

async function loadPendingOps(): Promise<PendingGamificationSyncOp[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function savePendingOps(ops: PendingGamificationSyncOp[]): Promise<void> {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(ops));
}

/**
 * Queue a gamification sync operation.
 * Coalesces: any sequence of upserts stays upsert; upsert + delete = delete.
 */
export async function queueGamificationSyncOp(
  dogId: string,
  type: GamificationSyncOpType,
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
  useGamificationStore.getState()._setSyncMeta({ pendingCount: ops.length });
}

// ── Row Conversion Helpers ──

function summaryToRow(
  userId: string,
  dogId: string,
): Record<string, unknown> {
  const state = useGamificationStore.getState();
  return {
    id: `gam-summary-${dogId}`,
    user_id: userId,
    dog_id: dogId,
    total_xp: state.totalXp,
    daily_xp: state.dailyXp,
    daily_xp_date: state.dailyXpDate,
    current_level: state.currentLevel,
    current_level_title: state.currentLevelTitle,
    good_boy_score: state.goodBoyScore,
    gbs_dimensions: state.gbsDimensions,
    gbs_last_calculated: state.gbsLastCalculated,
    current_streak: state.streak.currentStreak,
    longest_streak: state.streak.longestStreak,
    last_active_date: state.streak.lastActiveDate,
    freezes_available: state.streak.freezesAvailable,
    freezes_used_this_week: state.streak.freezesUsedThisWeek,
    freeze_last_reset: state.streak.freezeLastReset,
    total_active_days: state.streak.totalActiveDays,
    active_challenge: state.activeChallenge,
    updated_at: new Date().toISOString(),
  };
}

function xpEventToRow(
  event: XpEvent,
  userId: string,
  dogId: string,
): Record<string, unknown> {
  return {
    id: event.id,
    user_id: userId,
    dog_id: dogId,
    amount: event.amount,
    source: event.source,
    source_id: event.sourceId,
    earned_at: event.earnedAt,
    label: event.label,
    updated_at: new Date().toISOString(),
  };
}

function rowToXpEvent(row: Record<string, unknown>): XpEvent {
  return {
    id: row.id as string,
    amount: row.amount as number,
    source: row.source as XpEvent["source"],
    sourceId: row.source_id as string | null,
    earnedAt: row.earned_at as string,
    label: row.label as string,
  };
}

function achievementToRow(
  a: UnlockedAchievement,
  userId: string,
  dogId: string,
): Record<string, unknown> {
  return {
    id: `ach-${dogId}-${a.slug}`,
    user_id: userId,
    dog_id: dogId,
    slug: a.slug,
    unlocked_at: a.unlockedAt,
    xp_earned: a.xpEarned,
    shared: a.shared,
    updated_at: new Date().toISOString(),
  };
}

function rowToAchievement(row: Record<string, unknown>): UnlockedAchievement {
  return {
    slug: row.slug as string,
    unlockedAt: row.unlocked_at as string,
    xpEarned: row.xp_earned as number,
    shared: row.shared as boolean,
  };
}

function progressToRow(
  p: AchievementProgress,
  userId: string,
  dogId: string,
): Record<string, unknown> {
  return {
    id: `prog-${dogId}-${p.slug}`,
    user_id: userId,
    dog_id: dogId,
    slug: p.slug,
    current: p.current,
    target: p.target,
    updated_at: new Date().toISOString(),
  };
}

function rowToProgress(row: Record<string, unknown>): AchievementProgress {
  return {
    slug: row.slug as string,
    current: row.current as number,
    target: row.target as number,
  };
}

// ── Push Helpers ──

async function pushXpEvents(
  userId: string,
  dogId: string,
  events: XpEvent[],
): Promise<string[]> {
  const errors: string[] = [];
  if (events.length === 0) return errors;

  const rows = events.map((e) => xpEventToRow(e, userId, dogId));

  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase
      .from("xp_events")
      .upsert(batch, { onConflict: "id" });

    if (error) {
      errors.push(`xp_events batch ${i}: ${error.message}`);
    }
  }

  return errors;
}

async function pushAchievements(
  userId: string,
  dogId: string,
  achievements: UnlockedAchievement[],
): Promise<string[]> {
  const errors: string[] = [];
  if (achievements.length === 0) return errors;

  const rows = achievements.map((a) => achievementToRow(a, userId, dogId));

  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase
      .from("unlocked_achievements")
      .upsert(batch, { onConflict: "id" });

    if (error) {
      errors.push(`unlocked_achievements batch ${i}: ${error.message}`);
    }
  }

  return errors;
}

async function pushAchievementProgress(
  userId: string,
  dogId: string,
  progress: AchievementProgress[],
): Promise<string[]> {
  const errors: string[] = [];
  if (progress.length === 0) return errors;

  const rows = progress.map((p) => progressToRow(p, userId, dogId));

  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase
      .from("achievement_progress")
      .upsert(batch, { onConflict: "id" });

    if (error) {
      errors.push(`achievement_progress batch ${i}: ${error.message}`);
    }
  }

  return errors;
}

// ── Pull Helpers ──

async function pullXpEvents(
  userId: string,
  dogId: string,
  knownIds: Set<string>,
): Promise<XpEvent[]> {
  const { data, error } = await supabase
    .from("xp_events")
    .select("*")
    .eq("user_id", userId)
    .eq("dog_id", dogId)
    .order("earned_at", { ascending: true });

  if (error) throw error;

  return (data ?? [])
    .filter((row: Record<string, unknown>) => !knownIds.has(row.id as string))
    .map((row: Record<string, unknown>) => rowToXpEvent(row));
}

async function pullAchievements(
  userId: string,
  dogId: string,
  knownSlugs: Set<string>,
): Promise<UnlockedAchievement[]> {
  const { data, error } = await supabase
    .from("unlocked_achievements")
    .select("*")
    .eq("user_id", userId)
    .eq("dog_id", dogId);

  if (error) throw error;

  return (data ?? [])
    .filter((row: Record<string, unknown>) => !knownSlugs.has(row.slug as string))
    .map((row: Record<string, unknown>) => rowToAchievement(row));
}

async function pullAchievementProgress(
  userId: string,
  dogId: string,
): Promise<AchievementProgress[]> {
  const { data, error } = await supabase
    .from("achievement_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("dog_id", dogId);

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => rowToProgress(row));
}

// ── Core Sync ──

/**
 * Bidirectional sync for the active dog's gamification data.
 *
 * 1. Push local state (summary row + XP events + achievements + progress)
 * 2. Pull remote records missing locally
 * 3. Merge via _mergeGamification (max-wins for XP/streaks)
 */
export async function syncGamification(
  userId: string,
  dogId: string,
): Promise<GamificationSyncResult> {
  if (isSyncing) {
    return { pushed: 0, pulled: 0, conflicts: 0, errors: ["Sync already in progress"] };
  }

  isSyncing = true;
  const store = useGamificationStore.getState();
  store._setSyncMeta({ status: "syncing" });

  const result: GamificationSyncResult = { pushed: 0, pulled: 0, conflicts: 0, errors: [] };

  try {
    const pendingOps = await loadPendingOps();
    const dogOp = pendingOps.find((o) => o.dogId === dogId);

    // ── Step 1: Push local state if we have pending changes ──

    if (dogOp?.type === "upsert") {
      // Push summary row
      const summaryRow = summaryToRow(userId, dogId);
      const { data: remoteSummary, error: fetchErr } = await supabase
        .from("gamification_summaries")
        .select("total_xp, current_streak, longest_streak, updated_at")
        .eq("dog_id", dogId)
        .eq("user_id", userId)
        .limit(1);

      if (fetchErr) throw fetchErr;

      const remote = (remoteSummary ?? [])[0] as Record<string, unknown> | undefined;

      let shouldPush = true;

      if (remote) {
        // Max-wins: push if local XP is higher or timestamps are equal/newer
        const localXp = store.totalXp;
        const remoteXp = remote.total_xp as number;
        const remoteUpdated = new Date(remote.updated_at as string);
        const localUpdated = new Date(dogOp.timestamp);

        // Push if local XP is higher, OR local timestamp is newer
        shouldPush = localXp >= remoteXp || localUpdated >= remoteUpdated;

        if (!shouldPush) {
          result.conflicts++;
        }
      }

      if (shouldPush) {
        const { error: upsertErr } = await supabase
          .from("gamification_summaries")
          .upsert(summaryRow, { onConflict: "id" });

        if (upsertErr) {
          result.errors.push(`push summary: ${upsertErr.message}`);
        } else {
          result.pushed++;
        }
      }

      // Push XP events (append-only, always push all local events)
      const xpErrors = await pushXpEvents(userId, dogId, store.xpEvents);
      result.errors.push(...xpErrors);
      if (xpErrors.length === 0 && store.xpEvents.length > 0) {
        result.pushed++;
      }

      // Push achievements
      const achErrors = await pushAchievements(userId, dogId, store.unlockedAchievements);
      result.errors.push(...achErrors);

      // Push achievement progress
      const progErrors = await pushAchievementProgress(userId, dogId, store.achievementProgress);
      result.errors.push(...progErrors);
    }

    // ── Step 2: Pull remote data missing locally ──

    // Pull remote summary for max-wins merge
    const { data: remoteSummaries, error: summaryErr } = await supabase
      .from("gamification_summaries")
      .select("*")
      .eq("dog_id", dogId)
      .eq("user_id", userId)
      .limit(1);

    if (summaryErr) throw summaryErr;

    const remoteSummaryRow = (remoteSummaries ?? [])[0] as Record<string, unknown> | undefined;

    // Pull missing XP events
    const localEventIds = new Set(store.xpEvents.map((e) => e.id));
    const newXpEvents = await pullXpEvents(userId, dogId, localEventIds);

    // Pull missing achievements
    const localSlugs = new Set(store.unlockedAchievements.map((a) => a.slug));
    const newAchievements = await pullAchievements(userId, dogId, localSlugs);

    // Pull all achievement progress (max-wins merge handled in store)
    const remoteProgress = await pullAchievementProgress(userId, dogId);

    if (newXpEvents.length > 0 || newAchievements.length > 0 || remoteSummaryRow) {
      result.pulled++;
    }

    // ── Step 3: Merge into store ──

    if (remoteSummaryRow || newXpEvents.length > 0 || newAchievements.length > 0 || remoteProgress.length > 0) {
      store._mergeGamification({
        totalXp: (remoteSummaryRow?.total_xp as number) ?? store.totalXp,
        currentStreak: (remoteSummaryRow?.current_streak as number) ?? store.streak.currentStreak,
        longestStreak: (remoteSummaryRow?.longest_streak as number) ?? store.streak.longestStreak,
        lastActiveDate: (remoteSummaryRow?.last_active_date as string | null) ?? store.streak.lastActiveDate,
        totalActiveDays: (remoteSummaryRow?.total_active_days as number) ?? store.streak.totalActiveDays,
        goodBoyScore: (remoteSummaryRow?.good_boy_score as number) ?? store.goodBoyScore,
        gbsDimensions: (remoteSummaryRow?.gbs_dimensions as GbsDimensions) ?? store.gbsDimensions,
        gbsLastCalculated: (remoteSummaryRow?.gbs_last_calculated as string | null) ?? store.gbsLastCalculated,
        xpEvents: newXpEvents,
        unlockedAchievements: newAchievements,
        achievementProgress: remoteProgress,
        activeChallenge: (remoteSummaryRow?.active_challenge as UserChallenge | null) ?? store.activeChallenge,
      });
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
    console.error("[gamificationSync] Sync error:", msg);
    store._setSyncMeta({ status: "error" });
  } finally {
    isSyncing = false;
  }

  if (__DEV__ && (result.pushed > 0 || result.pulled > 0 || result.conflicts > 0)) {
    console.log(
      `[gamificationSync] Dog: ${dogId}, Pushed: ${result.pushed}, Pulled: ${result.pulled}, ` +
      `Conflicts: ${result.conflicts}, Errors: ${result.errors.length}`,
    );
  }

  return result;
}

// ── Realtime Subscription ──

/**
 * Subscribe to Supabase Realtime changes on gamification_summaries.
 * Any insert/update/delete from another device triggers a callback.
 */
export function subscribeToGamificationChanges(
  userId: string,
  onRemoteChange: () => void,
): () => void {
  const channel = supabase
    .channel("gamification-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "gamification_summaries",
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

export async function getLastGamificationSyncTime(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_SYNC_KEY);
}

export async function getGamificationPendingCount(): Promise<number> {
  const ops = await loadPendingOps();
  return ops.length;
}

/**
 * Clear all gamification sync data. Call on sign-out.
 */
export async function clearGamificationSyncData(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(PENDING_KEY),
    AsyncStorage.removeItem(LAST_SYNC_KEY),
  ]);
  useGamificationStore.getState()._setSyncMeta({
    status: "idle",
    lastSyncedAt: null,
    pendingCount: 0,
  });
}
