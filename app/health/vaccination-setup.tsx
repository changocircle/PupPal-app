import React, { useMemo } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Typography, Card } from "@/components/ui";
import { useDogStore } from "@/stores/dogStore";
import { useTrainingStore } from "@/stores/trainingStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useHealthStore } from "@/stores/healthStore";

/**
 * Vaccination Setup Welcome Screen
 *
 * First-time flow for users who haven't set up vaccination records.
 * Offers 3 paths: upload vet records, manual entry, or start fresh.
 */

export default function VaccinationSetupScreen() {
  const router = useRouter();

  const activeDogId = useDogStore((s) => s.activeDogId);
  const dogs = useDogStore((s) => s.dogs);
  const dog = useMemo(
    () => dogs.find((d) => d.id === activeDogId) ?? null,
    [dogs, activeDogId],
  );
  const plan = useTrainingStore((s) => s.plan);
  const onboardingData = useOnboardingStore((s) => s.data);
  const dogName =
    dog?.name ?? plan?.dogName ?? onboardingData.puppyName || "Your Pup";
  const dogId = dog?.id ?? plan?.dogName ?? "default-dog";
  const breed = dog?.breed ?? plan?.breed ?? onboardingData.breed ?? null;
  const ageMonths = onboardingData.ageMonths ?? 3;
  const ageWeeks = ageMonths * 4;

  const completeVaccinationSetup = useHealthStore(
    (s) => s.completeVaccinationSetup,
  );

  const handleStartFresh = () => {
    const dob = new Date();
    dob.setDate(dob.getDate() - ageWeeks * 7);

    completeVaccinationSetup({
      method: "fresh",
      completedVaccines: [],
      dogId,
      dateOfBirth: dob,
      ageWeeks,
      breed,
    });

    router.replace("/health/vaccinations");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Back */}
        <Pressable
          onPress={() => router.back()}
          className="px-xl pt-base pb-sm"
        >
          <Typography variant="body-medium" style={{ color: "#FF6B5C" }}>
            ← Back
          </Typography>
        </Pressable>

        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-xl mb-xl items-center"
        >
          <Typography className="text-[64px] mb-md">🐾</Typography>
          <Typography variant="h1" className="text-center">
            Let's set up {dogName}'s{"\n"}health record!
          </Typography>
          <Typography
            variant="body"
            color="secondary"
            className="text-center mt-sm"
          >
            Have you got any vaccination records from your vet?
          </Typography>
        </Animated.View>

        {/* Option 1: Upload */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          className="px-xl mb-md"
        >
          <Pressable onPress={() => router.push("/health/vaccine-upload")}>
            <Card className="flex-row items-center gap-lg">
              <View
                className="w-[52px] h-[52px] rounded-2xl items-center justify-center"
                style={{ backgroundColor: "#FFF0EE" }}
              >
                <Typography className="text-[24px]">📸</Typography>
              </View>
              <View className="flex-1">
                <Typography variant="body-medium">
                  Upload vet records
                </Typography>
                <Typography variant="caption" color="secondary">
                  Take photos of your vaccination card or vet documents. AI
                  reads them for you.
                </Typography>
              </View>
              <Typography color="tertiary">→</Typography>
            </Card>
          </Pressable>
        </Animated.View>

        {/* Option 2: Manual */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(180)}
          className="px-xl mb-md"
        >
          <Pressable onPress={() => router.push("/health/vaccine-manual")}>
            <Card className="flex-row items-center gap-lg">
              <View
                className="w-[52px] h-[52px] rounded-2xl items-center justify-center"
                style={{ backgroundColor: "#E8F5EE" }}
              >
                <Typography className="text-[24px]">✏️</Typography>
              </View>
              <View className="flex-1">
                <Typography variant="body-medium">Enter manually</Typography>
                <Typography variant="caption" color="secondary">
                  Mark which vaccines {dogName} has already had and when.
                </Typography>
              </View>
              <Typography color="tertiary">→</Typography>
            </Card>
          </Pressable>
        </Animated.View>

        {/* Option 3: Start Fresh */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(260)}
          className="px-xl mb-xl"
        >
          <Pressable onPress={handleStartFresh}>
            <Card className="flex-row items-center gap-lg">
              <View
                className="w-[52px] h-[52px] rounded-2xl items-center justify-center"
                style={{ backgroundColor: "#EBF3FA" }}
              >
                <Typography className="text-[24px]">🆕</Typography>
              </View>
              <View className="flex-1">
                <Typography variant="body-medium">Start fresh</Typography>
                <Typography variant="caption" color="secondary">
                  Brand new puppy with no vaccine history yet. We'll track
                  everything from here.
                </Typography>
              </View>
              <Typography color="tertiary">→</Typography>
            </Card>
          </Pressable>
        </Animated.View>

        {/* Skip */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(340)}
          className="items-center"
        >
          <Pressable onPress={() => router.back()} className="py-md px-xl">
            <Typography variant="body-sm" color="tertiary">
              I'll do this later
            </Typography>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
