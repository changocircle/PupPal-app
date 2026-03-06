/**
 * GamificationRow, horizontal stats row for Home screen
 * PRD-04: shows streak, daily XP, GBS, level in a compact horizontal layout
 */

import React from "react";
import { View, Pressable } from "react-native";
import { router } from "expo-router";
import { StreakFlame } from "./StreakFlame";
import { DailyXpBar } from "./DailyXpBar";
import { ScoreGauge } from "./ScoreGauge";
import { Typography } from "@/components/ui";
import { COLORS } from "@/constants/theme";

interface GamificationRowProps {
  streak: number;
  dailyXp: number;
  dailyXpTarget: number;
  goodBoyScore: number;
  level: number;
  levelTitle: string;
  totalXp: number;
}

export function GamificationRow({
  streak,
  dailyXp,
  dailyXpTarget,
  goodBoyScore,
  level,
  levelTitle,
  totalXp,
}: GamificationRowProps) {
  return (
    <View className="bg-surface rounded-2xl p-base" style={{
      shadowColor: "#1B2333",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    }}>
      {/* Top: Streak + Level */}
      <View className="flex-row items-center justify-between mb-md">
        {/* Streak */}
        <View className="flex-row items-center gap-sm">
          <StreakFlame streak={streak} size="sm" showLabel={false} />
          <View>
            <Typography variant="body-sm-medium">
              {streak > 0 ? `${streak} day streak` : "Start your streak!"}
            </Typography>
            <Typography variant="caption" color="tertiary">
              Train today to keep it going
            </Typography>
          </View>
        </View>

        {/* Level badge */}
        <View className="items-end">
          <View
            className="px-md py-[3px] rounded-full flex-row items-center gap-[4px]"
            style={{ backgroundColor: COLORS.accent.light }}
          >
            <Typography variant="caption" style={{ color: COLORS.accent.dark }}>
              Lv.{level}
            </Typography>
          </View>
          <Typography variant="caption" color="tertiary" className="mt-[1px]">
            {levelTitle}
          </Typography>
        </View>
      </View>

      {/* Middle: Daily XP bar */}
      <DailyXpBar currentXp={dailyXp} target={dailyXpTarget} />

      {/* Bottom: GBS + XP total */}
      <View className="flex-row items-center justify-between mt-md">
        <Pressable
          className="flex-row items-center gap-sm"
          onPress={() => {
            // Navigate to profile/achievements tab
          }}
        >
          <ScoreGauge score={goodBoyScore} size={44} strokeWidth={4} showLabel={false} />
          <View>
            <Typography variant="body-sm-medium">
              Good Boy Score
            </Typography>
            <Typography variant="caption" color="tertiary">
              {goodBoyScore}/100
            </Typography>
          </View>
        </Pressable>

        <View className="items-end">
          <Typography variant="body-sm-medium" style={{ color: COLORS.accent.dark }}>
            {totalXp.toLocaleString()} XP
          </Typography>
          <Typography variant="caption" color="tertiary">
            Total earned
          </Typography>
        </View>
      </View>
    </View>
  );
}
