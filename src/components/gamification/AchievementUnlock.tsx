/**
 * AchievementUnlock, full-screen celebration overlay
 * PRD-04 §6, DESIGN-SYSTEM.md: dark overlay, badge scale-in, confetti, share
 */

import React, { useMemo } from "react";
import { Modal, View, Pressable, Share, Platform } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  FadeInDown,
} from "react-native-reanimated";
import { Typography, Button } from "@/components/ui";
import { getAchievementEmoji, RARITY_COLORS } from "@/data/achievementData";
import type { Achievement } from "@/types/gamification";
import { useDogStore } from "@/stores/dogStore";
import { useOnboardingStore } from "@/stores/onboardingStore";

interface AchievementUnlockProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export function AchievementUnlock({
  achievement,
  onDismiss,
}: AchievementUnlockProps) {
  // Individual selectors → stable refs, prevents render loops
  const activeDogId = useDogStore((s) => s.activeDogId);
  const dogs = useDogStore((s) => s.dogs);
  const dog = useMemo(
    () => dogs.find((d) => d.id === activeDogId) ?? null,
    [dogs, activeDogId]
  );
  const dogName =
    dog?.name ?? useOnboardingStore.getState().data.puppyName ?? "Your Pup";

  if (!achievement) return null;

  const emoji = getAchievementEmoji(achievement.iconName);
  const rarityColor = RARITY_COLORS[achievement.rarity];
  const buddyMsg = achievement.buddyMessage.replace(
    /\{dog_name\}/g,
    dogName
  );
  const shareText = achievement.shareText.replace(
    /\{dog_name\}/g,
    dogName
  );

  const handleShare = async () => {
    try {
      await Share.share({
        message: shareText,
      });
    } catch {
      // User cancelled
    }
  };

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        className="flex-1 bg-black/60 items-center justify-center px-xl"
      >
        <Animated.View
          entering={FadeIn.duration(200)}
          className="bg-surface rounded-3xl p-3xl w-full max-w-[340px] items-center"
        >
          {/* Badge */}
          <Animated.View
            entering={FadeIn.delay(100).duration(200)}
            className="w-[80px] h-[80px] rounded-full items-center justify-center mb-lg"
            style={{ backgroundColor: `${rarityColor}20` }}
          >
            <Typography className="text-[40px]">{emoji}</Typography>
          </Animated.View>

          {/* Achievement name */}
          <Animated.View entering={FadeInDown.delay(300)}>
            <Typography variant="h2" className="text-center mb-xs">
              {achievement.name}
            </Typography>

            {/* Rarity tag */}
            <View className="self-center mb-md">
              <View
                className="px-md py-[3px] rounded-full"
                style={{ backgroundColor: `${rarityColor}20` }}
              >
                <Typography
                  variant="caption"
                  style={{ color: rarityColor, textTransform: "capitalize" }}
                >
                  {achievement.rarity}
                </Typography>
              </View>
            </View>
          </Animated.View>

          {/* Description */}
          <Animated.View entering={FadeInDown.delay(400)} className="mb-lg">
            <Typography
              variant="body"
              color="secondary"
              className="text-center"
            >
              {achievement.description}
            </Typography>
          </Animated.View>

          {/* XP bonus */}
          <Animated.View
            entering={FadeInDown.delay(350).duration(200)}
            className="bg-accent-light rounded-2xl px-xl py-base mb-lg w-full items-center"
          >
            <Typography variant="h3" style={{ color: "#F5A623" }}>
              +{achievement.xpBonus} XP
            </Typography>
          </Animated.View>

          {/* Buddy message */}
          <Animated.View
            entering={FadeInDown.delay(600)}
            className="flex-row items-start gap-sm mb-xl bg-background rounded-xl p-base w-full"
          >
            <Typography className="text-[24px]">🐕</Typography>
            <Typography variant="body-sm" className="flex-1">
              {buddyMsg}
            </Typography>
          </Animated.View>

          {/* Actions */}
          <View className="w-full gap-sm">
            <Button
              onPress={handleShare}
              variant="secondary"
              label="Share Achievement"
              leftIcon="🔗"
            />
            <Button
              onPress={onDismiss}
              variant="primary"
              label="Awesome!"
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
