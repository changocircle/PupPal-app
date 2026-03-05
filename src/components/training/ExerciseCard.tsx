/**
 * ExerciseCard — tappable card for exercise lists
 * PRD-03 §7: shows status, category tag, title, time
 *
 * Used in Today's Training + Plan week view.
 */

import React from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Typography, Badge } from "@/components/ui";
import { getExerciseById, personaliseExercise } from "@/data/exerciseData";
import {
  CATEGORY_META,
  DIFFICULTY_LABELS,
  type PlanExercise,
} from "@/types/training";
import { useDogStore } from "@/stores/dogStore";

interface ExerciseCardProps {
  planExercise: PlanExercise;
  index?: number;
  /** Whether this exercise is locked behind premium */
  locked?: boolean;
}

export function ExerciseCard({
  planExercise,
  index = 0,
  locked = false,
}: ExerciseCardProps) {
  const router = useRouter();
  const dog = useDogStore((s) => s.activeDog());

  const exercise = getExerciseById(planExercise.exerciseId);
  if (!exercise) return null;

  const personalised = personaliseExercise(
    exercise,
    dog?.name ?? "Your Pup",
    dog?.breed
  );

  const category = CATEGORY_META[exercise.category];
  const difficulty = DIFFICULTY_LABELS[exercise.difficulty] ?? { label: "Easy", paws: "🐾" };
  const isCompleted = planExercise.status === "completed";
  const isSkipped = planExercise.status === "skipped";
  const isTrick = planExercise.type === "trick_bonus";

  const handlePress = () => {
    if (locked) return; // Premium gate handled by parent
    router.push(`/exercise/${planExercise.id}`);
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <Pressable
        onPress={handlePress}
        disabled={locked}
        className={`flex-row items-center rounded-2xl p-base gap-md border ${
          isCompleted
            ? "bg-success-light border-success/20"
            : isSkipped
              ? "bg-neutral-50 border-border opacity-60"
              : "bg-surface border-border"
        }`}
        style={({ pressed }) => ({
          opacity: pressed ? 0.85 : locked ? 0.6 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        {/* Status indicator */}
        <View
          className={`w-[40px] h-[40px] rounded-full items-center justify-center ${
            isCompleted
              ? "bg-success"
              : isTrick
                ? "bg-accent-light"
                : "bg-primary-light"
          }`}
        >
          <Typography className="text-[20px]">
            {isCompleted ? "✅" : locked ? "🔒" : isTrick ? "⭐" : category.emoji}
          </Typography>
        </View>

        {/* Content */}
        <View className="flex-1">
          {/* Category + difficulty */}
          <View className="flex-row items-center gap-xs mb-[2px]">
            <Typography
              variant="overline"
              style={{ color: category.color, fontSize: 10 }}
            >
              {isTrick ? "BONUS TRICK" : category.label.toUpperCase()}
            </Typography>
            <Typography variant="overline" color="tertiary" style={{ fontSize: 10 }}>
              •
            </Typography>
            <Typography variant="overline" color="tertiary" style={{ fontSize: 10 }}>
              {difficulty.paws}
            </Typography>
          </View>

          {/* Title */}
          <Typography
            variant="body-medium"
            numberOfLines={1}
            className={isCompleted ? "line-through" : ""}
          >
            {personalised.title}
          </Typography>

          {/* Time */}
          <Typography variant="caption" color="secondary">
            {exercise.time_minutes} min
            {isCompleted && planExercise.xpEarned
              ? ` • +${planExercise.xpEarned} XP`
              : ""}
          </Typography>
        </View>

        {/* Right side indicator */}
        <View>
          {isCompleted ? (
            <Badge variant="success" label="Done" size="sm" />
          ) : isSkipped ? (
            <Badge variant="neutral" label="Skipped" size="sm" />
          ) : planExercise.status === "needs_practice" ? (
            <Badge variant="warning" label="Retry" size="sm" />
          ) : locked ? (
            <Badge variant="neutral" label="Premium" size="sm" />
          ) : (
            <View className="w-[24px] h-[24px] items-center justify-center">
              <Typography className="text-text-tertiary text-[16px]">›</Typography>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}
