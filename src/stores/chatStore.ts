/**
 * Chat Store, PRD-02 §9
 *
 * Zustand store for chat state with AsyncStorage persistence.
 * Manages messages, sessions, free tier limits, and conversation memory.
 * Sync-aware: exposes _syncMeta and _mergeChatData for the sync layer.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { nanoid } from "nanoid/non-secure";
import type {
  ChatMessage,
  ChatSession,
  MessageFeedback,
  DailyMessageCount,
  ConversationSummary,
} from "@/types/chat";
import { FREE_MESSAGE_LIMIT, SESSION_TIMEOUT_MINUTES } from "@/types/chat";

// ── Sync Metadata ──

export type SyncStatus = "idle" | "syncing" | "error";

export interface ChatSyncMeta {
  status: SyncStatus;
  lastSyncedAt: string | null;
  pendingCount: number;
}

const DEFAULT_SYNC_META: ChatSyncMeta = {
  status: "idle",
  lastSyncedAt: null,
  pendingCount: 0,
};

interface ChatState {
  // Current session
  currentSessionId: string | null;
  messages: ChatMessage[];

  // Sessions history
  sessions: ChatSession[];

  // Conversation summaries (for cross-session memory)
  conversationSummaries: string[];

  // Rich summaries (stored for sync; mirrors ConversationSummary from PRD-02)
  richSummaries: ConversationSummary[];

  // Free tier tracking
  dailyCount: DailyMessageCount | null;

  // Status
  isStreaming: boolean;
  streamingMessageId: string | null;

  // Sync metadata (transient, not persisted to AsyncStorage)
  _syncMeta: ChatSyncMeta;

  // Actions
  startSession: (dogId: string) => string;
  endSession: () => void;
  addUserMessage: (content: string, photoUrl?: string) => ChatMessage | null;
  addAssistantMessage: (content: string) => ChatMessage;
  updateStreamingContent: (messageId: string, content: string) => void;
  finishStreaming: (messageId: string) => void;
  setFeedback: (messageId: string, feedback: MessageFeedback) => void;
  clearConversation: () => void;

  // Free tier
  canSendMessage: (isPremium: boolean) => boolean;
  getRemainingMessages: (isPremium: boolean) => number;
  incrementDailyCount: () => void;

  // Session helpers
  getSessionMessages: (sessionId: string) => ChatMessage[];
  getRecentSummaries: (count?: number) => string[];
  addConversationSummary: (summary: string) => void;

  // Rich summary helpers (used by sync layer)
  addRichSummary: (summary: ConversationSummary) => void;
  getRecentRichSummaries: (dogId: string, count?: number) => ConversationSummary[];

  isSessionExpired: () => boolean;

  // Sync-layer actions (prefixed with _ to indicate internal use)
  _setSyncMeta: (updates: Partial<ChatSyncMeta>) => void;
  _mergeChatData: (data: {
    sessions: ChatSession[];
    messages: ChatMessage[];
    richSummaries: ConversationSummary[];
  }) => void;
}

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      currentSessionId: null,
      messages: [],
      sessions: [],
      conversationSummaries: [],
      richSummaries: [],
      dailyCount: null,
      isStreaming: false,
      streamingMessageId: null,
      _syncMeta: { ...DEFAULT_SYNC_META },

      startSession: (dogId: string) => {
        const existing = get().currentSessionId;
        if (existing && !get().isSessionExpired()) {
          return existing;
        }

        // End previous session if exists
        if (existing) {
          get().endSession();
        }

        const sessionId = nanoid();
        const session: ChatSession = {
          id: sessionId,
          dogId,
          startedAt: new Date().toISOString(),
          messageCount: 0,
          sentiment: "neutral",
          escalationTriggered: false,
          escalationType: "none",
        };

        set((state) => ({
          currentSessionId: sessionId,
          sessions: [session, ...state.sessions].slice(0, 50), // keep last 50 sessions
        }));

        return sessionId;
      },

      endSession: () => {
        const { currentSessionId, messages } = get();
        if (!currentSessionId) return;

        const sessionMessages = messages.filter(
          (m) => m.sessionId === currentSessionId
        );

        set((state) => ({
          currentSessionId: null,
          sessions: state.sessions.map((s) =>
            s.id === currentSessionId
              ? {
                  ...s,
                  endedAt: new Date().toISOString(),
                  messageCount: sessionMessages.length,
                }
              : s
          ),
        }));
      },

      addUserMessage: (content: string, photoUrl?: string) => {
        const { currentSessionId, sessions } = get();
        if (!currentSessionId) return null;

        // Stamp dogId from the active session so the sync layer can filter by dog
        const activeSession = sessions.find((s) => s.id === currentSessionId);

        const message: ChatMessage = {
          id: nanoid(),
          sessionId: currentSessionId,
          dogId: activeSession?.dogId,
          role: "user",
          content,
          photoUrl,
          createdAt: new Date().toISOString(),
          feedback: "none",
        };

        set((state) => ({
          messages: [...state.messages, message],
          sessions: state.sessions.map((s) =>
            s.id === currentSessionId
              ? { ...s, messageCount: s.messageCount + 1 }
              : s
          ),
        }));

        return message;
      },

      addAssistantMessage: (content: string) => {
        const { currentSessionId, sessions } = get();

        // Stamp dogId from the active session so the sync layer can filter by dog
        const activeSession = sessions.find((s) => s.id === currentSessionId);

        const message: ChatMessage = {
          id: nanoid(),
          sessionId: currentSessionId ?? "unknown",
          dogId: activeSession?.dogId,
          role: "assistant",
          content,
          createdAt: new Date().toISOString(),
          feedback: "none",
          isStreaming: true,
        };

        set((state) => ({
          messages: [...state.messages, message],
          isStreaming: true,
          streamingMessageId: message.id,
        }));

        return message;
      },

      updateStreamingContent: (messageId: string, content: string) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === messageId ? { ...m, content } : m
          ),
        }));
      },

      finishStreaming: (messageId: string) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === messageId ? { ...m, isStreaming: false } : m
          ),
          isStreaming: false,
          streamingMessageId: null,
        }));
      },

      setFeedback: (messageId: string, feedback: MessageFeedback) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === messageId ? { ...m, feedback } : m
          ),
        }));
      },

      clearConversation: () => {
        const { currentSessionId } = get();
        if (currentSessionId) {
          get().endSession();
        }
        set({ messages: [], currentSessionId: null });
      },

      // ── Free tier ──

      canSendMessage: (isPremium: boolean) => {
        if (isPremium) return true;

        const { dailyCount } = get();
        const today = getTodayDateString();

        if (!dailyCount || dailyCount.date !== today) {
          return true; // New day, reset
        }

        return dailyCount.messagesSent < dailyCount.messagesLimit;
      },

      getRemainingMessages: (isPremium: boolean) => {
        if (isPremium) return Infinity;

        const { dailyCount } = get();
        const today = getTodayDateString();

        if (!dailyCount || dailyCount.date !== today) {
          return FREE_MESSAGE_LIMIT;
        }

        return Math.max(0, dailyCount.messagesLimit - dailyCount.messagesSent);
      },

      incrementDailyCount: () => {
        const today = getTodayDateString();
        const { dailyCount } = get();

        if (!dailyCount || dailyCount.date !== today) {
          // New day
          set({
            dailyCount: {
              date: today,
              messagesSent: 1,
              messagesLimit: FREE_MESSAGE_LIMIT,
            },
          });
        } else {
          const newCount = dailyCount.messagesSent + 1;
          set({
            dailyCount: {
              ...dailyCount,
              messagesSent: newCount,
              limitHitAt:
                newCount >= dailyCount.messagesLimit
                  ? new Date().toISOString()
                  : dailyCount.limitHitAt,
            },
          });
        }
      },

      // ── Session helpers ──

      getSessionMessages: (sessionId: string) => {
        return get().messages.filter((m) => m.sessionId === sessionId);
      },

      getRecentSummaries: (count = 3) => {
        return get().conversationSummaries.slice(-count);
      },

      addConversationSummary: (summary: string) => {
        set((state) => ({
          conversationSummaries: [
            ...state.conversationSummaries,
            summary,
          ].slice(-20), // keep last 20 summaries
        }));
      },

      // ── Rich summary helpers ──

      addRichSummary: (summary: ConversationSummary) => {
        set((state) => ({
          richSummaries: [
            ...state.richSummaries,
            summary,
          ].slice(-20), // keep last 20 rich summaries
        }));
      },

      getRecentRichSummaries: (_dogId: string, count = 3) => {
        // Returns the most recent rich summaries. Dog isolation is handled
        // at the sync layer (only summaries for this dog are pulled from Supabase).
        return get().richSummaries.slice(-count);
      },

      isSessionExpired: () => {
        const { currentSessionId, messages } = get();
        if (!currentSessionId) return true;

        const sessionMsgs = messages.filter(
          (m) => m.sessionId === currentSessionId
        );
        if (sessionMsgs.length === 0) return false; // Just started

        const lastMsg = sessionMsgs[sessionMsgs.length - 1];
        if (!lastMsg) return true;

        const lastTime = new Date(lastMsg.createdAt).getTime();
        const now = Date.now();
        return now - lastTime > SESSION_TIMEOUT_MINUTES * 60 * 1000;
      },

      // ── Sync-layer actions ──

      _setSyncMeta: (updates) =>
        set((state) => ({
          _syncMeta: { ...state._syncMeta, ...updates },
        })),

      _mergeChatData: (data) => {
        set((state) => {
          // Merge sessions: remote wins by updated_at if both have the session
          const localSessionMap = new Map(state.sessions.map((s) => [s.id, s]));
          const mergedSessions: ChatSession[] = [...state.sessions];

          for (const remote of data.sessions) {
            const local = localSessionMap.get(remote.id);
            if (!local) {
              mergedSessions.push(remote);
            }
            // Local sessions are already correct; remote sessions are pulled for missing ones
          }

          // Merge messages: upsert by id, local wins for streaming messages
          const localMsgMap = new Map(state.messages.map((m) => [m.id, m]));
          const mergedMessages: ChatMessage[] = [...state.messages];

          for (const remote of data.messages) {
            if (!localMsgMap.has(remote.id)) {
              mergedMessages.push(remote);
            }
            // Don't overwrite local messages (they may be mid-stream)
          }

          // Merge rich summaries: upsert by id
          const localSummaryMap = new Map(state.richSummaries.map((s) => [s.id, s]));
          const mergedSummaries: ConversationSummary[] = [...state.richSummaries];

          for (const remote of data.richSummaries) {
            if (!localSummaryMap.has(remote.id)) {
              mergedSummaries.push(remote);
            }
          }

          return {
            sessions: mergedSessions.slice(0, 50),
            messages: mergedMessages.filter((m) => !m.isStreaming).slice(-200),
            richSummaries: mergedSummaries.slice(-20),
          };
        });
      },
    }),
    {
      name: "puppal-chat-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        messages: state.messages.filter((m) => !m.isStreaming).slice(-200), // persist last 200 messages
        sessions: state.sessions.slice(0, 50),
        conversationSummaries: state.conversationSummaries,
        richSummaries: state.richSummaries,
        dailyCount: state.dailyCount,
        // _syncMeta is NOT persisted (resets to defaults on restart)
      }),
      // Correct any stale messagesLimit persisted from a previous dev build
      // (e.g. 50 from when FREE_MESSAGE_LIMIT was __DEV__ ? 50 : 3).
      // Must call useChatStore.setState() — direct mutation of `state` arg
      // in Zustand v5 persist does not update the store.
      onRehydrateStorage: () => (state) => {
        if (
          state?.dailyCount &&
          state.dailyCount.messagesLimit !== FREE_MESSAGE_LIMIT
        ) {
          const corrected = Math.min(
            state.dailyCount.messagesSent,
            FREE_MESSAGE_LIMIT,
          );
          // Use setState to actually commit the correction to the store
          useChatStore.setState({
            dailyCount: {
              ...state.dailyCount,
              messagesLimit: FREE_MESSAGE_LIMIT,
              messagesSent: corrected,
            },
          });
        }
      },
    }
  )
);
