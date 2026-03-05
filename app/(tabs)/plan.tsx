import React from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Typography, Card, CardSkeleton } from "@/components/ui";

/**
 * Training Plan Tab
 * PRD-03
 *
 * Shell screen — full plan display + exercise detail in Phase 2.
 */
export default function PlanScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-xl" showsVerticalScrollIndicator={false}>
        <View className="pt-3xl mb-xl">
          <Typography variant="h1">Training Plan</Typography>
          <Typography variant="body" color="secondary">
            Your personalized weekly plan
          </Typography>
        </View>

        {/* Week overview placeholder */}
        <Card variant="featured" className="mb-xl">
          <Typography variant="overline" color="secondary" className="mb-xs">
            CURRENT WEEK
          </Typography>
          <Typography variant="h2" className="mb-sm">
            Plan generation coming soon
          </Typography>
          <Typography variant="body-sm" color="secondary">
            Your custom training plan with 160+ exercises, trick library, and
            adaptive difficulty will be built in Phase 2.
          </Typography>
        </Card>

        {/* Exercise placeholders */}
        <Typography variant="h3" className="mb-base">
          Today's Exercises
        </Typography>
        <View className="gap-base mb-4xl">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
