import React from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { Typography, Card, CardSkeleton } from "@/components/ui";

/**
 * Home Screen — Today's Training
 * PRD-03 Section 5
 *
 * Shows:
 * - Greeting with dog name + streak
 * - Today's exercises (from active training plan)
 * - Good Boy Score widget
 * - Quick actions
 *
 * This is a shell — full implementation in Phase 2.
 */
export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-xl" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400 }}
          className="pt-3xl mb-xl"
        >
          <Typography variant="h2" color="secondary">
            Good morning! 👋
          </Typography>
          <Typography variant="h1">Today's Training</Typography>
        </MotiView>

        {/* Streak + Score widget placeholder */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 100 }}
          className="mb-xl"
        >
          <Card variant="featured" className="flex-row justify-between items-center">
            <View>
              <Typography variant="body-sm" color="secondary">
                🔥 Streak
              </Typography>
              <Typography variant="h2">0 days</Typography>
            </View>
            <View className="items-end">
              <Typography variant="body-sm" color="secondary">
                ⭐ Good Boy Score
              </Typography>
              <Typography variant="h2">--</Typography>
            </View>
          </Card>
        </MotiView>

        {/* Today's exercises placeholder */}
        <View className="mb-xl">
          <Typography variant="h3" className="mb-base">
            Today's Exercises
          </Typography>
          <View className="gap-base">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </View>
        </View>

        {/* Quick tip from Buddy */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 300 }}
          className="mb-4xl"
        >
          <Card className="flex-row items-start gap-md">
            <Typography className="text-[32px]">🐕</Typography>
            <View className="flex-1">
              <Typography variant="body-sm-medium" color="secondary">
                Buddy's Tip
              </Typography>
              <Typography variant="body">
                Complete your training plan to get started! Your personalized
                exercises will appear here.
              </Typography>
            </View>
          </Card>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
}
