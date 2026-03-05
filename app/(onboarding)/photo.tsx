import React, { useState } from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Button, Typography } from "@/components/ui";
import { useOnboardingStore } from "@/stores/onboardingStore";

/**
 * Screen 3: Photo Upload + Breed Detection
 * PRD-01 Section 3, Screen 3
 *
 * - "Let's see that cute face! Upload a photo of [Name]"
 * - Photo upload (camera or gallery)
 * - Breed detection animation → result display
 * - Skip option available
 */
export default function PhotoScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboardingStore();
  const [isDetecting, setIsDetecting] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      updateData({ photoUri: uri });

      // TODO: Send to breed detection API
      setIsDetecting(true);
      setTimeout(() => {
        // Placeholder — will integrate Google Cloud Vision
        setIsDetecting(false);
      }, 2000);
    }
  };

  const handleContinue = () => {
    router.push("/(onboarding)/age");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-xl justify-between">
        {/* Buddy + prompt */}
        <View className="pt-3xl items-center">
          <View className="w-[80px] h-[80px] rounded-full bg-primary-light items-center justify-center mb-base">
            <Typography className="text-[40px]">🐕</Typography>
          </View>

          <View className="bg-surface rounded-lg p-lg shadow-card mb-2xl">
            <Typography variant="body-lg" className="text-center">
              {`Let's see that cute face! Upload a photo of ${data.puppyName || "your pup"}`}
            </Typography>
          </View>

          {/* Photo area */}
          <Pressable onPress={pickImage}>
            <MotiView
              from={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ type: "timing", duration: 300 }}
              className="w-[200px] h-[200px] rounded-xl bg-surface border-2 border-dashed border-border items-center justify-center overflow-hidden"
            >
              {data.photoUri ? (
                <Image
                  source={{ uri: data.photoUri }}
                  className="w-full h-full"
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
            </MotiView>
          </Pressable>

          {/* Breed detection result placeholder */}
          {isDetecting && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-lg"
            >
              <Typography variant="body-sm" color="secondary">
                Detecting breed... 🔍
              </Typography>
            </MotiView>
          )}

          {data.breed && (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              className="mt-lg bg-accent-light rounded-md px-lg py-sm"
            >
              <Typography variant="body-medium">
                {data.breed} detected! ✨
              </Typography>
            </MotiView>
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
