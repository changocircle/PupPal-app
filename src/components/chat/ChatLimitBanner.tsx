/**
 * ChatLimitBanner, PRD-02 §6 / PRD-07
 *
 * Inline paywall shown when free user hits daily message limit.
 * Also shows remaining message count subtly.
 */

import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { Typography, Button, Card } from "@/components/ui";
import { BuddyAvatar } from "./BuddyAvatar";

interface ChatLimitBannerProps {
  remaining: number;
  isLimitHit: boolean;
  dogName: string;
}

export function ChatLimitBanner({
  remaining,
  isLimitHit,
  dogName,
}: ChatLimitBannerProps) {
  const router = useRouter();

  if (isLimitHit) {
    // Full inline paywall
    return (
      <Animated.View
        entering={FadeIn.duration(400)}
        className="px-xl mb-base"
      >
        <Card className="bg-accent-light border border-accent/30 items-center py-lg">
          <BuddyAvatar mood="empathetic" size={32} />
          <Typography
            variant="body-medium"
            className="text-center mb-xs"
          >
            You've used your free messages today
          </Typography>
          <Typography
            variant="body-sm"
            color="secondary"
            className="text-center mb-lg max-w-[260px]"
          >
            Upgrade for unlimited Buddy access. {dogName}'s training shouldn't
            have limits!
          </Typography>
          <Button
            onPress={() => {
              router.push({
                pathname: "/paywall",
                params: { trigger: "feature_gate_chat", source: "chat_limit" },
              });
            }}
            variant="primary"
            size="md"
            fullWidth={false}
            label="Unlock Unlimited Chat"
          />
          <Typography
            variant="caption"
            color="tertiary"
            className="mt-sm"
          >
            Your messages reset at midnight
          </Typography>
        </Card>
      </Animated.View>
    );
  }

  // Subtle remaining count
  if (remaining <= 3 && remaining > 0) {
    return (
      <View className="px-xl mb-xs">
        <Typography
          variant="caption"
          color="tertiary"
          className="text-center"
        >
          {remaining} message{remaining !== 1 ? "s" : ""} remaining today
        </Typography>
      </View>
    );
  }

  return null;
}
