/**
 * TypingIndicator, PRD-02 §5, DESIGN-SYSTEM chat animations
 *
 * Three dots with staggered opacity animation in a Buddy-style bubble.
 */

import React, { useEffect } from "react";
import { View } from "react-native";
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

export function TypingIndicator() {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      className="flex-row justify-start px-xl mb-sm"
    >
      {/* Avatar */}
      <View className="w-[32px] h-[32px] rounded-full bg-primary-light items-center justify-center mr-sm mt-[2px]">
        <Animated.Text style={{ fontSize: 18 }}>🐕</Animated.Text>
      </View>

      {/* Dots bubble */}
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
    </Animated.View>
  );
}
