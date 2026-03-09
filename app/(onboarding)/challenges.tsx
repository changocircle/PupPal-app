import React, { useState } from "react";
import { View, Pressable, ScrollView, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
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
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customChallenges, setCustomChallenges] = useState<string[]>(
    data.customChallenges ?? []
  );
  const [currentCustomText, setCurrentCustomText] = useState("");

  const toggleChallenge = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((c) => c !== id);
      }
      if (prev.length >= MAX_CHALLENGES) return prev;
      return [...prev, id];
    });
  };

  const addCustomChallenge = () => {
    const text = currentCustomText.trim();
    if (!text) return;
    setCustomChallenges((prev) => [...prev, text]);
    setCurrentCustomText("");
  };

  const removeCustomChallenge = (index: number) => {
    setCustomChallenges((prev) => prev.filter((_, i) => i !== index));
  };

  const hasSelection = selected.length > 0 || customChallenges.length > 0;

  const handleContinue = () => {
    updateData({ challenges: selected, customChallenges });
    router.push("/(onboarding)/experience");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-xl">
        <View className="pt-3xl items-center mb-lg">
          <View className="w-[80px] h-[80px] rounded-full bg-primary-light items-center justify-center mb-base">
            <BuddyAvatar mood="waving" size={80} />
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

            {/* "Something else?" option */}
            <Animated.View
              entering={FadeIn.duration(250).delay(CHALLENGE_OPTIONS.length * 50)}
              className="w-[48%]"
            >
              <Pressable onPress={() => setShowCustomInput((v) => !v)}>
                <Card
                  variant={showCustomInput || customChallenges.length > 0 ? "featured" : "outline"}
                  className={`items-center py-base ${
                    showCustomInput || customChallenges.length > 0 ? "border-primary border-2" : ""
                  }`}
                >
                  <Typography className="text-[28px] mb-xs">✏️</Typography>
                  <Typography variant="body-sm-medium" className="text-center">
                    Something else?
                  </Typography>
                </Card>
              </Pressable>
            </Animated.View>
          </View>

          {/* Custom challenge input area */}
          {showCustomInput && (
            <Animated.View
              entering={FadeInDown.duration(200)}
              style={{
                marginBottom: 24,
                backgroundColor: "#FFFAF7",
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: "#F0EBE6",
              }}
            >
              {/* Existing custom challenges */}
              {customChallenges.map((text, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#F5F0EB",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    marginBottom: 8,
                  }}
                >
                  <Typography variant="body-sm" style={{ flex: 1 }}>
                    {text}
                  </Typography>
                  <Pressable
                    onPress={() => removeCustomChallenge(i)}
                    style={{ marginLeft: 8 }}
                  >
                    <Typography variant="caption" style={{ color: "#FF6B5C" }}>
                      Remove
                    </Typography>
                  </Pressable>
                </View>
              ))}

              {/* Text input for new custom challenge */}
              <TextInput
                style={{
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  fontFamily: "DMSans-Regular",
                  color: "#1B2333",
                  marginBottom: 8,
                }}
                placeholder="Describe the challenge in your own words..."
                placeholderTextColor="#9CA3AF"
                value={currentCustomText}
                onChangeText={setCurrentCustomText}
                multiline
                returnKeyType="done"
                onSubmitEditing={addCustomChallenge}
              />

              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="caption" color="secondary" style={{ flex: 1, marginRight: 8 }}>
                  We'll build your plan around this
                </Typography>
                <Pressable
                  onPress={addCustomChallenge}
                  style={{
                    backgroundColor: currentCustomText.trim() ? "#FF6B5C" : "#F0EBE6",
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                  }}
                  disabled={!currentCustomText.trim()}
                >
                  <Typography
                    variant="body-sm-medium"
                    style={{ color: currentCustomText.trim() ? "#FFFFFF" : "#9CA3AF" }}
                  >
                    {customChallenges.length > 0 ? "Add another" : "Add"}
                  </Typography>
                </Pressable>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        <View className="pb-3xl pt-base">
          <Button
            label={`Continue (${selected.length + customChallenges.length} selected)`}
            onPress={handleContinue}
            disabled={!hasSelection}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
