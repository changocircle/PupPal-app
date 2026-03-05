import React, { useMemo, useState, useCallback } from "react";
import { View, ScrollView, Pressable, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useSubscription } from "@/hooks/useSubscription";
import { Typography, Card, Button, Badge } from "@/components/ui";
import { VaccinationTimelineItem } from "@/components/health";
import { useHealthStore } from "@/stores/healthStore";
import { useDogStore } from "@/stores/dogStore";
import { useTrainingStore } from "@/stores/trainingStore";
import type { ScheduledVaccination } from "@/types/health";

/**
 * Vaccination Timeline Screen — PRD-05 §4
 */

export default function VaccinationsScreen() {
  const router = useRouter();
  const { isPremium } = useSubscription();

  // PRD-07: Redirect free users to paywall
  React.useEffect(() => {
    if (!isPremium) {
      router.replace({ pathname: "/paywall", params: { trigger: "feature_gate_health", source: "health_vaccinations" } });
    }
  }, [isPremium]);
  const dog = useDogStore((s) => s.activeDog());
  const plan = useTrainingStore((s) => s.plan);
  const dogName = dog?.name ?? plan?.dogName ?? "Your Pup";
  const dogId = dog?.id ?? plan?.dogName ?? "default-dog";

  const vaccinations = useHealthStore((s) => s.getVaccinationsForDog(dogId));
  const completeVaccination = useHealthStore((s) => s.completeVaccination);
  const skipVaccination = useHealthStore((s) => s.skipVaccination);

  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");

  const filtered = useMemo(() => {
    if (filter === "upcoming")
      return vaccinations.filter(
        (v) =>
          v.status === "upcoming" ||
          v.status === "due_soon" ||
          v.status === "overdue" ||
          v.status === "unknown"
      );
    if (filter === "completed")
      return vaccinations.filter(
        (v) => v.status === "completed" || v.status === "skipped"
      );
    return vaccinations;
  }, [vaccinations, filter]);

  const stats = useMemo(() => {
    const completed = vaccinations.filter(
      (v) => v.status === "completed"
    ).length;
    const total = vaccinations.length;
    const overdue = vaccinations.filter(
      (v) => v.status === "overdue"
    ).length;
    return { completed, total, overdue };
  }, [vaccinations]);

  const handleVaccinationPress = useCallback(
    (vax: ScheduledVaccination) => {
      if (vax.status === "completed") return;

      Alert.alert(
        `Log ${vax.vaccineName}`,
        "Mark this vaccination as completed?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Skip",
            style: "destructive",
            onPress: () => skipVaccination(vax.id),
          },
          {
            text: "Complete ✅",
            onPress: () => {
              completeVaccination(vax.id, {});
              Alert.alert("Logged!", `${vax.vaccineName} recorded. +5 XP 🎉`);
            },
          },
        ]
      );
    },
    [completeVaccination, skipVaccination]
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <Pressable
          onPress={() => router.back()}
          className="px-xl pt-base pb-sm"
        >
          <Typography variant="body-medium" style={{ color: "#FF6B5C" }}>
            ← Back
          </Typography>
        </Pressable>

        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-xl mb-lg"
        >
          <Typography variant="h1">💉 Vaccinations</Typography>
          <Typography variant="body" color="secondary">
            {dogName}'s vaccination schedule
          </Typography>
        </Animated.View>

        {/* Stats */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(60)}
          className="px-xl mb-lg"
        >
          <View className="flex-row gap-md">
            <Card className="flex-1 items-center">
              <Typography variant="h2" style={{ color: "#5CB882" }}>
                {stats.completed}
              </Typography>
              <Typography variant="caption" color="secondary">
                Completed
              </Typography>
            </Card>
            <Card className="flex-1 items-center">
              <Typography variant="h2">
                {stats.total - stats.completed}
              </Typography>
              <Typography variant="caption" color="secondary">
                Remaining
              </Typography>
            </Card>
            {stats.overdue > 0 && (
              <Card className="flex-1 items-center bg-error-light">
                <Typography variant="h2" style={{ color: "#EF6461" }}>
                  {stats.overdue}
                </Typography>
                <Typography variant="caption" style={{ color: "#EF6461" }}>
                  Overdue
                </Typography>
              </Card>
            )}
          </View>
        </Animated.View>

        {/* Filter pills */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(120)}
          className="px-xl mb-lg"
        >
          <View className="flex-row gap-sm">
            {(
              [
                { key: "all", label: "All" },
                { key: "upcoming", label: "Upcoming" },
                { key: "completed", label: "Completed" },
              ] as const
            ).map((f) => (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                className={`px-lg py-sm rounded-full ${
                  filter === f.key ? "bg-primary" : "bg-surface border border-border"
                }`}
              >
                <Typography
                  variant="body-sm-medium"
                  color={filter === f.key ? "inverse" : "secondary"}
                >
                  {f.label}
                </Typography>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Timeline */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(180)}
          className="px-xl"
        >
          {filtered.length > 0 ? (
            filtered.map((vax, i) => (
              <VaccinationTimelineItem
                key={vax.id}
                vaccination={vax}
                onPress={handleVaccinationPress}
                isLast={i === filtered.length - 1}
              />
            ))
          ) : (
            <Card className="items-center py-xl">
              <Typography className="text-[32px] mb-sm">✨</Typography>
              <Typography variant="body-medium">
                {filter === "upcoming"
                  ? "All vaccinations up to date!"
                  : "No vaccinations in this view"}
              </Typography>
            </Card>
          )}
        </Animated.View>

        {/* Disclaimer */}
        <View className="px-xl mt-xl">
          <Typography
            variant="caption"
            color="tertiary"
            className="text-center"
          >
            Based on AAHA guidelines. Your vet may adjust this schedule for{" "}
            {dogName}. Always follow your vet's specific recommendations.
          </Typography>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
