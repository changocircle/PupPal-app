/**
 * Chat Sync Hook
 *
 * Manages the sync lifecycle for chat sessions, messages, and summaries:
 * - Detects local store changes and queues sync operations
 * - Triggers sync on auth, dog switch, app foreground, and realtime events
 * - Debounces rapid changes (3s, matching trainingSync since chat data
 *   can grow quickly during active sessions)
 * - Exposes sync status and manual sync trigger
 *
 * Usage:
 *   const { status, lastSyncedAt, pendingCount, sync } = useChatSync();
 */

import { useEffect, useRef, useCallback, useMemo } from "react";
import { AppState } from "react-native";
import { useAuthStore } from "@/stores/authStore";
import { useDogStore } from "@/stores/dogStore";
import { useChatStore } from "@/stores/chatStore";
import type { ChatSyncMeta } from "@/stores/chatStore";
import {
  syncChat,
  queueChatSyncOp,
  subscribeToChatChanges,
} from "@/services/chatSync";

const SYNC_DEBOUNCE_MS = 3000;

export function useChatSync(): ChatSyncMeta & { sync: () => Promise<void> } {
  const user = useAuthStore((s) => s.user);
  const activeDogId = useDogStore((s) => s.activeDogId);
  const isSwitching = useDogStore((s) => s.isSwitching);
  const syncMeta = useChatStore((s) => s._syncMeta);
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
  // Tracks session count, message count, and summary count for the active dog.
  // Changing any of these triggers a debounced sync.
  const sessions = useChatStore((s) => s.sessions);
  const messages = useChatStore((s) => s.messages);
  const richSummaries = useChatStore((s) => s.richSummaries);

  const snapshotKey = useMemo(() => {
    if (!activeDogId) return "no-dog";
    const dogSessions = sessions.filter((s) => s.dogId === activeDogId);
    const dogMessages = messages.filter((m) => m.dogId === activeDogId && !m.isStreaming);
    return `${activeDogId}:${dogSessions.length}:${dogMessages.length}:${richSummaries.length}`;
  }, [activeDogId, sessions, messages, richSummaries]);

  // ── Initial sync on auth + dog ready ──
  useEffect(() => {
    if (!user?.id || !activeDogId || isSwitching) return;

    let cancelled = false;
    const uid = user.id;
    const did = activeDogId;

    async function init() {
      if (cancelled) return;
      await syncChat(uid, did);
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

    const unsub = useChatStore.subscribe((state) => {
      // Skip during sync (sync layer is updating the store)
      if (state._syncMeta.status === "syncing") {
        const did = dogIdRef.current ?? "";
        const dogSessions = state.sessions.filter((s) => s.dogId === did);
        const dogMessages = state.messages.filter((m) => m.dogId === did && !m.isStreaming);
        prevSnapshotRef.current = `${did}:${dogSessions.length}:${dogMessages.length}:${state.richSummaries.length}`;
        return;
      }

      const did = dogIdRef.current;
      if (!did) return;

      const dogSessions = state.sessions.filter((s) => s.dogId === did);
      const dogMessages = state.messages.filter((m) => m.dogId === did && !m.isStreaming);
      const key = `${did}:${dogSessions.length}:${dogMessages.length}:${state.richSummaries.length}`;

      if (key !== prevSnapshotRef.current) {
        prevSnapshotRef.current = key;

        // Queue sync op
        queueChatSyncOp(did, "upsert");

        // Debounced auto-sync
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        const uid = userIdRef.current;
        if (uid) {
          syncTimerRef.current = setTimeout(() => {
            syncChat(uid, did);
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
    const unsubscribe = subscribeToChatChanges(uid, () => {
      // Remote change detected: sync immediately (no debounce)
      syncChat(uid, did);
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
        syncChat(uid, did);
      }
    });

    return () => sub.remove();
  }, [user?.id, activeDogId]);

  // ── Manual sync trigger ──
  const sync = useCallback(async () => {
    if (userIdRef.current && dogIdRef.current) {
      await syncChat(userIdRef.current, dogIdRef.current);
    }
  }, []);

  return {
    ...syncMeta,
    sync,
  };
}
