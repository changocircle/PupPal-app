/**
 * WeekCard, compact week overview for plan screen
 * PRD-03 §9: Shows week number, title, phase badge, progress, status
 */

import React from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Typography, Badge, ProgressBar } from "@/components/ui";
import type { PlanWeek } from "@/types/training";

interface WeekCardProps {
  week: PlanWeek;
  progress: number;
  index: number;
  isCurrentWeek: boolean;
  locked: boolean;
  /** Custom lock message — defaults to "Unlock with Premium" */
  lockLabel?: string;
  onPress: () => void;
}

const PHASE_BADGES: Record<string, { label: string; variant: "accent" | "warning" | "success" | "neutral" }> = {
  foundation: { label: "Foundation", variant: "accent" },
  building: { label: "Building", variant: "warning" },
  advanced: { label: "Advanced", variant: "success" },
};

export function WeekCard({
  week,
  progress,
  index,
  isCurrentWeek,
  locked,
  lockLabel,
  onPress,
}: WeekCardProps) {
  const phaseBadge = PHASE_BADGES[week.phase] ?? {
    label: week.phase,
    variant: "neutral" as const,
  };
  const isCompleted = week.status === "completed";

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <Pressable
        onPress={onPress}
        disabled={locked && !isCurrentWeek}
        className={`rounded-2xl p-lg border ${
          isCurrentWeek
            ? "bg-primary-extralight border-primary/20"
            : isCompleted
              ? "bg-success-light border-success/20"
              : locked
                ? "bg-surface border-border opacity-60"
                : "bg-surface border-border"
        }`}
        style={({ pressed }) => ({
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        {/* Header row */}
        <View className="flex-row items-center justify-between mb-sm">
          <View className="flex-row items-center gap-sm">
            <View
              className={`w-[32px] h-[32px] rounded-full items-center justify-center ${
                isCompleted
                  ? "bg-success"
                  : isCurrentWeek
                    ? "bg-primary"
                    : "bg-border"
              }`}
            >
              <Typography
                variant="body-sm-medium"
                color={isCompleted || isCurrentWeek ? "inverse" : "secondary"}
              >
                {isCompleted ? "✓" : week.weekNumber}
              </Typography>
            </View>
            <View>
              <Typography variant="body-medium" numberOfLines={1}>
                Week {week.weekNumber}: {week.title}
              </Typography>
            </View>
          </View>
          <Badge
            variant={isCompleted ? "success" : phaseBadge.variant}
            label={isCompleted ? "Done" : phaseBadge.label}
            size="sm"
          />
        </View>

        {/* Description */}
        <Typography
          variant="body-sm"
          color="secondary"
          className="mb-sm"
          numberOfLines={2}
        >
          {week.description}
        </Typography>

        {/* Progress bar */}
        {(isCurrentWeek || isCompleted) && (
          <View className="mt-xs">
            <ProgressBar
              progress={progress / 100}
              variant={isCompleted ? "success" : "primary"}
              height={6}
            />
            <Typography
              variant="caption"
              color="tertiary"
              className="mt-[4px]"
            >
              {progress}% complete
              {isCurrentWeek ? ` • ${week.milestone}` : ""}
            </Typography>
          </View>
        )}

        {/* Locked overlay */}
        {locked && !isCurrentWeek && (
          <View className="flex-row items-center gap-xs mt-xs">
            <Typography className="text-[12px]">🔒</Typography>
            <Typography variant="caption" color="tertiary">
              {lockLabel || "Unlock with Premium"}
            </Typography>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}
