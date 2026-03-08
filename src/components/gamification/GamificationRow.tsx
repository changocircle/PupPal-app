/**
 * GamificationRow, horizontal stats row for Home screen
 * PRD-04: shows streak, daily XP, GBS, level in a compact horizontal layout
 *
 * All stats are tappable and navigate to relevant screens:
 * - Streak → Training plan tab
 * - Level badge → Achievements screen
 * - GBS → Achievements screen
 * - XP → Achievements screen
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
  /** HOME-01: delta vs yesterday score. Null/undefined means no prior session — show '--' */
  gbsDelta?: number | null;
  level: number;
  levelTitle: string;
  totalXp: number;
}

export function GamificationRow({
  streak,
  dailyXp,
  dailyXpTarget,
  goodBoyScore,
  gbsDelta,
  level,
  levelTitle,
  totalXp,
}: GamificationRowProps) {
  // HOME-01: safe delta label - show '--' when no prior session data exists
  const deltaLabel =
    gbsDelta == null
      ? '--'
      : gbsDelta > 0
        ? `+${gbsDelta}`
        : gbsDelta < 0
          ? `${gbsDelta}`
          : '--';
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
        {/* Streak → Plan tab (train today to keep it) */}
        <Pressable
          className="flex-row items-center gap-sm"
          onPress={() => router.push("/(tabs)/plan")}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <StreakFlame streak={streak} size="sm" showLabel={false} />
          <View>
            <Typography variant="body-sm-medium">
              {streak > 0 ? `${streak} day streak` : "Start your streak!"}
            </Typography>
            <Typography variant="caption" color="tertiary">
              Train today to keep it going
            </Typography>
          </View>
        </Pressable>

        {/* Level badge → Achievements */}
        <Pressable
          className="items-end"
          onPress={() => router.push("/achievements")}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <View
            className="px-md py-[3px] rounded-full flex-row items-center gap-[4px]"
            style={{ backgroundColor: COLORS.accent.light }}
          >
            <Typography variant="caption" style={{ color: COLORS.accent.dark }}>
              {levelTitle}
            </Typography>
          </View>
        </Pressable>
      </View>

      {/* Middle: Daily XP bar */}
      <DailyXpBar currentXp={dailyXp} target={dailyXpTarget} />

      {/* Bottom: GBS + XP total */}
      <View className="flex-row items-center justify-between mt-md">
        {/* GBS → Achievements */}
        <Pressable
          className="flex-row items-center gap-sm"
          onPress={() => router.push("/achievements")}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <ScoreGauge score={goodBoyScore} size={44} strokeWidth={4} showLabel={false} />
          <View>
            <Typography variant="body-sm-medium">
              Good Boy Score
            </Typography>
            <Typography variant="caption" color="tertiary">
              {goodBoyScore}/100 ({deltaLabel} vs yesterday)
            </Typography>
          </View>
        </Pressable>

        {/* XP total → Achievements */}
        <Pressable
          className="items-end"
          onPress={() => router.push("/achievements")}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Typography variant="body-sm-medium" style={{ color: COLORS.accent.dark }}>
            {totalXp.toLocaleString()} points
          </Typography>
          <Typography variant="caption" color="tertiary">
            Paw Points
          </Typography>
        </Pressable>
      </View>
    </View>
  );
}
