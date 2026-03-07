/**
 * WeeklyChallengeCard, weekly challenge progress card
 * PRD-04 §8: title, description, progress bar, XP reward, days remaining
 *
 * Accepts optional onPress to make the card tappable (navigates to plan).
 */

import React from "react";
import { View, Pressable } from "react-native";
import { Card, Typography, ProgressBar, Badge } from "@/components/ui";

interface WeeklyChallengeCardProps {
  title: string;
  description: string;
  progress: number;
  target: number;
  xpReward: number;
  completed: boolean;
  onPress?: () => void;
}

export function WeeklyChallengeCard({
  title,
  description,
  progress,
  target,
  xpReward,
  completed,
  onPress,
}: WeeklyChallengeCardProps) {
  const progressFraction = Math.min(progress / target, 1.0);

  const cardContent = (
    <Card>
      <View className="flex-row items-start justify-between mb-sm">
        <View className="flex-1 mr-md">
          <View className="flex-row items-center gap-sm mb-[2px]">
            <Typography className="text-[18px]">🏆</Typography>
            <Typography variant="body-medium">
              {title}
            </Typography>
          </View>
          <Typography variant="body-sm" color="secondary">
            {description}
          </Typography>
        </View>

        <Badge
          variant={completed ? "success" : "accent"}
          label={completed ? "Done!" : `${xpReward} pts`}
        />
      </View>

      {/* Progress */}
      <View className="mt-sm">
        <ProgressBar
          progress={progressFraction}
          height={6}
          variant={completed ? "success" : "accent"}
        />
        <View className="flex-row items-center justify-between mt-[4px]">
          <Typography variant="caption" color="tertiary">
            {completed
              ? "Challenge complete! 🎉"
              : `${progress}/${target}`}
          </Typography>
        </View>
      </View>
    </Card>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
}
