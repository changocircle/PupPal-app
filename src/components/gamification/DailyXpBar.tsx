/**
 * DailyXpBar, animated daily XP progress toward goal
 * PRD-04 §3, DESIGN-SYSTEM.md Gamification section
 *
 * Bar animates fill on XP update.
 * Flashes gold when goal is hit, then settles to success green.
 */

import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  interpolateColor,
} from "react-native-reanimated";
import { Typography } from "@/components/ui";
import { COLORS } from "@/constants/theme";
import { DAILY_XP_TARGET } from "@/types/gamification";

interface DailyXpBarProps {
  currentXp: number;
  target?: number;
  height?: number;
}

export function DailyXpBar({
  currentXp,
  target = DAILY_XP_TARGET,
  height = 8,
}: DailyXpBarProps) {
  const progress = Math.min(currentXp / target, 1.0);
  const isComplete = currentXp >= target;
  const overXp = Math.max(currentXp - target, 0);

  // Animated fill width
  const fillWidth = useSharedValue(0);
  const flashOpacity = useSharedValue(0);

  useEffect(() => {
    fillWidth.value = withTiming(progress, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });

    // Flash gold when goal is hit
    if (isComplete) {
      flashOpacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 300 })
      );
    }
  }, [currentXp, progress, isComplete]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value * 100}%` as `${number}%`,
    backgroundColor: isComplete
      ? COLORS.success.DEFAULT
      : COLORS.accent.DEFAULT,
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  return (
    <View>
      {/* Label */}
      <View className="flex-row items-center justify-between mb-[4px]">
        <Typography variant="caption" color="secondary">
          Daily XP
        </Typography>
        <Typography variant="caption" color={isComplete ? undefined : "secondary"}>
          {isComplete ? (
            <Typography
              variant="caption"
              style={{ color: COLORS.success.DEFAULT }}
            >
              {currentXp}/{target} ✓
              {overXp > 0 && ` (+${overXp} bonus)`}
            </Typography>
          ) : (
            `${currentXp}/${target}`
          )}
        </Typography>
      </View>

      {/* Bar track */}
      <View
        className="w-full rounded-full overflow-hidden"
        style={{
          height,
          backgroundColor: COLORS.border,
        }}
      >
        {/* Fill */}
        <Animated.View
          className="h-full rounded-full"
          style={[{ minWidth: currentXp > 0 ? 4 : 0 }, fillStyle]}
        />

        {/* Gold flash overlay */}
        <Animated.View
          className="absolute inset-0 rounded-full"
          style={[
            { backgroundColor: COLORS.accent.DEFAULT },
            flashStyle,
          ]}
        />
      </View>
    </View>
  );
}
