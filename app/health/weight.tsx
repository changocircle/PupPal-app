import React, { useState, useMemo, useCallback } from "react";
import { View, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Typography, Card, Button, PremiumGate } from "@/components/ui";
import { WeightChart } from "@/components/health";
import { useHealthStore } from "@/stores/healthStore";
import { useDogStore } from "@/stores/dogStore";
import { useTrainingStore } from "@/stores/trainingStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useSubscription } from "@/hooks/useSubscription";
import type { WeightUnit } from "@/types/health";

/**
 * Weight Tracking Screen — PRD-05 §6
 */

export default function WeightScreen() {
  const router = useRouter();
  const { isPremium } = useSubscription();
  const dog = useDogStore((s) => s.activeDog());
  const plan = useTrainingStore((s) => s.plan);
  const onboardingData = useOnboardingStore((s) => s.data);
  const dogName = dog?.name ?? plan?.dogName ?? (onboardingData.puppyName || "Your Pup");
  const dogId = dog?.id ?? plan?.dogName ?? "default-dog";
  const ageWeeks = (onboardingData.ageMonths ?? 3) * 4;

  const weights = useHealthStore((s) => s.getWeightHistory(dogId));
  const addWeightEntry = useHealthStore((s) => s.addWeightEntry);
  const preferredUnit = useHealthStore((s) => s.preferredWeightUnit);
  const setPreferredUnit = useHealthStore((s) => s.setPreferredWeightUnit);

  const [showForm, setShowForm] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [unit, setUnit] = useState<WeightUnit>(preferredUnit);
  const [notesInput, setNotesInput] = useState("");

  const currentAgeWeeks = useMemo(() => {
    // Approximate current age = plan age + weeks since plan generated
    const planDate = plan?.generatedAt ? new Date(plan.generatedAt).getTime() : Date.now();
    return ageWeeks + Math.floor((Date.now() - planDate) / (7 * 86_400_000));
  }, [ageWeeks, plan]);

  const handleSave = useCallback(() => {
    const val = parseFloat(weightInput);
    if (isNaN(val) || val <= 0) {
      Alert.alert("Invalid Weight", "Please enter a valid weight.");
      return;
    }

    addWeightEntry({
      dogId,
      weightValue: val,
      weightUnit: unit,
      ageWeeks: currentAgeWeeks,
      notes: notesInput.trim() || undefined,
    });

    setPreferredUnit(unit);
    setWeightInput("");
    setNotesInput("");
    setShowForm(false);
    Alert.alert("Logged! ⚖️", `${val} ${unit} recorded. +5 XP 🎉`);
  }, [weightInput, unit, notesInput, dogId, currentAgeWeeks, addWeightEntry, setPreferredUnit]);

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
          <Typography variant="h1">⚖️ Weight Tracker</Typography>
          <Typography variant="body" color="secondary">
            Track {dogName}'s growth over time
          </Typography>
        </Animated.View>

        {/* Current weight + add button */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(60)}
          className="px-xl mb-lg"
        >
          <Card>
            {weights.length > 0 ? (
              <View className="flex-row items-end justify-between">
                <View>
                  <Typography variant="caption" color="secondary">
                    Current Weight
                  </Typography>
                  <Typography variant="h1" style={{ fontSize: 40, lineHeight: 48 }}>
                    {weights[weights.length - 1]!.weightValue}
                  </Typography>
                  <Typography variant="body-sm" color="secondary">
                    {weights[weights.length - 1]!.weightUnit} · Week{" "}
                    {weights[weights.length - 1]!.ageAtMeasurementWeeks}
                  </Typography>
                </View>
                {/* PRD-07: Free users get 1 entry, premium unlimited */}
                {isPremium || weights.length === 0 ? (
                  <Button
                    label="+ Weigh In"
                    variant="primary"
                    size="sm"
                    onPress={() => setShowForm(true)}
                  />
                ) : (
                  <Button
                    label="🔒 Track More"
                    variant="secondary"
                    size="sm"
                    onPress={() => router.push({ pathname: "/paywall", params: { trigger: "feature_gate_health", source: "weight_chart" } })}
                  />
                )}
              </View>
            ) : (
              <View className="items-center py-base">
                <Typography className="text-[40px] mb-sm">⚖️</Typography>
                <Typography variant="body-medium" className="mb-sm">
                  No weight entries yet
                </Typography>
                <Button
                  label="Log First Weight"
                  variant="primary"
                  onPress={() => setShowForm(true)}
                />
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Weight entry form */}
        {showForm && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            className="px-xl mb-lg"
          >
            <Card className="bg-primary-extralight border border-primary/20">
              <Typography variant="h3" className="mb-base">
                Log Weight
              </Typography>

              {/* Weight input */}
              <View className="flex-row gap-sm mb-base">
                <View className="flex-1">
                  <TextInput
                    value={weightInput}
                    onChangeText={setWeightInput}
                    placeholder="Enter weight"
                    keyboardType="decimal-pad"
                    className="bg-surface border border-border rounded-xl px-base py-md text-[16px]"
                    style={{ fontFamily: "PlusJakartaSans-Medium" }}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                {/* Unit toggle */}
                <View className="flex-row bg-surface border border-border rounded-xl overflow-hidden">
                  <Pressable
                    onPress={() => setUnit("lbs")}
                    className={`px-lg py-md ${unit === "lbs" ? "bg-primary" : ""}`}
                  >
                    <Typography
                      variant="body-sm-medium"
                      color={unit === "lbs" ? "inverse" : "secondary"}
                    >
                      lbs
                    </Typography>
                  </Pressable>
                  <Pressable
                    onPress={() => setUnit("kg")}
                    className={`px-lg py-md ${unit === "kg" ? "bg-primary" : ""}`}
                  >
                    <Typography
                      variant="body-sm-medium"
                      color={unit === "kg" ? "inverse" : "secondary"}
                    >
                      kg
                    </Typography>
                  </Pressable>
                </View>
              </View>

              {/* Notes */}
              <TextInput
                value={notesInput}
                onChangeText={setNotesInput}
                placeholder="Notes (optional)"
                className="bg-surface border border-border rounded-xl px-base py-md mb-base text-[14px]"
                style={{ fontFamily: "PlusJakartaSans-Regular" }}
                placeholderTextColor="#9CA3AF"
              />

              {/* Actions */}
              <View className="flex-row gap-sm">
                <Pressable
                  onPress={() => setShowForm(false)}
                  className="flex-1 py-md items-center rounded-xl bg-surface border border-border"
                >
                  <Typography variant="body-sm-medium" color="secondary">
                    Cancel
                  </Typography>
                </Pressable>
                <View className="flex-1">
                  <Button
                    label="Save"
                    variant="primary"
                    fullWidth
                    onPress={handleSave}
                  />
                </View>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Chart — PRD-07: blurred for free users */}
        {weights.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(120)}
            className="px-xl mb-lg"
          >
            <PremiumGate
              feature="feature_gate_health"
              headline={`${dogName}'s Growth Curve`}
              subtitle="Track weight over time with breed-specific growth charts"
              cta="Unlock Weight Charts"
              lockIcon="📈"
              blurred
              preview={
                <Card>
                  <Typography variant="h3" className="mb-base">
                    📈 Growth Chart
                  </Typography>
                  <WeightChart entries={weights} unit={preferredUnit} />
                </Card>
              }
            >
              <Card>
                <Typography variant="h3" className="mb-base">
                  📈 Growth Chart
                </Typography>
                <WeightChart entries={weights} unit={preferredUnit} />
              </Card>
            </PremiumGate>
          </Animated.View>
        )}

        {/* Weight history */}
        {weights.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(180)}
            className="px-xl mb-xl"
          >
            <Typography variant="h3" className="mb-sm">
              History
            </Typography>
            {[...weights].reverse().slice(0, isPremium ? undefined : 1).map((w) => (
              <View
                key={w.id}
                className="flex-row items-center py-md border-b border-border"
              >
                <View className="flex-1">
                  <Typography variant="body-medium">
                    {w.weightValue} {w.weightUnit}
                  </Typography>
                  <Typography variant="caption" color="secondary">
                    Week {w.ageAtMeasurementWeeks} ·{" "}
                    {new Date(w.measuredAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Typography>
                </View>
                {w.notes && (
                  <Typography
                    variant="caption"
                    color="tertiary"
                    numberOfLines={1}
                    className="max-w-[120px]"
                  >
                    {w.notes}
                  </Typography>
                )}
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
