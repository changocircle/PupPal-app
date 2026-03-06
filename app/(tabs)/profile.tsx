import React, { useCallback, useMemo, useRef } from "react";
import { View, ScrollView, Pressable, Alert, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Typography, Card, Badge, ProgressBar, Button, ErrorBoundary, ProfileSkeleton } from "@/components/ui";
import { useGamificationStore } from "@/stores/gamificationStore";
import { useDogStore } from "@/stores/dogStore";
import { useTrainingStore } from "@/stores/trainingStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useSubscription } from "@/hooks/useSubscription";
import { useHydration } from "@/hooks/useHydration";
import { LEVEL_DEFINITIONS } from "@/types/gamification";
import { DogAvatar } from "@/components/dog";

/**
 * Profile & Settings Tab, PRD-04 (gamification) + PRD-14 (settings)
 *
 * Full implementation: user profile, dog info, gamification summary,
 * settings sections with navigation to sub-screens.
 *
 * FIX-04: Resolved "Maximum update depth exceeded" render loop.
 * Root cause: useGamificationStore with an inline object selector
 * creates a new reference on every render → Zustand (v5) sees a
 * "change" → re-render → infinite loop.
 * Solution: Individual scalar selectors instead of object selector.
 */

export default function ProfileScreen() {
  const hydrated = useHydration(
    useDogStore,
    useGamificationStore,
    useOnboardingStore,
    useSettingsStore,
  );

  if (!hydrated) {
    return <ProfileSkeleton />;
  }

  return (
    <ErrorBoundary screen="Profile">
      <ProfileScreenContent />
    </ErrorBoundary>
  );
}

