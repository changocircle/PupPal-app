/**
 * MessageBubble, PRD-02 §5, DESIGN-SYSTEM chat wireframe
 *
 * Buddy (left): white surface, shadow, avatar, body-lg text
 * User (right): coral filled, white text, no shadow
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Typography, BuddyImage } from "@/components/ui";
import { MarkdownText } from "./MarkdownText";
import type { ChatMessage } from "@/types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
  showAvatar?: boolean;
  onFeedback?: (messageId: string, feedback: "positive" | "negative") => void;
}

export function MessageBubble({
  message,
  showAvatar = true,
  onFeedback,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  return (
    <Animated.View
      entering={FadeInDown.duration(200).springify()}
      className={`flex-row mb-sm ${isUser ? "justify-end" : "justify-start"} px-xl`}
    >
      {/* Buddy avatar */}
      {isAssistant && showAvatar && (
        <View className="w-[32px] h-[32px] rounded-full overflow-hidden mr-sm mt-[2px]">
          <BuddyImage expression="happy" size={32} />
        </View>
      )}
      {isAssistant && !showAvatar && <View className="w-[32px] mr-sm" />}

      {/* Bubble */}
      <View
        className={`
          ${isUser ? "max-w-[75%]" : "max-w-[85%]"}
          ${
            isUser
              ? "bg-primary rounded-[16px] rounded-br-[8px]"
              : "bg-surface rounded-[16px] rounded-bl-[8px]"
          }
          px-base py-[14px]
        `}
        style={
          isAssistant
            ? {
                shadowColor: "#1B2333",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
              }
            : undefined
        }
      >
        {isAssistant ? (
          <MarkdownText
            style={{ fontSize: 18, lineHeight: 26 }}
          >
            {message.content}
          </MarkdownText>
        ) : (
          <Typography
            variant="body"
            color="inverse"
            style={{ color: "#FFFFFF" }}
          >
            {message.content}
          </Typography>
        )}

        {/* Streaming cursor, use pipe char (▊ doesn't render on all devices) */}
        {message.isStreaming && message.content.length > 0 && (
          <Typography
            variant="body-lg"
            style={{ color: "#FF6B5C", opacity: 0.6 }}
          >
            |
          </Typography>
        )}

        {/* Feedback buttons (assistant only, not streaming) */}
        {isAssistant && !message.isStreaming && onFeedback && (
          <View className="flex-row gap-md mt-sm pt-sm border-t border-border">
            <Pressable
              onPress={() => onFeedback(message.id, "positive")}
              className={`px-sm py-xs rounded-full ${
                message.feedback === "positive" ? "bg-success-light" : ""
              }`}
            >
              <Typography
                variant="caption"
                style={{
                  opacity: message.feedback === "negative" ? 0.3 : 0.6,
                }}
              >
                👍
              </Typography>
            </Pressable>
            <Pressable
              onPress={() => onFeedback(message.id, "negative")}
              className={`px-sm py-xs rounded-full ${
                message.feedback === "negative" ? "bg-error-light" : ""
              }`}
            >
              <Typography
                variant="caption"
                style={{
                  opacity: message.feedback === "positive" ? 0.3 : 0.6,
                }}
              >
                👎
              </Typography>
            </Pressable>
          </View>
        )}
      </View>
    </Animated.View>
  );
}
