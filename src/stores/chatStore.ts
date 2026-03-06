/**
 * Chat Store, PRD-02 §9
 *
 * Zustand store for chat state with AsyncStorage persistence.
 * Manages messages, sessions, free tier limits, and conversation memory.
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
} from "@/types/chat";
import { FREE_MESSAGE_LIMIT, SESSION_TIMEOUT_MINUTES } from "@/types/chat";

interface ChatState {
  // Current session
  currentSessionId: string | null;
  messages: ChatMessage[];

  // Sessions history
  sessions: ChatSession[];

  // Conversation summaries (for cross-session memory)
  conversationSummaries: string[];

  // Free tier tracking
  dailyCount: DailyMessageCount | null;

  // Status
  isStreaming: boolean;
  streamingMessageId: string | null;

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
  isSessionExpired: () => boolean;
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
      dailyCount: null,
      isStreaming: false,
      streamingMessageId: null,

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
        const { currentSessionId } = get();
        if (!currentSessionId) return null;

        const message: ChatMessage = {
          id: nanoid(),
          sessionId: currentSessionId,
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
        const { currentSessionId } = get();
        const message: ChatMessage = {
          id: nanoid(),
          sessionId: currentSessionId ?? "unknown",
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
    }),
    {
      name: "puppal-chat-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        messages: state.messages.filter((m) => !m.isStreaming).slice(-200), // persist last 200 messages
        sessions: state.sessions.slice(0, 50),
        conversationSummaries: state.conversationSummaries,
        dailyCount: state.dailyCount,
      }),
    }
  )
);
