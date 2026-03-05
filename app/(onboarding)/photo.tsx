import React, { useState } from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Button, Typography } from "@/components/ui";
import { useOnboardingStore } from "@/stores/onboardingStore";

/**
 * Screen 3: Photo Upload + Breed Detection
 * PRD-01 Section 3, Screen 3
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
      setIsDetecting(true);
      setTimeout(() => {
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
        <View className="pt-3xl items-center">
          <View className="w-[80px] h-[80px] rounded-full bg-primary-light items-center justify-center mb-base">
            <Typography className="text-[40px]">🐕</Typography>
          </View>

          <View className="bg-surface rounded-lg p-lg shadow-card mb-2xl">
            <Typography variant="body-lg" className="text-center">
              {`Let's see that cute face! Upload a photo of ${data.puppyName || "your pup"}`}
            </Typography>
          </View>

          <Pressable onPress={pickImage}>
            <Animated.View
              entering={FadeIn.duration(300)}
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
            </Animated.View>
          </Pressable>

          {isDetecting && (
            <Animated.View entering={FadeIn.duration(300)} className="mt-lg">
              <Typography variant="body-sm" color="secondary">
                Detecting breed... 🔍
              </Typography>
            </Animated.View>
          )}

          {data.breed && (
            <Animated.View
              entering={FadeInDown.duration(300)}
              className="mt-lg bg-accent-light rounded-md px-lg py-sm"
            >
              <Typography variant="body-medium">
                {data.breed} detected! ✨
              </Typography>
            </Animated.View>
          )}
        </View>

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
