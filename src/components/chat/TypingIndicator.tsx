/**
 * TypingIndicator, PRD-02 §5, DESIGN-SYSTEM chat animations
 *
 * Three dots with staggered opacity animation in a Buddy-style bubble.
 * Shows reassuring text after a delay ("Buddy is thinking...", "Almost there...").
 */

import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { BuddyAvatar } from "./BuddyAvatar";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { Typography } from "@/components/ui";

function Dot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: "#9CA3AF",
          marginHorizontal: 2,
        },
      ]}
    />
  );
}

function ThinkingText() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    // Show "Buddy is thinking..." after 3 seconds
    const thinkingTimer = setTimeout(() => {
      setText("Buddy is thinking...");
    }, 3000);

    // Change to "Almost there..." after 8 seconds
    const almostTimer = setTimeout(() => {
      setText("Almost there...");
    }, 8000);

    return () => {
      clearTimeout(thinkingTimer);
      clearTimeout(almostTimer);
    };
  }, []);

  if (!text) return null;

  return (
    <Animated.View entering={FadeIn.duration(400)}>
      <Typography
        variant="caption"
        color="tertiary"
        style={{ marginTop: 4, marginLeft: 4 }}
      >
        {text}
      </Typography>
    </Animated.View>
  );
}

export function TypingIndicator() {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      className="flex-row justify-start px-xl mb-sm"
    >
      {/* Avatar */}
      <View className="w-[32px] h-[32px] rounded-full bg-primary-light items-center justify-center mr-sm mt-[2px]">
        <BuddyAvatar mood="thinking" size={32} />
      </View>

      {/* Dots bubble + thinking text */}
      <View>
        <View
          className="bg-surface rounded-[16px] rounded-bl-[8px] px-lg py-[14px] flex-row items-center"
          style={{
            shadowColor: "#1B2333",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Dot delay={0} />
          <Dot delay={200} />
          <Dot delay={400} />
        </View>
        <ThinkingText />
      </View>
    </Animated.View>
  );
}
