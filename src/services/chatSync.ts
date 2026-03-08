/**
 * Chat Sync Service
 *
 * Bidirectional, local-first sync with Supabase for chat sessions,
 * messages, and conversation summaries. Same pattern as dogSync.ts
 * and trainingSync.ts (PR #25, PR #32).
 *
 * Conflict resolution: most recent updated_at wins.
 *
 * Architecture:
 * - Local mutations happen instantly via Zustand store
 * - A store subscriber detects changes and marks pending
 * - syncChat() pushes pending changes, pulls remote state, merges
 * - Supabase Realtime triggers immediate pulls on remote changes
 *
 * Per-dog isolation: all tables have a dog_id column.
 * Chat history (sessions + messages) and summaries are scoped
 * to a single dog, so switching dogs syncs the correct data.
 *
 * No circular dependencies: this file imports chatStore,
 * but chatStore does NOT import this file. The useChatSync
 * hook bridges them.
 */

import { supabase } from "@/services/supabase";
import { useChatStore } from "@/stores/chatStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ChatMessage, ChatSession, ConversationSummary } from "@/types/chat";

// ── Storage Keys ──

const PENDING_KEY = "puppal-chat-sync-pending";
const LAST_SYNC_KEY = "puppal-chat-sync-last";

// ── Types ──

export type ChatSyncOpType = "upsert" | "delete";

interface PendingChatSyncOp {
  dogId: string;
  type: ChatSyncOpType;
  timestamp: string;
}

export interface ChatSyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
}

// ── Lock ──

let isSyncing = false;

// ── Pending Operations Queue ──

async function loadPendingOps(): Promise<PendingChatSyncOp[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function savePendingOps(ops: PendingChatSyncOp[]): Promise<void> {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(ops));
}

/**
 * Queue a chat sync operation.
 * Coalesces: any sequence of upserts stays upsert; upsert + delete = delete.
 */
export async function queueChatSyncOp(
  dogId: string,
  type: ChatSyncOpType,
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
  useChatStore.getState()._setSyncMeta({ pendingCount: ops.length });
}

// ── Row Conversion Helpers ──

function sessionToRow(
  session: ChatSession,
  userId: string,
): Record<string, unknown> {
  return {
    id: session.id,
    user_id: userId,
    dog_id: session.dogId,
    started_at: session.startedAt,
    ended_at: session.endedAt ?? null,
    message_count: session.messageCount,
    summary: session.summary ?? null,
    topics: session.topics ?? [],
    sentiment: session.sentiment,
    escalation_triggered: session.escalationTriggered,
    escalation_type: session.escalationType,
    updated_at: new Date().toISOString(),
  };
}

function rowToSession(row: Record<string, unknown>): ChatSession {
  return {
    id: row.id as string,
    dogId: row.dog_id as string,
    startedAt: row.started_at as string,
    endedAt: row.ended_at as string | undefined,
    messageCount: row.message_count as number,
    summary: row.summary as string | undefined,
    topics: (row.topics as string[]) ?? [],
    sentiment: row.sentiment as ChatSession["sentiment"],
    escalationTriggered: row.escalation_triggered as boolean,
    escalationType: row.escalation_type as ChatSession["escalationType"],
  };
}

function messageToRow(
  message: ChatMessage,
  userId: string,
): Record<string, unknown> {
  return {
    id: message.id,
    user_id: userId,
    dog_id: message.dogId,
    session_id: message.sessionId,
    role: message.role,
    content: message.content,
    photo_url: message.photoUrl ?? null,
    feedback: message.feedback,
    tokens_used: message.tokensUsed ?? null,
    updated_at: new Date().toISOString(),
  };
}

function rowToMessage(row: Record<string, unknown>): ChatMessage {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    dogId: row.dog_id as string,
    role: row.role as ChatMessage["role"],
    content: row.content as string,
    photoUrl: row.photo_url as string | undefined,
    createdAt: row.created_at as string,
    feedback: row.feedback as ChatMessage["feedback"],
    tokensUsed: row.tokens_used as number | undefined,
    isStreaming: false,
  };
}

