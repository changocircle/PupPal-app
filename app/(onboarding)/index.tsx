import React from "react";
import { View, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { Button, Typography, BuddyImage } from "@/components/ui";
import { resetAllStores } from "@/lib/resetStores";

/**
 * Screen 1: Welcome / Meet Buddy
 * PRD-01 Section 3, Screen 1
 */
export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-xl justify-between">
        {/* Top section, Buddy character illustration */}
        <View className="flex-1 items-center justify-center">
          <Animated.View
            entering={FadeInDown.duration(600)}
            className="items-center"
          >
            {/* Buddy waving illustration — expression #2 from brand guidelines */}
            <Animated.View
              entering={ZoomIn.duration(700).springify()}
              className="mb-xl"
              style={{ alignItems: "center" }}
            >
              <BuddyImage
                expression="waving"
                size={200}
                style={{
                  shadowColor: "#FF6B5C",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.18,
                  shadowRadius: 24,
                }}
              />
            </Animated.View>

            <View className="bg-surface rounded-lg p-lg shadow-card max-w-[320px]">
              <Typography variant="body-lg" className="text-center">
                Hey! I'm Buddy, your puppy's personal mentor. I'll create a
                custom training plan just for your pup. 🐾
              </Typography>
            </View>
          </Animated.View>
        </View>

        {/* Bottom section, CTA */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(400)}
          className="pb-3xl gap-base"
        >
          <Button
            label="Let's Go!"
            onPress={() => {
              resetAllStores();
              router.push("/(onboarding)/name");
            }}
          />

          <Button
            variant="ghost"
            label="Already have an account? Sign in"
            size="sm"
            onPress={() => {
              Alert.alert(
                "Sign In",
                "Sign in is coming soon! For now, start fresh and we'll get your pup set up in no time.",
                [{ text: "OK" }]
              );
            }}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
