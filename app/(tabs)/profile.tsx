import React from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Typography, Card, Badge, ProgressBar } from "@/components/ui";

/**
 * Profile / Settings / Achievements Tab
 * PRD-04 (gamification) + PRD-14 (settings)
 *
 * Shell screen — full implementation across Phases 4 & 5.
 */
export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-xl" showsVerticalScrollIndicator={false}>
        <View className="pt-3xl mb-xl">
          <Typography variant="h1">Profile</Typography>
        </View>

        {/* Dog card */}
        <Card className="flex-row items-center gap-base mb-xl">
          <View className="w-[64px] h-[64px] rounded-full bg-primary-light items-center justify-center">
            <Typography className="text-[32px]">🐕</Typography>
          </View>
          <View className="flex-1">
            <Typography variant="h3">Your Pup</Typography>
            <Typography variant="body-sm" color="secondary">
              Tap to edit profile
            </Typography>
          </View>
        </Card>

        {/* Gamification summary */}
        <Typography variant="h3" className="mb-base">
          Progress
        </Typography>
        <Card className="mb-xl">
          <View className="flex-row justify-between mb-md">
            <View>
              <Typography variant="body-sm" color="secondary">Level</Typography>
              <Typography variant="h2">1</Typography>
            </View>
            <View className="items-end">
              <Typography variant="body-sm" color="secondary">XP</Typography>
              <Typography variant="h2">0</Typography>
            </View>
          </View>
          <ProgressBar progress={0} variant="accent" />
          <Typography variant="caption" color="tertiary" className="mt-xs text-center">
            0 / 100 XP to Level 2
          </Typography>
        </Card>

        {/* Achievements teaser */}
        <Typography variant="h3" className="mb-base">
          Achievements
        </Typography>
        <Card variant="featured" className="mb-xl items-center">
          <Typography className="text-[32px] mb-sm">🏆</Typography>
          <Typography variant="body-medium" className="text-center">
            Complete exercises to unlock achievements!
          </Typography>
          <Typography variant="caption" color="secondary" className="text-center mt-xs">
            ~45 achievements to discover
          </Typography>
        </Card>

        {/* Settings links */}
        <Typography variant="h3" className="mb-base">
          Settings
        </Typography>
        <View className="gap-sm mb-4xl">
          {[
            { label: "Account", icon: "👤" },
            { label: "Notifications", icon: "🔔" },
            { label: "Subscription", icon: "💎" },
            { label: "Help & Support", icon: "❓" },
            { label: "Privacy Policy", icon: "🔒" },
          ].map((item) => (
            <Pressable key={item.label}>
              <Card variant="outline" className="flex-row items-center gap-md py-md">
                <Typography>{item.icon}</Typography>
                <Typography variant="body-medium" className="flex-1">
                  {item.label}
                </Typography>
                <Typography color="tertiary">→</Typography>
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
