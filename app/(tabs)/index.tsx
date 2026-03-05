import React from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Typography, Card, CardSkeleton } from "@/components/ui";

/**
 * Home Screen — Today's Training
 * PRD-03 Section 5
 *
 * This is a shell — full implementation in Phase 2.
 */
export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-xl" showsVerticalScrollIndicator={false}>
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="pt-3xl mb-xl"
        >
          <Typography variant="h2" color="secondary">
            Good morning! 👋
          </Typography>
          <Typography variant="h1">Today's Training</Typography>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
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
        </Animated.View>

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

        <Animated.View
          entering={FadeInDown.duration(400).delay(300)}
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
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
