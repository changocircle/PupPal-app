/**
 * AchievementBadge, single achievement display (for grid/list)
 * PRD-04 §6: locked/unlocked states, rarity border, progress indicator
 *
 * Locked achievements show name + progress bar (PlayStation/Xbox style),
 * NOT "???" placeholder. Users should see what they're working towards.
 */

import React from "react";
import { View, Pressable } from "react-native";
import { Typography } from "@/components/ui";
import { getAchievementEmoji, RARITY_COLORS } from "@/data/achievementData";
import type { Achievement, AchievementProgress } from "@/types/gamification";

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
  progress?: AchievementProgress;
  onPress?: () => void;
  size?: "sm" | "md";
}

/**
 * Format a progress label like "{current}/{target} exercises" with actual values.
 */
function formatProgressLabel(
  label: string | null,
  current: number,
  target: number
): string {
  if (!label) return `${current}/${target}`;
  return label
    .replace("{current}", String(current))
    .replace("{target}", String(target));
}

export function AchievementBadge({
  achievement,
  unlocked,
  progress,
  onPress,
  size = "md",
}: AchievementBadgeProps) {
  const emoji = getAchievementEmoji(achievement.iconName);
  const rarityColor = RARITY_COLORS[achievement.rarity];
  const iconSize = size === "sm" ? 28 : 36;
  const containerSize = size === "sm" ? 56 : 72;
  const progressPct = progress
    ? Math.min((progress.current / progress.target) * 100, 100)
    : 0;

  return (
    <Pressable onPress={onPress} className="items-center" style={{ width: containerSize + 16 }}>
      {/* Badge circle */}
      <View
        className="items-center justify-center rounded-full"
        style={{
          width: containerSize,
          height: containerSize,
          backgroundColor: unlocked ? `${rarityColor}15` : "#F0EBE6",
          borderWidth: unlocked ? 2 : 1,
          borderColor: unlocked ? rarityColor : "#E5E0DB",
          opacity: unlocked ? 1 : 0.7,
        }}
      >
        <Typography style={{ fontSize: iconSize }}>
          {unlocked ? emoji : "🔒"}
        </Typography>
      </View>

      {/* Name: always visible (PRD-04: no ??? placeholders) */}
      <Typography
        variant="caption"
        color={unlocked ? undefined : "secondary"}
        className="text-center mt-[4px]"
        numberOfLines={2}
      >
        {achievement.name}
      </Typography>

      {/* Progress bar for locked achievements with trackable progress */}
      {!unlocked && progress && progress.target > 0 && (
        <View className="w-full mt-[2px]">
          <View
            className="h-[4px] rounded-full overflow-hidden"
            style={{ backgroundColor: "#E5E0DB" }}
          >
            <View
              className="h-full rounded-full"
              style={{
                width: `${progressPct}%` as `${number}%`,
                backgroundColor: progressPct > 0 ? rarityColor : "transparent",
                minWidth: progress.current > 0 ? 4 : 0,
              }}
            />
          </View>
          <Typography
            variant="caption"
            color="tertiary"
            className="text-center mt-[1px]"
            style={{ fontSize: 9 }}
          >
            {formatProgressLabel(
              achievement.progressLabel,
              progress.current,
              progress.target
            )}
          </Typography>
        </View>
      )}
    </Pressable>
  );
}
