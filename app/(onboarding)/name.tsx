import React, { useRef, useEffect, useState } from "react";
import { View, TextInput, Keyboard } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Button, Typography, Input } from "@/components/ui";
import { useOnboardingStore } from "@/stores/onboardingStore";

/**
 * Screen 2: Puppy's Name
 * PRD-01 Section 3, Screen 2
 */
export default function NameScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const { data, updateData } = useOnboardingStore();
  const [showReaction, setShowReaction] = useState(false);
  const [name, setName] = useState(data.puppyName);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const isValid = name.trim().length >= 1 && name.trim().length <= 30;

  const handleContinue = () => {
    if (!isValid) return;
    const cleanName = name.trim();
    updateData({ puppyName: cleanName });
    setShowReaction(true);
    Keyboard.dismiss();
    setTimeout(() => {
      router.push("/(onboarding)/photo");
    }, 1500);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-xl justify-between">
        <View className="pt-3xl">
          <Animated.View
            entering={FadeInDown.duration(400)}
            className="items-center mb-2xl"
          >
            <View className="w-[80px] h-[80px] rounded-full bg-primary-light items-center justify-center mb-base">
              <Typography className="text-[40px]">🐕</Typography>
            </View>
            <View className="bg-surface rounded-lg p-lg shadow-card">
              <Typography variant="body-lg" className="text-center">
                {showReaction
                  ? `I love that! ${name.trim()} is a great name 🐾`
                  : "First things first — what's your puppy's name?"}
              </Typography>
            </View>
          </Animated.View>

          {!showReaction && (
            <Animated.View entering={FadeInDown.duration(400).delay(200)}>
              <Input
                ref={inputRef}
                placeholder="e.g., Luna, Max, Bella..."
                value={name}
                onChangeText={(text) => {
                  const cleaned = text.replace(
                    /[^\p{L}\p{N}\s\-']/gu,
                    "",
                  );
                  setName(cleaned);
                }}
                maxLength={30}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />
            </Animated.View>
          )}
        </View>

        {!showReaction && (
          <View className="pb-3xl">
            <Button
              label="Continue"
              onPress={handleContinue}
              disabled={!isValid}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
