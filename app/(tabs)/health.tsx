import React from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Typography, Card, Badge, CardSkeleton } from "@/components/ui";

/**
 * Health Dashboard Tab
 * PRD-05
 *
 * Shell screen — full health tracker in Phase 5.
 */
export default function HealthScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-xl" showsVerticalScrollIndicator={false}>
        <View className="pt-3xl mb-xl">
          <Typography variant="h1">Health</Typography>
          <Typography variant="body" color="secondary">
            Vaccinations, meds, weight & more
          </Typography>
        </View>

        {/* Quick status cards */}
        <View className="flex-row gap-md mb-xl">
          <Card className="flex-1 items-center">
            <Typography className="text-[28px] mb-xs">💉</Typography>
            <Typography variant="body-sm-medium">Vaccinations</Typography>
            <Badge variant="neutral" label="Not set up" size="sm" />
          </Card>
          <Card className="flex-1 items-center">
            <Typography className="text-[28px] mb-xs">💊</Typography>
            <Typography variant="body-sm-medium">Medications</Typography>
            <Badge variant="neutral" label="Not set up" size="sm" />
          </Card>
        </View>

        <View className="flex-row gap-md mb-xl">
          <Card className="flex-1 items-center">
            <Typography className="text-[28px] mb-xs">⚖️</Typography>
            <Typography variant="body-sm-medium">Weight</Typography>
            <Badge variant="neutral" label="No entries" size="sm" />
          </Card>
          <Card className="flex-1 items-center">
            <Typography className="text-[28px] mb-xs">🏥</Typography>
            <Typography variant="body-sm-medium">Vet Visits</Typography>
            <Badge variant="neutral" label="None logged" size="sm" />
          </Card>
        </View>

        {/* Coming soon note */}
        <Card variant="featured" className="mb-4xl">
          <Typography variant="body-sm" color="secondary" className="text-center">
            🏥 Full health tracker coming in Phase 5
          </Typography>
          <Typography variant="caption" color="tertiary" className="text-center mt-xs">
            Vaccination schedules, medication reminders, weight tracking with
            breed growth curves, vet visit logs, and developmental milestones
          </Typography>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
