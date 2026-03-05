/**
 * SuggestedPrompts — PRD-02 §5/§11
 *
 * Horizontally scrollable pill buttons above the input bar.
 * Tap sends as message immediately.
 */

import React from "react";
import { ScrollView, Pressable } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Typography } from "@/components/ui";

interface SuggestedPromptsProps {
  prompts: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export function SuggestedPrompts({
  prompts,
  onSelect,
  disabled = false,
}: SuggestedPromptsProps) {
  if (prompts.length === 0) return null;

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingVertical: 8,
          gap: 8,
        }}
      >
        {prompts.map((prompt, idx) => (
          <Pressable
            key={`${prompt}-${idx}`}
            onPress={() => !disabled && onSelect(prompt)}
            disabled={disabled}
            className={`
              bg-primary-light px-base py-sm rounded-full
              ${disabled ? "opacity-50" : ""}
            `}
          >
            <Typography
              variant="body-sm-medium"
              style={{ color: "#FF6B5C" }}
            >
              {prompt}
            </Typography>
          </Pressable>
        ))}
      </ScrollView>
    </Animated.View>
  );
}
