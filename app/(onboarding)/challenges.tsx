import React, { useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { Button, Typography, Card } from "@/components/ui";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { BuddyAvatar } from "@/components/chat/BuddyAvatar";

/**
 * Screen 5: Challenge Selection
 * PRD-01 Section 3, Screen 5
 */

const CHALLENGE_OPTIONS = [
  { id: "biting", label: "Biting & Nipping", emoji: "🦷" },
  { id: "potty", label: "Potty Training", emoji: "🚽" },
  { id: "barking", label: "Excessive Barking", emoji: "🗣️" },
  { id: "leash", label: "Leash Pulling", emoji: "🦮" },
  { id: "separation", label: "Separation Anxiety", emoji: "😢" },
  { id: "chewing", label: "Destructive Chewing", emoji: "👟" },
  { id: "jumping", label: "Jumping on People", emoji: "⬆️" },
  { id: "recall", label: "Won't Come When Called", emoji: "🏃" },
  { id: "socialization", label: "Fear of Other Dogs", emoji: "🐕‍🦺" },
  { id: "crate", label: "Crate Training", emoji: "🏠" },
  { id: "food_guarding", label: "Food Guarding", emoji: "🍖" },
  { id: "focus", label: "Won't Pay Attention", emoji: "👀" },
] as const;

const MAX_CHALLENGES = 5;

export default function ChallengesScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboardingStore();
  const [selected, setSelected] = useState<string[]>(data.challenges);

  const toggleChallenge = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((c) => c !== id);
      }
      if (prev.length >= MAX_CHALLENGES) return prev;
      return [...prev, id];
    });
  };

  const handleContinue = () => {
    updateData({ challenges: selected });
    router.push("/(onboarding)/experience");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-xl">
        <View className="pt-3xl items-center mb-lg">
          <View className="w-[80px] h-[80px] rounded-full bg-primary-light items-center justify-center mb-base">
            <BuddyAvatar mood="greeting" size={80} />
          </View>
          <View className="bg-surface rounded-lg p-lg shadow-card">
            <Typography variant="body-lg" className="text-center">
              {`What are ${data.puppyName || "your pup"}'s biggest challenges?`}
            </Typography>
          </View>
          <Typography variant="caption" color="secondary" className="mt-sm">
            Select up to {MAX_CHALLENGES} (pick at least 1)
          </Typography>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <View className="flex-row flex-wrap gap-md pb-xl">
            {CHALLENGE_OPTIONS.map((challenge, index) => {
              const isSelected = selected.includes(challenge.id);
              return (
                <Animated.View
                  key={challenge.id}
                  entering={FadeIn.duration(250).delay(index * 50)}
                  className="w-[48%]"
                >
                  <Pressable onPress={() => toggleChallenge(challenge.id)}>
                    <Card
                      variant={isSelected ? "featured" : "outline"}
                      className={`items-center py-base ${
                        isSelected ? "border-primary border-2" : ""
                      }`}
                    >
                      <Typography className="text-[28px] mb-xs">
                        {challenge.emoji}
                      </Typography>
                      <Typography
                        variant="body-sm-medium"
                        className="text-center"
                      >
                        {challenge.label}
                      </Typography>
                    </Card>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </ScrollView>

        <View className="pb-3xl pt-base">
          <Button
            label={`Continue (${selected.length} selected)`}
            onPress={handleContinue}
            disabled={selected.length === 0}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
