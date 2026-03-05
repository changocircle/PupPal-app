/**
 * PremiumGate — reusable component wrapping premium content
 * PRD-07 §4: shows preview for free users, full content for premium.
 *
 * Uses useSubscription as single source of truth.
 * In production: triggers Superwall paywall.
 * For now: shows a styled upgrade prompt.
 */

import React from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Typography, Button } from "@/components/ui";
import { useSubscription } from "@/hooks/useSubscription";
import { useDogStore } from "@/stores/dogStore";

interface PremiumGateProps {
  /** Superwall trigger name (for future integration) */
  feature: string;
  /** Content to show for premium users */
  children: React.ReactNode;
  /** What free users see above the lock overlay */
  preview?: React.ReactNode;
  /** Personalised gate headline */
  headline?: string;
  /** CTA button text */
  cta?: string;
  /** Compact mode — inline lock badge instead of full overlay */
  compact?: boolean;
}

export function PremiumGate({
  feature,
  children,
  preview,
  headline,
  cta,
  compact = false,
}: PremiumGateProps) {
  const { isPremium } = useSubscription();
  const dog = useDogStore((s) => s.activeDog());
  const dogName = dog?.name ?? "Your pup";

  // Premium users see content directly
  if (isPremium) return <>{children}</>;

  const defaultHeadline = `${dogName}'s full training plan is ready`;
  const defaultCta = "Unlock Premium";

  const handleUpgrade = () => {
    // Future: Superwall.register(feature)
    // For now: just log
    console.log(`[PremiumGate] upgrade tapped: ${feature}`);
  };

  if (compact) {
    return (
      <Pressable
        onPress={handleUpgrade}
        className="flex-row items-center gap-sm rounded-xl bg-accent-light px-base py-sm"
      >
        <Typography className="text-[14px]">🔒</Typography>
        <Typography variant="body-sm-medium" style={{ color: "#F5A623" }}>
          {cta ?? "Upgrade"}
        </Typography>
      </Pressable>
    );
  }

  return (
    <Animated.View entering={FadeIn} className="relative">
      {/* Preview content (blurred / dimmed) */}
      {preview && (
        <View className="opacity-40" pointerEvents="none">
          {preview}
        </View>
      )}

      {/* Gate overlay */}
      <View
        className={`${
          preview ? "absolute inset-0" : ""
        } items-center justify-center bg-surface/95 rounded-2xl p-xl`}
      >
        <Typography className="text-[32px] mb-base">🔒</Typography>
        <Typography
          variant="h3"
          className="text-center mb-sm"
          numberOfLines={2}
        >
          {headline ?? defaultHeadline}
        </Typography>
        <Typography
          variant="body-sm"
          color="secondary"
          className="text-center mb-lg"
        >
          Unlock the full 12-week plan, 160+ exercises, and trick library.
        </Typography>
        <Button onPress={handleUpgrade} variant="primary" label={cta ?? defaultCta} />
        <Pressable onPress={() => {}} className="mt-base">
          <Typography variant="body-sm" color="tertiary">
            Maybe later
          </Typography>
        </Pressable>
      </View>
    </Animated.View>
  );
}