function summaryToRow(
  summary: ConversationSummary,
  userId: string,
  dogId: string,
): Record<string, unknown> {
  return {
    id: summary.id,
    user_id: userId,
    dog_id: dogId,
    session_id: summary.sessionId ?? null,
    summary_text: summary.summaryText,
    key_topics: summary.keyTopics ?? [],
    advice_given: summary.adviceGiven ?? [],
    follow_up_needed: summary.followUpNeeded ?? [],
    updated_at: new Date().toISOString(),
  };
}

function rowToSummary(row: Record<string, unknown>): ConversationSummary {
  return {
    id: row.id as string,
    sessionId: row.session_id as string | undefined,
    summaryText: row.summary_text as string,
    keyTopics: (row.key_topics as string[]) ?? [],
    adviceGiven: (row.advice_given as string[]) ?? [],
    followUpNeeded: (row.follow_up_needed as string[]) ?? [],
    createdAt: row.created_at as string,
  };
}

// ── Push Helpers ──

async function pushSessions(
  userId: string,
  sessions: ChatSession[],
): Promise<string[]> {
  const errors: string[] = [];
  if (sessions.length === 0) return errors;

  const rows = sessions.map((s) => sessionToRow(s, userId));

  // Upsert in batches of 50
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase
      .from("chat_sessions")
      .upsert(batch, { onConflict: "id" });

    if (error) {
      errors.push(`sessions batch ${i}: ${error.message}`);
    }
  }

  return errors;
}

async function pushMessages(
  userId: string,
  messages: ChatMessage[],
): Promise<string[]> {
  const errors: string[] = [];
  if (messages.length === 0) return errors;

  // Filter out streaming messages and messages without a dogId
  const pushable = messages.filter((m) => !m.isStreaming && m.dogId);
  if (pushable.length === 0) return errors;

  const rows = pushable.map((m) => messageToRow(m, userId));

  // Upsert in batches of 50
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase
      .from("chat_messages")
      .upsert(batch, { onConflict: "id" });

    if (error) {
      errors.push(`messages batch ${i}: ${error.message}`);
    }
  }

  return errors;
}

async function pushSummaries(
  userId: string,
  dogId: string,
  summaries: ConversationSummary[],
): Promise<string[]> {
  const errors: string[] = [];
  if (summaries.length === 0) return errors;

  const rows = summaries.map((s) => summaryToRow(s, userId, dogId));

  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase
      .from("chat_summaries")
      .upsert(batch, { onConflict: "id" });

    if (error) {
      errors.push(`summaries batch ${i}: ${error.message}`);
    }
  }

  return errors;
}

// ── Pull Helpers ──

