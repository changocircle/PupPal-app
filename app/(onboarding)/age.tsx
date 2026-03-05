import React, { useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Button, Typography, Card } from "@/components/ui";
import { useOnboardingStore } from "@/stores/onboardingStore";

/**
 * Screen 4: Dog's Age
 * PRD-01 Section 3, Screen 4
 */

const AGE_OPTIONS = [
  { id: "under_8_weeks", label: "Under 8 weeks", emoji: "🍼", months: 1 },
  { id: "8_12_weeks", label: "8–12 weeks", emoji: "🐾", months: 2 },
  { id: "3_6_months", label: "3–6 months", emoji: "🦴", months: 4 },
  { id: "6_12_months", label: "6–12 months", emoji: "🎾", months: 9 },
  { id: "1_2_years", label: "1–2 years", emoji: "🐕", months: 18 },
  { id: "over_2_years", label: "2+ years", emoji: "🏆", months: 30 },
] as const;

export default function AgeScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboardingStore();
  const [selectedAge, setSelectedAge] = useState<string | null>(null);

  const handleSelect = (option: (typeof AGE_OPTIONS)[number]) => {
    setSelectedAge(option.id);
    updateData({ ageMonths: option.months });
  };

  const handleContinue = () => {
    if (!selectedAge) return;
    router.push("/(onboarding)/challenges");
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
                {`How old is ${data.puppyName || "your pup"}?`}
              </Typography>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="flex-row flex-wrap gap-md justify-between">
              {AGE_OPTIONS.map((option, index) => (
                <Animated.View
                  key={option.id}
                  entering={FadeInDown.duration(300).delay(index * 80)}
                  className="w-[48%]"
                >
                  <Pressable onPress={() => handleSelect(option)}>
                    <Card
                      variant={selectedAge === option.id ? "featured" : "outline"}
                      className={`items-center py-lg ${
                        selectedAge === option.id ? "border-primary border-2" : ""
                      }`}
                    >
                      <Typography className="text-[32px] mb-xs">
                        {option.emoji}
                      </Typography>
                      <Typography
                        variant="body-medium"
                        color={selectedAge === option.id ? "primary" : "primary"}
                      >
                        {option.label}
                      </Typography>
                    </Card>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </ScrollView>
        </View>

        <View className="pb-3xl">
          <Button
            label="Continue"
            onPress={handleContinue}
            disabled={!selectedAge}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
