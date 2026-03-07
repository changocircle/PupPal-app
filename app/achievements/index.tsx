/**
 * Achievements Grid Screen, PRD-04 §6
 * Full-screen grid of all achievements, grouped by category.
 * Unlocked badges show emoji + name; locked show "?" with optional progress.
 *
 * FIX-05: Category filter pills were stretching vertically to fill the screen.
 * Root cause: NativeWind `className` on ScrollView + Pressable don't reliably
 * constrain height in RN. The outer ScrollView had no explicit height, and the
 * `rounded-full` + `px-md py-xs` pills expanded to fill available flex space.
 * Fix: Explicit inline styles on the filter container with `height`, `flexGrow: 0`,
 * `alignItems: 'center'` and consistent pill sizing.
 */

import React, { useState, useMemo } from "react";
import { View, ScrollView, Pressable, SafeAreaView, StyleSheet } from "react-native";
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
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Typography variant="body-lg">←</Typography>
        </Pressable>
        <Typography variant="h2" style={{ flex: 1 }}>
          Achievements
        </Typography>
        <Typography variant="body-sm" color="secondary">
          {unlockedCount}/{totalCount}
        </Typography>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <ScoreGauge score={goodBoyScore} size={52} strokeWidth={4} showLabel={false} />
          <Typography variant="caption" color="secondary" style={{ marginTop: 2 }}>
            GBS
          </Typography>
        </View>
        <View style={styles.statItem}>
          <StreakFlame streak={streakData.currentStreak} size="sm" showLabel={false} />
          <Typography variant="caption" color="secondary" style={{ marginTop: 2 }}>
            Streak
          </Typography>
        </View>
        <View style={styles.statItem}>
          <Typography variant="h3" style={{ color: COLORS.accent.dark }}>
            {totalXp.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="secondary" style={{ marginTop: 2 }}>
            Paw Points
          </Typography>
        </View>
        <View style={styles.statItem}>
          <Typography variant="h3">{levelInfo.title}</Typography>
          <Typography variant="caption" color="secondary" style={{ marginTop: 2 }}>
            {levelInfo.title}
          </Typography>
        </View>
      </View>

      {/* FIX-05: Category filter pills, constrained height container */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          <Pressable
            onPress={() => setSelectedCategory("all")}
            style={[
              styles.filterPill,
              {
                backgroundColor:
                  selectedCategory === "all"
                    ? COLORS.primary.DEFAULT
                    : COLORS.primary.light,
              },
            ]}
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
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected
                      ? COLORS.primary.DEFAULT
                      : COLORS.primary.light,
                  },
                ]}
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
      </View>

      {/* Achievement grid */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        <View style={styles.grid}>
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
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Typography style={{ fontSize: 40, marginBottom: 12 }}>🏅</Typography>
            <Typography variant="body" color="secondary">
              No achievements in this category yet
            </Typography>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#1B2333",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    alignItems: "center",
  },
  // FIX-05: Constrained filter container
  filterContainer: {
    height: 48,               // Fixed height prevents vertical expansion
    flexGrow: 0,              // Don't grow to fill flex space
    flexShrink: 0,            // Don't shrink either
    marginBottom: 4,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",     // Vertically center pills in the row
    height: 48,               // Match container height
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,        // Fully rounded
    height: 34,               // Explicit pill height
    justifyContent: "center", // Center text vertically
    alignItems: "center",     // Center text horizontally
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
});
