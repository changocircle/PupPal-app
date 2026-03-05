import React, { useRef, useEffect, useState } from "react";
import { View, TextInput, Keyboard } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { Button, Typography, Input } from "@/components/ui";
import { useOnboardingStore } from "@/stores/onboardingStore";

/**
 * Screen 2: Puppy's Name
 * PRD-01 Section 3, Screen 2
 *
 * - Buddy asks "What's your puppy's name?"
 * - Auto-focused text input, keyboard appears immediately
 * - On submit: Buddy reacts "I love that! [Name] is a great name 🐾"
 * - Auto-advance after reaction animation
 */
export default function NameScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const { data, updateData } = useOnboardingStore();
  const [showReaction, setShowReaction] = useState(false);
  const [name, setName] = useState(data.puppyName);

  useEffect(() => {
    // Auto-focus input
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const isValid = name.trim().length >= 1 && name.trim().length <= 30;

  const handleContinue = () => {
    if (!isValid) return;

    const cleanName = name.trim();
    updateData({ puppyName: cleanName });

    // Show Buddy reaction
    setShowReaction(true);
    Keyboard.dismiss();

    // Auto-advance after reaction
    setTimeout(() => {
      router.push("/(onboarding)/photo");
    }, 1500);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-xl justify-between">
        {/* Buddy + question */}
        <View className="pt-3xl">
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400 }}
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
          </MotiView>

          {/* Name input */}
          {!showReaction && (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 400, delay: 200 }}
            >
              <Input
                ref={inputRef}
                placeholder="e.g., Luna, Max, Bella..."
                value={name}
                onChangeText={(text) => {
                  // Strip emoji, allow hyphens and apostrophes
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
            </MotiView>
          )}
        </View>

        {/* Continue button */}
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
