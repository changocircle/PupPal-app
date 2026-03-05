import React from "react";
import { View, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Typography, Card, Button, Badge } from "@/components/ui";
import { useSubscription } from "@/hooks/useSubscription";

/**
 * Subscription Management Screen — PRD-06 / PRD-14 §4
 */

export default function SubscriptionScreen() {
  const router = useRouter();
  const { isPremium } = useSubscription();

  const FREE_FEATURES = [
    "5 daily AI chat messages",
    "Week 1 training plan",
    "2 upcoming health events",
    "Basic achievements",
  ];

  const PREMIUM_FEATURES = [
    "Unlimited AI chat messages",
    "Full 12-week training plan",
    "Complete health tracker",
    "All achievements & challenges",
    "Growth journal",
    "PDF health exports",
    "Priority support",
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <Pressable
          onPress={() => router.back()}
          className="px-xl pt-base pb-sm"
        >
          <Typography variant="body-medium" style={{ color: "#FF6B5C" }}>
            ← Back
          </Typography>
        </Pressable>

        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-xl mb-xl"
        >
          <Typography variant="h1">💎 Subscription</Typography>
        </Animated.View>

        {/* Current plan */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(60)}
          className="px-xl mb-lg"
        >
          <Card variant="featured">
            <View className="items-center py-base">
              <Typography className="text-[48px] mb-sm">
                {isPremium ? "💎" : "🐾"}
              </Typography>
              <View className="flex-row items-center gap-sm mb-xs">
                <Typography variant="h2">
                  {isPremium ? "Premium" : "Free"} Plan
                </Typography>
                <Badge
                  variant={isPremium ? "accent" : "neutral"}
                  label={isPremium ? "Active" : "Current"}
                  size="sm"
                />
              </View>
              <Typography variant="body-sm" color="secondary">
                {isPremium
                  ? "You have full access to all PupPal features!"
                  : "Upgrade to unlock the full PupPal experience"}
              </Typography>
            </View>
          </Card>
        </Animated.View>

        {/* Plan comparison */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(120)}
          className="px-xl mb-lg"
        >
          <View className="flex-row gap-md">
            {/* Free */}
            <Card className="flex-1">
              <Typography variant="body-medium" className="mb-base">
                Free
              </Typography>
              {FREE_FEATURES.map((f) => (
                <View key={f} className="flex-row gap-sm mb-sm">
                  <Typography variant="caption">✓</Typography>
                  <Typography variant="caption" color="secondary" className="flex-1">
                    {f}
                  </Typography>
                </View>
              ))}
            </Card>

            {/* Premium */}
            <Card className="flex-1 border-2 border-primary/20 bg-primary-extralight">
              <Typography
                variant="body-medium"
                style={{ color: "#FF6B5C" }}
                className="mb-base"
              >
                Premium ✨
              </Typography>
              {PREMIUM_FEATURES.map((f) => (
                <View key={f} className="flex-row gap-sm mb-sm">
                  <Typography variant="caption" style={{ color: "#FF6B5C" }}>
                    ✓
                  </Typography>
                  <Typography variant="caption" className="flex-1">
                    {f}
                  </Typography>
                </View>
              ))}
            </Card>
          </View>
        </Animated.View>

        {/* Upgrade / Manage */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(180)}
          className="px-xl mb-xl"
        >
          {!isPremium ? (
            <Button
              label="Upgrade to Premium 💎"
              variant="primary"
              fullWidth
              onPress={() =>
                Alert.alert(
                  "Premium",
                  "RevenueCat + Superwall integration launches in Phase 6!"
                )
              }
            />
          ) : (
            <Button
              label="Manage Subscription"
              variant="secondary"
              fullWidth
              onPress={() =>
                Alert.alert(
                  "Manage",
                  "This would open your App Store subscription management."
                )
              }
            />
          )}
          <Typography
            variant="caption"
            color="tertiary"
            className="text-center mt-md"
          >
            Cancel anytime. No hidden fees.
          </Typography>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
