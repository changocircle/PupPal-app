/**
 * ChatHistoryModal — PRD-02 Section 5
 *
 * Full-screen modal showing past chat sessions.
 * Each row: date + first topic + message count.
 * Tap to view the full conversation (read-only).
 */

import React, { useMemo, useState } from "react";
import {
  View,
  Modal,
  FlatList,
  Pressable,
  SafeAreaView,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Typography } from "@/components/ui";
import { useChatStore } from "@/stores/chatStore";
import type { ChatSession, ChatMessage } from "@/types/chat";

interface ChatHistoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ChatHistoryModal({ visible, onClose }: ChatHistoryModalProps) {
  const sessions = useChatStore((s) => s.sessions);
  const getSessionMessages = useChatStore((s) => s.getSessionMessages);
  const currentSessionId = useChatStore((s) => s.currentSessionId);

  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(
    null
  );

  // Past sessions = all completed sessions except the current one
  const pastSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.id !== currentSessionId && s.messageCount > 0)
        .sort(
          (a, b) =>
            new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        ),
    [sessions, currentSessionId]
  );

  function handleClose() {
    setSelectedSession(null);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-xl py-base border-b border-border bg-surface">
          {selectedSession ? (
            <Pressable
              onPress={() => setSelectedSession(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Typography variant="body-sm-medium" style={{ color: "#FF6B5C" }}>
                ← Back
              </Typography>
            </Pressable>
          ) : (
            <View className="w-[60px]" />
          )}
          <Typography variant="body-medium">
            {selectedSession ? formatDate(selectedSession.startedAt) : "Chat History"}
          </Typography>
          <Pressable
            onPress={handleClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Typography variant="body-sm-medium" style={{ color: "#FF6B5C" }}>
              Done
            </Typography>
          </Pressable>
        </View>

        {selectedSession ? (
          <SessionView
            session={selectedSession}
            messages={getSessionMessages(selectedSession.id)}
          />
        ) : (
          <SessionList
            sessions={pastSessions}
            onSelectSession={setSelectedSession}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ── Session List ──

function SessionList({
  sessions,
  onSelectSession,
}: {
  sessions: ChatSession[];
  onSelectSession: (s: ChatSession) => void;
}) {
  if (sessions.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-xl">
        <Animated.View entering={FadeInDown.duration(400)} className="items-center">
          <Typography style={{ fontSize: 48, lineHeight: 56 }}>💬</Typography>
          <Typography variant="body-medium" className="text-center mt-base mb-sm">
            No past conversations yet
          </Typography>
          <Typography
            variant="body-sm"
            color="secondary"
            className="text-center max-w-[260px]"
          >
            Start chatting with Buddy and your history will appear here.
          </Typography>
        </Animated.View>
      </View>
    );
  }

  return (
    <FlatList
      data={sessions}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
      renderItem={({ item, index }) => (
        <Animated.View entering={FadeIn.delay(index * 40).duration(200)}>
          <SessionRow session={item} onPress={() => onSelectSession(item)} />
        </Animated.View>
      )}
      ItemSeparatorComponent={() => <View className="h-[1px] bg-border mx-xl" />}
    />
  );
}

function SessionRow({
  session,
  onPress,
}: {
  session: ChatSession;
  onPress: () => void;
}) {
  const topicLabel =
    session.topics && session.topics.length > 0
      ? session.topics.slice(0, 2).join(", ")
      : session.summary
      ? session.summary.slice(0, 50) + (session.summary.length > 50 ? "…" : "")
      : "Chat session";

  const sentimentEmoji: Record<string, string> = {
    positive: "😊",
    celebratory: "🎉",
    frustrated: "😅",
    concerned: "🤔",
    neutral: "💬",
  };

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-xl py-base active:bg-surface gap-base"
    >
      {/* Icon */}
      <View className="w-[40px] h-[40px] rounded-full bg-primary-light items-center justify-center">
        <Typography style={{ fontSize: 20, lineHeight: 24 }}>
          {sentimentEmoji[session.sentiment] ?? "💬"}
        </Typography>
      </View>

      {/* Content */}
      <View className="flex-1 gap-xs">
        <Typography variant="body-sm-medium" numberOfLines={1}>
          {topicLabel}
        </Typography>
        <Typography variant="caption" color="secondary">
          {formatDate(session.startedAt)} · {session.messageCount} message
          {session.messageCount !== 1 ? "s" : ""}
        </Typography>
      </View>

      {/* Arrow */}
      <Typography variant="caption" color="tertiary">
        ›
      </Typography>
    </Pressable>
  );
}

// ── Session Detail View (read-only) ──

function SessionView({
  session,
  messages,
}: {
  session: ChatSession;
  messages: ChatMessage[];
}) {
  if (messages.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-xl">
        <Typography variant="body-sm" color="secondary" className="text-center">
          No messages saved for this session.
        </Typography>
      </View>
    );
  }

  return (
    <FlatList
      data={messages.filter((m) => m.role !== "system" && m.content)}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 32, paddingHorizontal: 16 }}
      renderItem={({ item }) => <HistoryBubble message={item} />}
    />
  );
}

function HistoryBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <View
      className={`mb-sm max-w-[80%] ${isUser ? "self-end" : "self-start"}`}
    >
      <View
        className={`px-base py-sm rounded-lg ${
          isUser
            ? "bg-primary"
            : "bg-surface border border-border"
        }`}
      >
        <Typography
          variant="body-sm"
          style={isUser ? { color: "#FFFFFF" } : undefined}
        >
          {message.content}
        </Typography>
      </View>
    </View>
  );
}

// ── Helpers ──

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)
    return date.toLocaleDateString("en-US", { weekday: "long" });

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: diffDays > 365 ? "numeric" : undefined,
  });
}
