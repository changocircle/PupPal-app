import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { Button, Typography } from "@/components/ui";

/**
 * Screen 1: Welcome / Meet Buddy
 * PRD-01 Section 3, Screen 1
 *
 * - Top 40%: Buddy character illustration with idle animation
 * - Middle: Speech bubble greeting (typewriter effect)
 * - Bottom: "Let's Go!" CTA
 * - Below CTA: "Already have an account? Sign in" link
 */
export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-xl justify-between">
        {/* Top section — Buddy character placeholder */}
        <View className="flex-1 items-center justify-center">
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600 }}
            className="items-center"
          >
            {/* Buddy character placeholder — replace with illustration */}
            <View className="w-[200px] h-[200px] rounded-full bg-primary-light items-center justify-center mb-xl">
              <Typography variant="display" className="text-[80px]">
                🐕
              </Typography>
            </View>

            {/* Speech bubble */}
            <View className="bg-surface rounded-lg p-lg shadow-card max-w-[320px]">
              <Typography variant="body-lg" className="text-center">
                Hey! I'm Buddy, your puppy's personal mentor. I'll create a
                custom training plan just for your pup. 🐾
              </Typography>
            </View>
          </MotiView>
        </View>

        {/* Bottom section — CTA */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600, delay: 400 }}
          className="pb-3xl gap-base"
        >
          <Button
            label="Let's Go!"
            onPress={() => router.push("/(onboarding)/name")}
          />

          <Button
            variant="ghost"
            label="Already have an account? Sign in"
            size="sm"
            onPress={() => {
              // TODO: Navigate to auth sign-in flow
            }}
          />
        </MotiView>
      </View>
    </SafeAreaView>
  );
}
