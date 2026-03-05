import React from "react";
import { View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { Button, Typography, Card, Badge } from "@/components/ui";
import { useOnboardingStore } from "@/stores/onboardingStore";

/**
 * Screen 7: Personalized Plan Preview
 * PRD-01 Section 3, Screen 7
 *
 * - "Here's [Name]'s custom plan!"
 * - Shows personalized training plan summary
 * - Creates emotional investment (sunk cost) before paywall
 * - Animated reveal of plan components
 */
export default function PlanPreviewScreen() {
  const router = useRouter();
  const { data } = useOnboardingStore();
  const puppyName = data.puppyName || "Your Pup";

  // Derive plan preview from collected data
  const challengeCount = data.challenges.length;
  const isFirstTime = data.ownerExperience === "first_time";

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-xl" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500 }}
          className="pt-3xl items-center mb-2xl"
        >
          <Typography className="text-[48px] mb-sm">🎉</Typography>
          <Typography variant="h1" className="text-center mb-xs">
            {`${puppyName}'s Custom Plan`}
          </Typography>
          <Typography variant="body" color="secondary" className="text-center">
            Built specifically for {puppyName}'s needs
          </Typography>
        </MotiView>

        {/* Plan summary cards */}
        <View className="gap-base mb-2xl">
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400, delay: 200 }}
          >
            <Card className="flex-row items-center gap-base">
              <Typography className="text-[32px]">📋</Typography>
              <View className="flex-1">
                <Typography variant="h3">
                  {isFirstTime ? "8-Week" : "6-Week"} Training Plan
                </Typography>
                <Typography variant="body-sm" color="secondary">
                  Customized daily exercises for {puppyName}
                </Typography>
              </View>
            </Card>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400, delay: 350 }}
          >
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
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400, delay: 500 }}
          >
            <Card className="flex-row items-center gap-base">
              <Typography className="text-[32px]">🤖</Typography>
              <View className="flex-1">
                <Typography variant="h3">24/7 AI Mentor</Typography>
                <Typography variant="body-sm" color="secondary">
                  Buddy knows {puppyName}'s breed, age & challenges
                </Typography>
              </View>
            </Card>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400, delay: 650 }}
          >
            <Card className="flex-row items-center gap-base">
              <Typography className="text-[32px]">🏥</Typography>
              <View className="flex-1">
                <Typography variant="h3">Health Tracker</Typography>
                <Typography variant="body-sm" color="secondary">
                  Vaccinations, weight, vet visits — all in one place
                </Typography>
              </View>
            </Card>
          </MotiView>
        </View>

        {/* Social proof */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "timing", duration: 400, delay: 800 }}
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
        </MotiView>
      </ScrollView>

      {/* CTA */}
      <View className="px-xl pb-3xl pt-base">
        <Button
          label={`Start ${puppyName}'s Journey`}
          onPress={() => router.push("/(onboarding)/paywall")}
        />
      </View>
    </SafeAreaView>
  );
}
