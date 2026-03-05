/**
 * Achievements Grid Screen — PRD-04 §6
 * Full-screen grid of all achievements, grouped by category.
 * Unlocked badges show emoji + name; locked show "?" with optional progress.
 */

import React, { useState, useMemo } from "react";
import { View, ScrollView, Pressable, SafeAreaView } from "react-native";
import { router } from "expo-router";
import { Typography, Badge } from "@/components/ui";
import { AchievementBadge } from "@/components/gamification";
import { ScoreGauge, StreakFlame } from "@/components/gamification";
import {
  ALL_ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  getAchievementsByCategory,
} from "@/data/achievementData";
import { useGamificationStore } from "@/stores/gamificationStore";
import type { AchievementCategory } from "@/types/gamification";
import { COLORS } from "@/constants/theme";

export default function AchievementsScreen() {
  const [selectedCategory, setSelectedCategory] =
    useState<AchievementCategory | "all">("all");

  const unlockedAchievements = useGamificationStore(
    (s) => s.unlockedAchievements
  );
  const achievementProgress = useGamificationStore(
    (s) => s.achievementProgress
  );
  const totalXp = useGamificationStore((s) => s.totalXp);
  const goodBoyScore = useGamificationStore((s) => s.goodBoyScore);
  const streakData = useGamificationStore((s) => s.streak);
  const getLevelInfo = useGamificationStore((s) => s.getLevelInfo);

  const unlockedSlugs = useMemo(
    () => new Set(unlockedAchievements.map((a) => a.slug)),
    [unlockedAchievements]
  );

  const levelInfo = getLevelInfo();
  const unlockedCount = unlockedAchievements.length;
  const totalCount = ALL_ACHIEVEMENTS.length;

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    if (selectedCategory === "all") return ALL_ACHIEVEMENTS;
    return getAchievementsByCategory(selectedCategory);
  }, [selectedCategory]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-base pt-base pb-sm">
        <Pressable onPress={() => router.back()} className="mr-md p-xs">
          <Typography variant="body-lg">←</Typography>
        </Pressable>
        <Typography variant="h2" className="flex-1">
          Achievements
        </Typography>
        <Typography variant="body-sm" color="secondary">
          {unlockedCount}/{totalCount}
        </Typography>
      </View>

      {/* Stats row */}
      <View className="flex-row items-center justify-around px-base py-md bg-surface mx-base rounded-2xl mb-base" style={{
        shadowColor: "#1B2333",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}>
        <View className="items-center">
          <ScoreGauge score={goodBoyScore} size={52} strokeWidth={4} showLabel={false} />
          <Typography variant="caption" color="secondary" className="mt-[2px]">
            GBS
          </Typography>
        </View>
        <View className="items-center">
          <StreakFlame streak={streakData.currentStreak} size="sm" showLabel={false} />
          <Typography variant="caption" color="secondary" className="mt-[2px]">
            Streak
          </Typography>
        </View>
        <View className="items-center">
          <Typography variant="h3" style={{ color: COLORS.accent.dark }}>
            {totalXp.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="secondary" className="mt-[2px]">
            Total XP
          </Typography>
        </View>
        <View className="items-center">
          <Typography variant="h3">Lv.{levelInfo.level}</Typography>
          <Typography variant="caption" color="secondary" className="mt-[2px]">
            {levelInfo.title}
          </Typography>
        </View>
      </View>

      {/* Category filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 8 }}
      >
        <Pressable
          onPress={() => setSelectedCategory("all")}
          className="px-md py-xs rounded-full"
          style={{
            backgroundColor:
              selectedCategory === "all"
                ? COLORS.primary.DEFAULT
                : COLORS.primary.light,
          }}
        >
          <Typography
            variant="body-sm-medium"
            style={{
              color:
                selectedCategory === "all" ? "#FFFFFF" : COLORS.primary.DEFAULT,
            }}
          >
            All ({totalCount})
          </Typography>
        </Pressable>

        {ACHIEVEMENT_CATEGORIES.map((cat) => {
          const catAchievements = getAchievementsByCategory(cat.key);
          const catUnlocked = catAchievements.filter((a) =>
            unlockedSlugs.has(a.slug)
          ).length;
          const isSelected = selectedCategory === cat.key;

          return (
            <Pressable
              key={cat.key}
              onPress={() => setSelectedCategory(cat.key)}
              className="px-md py-xs rounded-full"
              style={{
                backgroundColor: isSelected
                  ? COLORS.primary.DEFAULT
                  : COLORS.primary.light,
              }}
            >
              <Typography
                variant="body-sm-medium"
                style={{
                  color: isSelected ? "#FFFFFF" : COLORS.primary.DEFAULT,
                }}
              >
                {cat.emoji} {cat.label} ({catUnlocked}/{catAchievements.length})
              </Typography>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Achievement grid */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        <View className="flex-row flex-wrap" style={{ gap: 12 }}>
          {filteredAchievements.map((achievement) => {
            const isUnlocked = unlockedSlugs.has(achievement.slug);
            const progress = achievementProgress.find(
              (p) => p.slug === achievement.slug
            );

            return (
              <AchievementBadge
                key={achievement.slug}
                achievement={achievement}
                unlocked={isUnlocked}
                progress={progress}
              />
            );
          })}
        </View>

        {filteredAchievements.length === 0 && (
          <View className="items-center py-3xl">
            <Typography className="text-[40px] mb-md">🏅</Typography>
            <Typography variant="body" color="secondary">
              No achievements in this category yet
            </Typography>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
