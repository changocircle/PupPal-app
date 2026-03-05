import React from "react";
import { View } from "react-native";
import { MotiView } from "moti";

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

const FILL_CLASSES: Record<string, string> = {
  primary: "bg-primary",
  accent: "bg-accent",
  success: "bg-success",
};

export function ProgressBar({
  progress,
  height = 8,
  variant = "primary",
  animated = true,
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <View
      className="w-full bg-border overflow-hidden"
      style={{ height, borderRadius: height / 2 }}
    >
      <MotiView
        animate={{
          width: `${clampedProgress * 100}%` as unknown as number,
        }}
        transition={
          animated
            ? { type: "timing", duration: 500 }
            : { type: "timing", duration: 0 }
        }
        className={`h-full ${FILL_CLASSES[variant]}`}
        style={{ borderRadius: height / 2 }}
      />
    </View>
  );
}
