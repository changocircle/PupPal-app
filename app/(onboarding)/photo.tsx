import React, { useState, useCallback } from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Button, Typography } from "@/components/ui";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { detectBreed, type BreedPrediction } from "@/lib/breedDetect";

/**
 * Screen 3: Photo Upload + Breed Detection
 * PRD-01 Section 3, Screen 3
 *
 * Confidence thresholds:
 *   >70% , auto-fill breed with Buddy reaction
 *   40-70, show as suggestion with confirm/change
 *   <40% , show top options or fall back to manual
 *   fail , silently show manual selector
 */

type DetectionState =
  | { status: "idle" }
  | { status: "detecting" }
  | { status: "high"; breed: string; confidence: number }
  | { status: "medium"; breed: string; confidence: number; suggestions: BreedPrediction[] }
  | { status: "low"; suggestions: BreedPrediction[] }
  | { status: "manual" };

export default function PhotoScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboardingStore();
  const [detection, setDetection] = useState<DetectionState>({ status: "idle" });

  const runDetection = useCallback(async (uri: string) => {
    setDetection({ status: "detecting" });

    const result = await detectBreed(uri);

    if (!result) {
      // Timeout, error, or no breeds found: silent fallback
      setDetection({ status: "manual" });
      return;
    }

    if (result.confidence > 70) {
      // High confidence: auto-fill
      updateData({ breed: result.topBreed });
      setDetection({
        status: "high",
        breed: result.topBreed,
        confidence: result.confidence,
      });
    } else if (result.confidence >= 40) {
      // Medium confidence: suggest with confirm/change
      setDetection({
        status: "medium",
        breed: result.topBreed,
        confidence: result.confidence,
        suggestions: result.suggestions,
      });
    } else {
      // Low confidence: show options or manual
      setDetection({
        status: "low",
        suggestions: result.suggestions,
      });
    }
  }, [updateData]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      updateData({ photoUri: uri, breed: undefined });
      await runDetection(uri);
    }
  };

  const confirmBreed = (breed: string) => {
    updateData({ breed });
    setDetection((prev) =>
      prev.status === "medium"
        ? { status: "high", breed, confidence: prev.confidence }
        : { status: "high", breed, confidence: 50 }
    );
  };

  const goManual = () => {
    setDetection({ status: "manual" });
  };

  const handleContinue = () => {
    router.push("/(onboarding)/age");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-xl justify-between">
        <View className="pt-3xl items-center">
          {/* Buddy avatar */}
          <View className="w-[80px] h-[80px] rounded-full bg-primary-light items-center justify-center mb-base">
            <Typography className="text-[40px]">🐕</Typography>
          </View>

          {/* Buddy speech bubble */}
          <View className="bg-surface rounded-lg p-lg shadow-card mb-2xl">
            <Typography variant="body-lg" className="text-center">
              {`Let's see that cute face! Upload a photo of ${data.puppyName || "your pup"}`}
            </Typography>
          </View>

          {/* Photo upload area */}
          <Pressable onPress={pickImage}>
            <Animated.View
              entering={FadeIn.duration(300)}
              className="w-[200px] h-[200px] rounded-xl bg-surface border-2 border-dashed border-border items-center justify-center overflow-hidden"
            >
              {data.photoUri ? (
                <Image
                  source={{ uri: data.photoUri }}
                  style={{ width: 200, height: 200 }}
                  contentFit="cover"
                />
              ) : (
                <View className="items-center gap-sm">
                  <Typography className="text-[48px]">📸</Typography>
                  <Typography variant="body-sm" color="secondary">
                    Tap to upload
                  </Typography>
                </View>
              )}
            </Animated.View>
          </Pressable>

          {/* ─── Detection states ─── */}

          {detection.status === "detecting" && (
            <Animated.View entering={FadeIn.duration(300)} className="mt-lg items-center">
              <Typography variant="body-sm" color="secondary">
                Detecting breed... 🔍
              </Typography>
            </Animated.View>
          )}

          {detection.status === "high" && (
            <Animated.View
              entering={FadeInDown.duration(300)}
              className="mt-lg items-center"
            >
              <View className="bg-accent-light rounded-md px-lg py-sm mb-xs">
                <Typography variant="body-medium" className="text-center">
                  {detection.breed} detected! ✨
                </Typography>
              </View>
              <Typography variant="caption" color="secondary">
                {detection.confidence}% confidence
              </Typography>
            </Animated.View>
          )}

          {detection.status === "medium" && (
            <Animated.View
              entering={FadeInDown.duration(300)}
              className="mt-lg items-center gap-sm"
            >
              <Typography variant="body-medium" className="text-center">
                Looks like a {detection.breed}? 🤔
              </Typography>
              <View className="flex-row gap-sm">
                <Button
                  label="That's right!"
                  variant="primary"
                  size="sm"
                  onPress={() => confirmBreed(detection.breed)}
                />
                <Button
                  label="Change"
                  variant="secondary"
                  size="sm"
                  onPress={goManual}
                />
              </View>
              {detection.suggestions.length > 1 && (
                <View className="mt-xs items-center">
                  <Typography variant="caption" color="secondary">
                    Also possible:
                  </Typography>
                  {detection.suggestions.slice(1).map((s) => (
                    <Pressable key={s.name} onPress={() => confirmBreed(s.name)}>
                      <Typography variant="body-sm" color="accent" className="mt-xxs">
                        {s.name} ({s.confidence}%)
                      </Typography>
                    </Pressable>
                  ))}
                </View>
              )}
            </Animated.View>
          )}

          {detection.status === "low" && (
            <Animated.View
              entering={FadeInDown.duration(300)}
              className="mt-lg items-center gap-sm"
            >
              <Typography variant="body-sm" color="secondary" className="text-center">
                Hmm, not sure about the breed. Pick one:
              </Typography>
              {detection.suggestions.map((s) => (
                <Pressable key={s.name} onPress={() => confirmBreed(s.name)}>
                  <View className="bg-surface rounded-md px-lg py-xs border border-border">
                    <Typography variant="body-medium">
                      {s.name} ({s.confidence}%)
                    </Typography>
                  </View>
                </Pressable>
              ))}
              <Button
                label="Choose breed manually"
                variant="ghost"
                size="sm"
                onPress={goManual}
              />
            </Animated.View>
          )}

          {detection.status === "manual" && (
            <Animated.View
              entering={FadeIn.duration(200)}
              className="mt-lg items-center"
            >
              <Typography variant="body-sm" color="secondary">
                You can select breed on the next screen
              </Typography>
            </Animated.View>
          )}

          {/* Show confirmed breed if already set */}
          {data.breed && detection.status !== "high" && detection.status !== "medium" && (
            <Animated.View
              entering={FadeInDown.duration(300)}
              className="mt-lg bg-accent-light rounded-md px-lg py-sm"
            >
              <Typography variant="body-medium">
                {data.breed} ✨
              </Typography>
            </Animated.View>
          )}
        </View>

        {/* Bottom actions */}
        <View className="pb-3xl gap-sm">
          <Button label="Continue" onPress={handleContinue} />
          {!data.photoUri && (
            <Button
              variant="ghost"
              label="Skip for now"
              size="sm"
              onPress={handleContinue}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
