import React from "react";
import { View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { Button, Typography, Card } from "@/components/ui";
import { useOnboardingStore } from "@/stores/onboardingStore";

/**
 * Screen 8: Paywall
 * PRD-01 Section 3, Screen 8 + PRD-06
 *
 * This is a PLACEHOLDER. The actual paywall will be rendered by Superwall
 * (remote paywall, no app update needed for changes).
 *
 * For development: shows the structure and pricing.
 * For production: Superwall.register("onboarding_complete") triggers the real paywall.
 */
export default function PaywallScreen() {
  const router = useRouter();
  const { data } = useOnboardingStore();
  const puppyName = data.puppyName || "Your Pup";

  const handleStartTrial = () => {
    // TODO: RevenueCat purchase flow
    // For now, skip to main app
    router.replace("/(tabs)");
  };

  const handleSkip = () => {
    // Enter free tier
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-xl" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500 }}
          className="pt-3xl items-center mb-2xl"
        >
          <Typography variant="h1" className="text-center mb-xs">
            {`Unlock ${puppyName}'s\nFull Potential`}
          </Typography>
          <Typography variant="body" color="secondary" className="text-center">
            Start your free 3-day trial. Cancel anytime.
          </Typography>
        </MotiView>

        {/* Benefits */}
        <View className="gap-md mb-2xl">
          {[
            { icon: "✅", text: "Unlimited AI mentor access" },
            { icon: "✅", text: "Full personalized training plan" },
            { icon: "✅", text: "Health & vaccination tracker" },
            { icon: "✅", text: "All achievements & challenges" },
            { icon: "✅", text: "Growth journal & milestones" },
          ].map((item, i) => (
            <MotiView
              key={i}
              from={{ opacity: 0, translateX: -15 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: "timing", duration: 300, delay: 200 + i * 80 }}
              className="flex-row items-center gap-md"
            >
              <Typography>{item.icon}</Typography>
              <Typography variant="body-medium">{item.text}</Typography>
            </MotiView>
          ))}
        </View>

        {/* Pricing cards */}
        <View className="gap-md mb-2xl">
          {/* Annual — recommended */}
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "timing", duration: 400, delay: 600 }}
          >
            <Card variant="featured" className="border-2 border-primary">
              <View className="flex-row justify-between items-start mb-sm">
                <View>
                  <Typography variant="h3">Annual</Typography>
                  <Typography variant="body-sm" color="secondary">
                    3-day free trial, then
                  </Typography>
                </View>
                <View className="bg-primary rounded-full px-md py-xs">
                  <Typography variant="caption" color="inverse">
                    BEST VALUE
                  </Typography>
                </View>
              </View>
              <View className="flex-row items-baseline gap-xs">
                <Typography variant="h1">$39.99</Typography>
                <Typography variant="body-sm" color="secondary">/year</Typography>
              </View>
              <Typography variant="caption" color="secondary" className="mt-xs">
                That's just $3.33/month — less than one training treat bag
              </Typography>
            </Card>
          </MotiView>

          {/* Monthly */}
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "timing", duration: 400, delay: 700 }}
          >
            <Card variant="outline">
              <Typography variant="h3">Monthly</Typography>
              <View className="flex-row items-baseline gap-xs mt-xs">
                <Typography variant="h2">$9.99</Typography>
                <Typography variant="body-sm" color="secondary">/month</Typography>
              </View>
            </Card>
          </MotiView>
        </View>

        {/* Trust signals */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "timing", duration: 400, delay: 800 }}
          className="items-center mb-lg"
        >
          <Typography variant="caption" color="tertiary" className="text-center">
            🔒 No payment now • Cancel anytime • Reminder before billing
          </Typography>
        </MotiView>
      </ScrollView>

      {/* CTA */}
      <View className="px-xl pb-3xl gap-sm">
        <Button
          label="Start Free Trial"
          onPress={handleStartTrial}
        />
        <Button
          variant="ghost"
          label="Continue with limited access"
          size="sm"
          onPress={handleSkip}
        />
      </View>
    </SafeAreaView>
  );
}
