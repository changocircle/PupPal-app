import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Button, Typography } from "@/components/ui";

/**
 * Screen 1: Welcome / Meet Buddy
 * PRD-01 Section 3, Screen 1
 */
export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-xl justify-between">
        {/* Top section — Buddy character placeholder */}
        <View className="flex-1 items-center justify-center">
          <Animated.View
            entering={FadeInDown.duration(600)}
            className="items-center"
          >
            <View className="w-[200px] h-[200px] rounded-full bg-primary-light items-center justify-center mb-xl">
              <Typography variant="display" className="text-[80px]">
                🐕
              </Typography>
            </View>

            <View className="bg-surface rounded-lg p-lg shadow-card max-w-[320px]">
              <Typography variant="body-lg" className="text-center">
                Hey! I'm Buddy, your puppy's personal mentor. I'll create a
                custom training plan just for your pup. 🐾
              </Typography>
            </View>
          </Animated.View>
        </View>

        {/* Bottom section — CTA */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(400)}
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
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
