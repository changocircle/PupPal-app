/**
 * CompletionModal, celebration overlay after exercise completion
 * PRD-03 §7: celebration animation, XP float-up, optional rating
 */

import React, { useEffect } from "react";
import { Modal, Pressable, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  FadeInDown,
} from "react-native-reanimated";
import { Typography, Button } from "@/components/ui";

interface CompletionModalProps {
  visible: boolean;
  exerciseTitle: string;
  xpEarned: number;
  dogName: string;
  streak: number;
  onRate: (rating: number) => void;
  onDismiss: () => void;
}

export function CompletionModal({
  visible,
  exerciseTitle,
  xpEarned,
  dogName,
  streak,
  onRate,
  onDismiss,
}: CompletionModalProps) {
  const [selectedRating, setSelectedRating] = React.useState<number | null>(null);

  useEffect(() => {
    if (visible) setSelectedRating(null);
  }, [visible]);

  const handleDone = () => {
    if (selectedRating) onRate(selectedRating);
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        className="flex-1 bg-black/50 items-center justify-center px-xl"
      >
        <Animated.View
          entering={FadeIn.duration(200)}
          className="bg-surface rounded-3xl p-3xl w-full max-w-[340px] items-center"
        >
          {/* Celebration emoji */}
          <Animated.Text
            entering={FadeIn.delay(100).duration(200)}
            className="text-[56px] mb-base"
          >
            🎉
          </Animated.Text>

          {/* Title */}
          <Typography variant="h2" className="text-center mb-xs">
            Great job!
          </Typography>

          <Typography
            variant="body"
            color="secondary"
            className="text-center mb-lg"
          >
            {dogName} is getting better every day!
          </Typography>

          {/* XP earned */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(200)}
            className="bg-accent-light rounded-2xl px-xl py-base mb-lg w-full items-center"
          >
            <Typography variant="h3" style={{ color: "#F5A623" }}>
              +{xpEarned} XP
            </Typography>
            {streak > 1 && (
              <Typography variant="body-sm" color="secondary" className="mt-[2px]">
                🔥 {streak} day streak!
              </Typography>
            )}
          </Animated.View>

          {/* Rating */}
          <Typography
            variant="body-sm-medium"
            color="secondary"
            className="mb-sm"
          >
            How did it go?
          </Typography>
          <View className="flex-row gap-sm mb-xl">
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => setSelectedRating(star)}
                className="p-xs"
              >
                <Typography className="text-[28px]">
                  {star <= (selectedRating ?? 0) ? "⭐" : "☆"}
                </Typography>
              </Pressable>
            ))}
          </View>

          {/* Exercise title */}
          <Typography
            variant="caption"
            color="tertiary"
            className="text-center mb-lg"
            numberOfLines={1}
          >
            {exerciseTitle}
          </Typography>

          {/* Action */}
          <Button onPress={handleDone} variant="primary" className="w-full" label="Continue Training" />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