function ProfileScreenContent() {
  const router = useRouter();

  // FIX-04: Individual selectors instead of object destructure.
  // Each returns a primitive or stable ref → no spurious re-renders.
  const activeDogId = useDogStore((s) => s.activeDogId);
  const dogs = useDogStore((s) => s.dogs);
  const dog = useMemo(
    () => dogs.find((d) => d.id === activeDogId) ?? null,
    [dogs, activeDogId]
  );

  const plan = useTrainingStore((s) => s.plan);
  const onboardingData = useOnboardingStore((s) => s.data);
  const dogName =
    dog?.name ?? plan?.dogName ?? (onboardingData.puppyName || "Your Pup");
  const breed = dog?.breed ?? plan?.breed ?? onboardingData.breed ?? "Puppy";
  const ageMonths = onboardingData.ageMonths;

  // FIX-04: Separate scalar selectors (no inline object creation)
  const totalXp = useGamificationStore((s) => s.totalXp);
  const currentLevel = useGamificationStore((s) => s.currentLevel);
  const currentLevelTitle = useGamificationStore((s) => s.currentLevelTitle);
  const achievements = useGamificationStore((s) => s.unlockedAchievements);

  const levelDef = LEVEL_DEFINITIONS[currentLevel - 1];
  const nextLevelDef = LEVEL_DEFINITIONS[currentLevel]; // may be undefined at max
  const currentLevelXp = levelDef ? totalXp - levelDef.cumulativeXp : 0;
  const currentLevelMax = nextLevelDef
    ? nextLevelDef.cumulativeXp - (levelDef?.cumulativeXp ?? 0)
    : 1;
  const xpProgress =
    currentLevelMax > 0 ? Math.min(currentLevelXp / currentLevelMax, 1) : 1;

  // Subscription
  const { isPremium } = useSubscription();

  // Dev premium toggle, 5-tap easter egg on version text
  const devPremiumOverride = useSettingsStore((s) => s.devPremiumOverride);
  const toggleDevPremium = useSettingsStore((s) => s.toggleDevPremium);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleVersionTap = useCallback(() => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      toggleDevPremium();
      Alert.alert(
        devPremiumOverride ? "Premium Disabled" : "⚡ Premium Enabled",
        devPremiumOverride
          ? "Dev override OFF. Back to free tier."
          : "Dev override ON. All premium features unlocked.",
      );
    } else {
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, 2000);
    }
  }, [devPremiumOverride, toggleDevPremium]);

  // Settings
  const userName = useSettingsStore((s) => s.userName);

  // Sign out
  const handleSignOut = useCallback(() => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          // In production: clear auth state, navigate to login
          Alert.alert("Signed Out", "You've been signed out.");
        },
      },
    ]);
  }, []);

  // Delete account
  const handleDeleteAccount = useCallback(() => {
    Alert.prompt(
      "Delete Account",
      'This will permanently delete all your data. Type "DELETE" to confirm.',
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: (text: string | undefined) => {
            if (text === "DELETE") {
              Alert.alert(
                "Account Deleted",
                "Your data has been permanently removed."
              );
            } else {
              Alert.alert("Cancelled", 'You must type "DELETE" to proceed.');
            }
          },
        },
      ],
      "plain-text"
    );
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Header ── */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-xl pt-3xl mb-lg"
        >
          <Typography variant="h1">Profile</Typography>
        </Animated.View>

        {/* ── User Profile Card ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(60)}
          className="px-xl mb-lg"
        >
          <Pressable onPress={() => router.push("/settings/edit-profile")}>
            <Card className="flex-row items-center gap-base">
              <View className="w-[64px] h-[64px] rounded-full bg-primary-light items-center justify-center">
                <Typography className="text-[28px]">👤</Typography>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-sm">
                  <Typography variant="h3">
                    {userName || "Dog Parent"}
                  </Typography>
                  {isPremium && (
                    <Badge variant="accent" label="Premium 💎" size="sm" />
                  )}
                </View>
                <Typography variant="body-sm" color="secondary">
                  Tap to edit profile
                </Typography>
              </View>
              <Typography color="tertiary">→</Typography>
            </Card>
          </Pressable>
        </Animated.View>

        {/* ── Dog Card ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(120)}
          className="px-xl mb-lg"
        >
          <Pressable
            onPress={() =>
              dog?.id ? router.push(`/dog/${dog.id}/manage`) : undefined
            }
          >
            <Card className="flex-row items-center gap-base">
              <DogAvatar
                name={dogName}
                photoUrl={dog?.photo_url}
                size={56}
                showBorder
              />
              <View className="flex-1">
                <Typography variant="h3">{dogName}</Typography>
                <Typography variant="body-sm" color="secondary">
                  {breed}
                  {ageMonths ? ` · ~${ageMonths} months` : ""}
                </Typography>
              </View>
              <Typography color="tertiary">→</Typography>
            </Card>
          </Pressable>
        </Animated.View>

        {/* ── Gamification Summary ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(180)}
          className="px-xl mb-lg"
        >
          <Typography variant="h3" className="mb-sm">
            Progress
          </Typography>
          <Card>
            <View className="flex-row justify-between mb-md">
              <View>
                <Typography variant="caption" color="secondary">
                  Level
                </Typography>
                <View className="flex-row items-center gap-xs">
                  <Typography variant="h2">{currentLevel}</Typography>
                  <Typography variant="body-sm" color="secondary">
                    {currentLevelTitle}
                  </Typography>
                </View>
              </View>
              <View className="items-end">
                <Typography variant="caption" color="secondary">
                  Total XP
                </Typography>
                <Typography variant="h2">{totalXp}</Typography>
              </View>
            </View>
            <ProgressBar progress={xpProgress} variant="accent" animated />
            <Typography
              variant="caption"
              color="tertiary"
              className="mt-xs text-center"
            >
              {currentLevelXp} / {currentLevelMax} XP to Level{" "}
              {currentLevel + 1}
            </Typography>
          </Card>
        </Animated.View>

        {/* ── Achievements ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(240)}
          className="px-xl mb-lg"
        >
          <Pressable onPress={() => router.push("/achievements")}>
            <Card variant="featured" className="flex-row items-center gap-md">
              <Typography className="text-[32px]">🏆</Typography>
              <View className="flex-1">
                <Typography variant="body-medium">
                  {achievements.length > 0
                    ? `${achievements.length} Achievement${achievements.length !== 1 ? "s" : ""} Unlocked`
                    : "No Achievements Yet"}
                </Typography>
                <Typography variant="caption" color="secondary">
                  {achievements.length > 0
                    ? "Tap to view your collection"
                    : "Complete exercises to start unlocking!"}
                </Typography>
              </View>
              <Typography color="tertiary">→</Typography>
            </Card>
          </Pressable>
        </Animated.View>

        {/* ── Breed Encyclopedia ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(270)}
          className="px-xl mb-lg"
        >
          <Pressable onPress={() => router.push("/breeds")}>
            <Card className="flex-row items-center gap-md">
              <Typography className="text-[32px]">📚</Typography>
              <View className="flex-1">
                <Typography variant="body-medium">
                  Breed Encyclopedia
                </Typography>
                <Typography variant="caption" color="secondary">
                  {breed !== "Puppy"
                    ? `Learn about ${breed}s and 50 other breeds`
                    : "Explore 51 breed profiles"}
                </Typography>
              </View>
              <Typography color="tertiary">→</Typography>
            </Card>
          </Pressable>
        </Animated.View>

        {/* ── Community ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(300)}
          className="px-xl mb-lg"
        >
          <Pressable onPress={() => router.push("/community")}>
            <Card className="flex-row items-center gap-md">
              <Typography className="text-[32px]">💬</Typography>
              <View className="flex-1">
                <Typography variant="body-medium">Community</Typography>
                <Typography variant="caption" color="secondary">
                  Connect with fellow puppy parents
                </Typography>
              </View>
              <Badge label="Preview" variant="accent" size="sm" />
              <Typography color="tertiary">→</Typography>
            </Card>
          </Pressable>
        </Animated.View>

        {/* ── Settings ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(330)}
          className="px-xl mb-lg"
        >
          <Typography variant="h3" className="mb-sm">
            Settings
          </Typography>

          {/* Preferences */}
          <Pressable onPress={() => router.push("/settings/preferences")}>
            <Card
              variant="outline"
              className="flex-row items-center gap-md py-md mb-sm"
            >
              <Typography className="text-[20px]">⚙️</Typography>
              <View className="flex-1">
                <Typography variant="body-medium">Preferences</Typography>
                <Typography variant="caption" color="secondary">
                  Units, notifications, training reminders
                </Typography>
              </View>
              <Typography color="tertiary">→</Typography>
            </Card>
          </Pressable>

          {/* Notifications */}
          <Pressable onPress={() => router.push("/settings/notifications")}>
            <Card
              variant="outline"
              className="flex-row items-center gap-md py-md mb-sm"
            >
              <Typography className="text-[20px]">🔔</Typography>
              <View className="flex-1">
                <Typography variant="body-medium">Notifications</Typography>
                <Typography variant="caption" color="secondary">
                  Training reminders, health alerts
                </Typography>
              </View>
              <Typography color="tertiary">→</Typography>
            </Card>
          </Pressable>

          {/* Subscription */}
          <Pressable onPress={() => router.push("/settings/subscription")}>
            <Card
              variant="outline"
              className="flex-row items-center gap-md py-md mb-sm"
            >
              <Typography className="text-[20px]">💎</Typography>
              <View className="flex-1">
                <Typography variant="body-medium">Subscription</Typography>
                <Typography variant="caption" color="secondary">
                  {isPremium ? "Premium Plan" : "Free Plan"}
                </Typography>
              </View>
              <Typography color="tertiary">→</Typography>
            </Card>
          </Pressable>

          {/* Invite friends */}
          <Pressable onPress={() => router.push("/referral")}>
            <Card
              variant="outline"
              className="flex-row items-center gap-md py-md mb-sm"
            >
              <Typography className="text-[20px]">🎁</Typography>
              <View className="flex-1">
                <Typography variant="body-medium">Invite Friends</Typography>
                <Typography variant="caption" color="secondary">
                  Share PupPal & earn rewards
                </Typography>
              </View>
              <Typography color="tertiary">→</Typography>
            </Card>
          </Pressable>
        </Animated.View>

        {/* ── Support ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(360)}
          className="px-xl mb-lg"
        >
          <Typography variant="h3" className="mb-sm">
            Support
          </Typography>

          {[
            {
              icon: "❓",
              label: "Help Center",
              onPress: () =>
                Alert.alert("Help Center", "Help articles coming soon!"),
            },
            {
              icon: "💬",
              label: "Contact Support",
              onPress: () => Linking.openURL("mailto:support@puppal.dog"),
            },
            {
              icon: "⭐",
              label: "Rate PupPal",
              onPress: () =>
                Alert.alert("Thanks!", "Rating would open the App Store."),
            },
            {
              icon: "💡",
              label: "Share Feedback",
              onPress: () => Linking.openURL("mailto:feedback@puppal.dog"),
            },
          ].map((item) => (
            <Pressable key={item.label} onPress={item.onPress}>
              <Card
                variant="outline"
                className="flex-row items-center gap-md py-md mb-sm"
              >
                <Typography className="text-[20px]">{item.icon}</Typography>
                <Typography variant="body-medium" className="flex-1">
                  {item.label}
                </Typography>
                <Typography color="tertiary">→</Typography>
              </Card>
            </Pressable>
          ))}
        </Animated.View>

        {/* ── Legal ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(420)}
          className="px-xl mb-lg"
        >
          <Typography variant="h3" className="mb-sm">
            Legal
          </Typography>

          {[
            {
              icon: "🛡️",
              label: "Data & Privacy",
              onPress: () => router.push("/settings/data-privacy"),
            },
            {
              icon: "🔒",
              label: "Privacy Policy",
              onPress: () =>
                Linking.openURL("https://puppal.dog/privacy").catch(() =>
                  Alert.alert("Privacy Policy", "Visit puppal.dog/privacy")
                ),
            },
            {
              icon: "📄",
              label: "Terms of Service",
              onPress: () =>
                Linking.openURL("https://puppal.dog/terms").catch(() =>
                  Alert.alert("Terms", "Visit puppal.dog/terms")
                ),
            },
          ].map((item) => (
            <Pressable key={item.label} onPress={item.onPress}>
              <Card
                variant="outline"
                className="flex-row items-center gap-md py-md mb-sm"
              >
                <Typography className="text-[20px]">{item.icon}</Typography>
                <Typography variant="body-medium" className="flex-1">
                  {item.label}
                </Typography>
                <Typography color="tertiary">→</Typography>
              </Card>
            </Pressable>
          ))}
        </Animated.View>

        {/* ── Danger Zone ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(480)}
          className="px-xl mb-xl"
        >
          <View className="gap-sm">
            <Button
              label="Sign Out"
              variant="secondary"
              fullWidth
              onPress={handleSignOut}
            />
            <Pressable
              onPress={() => router.push("/settings/data-privacy")}
              className="py-md items-center"
            >
              <Typography variant="body-sm" style={{ color: "#EF6461" }}>
                Delete Account
              </Typography>
            </Pressable>
          </View>
        </Animated.View>

        {/* Dev premium indicator */}
        {devPremiumOverride && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            className="mx-xl mb-sm"
          >
            <Pressable
              onPress={handleVersionTap}
              className="bg-warning/10 border border-warning/30 rounded-xl py-sm px-base items-center"
            >
              <Typography variant="body-sm-medium" style={{ color: "#F59E0B" }}>
                ⚡ Premium Override Active
              </Typography>
              <Typography variant="caption" color="tertiary">
                Tap version text 5× to disable
              </Typography>
            </Pressable>
          </Animated.View>
        )}

        {/* Version */}
        <Pressable
          onPress={handleVersionTap}
          className="px-xl mb-4xl items-center"
        >
          <Typography variant="caption" color="tertiary">
            PupPal v1.0.0 · Made with 🐾
          </Typography>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
