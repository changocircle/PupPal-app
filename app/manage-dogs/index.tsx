/**
 * Manage Dogs — "Your Puppy Family" Screen
 * PRD-11 §3: Lists all registered dogs, allows switching,
 * and provides "Add Another Dog" at the bottom.
 *
 * Reached from Profile → Manage Dogs.
 */

import React, { useMemo, useCallback } from "react";
import { View, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Typography, Card, Badge, Button } from "@/components/ui";
import { DogAvatar } from "@/components/dog/DogAvatar";
import { useDogStore } from "@/stores/dogStore";
import { useSubscription } from "@/hooks/useSubscription";
import { COLORS, RADIUS } from "@/constants/theme";
import { getDogAge } from "@/lib/dogAge";

export default function ManageDogsScreen() {
  const router = useRouter();
  const { isPremium } = useSubscription();
  const dogs = useDogStore((s) => s.dogs);
  const activeDogId = useDogStore((s) => s.activeDogId);
  const switchDog = useDogStore((s) => s.switchDog);
  const isSwitching = useDogStore((s) => s.isSwitching);

  const activeDogs = useMemo(
    () => dogs.filter((d) => !d.archived_at),
    [dogs]
  );
  const archivedDogs = useMemo(
    () => dogs.filter((d) => d.archived_at != null),
    [dogs]
  );

  const handleSwitchDog = useCallback(
    async (dogId: string) => {
      if (dogId === activeDogId) return;
      await switchDog(dogId);
    },
    [activeDogId, switchDog]
  );

  const handleAddDog = useCallback(() => {
    if (!isPremium) {
      Alert.alert(
        "Premium Feature",
        "Multi-dog support is available for Premium subscribers. Upgrade to add more dogs!",
        [
          { text: "Maybe Later", style: "cancel" },
          {
            text: "Upgrade",
            onPress: () =>
              router.push({
                pathname: "/paywall",
                params: {
                  trigger: "feature_gate_multi_dog",
                  source: "manage_dogs",
                },
              } as any),
          },
        ]
      );
      return;
    }
    router.push("/add-dog");
  }, [isPremium, router]);

  const formatAge = (dog: any) => {
    const age = getDogAge(dog.date_of_birth, dog.age_months_at_creation, dog.created_at);
    if (!age) return null;
    return age.estimated ? `~${age.label}` : age.label;
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Back */}
        <Pressable
          onPress={() => router.back()}
          className="px-xl pt-base pb-sm"
        >
          <Typography variant="body-medium" style={{ color: "#FF6B5C" }}>
            ← Back
          </Typography>
        </Pressable>

        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-xl pt-sm mb-xl"
        >
          <Typography variant="h1">Your Puppy Family 🐾</Typography>
          <Typography variant="body" color="secondary" className="mt-xs">
            {activeDogs.length} {activeDogs.length === 1 ? "dog" : "dogs"} registered
          </Typography>
        </Animated.View>

        {/* Active Dogs */}
        {activeDogs.map((dog, i) => {
          const isActive = dog.id === activeDogId;
          return (
            <Animated.View
              key={dog.id}
              entering={FadeInDown.duration(400).delay(80 * (i + 1))}
              className="px-xl mb-md"
            >
              <Pressable
                onPress={() => handleSwitchDog(dog.id)}
                disabled={isSwitching}
                style={{ opacity: isSwitching ? 0.6 : 1 }}
              >
                <Card
                  className="flex-row items-center gap-base"
                  style={{
                    borderWidth: isActive ? 2 : 1,
                    borderColor: isActive
                      ? COLORS.primary.DEFAULT
                      : COLORS.border,
                    backgroundColor: isActive
                      ? COLORS.primary.extralight
                      : COLORS.surface,
                  }}
                >
                  <DogAvatar
                    name={dog.name}
                    photoUrl={dog.photo_url}
                    size={56}
                    showBorder={isActive}
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center gap-sm">
                      <Typography
                        variant="body-medium"
                        style={{ fontWeight: isActive ? "700" : "600", fontSize: 17 }}
                      >
                        {dog.name}
                      </Typography>
                      {isActive && (
                        <Badge label="Active" variant="success" size="sm" />
                      )}
                    </View>
                    <Typography variant="body-sm" color="secondary">
                      {dog.breed ?? "Unknown breed"}
                      {formatAge(dog) ? ` · ${formatAge(dog)}` : ""}
                    </Typography>
                  </View>
                  {isActive ? (
                    <Typography style={{ fontSize: 20 }}>✓</Typography>
                  ) : (
                    <Typography variant="caption" color="accent">
                      Switch
                    </Typography>
                  )}
                </Card>
              </Pressable>
            </Animated.View>
          );
        })}

        {/* Archived Dogs */}
        {archivedDogs.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(80 * (activeDogs.length + 1))}
            className="px-xl mt-base mb-md"
          >
            <Typography
              variant="caption"
              color="tertiary"
              className="uppercase tracking-wider mb-sm"
            >
              Archived
            </Typography>
            {archivedDogs.map((dog) => (
              <Pressable
                key={dog.id}
                onPress={() =>
                  router.push(`/dog/${dog.id}/manage` as any)
                }
                className="mb-sm"
              >
                <Card className="flex-row items-center gap-base" style={{ opacity: 0.6 }}>
                  <DogAvatar name={dog.name} photoUrl={dog.photo_url} size={40} />
                  <View className="flex-1">
                    <Typography variant="body-sm" style={{ fontWeight: "500" }}>
                      {dog.name}
                    </Typography>
                    <Typography variant="caption" color="tertiary">
                      Archived
                    </Typography>
                  </View>
                </Card>
              </Pressable>
            ))}
          </Animated.View>
        )}

        {/* Add Another Dog */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(80 * (activeDogs.length + 2))}
          className="px-xl mt-base"
        >
          <Pressable onPress={handleAddDog}>
            <Card
              className="items-center py-lg"
              style={{
                borderWidth: 2,
                borderColor: COLORS.primary.DEFAULT,
                borderStyle: "dashed",
              }}
            >
              <Typography className="text-[32px] mb-sm">🐶</Typography>
              <Typography
                variant="body-medium"
                style={{ color: COLORS.primary.DEFAULT, fontWeight: "600" }}
              >
                + Add Another Dog
              </Typography>
              {!isPremium && (
                <View className="mt-xs">
                  <Badge label="Premium" variant="accent" size="sm" />
                </View>
              )}
            </Card>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