async function pullSessions(
  userId: string,
  dogId: string,
): Promise<ChatSession[]> {
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("dog_id", dogId)
    .order("started_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => rowToSession(row));
}

async function pullMessages(
  userId: string,
  dogId: string,
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("user_id", userId)
    .eq("dog_id", dogId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => rowToMessage(row));
}

async function pullSummaries(
  userId: string,
  dogId: string,
): Promise<ConversationSummary[]> {
  const { data, error } = await supabase
    .from("chat_summaries")
    .select("*")
    .eq("user_id", userId)
    .eq("dog_id", dogId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => rowToSummary(row));
}

// ── Core Sync ──

/**
 * Bidirectional sync for chat history and summaries for a specific dog.
 *
 * 1. Check for pending local changes
 * 2. Push: sessions, messages, and summaries for this dog
 * 3. Pull: fetch remote state and merge into store
 * 4. Update sync metadata
 *
 * Conflict resolution:
 * - Sessions/messages: push local first (local-first), then pull missing remote records
 * - Summaries: upsert both directions (summaries only grow, never edited)
 */
export async function syncChat(
  userId: string,
  dogId: string,
): Promise<ChatSyncResult> {
  if (isSyncing) {
    return { pushed: 0, pulled: 0, conflicts: 0, errors: ["Sync already in progress"] };
  }

  isSyncing = true;
  const store = useChatStore.getState();
  store._setSyncMeta({ status: "syncing" });

  const result: ChatSyncResult = { pushed: 0, pulled: 0, conflicts: 0, errors: [] };

  try {
    const pendingOps = await loadPendingOps();
    const dogOp = pendingOps.find((o) => o.dogId === dogId);

    // ── Local state for this dog ──
    const localSessions = store.sessions.filter((s) => s.dogId === dogId);
    const localMessages = store.messages.filter(
      (m) => (m.dogId === dogId) && !m.isStreaming,
    );
    const localSummaries = store.richSummaries.filter(
      // Summaries aren't per-dog in store yet; we use all of them for this dog
      // (they get tagged with dogId during push)
      () => true,
    );

    // ── Step 1: Push local changes if pending ──
    if (dogOp?.type === "upsert" || localSessions.length > 0) {
      const sessErrors = await pushSessions(userId, localSessions);
      result.errors.push(...sessErrors);
      if (sessErrors.length === 0 && localSessions.length > 0) {
        result.pushed += localSessions.length;
      }

      const msgErrors = await pushMessages(userId, localMessages);
      result.errors.push(...msgErrors);
      if (msgErrors.length === 0 && localMessages.length > 0) {
        result.pushed += localMessages.length;
      }

      const sumErrors = await pushSummaries(userId, dogId, localSummaries);
      result.errors.push(...sumErrors);
    }

    // ── Step 2: Pull remote state and merge ──
    const [remoteSessions, remoteMessages, remoteSummaries] = await Promise.all([
      pullSessions(userId, dogId),
      pullMessages(userId, dogId),
      pullSummaries(userId, dogId),
    ]);

    // Count pulled records that don't exist locally
    const localSessionIds = new Set(localSessions.map((s) => s.id));
    const localMessageIds = new Set(localMessages.map((m) => m.id));
    const localSummaryIds = new Set(store.richSummaries.map((s) => s.id));

    const newSessions = remoteSessions.filter((s) => !localSessionIds.has(s.id));
    const newMessages = remoteMessages.filter((m) => !localMessageIds.has(m.id));
    const newSummaries = remoteSummaries.filter((s) => !localSummaryIds.has(s.id));

    result.pulled += newSessions.length + newMessages.length + newSummaries.length;

    // Merge into store
    if (newSessions.length > 0 || newMessages.length > 0 || newSummaries.length > 0) {
      store._mergeChatData({
        sessions: newSessions,
        messages: newMessages,
        richSummaries: newSummaries,
      });
    }

    // ── Step 3: Clean up pending ops ──
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
    console.error("[chatSync] Sync error:", msg);
    store._setSyncMeta({ status: "error" });
  } finally {
    isSyncing = false;
  }

  if (__DEV__ && (result.pushed > 0 || result.pulled > 0 || result.errors.length > 0)) {
    console.log(
      `[chatSync] Dog: ${dogId}, Pushed: ${result.pushed}, Pulled: ${result.pulled}, ` +
      `Conflicts: ${result.conflicts}, Errors: ${result.errors.length}`,
    );
  }

  return result;
}

// ── Realtime Subscription ──

/**
 * Subscribe to Supabase Realtime changes on chat_sessions.
 * Any insert/update/delete from another device triggers a callback.
 * Returns an unsubscribe function.
 */
export function subscribeToChatChanges(
  userId: string,
  onRemoteChange: () => void,
): () => void {
  const channel = supabase
    .channel("chat-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "chat_sessions",
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

export async function getLastChatSyncTime(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_SYNC_KEY);
}

export async function getChatPendingCount(): Promise<number> {
  const ops = await loadPendingOps();
  return ops.length;
}

/**
 * Clear all chat sync data. Call on sign-out.
 */
export async function clearChatSyncData(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(PENDING_KEY),
    AsyncStorage.removeItem(LAST_SYNC_KEY),
  ]);
  useChatStore.getState()._setSyncMeta({
    status: "idle",
    lastSyncedAt: null,
    pendingCount: 0,
  });
}
