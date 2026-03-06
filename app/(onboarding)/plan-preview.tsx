import React from "react";
import { View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Button, Typography, Card, Badge } from "@/components/ui";
import { useOnboardingStore } from "@/stores/onboardingStore";

/**
 * Screen 7: Personalized Plan Preview
 * PRD-01 Section 3, Screen 7
 */
export default function PlanPreviewScreen() {
  const router = useRouter();
  const { data } = useOnboardingStore();
  const puppyName = data.puppyName || "Your Pup";
  const challengeCount = data.challenges.length;
  const isFirstTime = data.ownerExperience === "first_time";

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-xl" showsVerticalScrollIndicator={false}>
        <Animated.View
          entering={FadeInDown.duration(500)}
          className="pt-3xl items-center mb-2xl"
        >
          <Typography className="text-[48px] mb-sm">🎉</Typography>
          <Typography variant="h1" className="text-center mb-xs">
            {`${puppyName}'s Custom Plan`}
          </Typography>
          <Typography variant="body" color="secondary" className="text-center">
            Built specifically for {puppyName}'s needs
          </Typography>
        </Animated.View>

        <View className="gap-base mb-2xl">
          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            <Card className="flex-row items-center gap-base">
              <Typography className="text-[32px]">📋</Typography>
              <View className="flex-1">
                <Typography variant="h3">
                  12-Week Training Plan
                </Typography>
                <Typography variant="body-sm" color="secondary">
                  Customized daily exercises for {puppyName}
                </Typography>
              </View>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(350)}>
            <Card className="flex-row items-center gap-base">
              <Typography className="text-[32px]">🎯</Typography>
              <View className="flex-1">
                <Typography variant="h3">
                  {challengeCount} Focus {challengeCount === 1 ? "Area" : "Areas"}
                </Typography>
                <Typography variant="body-sm" color="secondary">
                  Targeted exercises for {puppyName}'s specific challenges
                </Typography>
              </View>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(500)}>
            <Card className="flex-row items-center gap-base">
              <Typography className="text-[32px]">🤖</Typography>
              <View className="flex-1">
                <Typography variant="h3">24/7 AI Mentor</Typography>
                <Typography variant="body-sm" color="secondary">
                  Buddy knows {puppyName}'s breed, age & challenges
                </Typography>
              </View>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(650)}>
            <Card className="flex-row items-center gap-base">
              <Typography className="text-[32px]">🏥</Typography>
              <View className="flex-1">
                <Typography variant="h3">Health Tracker</Typography>
                <Typography variant="body-sm" color="secondary">
                  Vaccinations, weight, vet visits, all in one place
                </Typography>
              </View>
            </Card>
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeIn.duration(400).delay(800)}
          className="items-center mb-2xl"
        >
          <View className="flex-row gap-xs mb-xs">
            {[1, 2, 3, 4, 5].map((star) => (
              <Typography key={star} className="text-[20px]">⭐</Typography>
            ))}
          </View>
          <Typography variant="body-sm" color="secondary">
            Trusted by thousands of puppy parents
          </Typography>
        </Animated.View>
      </ScrollView>

      <View className="px-xl pb-3xl pt-base">
        <Button
          label={`Start ${puppyName}'s Journey`}
          onPress={() => router.push("/(onboarding)/paywall")}
        />
      </View>
    </SafeAreaView>
  );
}
