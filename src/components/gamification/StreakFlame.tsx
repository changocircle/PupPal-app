/**
 * StreakFlame, animated streak display with visual escalation
 * PRD-04 §4, DESIGN-SYSTEM.md Gamification section
 *
 * Visual escalation by streak length:
 * - 1-6: Small flame, standard
 * - 7-13: Medium, warmer
 * - 14-29: Larger, orange glow
 * - 30-59: Animated pulsing
 * - 60-89: Purple (rare)
 * - 90+: Special elite
 */

import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Typography } from "@/components/ui";
import { getStreakTier } from "@/types/gamification";

interface StreakFlameProps {
  streak: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const TIER_CONFIG = {
  none: { emoji: "🔥", fontSize: 20, color: "#9CA3AF" },
  starter: { emoji: "🔥", fontSize: 22, color: "#FF6B5C" },
  weekly: { emoji: "🔥", fontSize: 26, color: "#FF6B5C" },
  biweekly: { emoji: "🔥", fontSize: 30, color: "#F5A623" },
  monthly: { emoji: "🔥", fontSize: 32, color: "#F5A623" },
  rare: { emoji: "🔥", fontSize: 34, color: "#9B59B6" },
  elite: { emoji: "🔥", fontSize: 36, color: "#FFB547" },
} as const;

const SIZE_SCALE = { sm: 0.7, md: 1, lg: 1.3 };

export function StreakFlame({
  streak,
  size = "md",
  showLabel = true,
}: StreakFlameProps) {
  const tier = getStreakTier(streak);
  const config = TIER_CONFIG[tier];
  const scale = SIZE_SCALE[size];

  // Continuous pulse animation (PRD-04: scale 1.0 → 1.05 → 1.0, 2s cycle)
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (streak <= 0) return;

    // Pulse intensity scales with tier
    const pulseAmount = tier === "monthly" || tier === "rare" || tier === "elite"
      ? 0.1
      : 0.05;

    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1 + pulseAmount, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1, // infinite
      false
    );
  }, [streak, tier]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value * scale }],
  }));

  if (streak <= 0 && !showLabel) return null;

  return (
    <View className="items-center">
      <Animated.Text
        style={[
          {
            fontSize: config.fontSize,
            lineHeight: config.fontSize + 4,
          },
          animatedStyle,
        ]}
      >
        {config.emoji}
      </Animated.Text>
      {showLabel && (
        <Typography
          variant={size === "lg" ? "h3" : "body-sm-medium"}
          style={{ color: streak > 0 ? config.color : "#9CA3AF" }}
        >
          {streak > 0 ? `${streak}` : "0"}
        </Typography>
      )}
    </View>
  );
}
