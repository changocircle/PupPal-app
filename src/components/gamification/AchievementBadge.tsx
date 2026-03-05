/**
 * AchievementBadge — single achievement display (for grid/list)
 * PRD-04 §6: locked/unlocked states, rarity border, progress indicator
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
          opacity: unlocked ? 1 : 0.5,
        }}
      >
        <Typography style={{ fontSize: iconSize }}>
          {unlocked ? emoji : "🔒"}
        </Typography>
      </View>

      {/* Name */}
      <Typography
        variant="caption"
        color={unlocked ? undefined : "tertiary"}
        className="text-center mt-[4px]"
        numberOfLines={2}
      >
        {unlocked ? achievement.name : "???"}
      </Typography>

      {/* Progress bar (if locked with progress) */}
      {!unlocked && progress && progress.target > 0 && (
        <View className="w-full mt-[2px]">
          <View
            className="h-[3px] rounded-full overflow-hidden"
            style={{ backgroundColor: "#F0EBE6" }}
          >
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.min(
                  (progress.current / progress.target) * 100,
                  100
                )}%` as `${number}%`,
                backgroundColor: "#9CA3AF",
                minWidth: progress.current > 0 ? 3 : 0,
              }}
            />
          </View>
        </View>
      )}
    </Pressable>
  );
}
