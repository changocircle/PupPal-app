import React, { useRef, useCallback, useEffect, useMemo } from "react";
import { View, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Typography, ErrorBoundary, ChatSkeleton, BuddyImage } from "@/components/ui";
import {
  MessageBubble,
  TypingIndicator,
  SuggestedPrompts,
  ChatInput,
  ChatLimitBanner,
  ChatOverflowMenu,
} from "@/components/chat";
import { useChat } from "@/hooks/useChat";
import { useDogStore } from "@/stores/dogStore";
import { DogSwitcherButton } from "@/components/dog/DogSwitcherButton";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useSubscription } from "@/hooks/useSubscription";
import { useHydration } from "@/hooks/useHydration";
import type { ChatMessage } from "@/types/chat";

/**
 * Buddy AI Chat Screen, PRD-02
 *
 * Full chat interface with:
 * - Message bubbles (Buddy left, user right)
 * - Typing indicator with staggered dots
 * - Streaming response rendering
 * - Suggested prompts (contextual)
 * - Free tier gating (3 msgs/day)
 * - Thumbs up/down feedback
 */

export default function ChatScreen() {
  const hydrated = useHydration(useDogStore, useOnboardingStore);

  if (!hydrated) {
    return <ChatSkeleton />;
  }

  return (
    <ErrorBoundary screen="Chat">
      <ChatScreenContent />
    </ErrorBoundary>
  );
}

function ChatScreenContent() {
  const flatListRef = useRef<FlatList>(null);
  const { isPremium } = useSubscription();
  // Individual selectors → stable refs, prevents render loops
  const activeDogId = useDogStore((s) => s.activeDogId);
  const dogs = useDogStore((s) => s.dogs);
  const dog = useMemo(
    () => dogs.find((d) => d.id === activeDogId) ?? null,
    [dogs, activeDogId]
  );
  const onboarding = useOnboardingStore((s) => s.data);
  const dogName = dog?.name ?? onboarding.puppyName ?? "Your Pup";

  const {
    messages,
    isStreaming,
    canSend,
    remainingMessages,
    suggestedPrompts,
    isLiveAI,
    sendMessage,
    sendSuggestedPrompt,
    setFeedback,
    startNewSession,
  } = useChat();

  const isLimitHit = !isPremium && remainingMessages <= 0;
  const hasMessages = messages.length > 0;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, messages[messages.length - 1]?.content]);

  // Message renderer
  const renderMessage = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      // Hide empty streaming messages (TypingIndicator handles the visual)
      if (item.isStreaming && !item.content) return null;

      // Show avatar only for first message or when switching speakers
      const prev = index > 0 ? messages[index - 1] : undefined;
      const showAvatar =
        item.role === "assistant" &&
        (!prev || prev.role !== "assistant");

      return (
        <MessageBubble
          message={item}
          showAvatar={showAvatar}
          onFeedback={item.role === "assistant" ? setFeedback : undefined}
        />
      );
    },
    [messages, setFeedback]
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* ── Header ── */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-row items-center px-xl py-sm border-b border-border bg-surface"
        >
          <View className="w-[36px] h-[36px] rounded-full overflow-hidden mr-sm">
            <BuddyImage expression="happy" size={36} />
          </View>
          <View className="flex-1">
            <Typography variant="body-medium">Buddy</Typography>
            <View className="flex-row items-center gap-xs">
              <View className={`w-[6px] h-[6px] rounded-full ${isLiveAI ? "bg-success" : "bg-accent"}`} />
              <Typography variant="caption" color="secondary">
                {isLiveAI ? "Online" : "Demo mode"}
              </Typography>
            </View>
          </View>
          {/* Free tier counter — counts down from 3 to 0, hidden for premium */}
          {!isPremium && remainingMessages < Infinity && (
            <View className="bg-primary-light px-sm py-xs rounded-full mr-sm">
              <Typography variant="caption" style={{ color: "#FF6B5C" }}>
                {remainingMessages} left
              </Typography>
            </View>
          )}
          <View className="mr-xs">
            <DogSwitcherButton />
          </View>
          {/* Overflow menu: New conversation + Chat history */}
          <ChatOverflowMenu onNewConversation={startNewSession} />
        </Animated.View>

        {/* ── Messages ── */}
        {!hasMessages ? (
          <EmptyState
            dogName={dogName}
            suggestedPrompts={suggestedPrompts}
            onSelectPrompt={sendSuggestedPrompt}
            canSend={canSend}
          />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={keyExtractor}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              <>
                {/* Typing indicator while streaming */}
                {isStreaming &&
                  messages[messages.length - 1]?.content === "" && (
                    <TypingIndicator />
                  )}

                {/* Limit hit banner */}
                {isLimitHit && (
                  <ChatLimitBanner
                    remaining={remainingMessages}
                    isLimitHit={true}
                    dogName={dogName}
                  />
                )}
              </>
            }
          />
        )}

        {/* ── Suggested prompts (after messages) ── */}
        {hasMessages && !isStreaming && !isLimitHit && (
          <SuggestedPrompts
            prompts={suggestedPrompts}
            onSelect={sendSuggestedPrompt}
            disabled={!canSend}
          />
        )}

        {/* ── Free tier remaining (subtle) ── */}
        {!isPremium && !isLimitHit && remainingMessages <= 1 && hasMessages && (
          <ChatLimitBanner
            remaining={remainingMessages}
            isLimitHit={false}
            dogName={dogName}
          />
        )}

        {/* ── Input bar ── */}
        <ChatInput
          onSend={sendMessage}
          disabled={!canSend || isLimitHit}
          placeholder={
            isLimitHit
              ? "Upgrade for unlimited access"
              : "Ask Buddy anything..."
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────
// Empty state, first time or cleared conversation
// ──────────────────────────────────────────────

function EmptyState({
  dogName,
  suggestedPrompts,
  onSelectPrompt,
  canSend,
}: {
  dogName: string;
  suggestedPrompts: string[];
  onSelectPrompt: (text: string) => void;
  canSend: boolean;
}) {
  return (
    <View className="flex-1 justify-center items-center px-xl">
      <Animated.View
        entering={FadeInDown.duration(500)}
        className="items-center"
      >
        {/* Buddy avatar */}
        <BuddyImage expression="waving" size={100} containerStyle={{ marginBottom: 24 }} />

        <Typography variant="h2" className="text-center mb-sm">
          Hey there! 👋
        </Typography>
        <Typography
          variant="body"
          color="secondary"
          className="text-center mb-2xl max-w-[300px]"
        >
          I'm Buddy, {dogName}'s personal training mentor. Ask me anything about
          training, behaviour, or health!
        </Typography>

        {/* Suggested prompts */}
        <View className="w-full gap-sm">
          {suggestedPrompts.map((prompt, idx) => (
            <Animated.View
              key={`${prompt}-${idx}`}
              entering={FadeInDown.delay(300 + idx * 80).springify()}
            >
              <View
                className="bg-surface border border-border rounded-xl px-base py-md"
                style={{
                  shadowColor: "#1B2333",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  elevation: 1,
                }}
              >
                <Typography
                  variant="body-sm-medium"
                  style={{ color: "#FF6B5C" }}
                  onPress={() => canSend && onSelectPrompt(prompt)}
                >
                  {prompt}
                </Typography>
              </View>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}
