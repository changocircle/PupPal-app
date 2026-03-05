/**
 * ChatInput — PRD-02 §5
 *
 * Text input with send button, character counter near limit.
 * Photo button placeholder (premium only, future).
 */

import React, { useState, useCallback } from "react";
import { View, TextInput, Pressable, Keyboard } from "react-native";
import { Typography } from "@/components/ui";
import { MAX_MESSAGE_LENGTH } from "@/types/chat";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Ask Buddy anything...",
}: ChatInputProps) {
  const [text, setText] = useState("");

  const trimmedLength = text.trim().length;
  const canSend = trimmedLength > 0 && trimmedLength <= MAX_MESSAGE_LENGTH && !disabled;
  const nearLimit = trimmedLength > MAX_MESSAGE_LENGTH - 200;

  const handleSend = useCallback(() => {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
    Keyboard.dismiss();
  }, [text, canSend, onSend]);

  return (
    <View className="border-t border-border bg-surface px-xl pt-sm pb-[34px]">
      {/* Character counter near limit */}
      {nearLimit && (
        <View className="flex-row justify-end mb-xs">
          <Typography
            variant="caption"
            style={{
              color:
                trimmedLength > MAX_MESSAGE_LENGTH ? "#EF6461" : "#9CA3AF",
            }}
          >
            {trimmedLength}/{MAX_MESSAGE_LENGTH}
          </Typography>
        </View>
      )}

      <View className="flex-row items-end gap-sm">
        {/* Photo button placeholder — TODO: wire up camera/gallery
        <Pressable className="w-[40px] h-[40px] rounded-full bg-border items-center justify-center mb-[4px]">
          <Typography variant="body" style={{ fontSize: 18 }}>📷</Typography>
        </Pressable>
        */}

        {/* Text input */}
        <View className="flex-1 bg-background rounded-2xl px-base py-sm min-h-[40px] max-h-[120px] border border-border">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={MAX_MESSAGE_LENGTH + 50} // slight buffer, enforce on send
            editable={!disabled}
            style={{
              fontFamily: "PlusJakartaSans_400Regular",
              fontSize: 16,
              lineHeight: 22,
              color: "#1B2333",
              maxHeight: 100,
            }}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
        </View>

        {/* Send button */}
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          className={`w-[40px] h-[40px] rounded-full items-center justify-center mb-[4px] ${
            canSend ? "bg-primary" : "bg-border"
          }`}
        >
          <Typography
            variant="body"
            color="inverse"
            style={{ fontSize: 18, opacity: canSend ? 1 : 0.4 }}
          >
            ➤
          </Typography>
        </Pressable>
      </View>
    </View>
  );
}
