import React, { useState } from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInLeft } from "react-native-reanimated";
import { Button, Typography, Card } from "@/components/ui";
import { useOnboardingStore } from "@/stores/onboardingStore";
import type { ExperienceOption } from "@/types/models";

/**
 * Screen 6: Owner Experience Level
 * PRD-01 Section 3, Screen 6
 */

const EXPERIENCE_OPTIONS: ExperienceOption[] = [
  {
    id: "first_time",
    label: "First Time",
    emoji: "🌱",
    description: "This is my first puppy ever — help me with everything!",
  },
  {
    id: "some_experience",
    label: "Some Experience",
    emoji: "🐾",
    description: "I've had dogs before but could use a refresher.",
  },
  {
    id: "experienced",
    label: "Experienced",
    emoji: "🏆",
    description: "I know the basics — looking for advanced techniques.",
  },
];

export default function ExperienceScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboardingStore();
  const [selected, setSelected] = useState<ExperienceOption["id"] | null>(
    data.ownerExperience,
  );

  const handleSelect = (option: ExperienceOption) => {
    setSelected(option.id);
    updateData({ ownerExperience: option.id });
  };

  const handleContinue = () => {
    if (!selected) return;
    router.push("/(onboarding)/plan-preview");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-xl justify-between">
        <View className="pt-3xl">
          <View className="items-center mb-2xl">
            <View className="w-[80px] h-[80px] rounded-full bg-primary-light items-center justify-center mb-base">
              <Typography className="text-[40px]">🐕</Typography>
            </View>
            <View className="bg-surface rounded-lg p-lg shadow-card">
              <Typography variant="body-lg" className="text-center">
                Have you had a dog before?
              </Typography>
            </View>
          </View>

          <View className="gap-md">
            {EXPERIENCE_OPTIONS.map((option, index) => (
              <Animated.View
                key={option.id}
                entering={FadeInLeft.duration(300).delay(index * 100)}
              >
                <Pressable onPress={() => handleSelect(option)}>
                  <Card
                    variant={selected === option.id ? "featured" : "outline"}
                    className={`flex-row items-center gap-base ${
                      selected === option.id ? "border-primary border-2" : ""
                    }`}
                  >
                    <Typography className="text-[36px]">{option.emoji}</Typography>
                    <View className="flex-1">
                      <Typography variant="h3">{option.label}</Typography>
                      <Typography variant="body-sm" color="secondary">
                        {option.description}
                      </Typography>
                    </View>
                  </Card>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </View>

        <View className="pb-3xl">
          <Button
            label="Continue"
            onPress={handleContinue}
            disabled={!selected}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
