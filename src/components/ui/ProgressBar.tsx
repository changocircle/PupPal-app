import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

/**
 * ProgressBar with animated fill matching PupPal Design System.
 *
 * Used for: training progress, XP progress, onboarding steps.
 */

interface ProgressBarProps {
  /** Progress value from 0 to 1 */
  progress: number;
  /** Height of the bar */
  height?: number;
  /** Fill color variant */
  variant?: "primary" | "accent" | "success";
  /** Background color */
  trackColor?: string;
  /** Whether to animate the fill change */
  animated?: boolean;
}

const FILL_COLORS: Record<string, string> = {
  primary: "#FF6B5C",
  accent: "#FFC857",
  success: "#4CAF50",
};

export function ProgressBar({
  progress,
  height = 8,
  variant = "primary",
  animated = true,
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const widthPercent = useSharedValue(0);

  useEffect(() => {
    widthPercent.value = animated
      ? withTiming(clampedProgress, { duration: 500 })
      : clampedProgress;
  }, [clampedProgress, animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${widthPercent.value * 100}%`,
    backgroundColor: FILL_COLORS[variant] || FILL_COLORS.primary,
  }));

  return (
    <View
      className="w-full bg-border overflow-hidden"
      style={{ height, borderRadius: height / 2 }}
    >
      <Animated.View
        style={[animatedStyle, { height, borderRadius: height / 2 }]}
      />
    </View>
  );
}
