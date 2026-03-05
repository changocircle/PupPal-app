/**
 * LevelUpOverlay — full-screen level-up celebration
 * PRD-04 §7: number transition, particles, shareable card
 */

import React from "react";
import { Modal, View, Share } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  FadeInDown,
  SlideInUp,
} from "react-native-reanimated";
import { Typography, Button } from "@/components/ui";
import type { LevelDefinition } from "@/types/gamification";

interface LevelUpOverlayProps {
  levelDef: LevelDefinition | null;
  onDismiss: () => void;
}

const LEVEL_EMOJIS: Record<number, string> = {
  1: "🐾",
  2: "📚",
  3: "🎓",
  4: "⭐",
  5: "🏅",
  6: "🌟",
  7: "💎",
  8: "👑",
  9: "🐺",
  10: "🏆",
};

export function LevelUpOverlay({
  levelDef,
  onDismiss,
}: LevelUpOverlayProps) {
  if (!levelDef) return null;

  const emoji = LEVEL_EMOJIS[levelDef.level] ?? "⭐";

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just became a ${levelDef.title} on PupPal! Level ${levelDef.level} 🎉`,
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
          entering={ZoomIn.springify().damping(12)}
          className="bg-surface rounded-3xl p-3xl w-full max-w-[340px] items-center"
        >
          {/* Level badge */}
          <Animated.View
            entering={ZoomIn.delay(200).springify().damping(8)}
            className="w-[90px] h-[90px] rounded-full items-center justify-center mb-lg"
            style={{ backgroundColor: "#FFF6E5" }}
          >
            <Typography className="text-[44px]">{emoji}</Typography>
          </Animated.View>

          {/* Level Up text */}
          <Animated.View entering={FadeInDown.delay(300)} className="items-center mb-sm">
            <Typography variant="overline" color="secondary" className="mb-xs">
              LEVEL UP!
            </Typography>
            <Typography variant="display" className="text-center">
              Level {levelDef.level}
            </Typography>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInDown.delay(400)} className="mb-xl">
            <Typography
              variant="h3"
              style={{ color: "#F5A623" }}
              className="text-center"
            >
              {levelDef.title}
            </Typography>
          </Animated.View>

          {/* Buddy celebration */}
          <Animated.View
            entering={SlideInUp.delay(500).springify()}
            className="flex-row items-start gap-sm mb-xl bg-background rounded-xl p-base w-full"
          >
            <Typography className="text-[24px]">🐕</Typography>
            <Typography variant="body-sm" className="flex-1">
              You're officially a {levelDef.title}! Your training skills
              are seriously impressive. Keep going — the next level awaits!
            </Typography>
          </Animated.View>

          {/* Actions */}
          <View className="w-full gap-sm">
            <Button
              onPress={handleShare}
              variant="secondary"
              label="Share Level Up"
              leftIcon="🔗"
            />
            <Button
              onPress={onDismiss}
              variant="primary"
              label="Let's Go!"
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
