import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  FadeInLeft,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Typography, Card, Button, Badge } from "@/components/ui";
import { CompletionModal } from "@/components/training";
import { AchievementUnlock, LevelUpOverlay } from "@/components/gamification";
import { useTrainingStore } from "@/stores/trainingStore";
import { useDogStore } from "@/stores/dogStore";
import { useGamification } from "@/hooks/useGamification";
import {
  getExerciseById,
  personaliseExercise,
} from "@/data/exerciseData";
import {
  CATEGORY_META,
  DIFFICULTY_LABELS,
  type PlanExercise,
} from "@/types/training";

/**
 * Exercise Detail Screen — PRD-03 §7
 *
 * Full step-by-step instructions, timer, supplies, tips.
 * Bottom actions: Mark Complete, Need More Practice, Skip.
 */

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const dog = useDogStore((s) => s.activeDog());
  const plan = useTrainingStore((s) => s.plan);
  const completeExercise = useTrainingStore((s) => s.completeExercise);
  const markNeedsPractice = useTrainingStore((s) => s.markNeedsPractice);
  const skipExercise = useTrainingStore((s) => s.skipExercise);
  const advanceDay = useTrainingStore((s) => s.advanceDay);
  const streak = useTrainingStore((s) => s.streak);

  // Gamification hook
  const gam = useGamification();

  const [showCompletion, setShowCompletion] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Find the plan exercise across all weeks/days
  const planExercise = useMemo(() => {
    if (!plan || !id) return null;
    for (const week of plan.weeks) {
      for (const day of week.days) {
        const found = day.exercises.find((e) => e.id === id);
        if (found) return found;
      }
    }
    return null;
  }, [plan, id]);

  const exercise = useMemo(() => {
    if (!planExercise) return null;
    return getExerciseById(planExercise.exerciseId) ?? null;
  }, [planExercise]);

  const personalised = useMemo(() => {
    if (!exercise) return null;
    return personaliseExercise(
      exercise,
      dog?.name ?? plan?.dogName ?? "Your Pup",
      dog?.breed ?? plan?.breed
    );
  }, [exercise, dog, plan]);

  // Timer logic
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Timer pulse animation
  const timerPulse = useSharedValue(1);
  useEffect(() => {
    if (timerActive) {
      timerPulse.value = withRepeat(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      timerPulse.value = withTiming(1);
    }
  }, [timerActive]);
  const timerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timerPulse.value }],
  }));

  // Handlers
  const handleComplete = useCallback(() => {
    if (!planExercise) return;
    const xp = completeExercise(planExercise.id);
    setXpEarned(xp);
    setTimerActive(false);

    // Wire into gamification: earn XP, check achievements, update GBS
    gam.onExerciseCompleted(planExercise.exerciseId, planExercise.id, xp);

    setShowCompletion(true);
  }, [planExercise, completeExercise, gam.onExerciseCompleted]);

  const handleNeedsPractice = useCallback(() => {
    if (!planExercise) return;
    markNeedsPractice(planExercise.id);
    setTimerActive(false);
    router.back();
  }, [planExercise, markNeedsPractice, router]);

  const handleSkip = useCallback(() => {
    if (!planExercise) return;
    skipExercise(planExercise.id);
    router.back();
  }, [planExercise, skipExercise, router]);

  const handleCompletionDismiss = useCallback(() => {
    setShowCompletion(false);
    // Check if all today's exercises are done — if so, advance day
    const todayExercises = useTrainingStore.getState().getTodayExercises();
    const allDone = todayExercises.every(
      (e) => e.status === "completed" || e.status === "skipped"
    );
    if (allDone) {
      advanceDay();
    }
    router.back();
  }, [advanceDay, router]);

  // ── Error state ──
  if (!exercise || !personalised || !planExercise) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Typography className="text-[40px] mb-base">🤔</Typography>
        <Typography variant="h3" className="mb-sm">
          Exercise not found
        </Typography>
        <Button onPress={() => router.back()} variant="secondary" label="Go Back" />
      </SafeAreaView>
    );
  }

  const category = CATEGORY_META[exercise.category];
  const difficulty = DIFFICULTY_LABELS[exercise.difficulty] ?? { label: "Easy", paws: "🐾" };
  const isTrick = planExercise.type === "trick_bonus";
  const isCompleted = planExercise.status === "completed";

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── Back button ── */}
        <Pressable
          onPress={() => router.back()}
          className="px-xl pt-base pb-sm"
        >
          <Typography variant="body-medium" style={{ color: "#FF6B5C" }}>
            ← Back
          </Typography>
        </Pressable>

        {/* ── Header ── */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-xl mb-lg"
        >
          {/* Category + Difficulty */}
          <View className="flex-row items-center gap-sm mb-sm">
            <Badge
              variant="accent"
              label={isTrick ? "⭐ Bonus Trick" : category.label}
              size="sm"
            />
            <Badge variant="neutral" label={(difficulty ?? { paws: "🐾" }).paws} size="sm" />
            <Badge
              variant="neutral"
              label={`${exercise.time_minutes} min`}
              size="sm"
            />
          </View>

          <Typography variant="h1" className="mb-sm">
            {personalised.title}
          </Typography>

          <Typography variant="body" color="secondary">
            {personalised.overview}
          </Typography>
        </Animated.View>

        {/* ── Supplies ── */}
        {exercise.supplies.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(80)}
            className="px-xl mb-lg"
          >
            <Card className="bg-accent-light border-accent/20">
              <Typography variant="body-sm-medium" className="mb-sm">
                🧺 What you'll need
              </Typography>
              <View className="flex-row flex-wrap gap-sm">
                {exercise.supplies.map((supply, i) => (
                  <View
                    key={i}
                    className="bg-surface px-md py-xs rounded-full"
                  >
                    <Typography variant="body-sm">{supply}</Typography>
                  </View>
                ))}
              </View>
            </Card>
          </Animated.View>
        )}

        {/* ── Timer ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(120)}
          className="px-xl mb-lg"
        >
          <Animated.View style={timerAnimStyle}>
            <Card
              className={`items-center py-lg ${
                timerActive
                  ? "bg-primary-extralight border-primary/20"
                  : "bg-surface"
              }`}
            >
              <Typography
                variant="h1"
                style={{
                  fontSize: 36,
                  fontVariant: ["tabular-nums"],
                  color: timerActive ? "#FF6B5C" : "#1B2333",
                }}
              >
                {formatTime(timerSeconds)}
              </Typography>
              <Pressable
                onPress={() => setTimerActive(!timerActive)}
                className={`mt-sm px-xl py-sm rounded-full ${
                  timerActive ? "bg-primary" : "bg-primary-light"
                }`}
              >
                <Typography
                  variant="body-sm-medium"
                  color={timerActive ? "inverse" : undefined}
                  style={timerActive ? undefined : { color: "#FF6B5C" }}
                >
                  {timerActive ? "⏸ Pause" : "▶ Start Timer"}
                </Typography>
              </Pressable>
            </Card>
          </Animated.View>
        </Animated.View>

        {/* ── Steps ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(160)}
          className="px-xl mb-lg"
        >
          <Typography variant="h3" className="mb-base">
            Step-by-Step
          </Typography>
          {personalised.steps.map((step, idx) => (
            <Animated.View
              key={idx}
              entering={FadeInLeft.delay(200 + idx * 60).springify()}
              className="flex-row gap-md mb-md"
            >
              <View className="w-[28px] h-[28px] rounded-full bg-primary items-center justify-center mt-[2px]">
                <Typography variant="caption" color="inverse" style={{ fontSize: 12 }}>
                  {idx + 1}
                </Typography>
              </View>
              <View className="flex-1">
                <Typography variant="body">{step}</Typography>
              </View>
            </Animated.View>
          ))}
        </Animated.View>

        {/* ── Success criteria ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(220)}
          className="px-xl mb-lg"
        >
          <Card className="bg-success-light border-success/20">
            <Typography variant="body-sm-medium" className="mb-xs">
              ✅ Success looks like
            </Typography>
            <Typography variant="body-sm">
              {personalised.success_criteria}
            </Typography>
          </Card>
        </Animated.View>

        {/* ── Pro Tips ── */}
        {personalised.pro_tips.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(260)}
            className="px-xl mb-lg"
          >
            <Typography variant="h3" className="mb-sm">
              💡 Pro Tips
            </Typography>
            {personalised.pro_tips.map((tip, idx) => (
              <View key={idx} className="flex-row gap-sm mb-sm">
                <Typography variant="body-sm" color="secondary">
                  •
                </Typography>
                <Typography variant="body-sm" color="secondary" className="flex-1">
                  {tip}
                </Typography>
              </View>
            ))}
          </Animated.View>
        )}

        {/* ── Common Mistakes ── */}
        {personalised.common_mistakes.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(300)}
            className="px-xl mb-lg"
          >
            <Typography variant="h3" className="mb-sm">
              ⚠️ Common Mistakes
            </Typography>
            {personalised.common_mistakes.map((mistake, idx) => (
              <View key={idx} className="flex-row gap-sm mb-sm">
                <Typography variant="body-sm" style={{ color: "#EF6461" }}>
                  ✗
                </Typography>
                <Typography variant="body-sm" color="secondary" className="flex-1">
                  {mistake}
                </Typography>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {/* ── Bottom action bar ── */}
      {!isCompleted && (
        <Animated.View
          entering={FadeIn.delay(400)}
          className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border px-xl pb-[34px] pt-base"
        >
          <Button
            onPress={handleComplete}
            variant="primary"
            className="mb-sm"
            label="✅ Mark Complete"
          />
          <View className="flex-row gap-sm">
            <Pressable
              onPress={handleNeedsPractice}
              className="flex-1 py-sm items-center rounded-xl bg-warning-light"
            >
              <Typography variant="body-sm-medium" style={{ color: "#F5A623" }}>
                🔄 Need More Practice
              </Typography>
            </Pressable>
            <Pressable
              onPress={handleSkip}
              className="flex-1 py-sm items-center rounded-xl bg-neutral-100"
            >
              <Typography variant="body-sm-medium" color="secondary">
                ⏭ Skip
              </Typography>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* ── Completion celebration ── */}
      <CompletionModal
        visible={showCompletion}
        exerciseTitle={personalised.title}
        xpEarned={xpEarned}
        dogName={dog?.name ?? plan?.dogName ?? "Your Pup"}
        streak={streak}
        onRate={(rating) => {
          // Rating saved via completeExercise already
        }}
        onDismiss={handleCompletionDismiss}
      />

      {/* ── Gamification celebrations (shown after completion modal) ── */}
      {!showCompletion && (
        <>
          <AchievementUnlock
            achievement={gam.pendingCelebration}
            onDismiss={gam.dismissCelebration}
          />
          <LevelUpOverlay
            levelDef={gam.pendingLevelUp}
            onDismiss={gam.dismissLevelUp}
          />
        </>
      )}
    </SafeAreaView>
  );
}
