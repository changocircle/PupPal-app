import React from "react";
import { View, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { Button, Typography } from "@/components/ui";
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
            {/* Buddy avatar: layered circles for a premium, branded look */}
            <Animated.View
              entering={ZoomIn.duration(700).springify()}
              className="mb-xl"
              style={{ alignItems: "center" }}
            >
              {/* Outer glow ring */}
              <View
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: 110,
                  backgroundColor: "#FFF0EE",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#FF6B5C",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.18,
                  shadowRadius: 24,
                  elevation: 10,
                }}
              >
                {/* Inner coloured circle */}
                <View
                  style={{
                    width: 180,
                    height: 180,
                    borderRadius: 90,
                    backgroundColor: "#FF6B5C",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/* Buddy's face */}
                  <View style={{ alignItems: "center" }}>
                    <Typography style={{ fontSize: 72, lineHeight: 80 }}>
                      🐶
                    </Typography>
                    {/* Waving paw */}
                    <Typography
                      style={{
                        fontSize: 28,
                        lineHeight: 32,
                        position: "absolute",
                        bottom: -4,
                        right: -8,
                      }}
                    >
                      👋
                    </Typography>
                  </View>
                </View>
              </View>

              {/* Buddy name badge */}
              <View
                style={{
                  marginTop: -16,
                  backgroundColor: "#1B2333",
                  paddingHorizontal: 20,
                  paddingVertical: 6,
                  borderRadius: 20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.12,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              >
                <Typography
                  style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700", letterSpacing: 0.5 }}
                >
                  Hi, I'm Buddy! 🐾
                </Typography>
              </View>
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
