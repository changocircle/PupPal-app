import React, { useEffect, useMemo } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Typography, Card, ProgressBar } from "@/components/ui";
import { ExerciseCard, DayProgress } from "@/components/training";
import {
  GamificationRow,
  WeeklyChallengeCard,
  AchievementUnlock,
  LevelUpOverlay,
} from "@/components/gamification";
import { useTrainingStore } from "@/stores/trainingStore";
import { useDogStore } from "@/stores/dogStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useGamification } from "@/hooks/useGamification";
import { DogSwitcherButton } from "@/components/dog";

/**
 * Home Screen — "Today's Training" + Gamification
 * PRD-03 §7 + PRD-04: dog name, gamification row, today's exercises,
 * weekly challenge, achievement/level-up celebrations
 */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const router = useRouter();
  const dog = useDogStore((s) => s.activeDog());
  const onboardingData = useOnboardingStore((s) => s.data);

  const plan = useTrainingStore((s) => s.plan);
  const generatePlan = useTrainingStore((s) => s.generatePlan);
  const getTodayExercises = useTrainingStore((s) => s.getTodayExercises);
  const getCurrentWeek = useTrainingStore((s) => s.getCurrentWeek);
  const getCurrentDay = useTrainingStore((s) => s.getCurrentDay);
  const getWeekProgress = useTrainingStore((s) => s.getWeekProgress);

  // Gamification hook — XP, level, GBS, streak, achievements
  const gam = useGamification();

  // Auto-generate plan if not yet created and we have onboarding data
  useEffect(() => {
    if (!plan && onboardingData.puppyName) {
      const ageWeeks = onboardingData.ageMonths
        ? onboardingData.ageMonths * 4.3
        : 12;
      generatePlan({
        dogName: onboardingData.puppyName,
        breed: onboardingData.breed,
        ageWeeks: Math.round(ageWeeks),
        challenges: onboardingData.challenges,
        experience: onboardingData.ownerExperience,
      });
    }
  }, [plan, onboardingData.puppyName]);

  const todayExercises = useMemo(() => getTodayExercises(), [plan]);
  const currentWeek = useMemo(() => getCurrentWeek(), [plan]);
  const currentDay = useMemo(() => getCurrentDay(), [plan]);
  const weekProgress = useMemo(
    () => (plan ? getWeekProgress(plan.currentWeek) : 0),
    [plan]
  );

  const dogName = dog?.name ?? onboardingData.puppyName ?? "Your Pup";
  const completedToday = todayExercises.filter(
    (e) => e.status === "completed"
  ).length;
  const totalToday = todayExercises.length;
  const allDoneToday = totalToday > 0 && completedToday === totalToday;

  const totalMinutes = todayExercises.reduce((sum, e) => {
    return sum + (e.status !== "completed" ? 5 : 0);
  }, 0);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-xl" showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="pt-3xl mb-lg"
        >
          <View className="flex-row items-center justify-between mb-xs">
            <Typography variant="h2" color="secondary">
              {getGreeting()} 👋
            </Typography>
            <DogSwitcherButton />
          </View>
          <Typography variant="h1">{dogName}'s Training</Typography>
        </Animated.View>

        {/* ── Gamification Row (replaces old stats row) ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(80)}
          className="mb-lg"
        >
          <GamificationRow
            streak={gam.currentStreak}
            dailyXp={gam.dailyXp}
            dailyXpTarget={gam.dailyXpTarget}
            goodBoyScore={gam.goodBoyScore}
            level={gam.level}
            levelTitle={gam.levelTitle}
            totalXp={gam.totalXp}
          />
        </Animated.View>

        {/* ── Weekly Challenge ── */}
        {gam.activeChallenge && !gam.activeChallenge.completed && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(120)}
            className="mb-lg"
          >
            <WeeklyChallengeCard
              title={gam.activeChallenge.title}
              description={gam.activeChallenge.description}
              progress={gam.activeChallenge.progress}
              target={gam.activeChallenge.target}
              xpReward={gam.activeChallenge.xpReward}
              completed={gam.activeChallenge.completed}
            />
          </Animated.View>
        )}

        {/* ── Week/Day context ── */}
        {currentWeek && plan && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(160)}
            className="mb-lg"
          >
            <Card variant="featured">
              <View className="flex-row items-center justify-between mb-sm">
                <View>
                  <Typography variant="overline" color="secondary">
                    WEEK {plan.currentWeek} • DAY {plan.currentDay}
                  </Typography>
                  <Typography variant="body-medium">
                    {currentWeek.title}
                  </Typography>
                </View>
                <Pressable
                  onPress={() => router.push("/(tabs)/plan")}
                  className="bg-primary-light px-md py-xs rounded-full"
                >
                  <Typography variant="caption" style={{ color: "#FF6B5C" }}>
                    View Plan
                  </Typography>
                </Pressable>
              </View>

              {/* Day dots */}
              <DayProgress
                days={currentWeek.days}
                currentDay={plan.currentDay}
              />

              {/* Week progress */}
              <View className="mt-md">
                <ProgressBar progress={weekProgress / 100} height={6} />
                <Typography variant="caption" color="tertiary" className="mt-[4px]">
                  {weekProgress}% of Week {plan.currentWeek} complete
                </Typography>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* ── Today's Exercises ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(220)}
          className="mb-xl"
        >
          <View className="flex-row items-center justify-between mb-base">
            <Typography variant="h3">
              {allDoneToday ? "All done! 🎉" : "Today's Exercises"}
            </Typography>
            {!allDoneToday && totalToday > 0 && (
              <Typography variant="caption" color="secondary">
                ~{Math.max(totalMinutes, 5)} min
              </Typography>
            )}
          </View>

          {todayExercises.length === 0 ? (
            <Card className="items-center py-xl">
              <Typography className="text-[40px] mb-base">📋</Typography>
              <Typography
                variant="body-medium"
                className="text-center mb-sm"
              >
                No exercises yet
              </Typography>
              <Typography
                variant="body-sm"
                color="secondary"
                className="text-center"
              >
                Complete onboarding to generate your personalised training plan!
              </Typography>
            </Card>
          ) : (
            <View className="gap-md">
              {todayExercises.map((planEx, idx) => (
                <ExerciseCard
                  key={planEx.id}
                  planExercise={planEx}
                  index={idx}
                />
              ))}
            </View>
          )}
        </Animated.View>

        {/* ── Achievements Shortcut ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(280)}
          className="mb-lg"
        >
          <Pressable
            onPress={() => router.push("/achievements")}
          >
            <Card className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-md">
                <Typography className="text-[24px]">🏅</Typography>
                <View>
                  <Typography variant="body-medium">Achievements</Typography>
                  <Typography variant="caption" color="secondary">
                    {gam.unlockedCount} of {gam.totalAchievements} unlocked
                  </Typography>
                </View>
              </View>
              <Typography variant="body" color="tertiary">
                →
              </Typography>
            </Card>
          </Pressable>
        </Animated.View>

        {/* ── Done for the day / Buddy tip ── */}
        {allDoneToday && (
          <Animated.View entering={FadeIn.delay(300)} className="mb-xl">
            <Card className="flex-row items-start gap-md bg-success-light border-success/20">
              <Typography className="text-[32px]">🐕</Typography>
              <View className="flex-1">
                <Typography variant="body-medium" className="mb-[2px]">
                  Great session!
                </Typography>
                <Typography variant="body-sm" color="secondary">
                  {dogName} is making amazing progress. Come back tomorrow for
                  the next set of exercises!
                </Typography>
              </View>
            </Card>
          </Animated.View>
        )}

        {!allDoneToday && todayExercises.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(350)}
            className="mb-4xl"
          >
            <Card className="flex-row items-start gap-md">
              <Typography className="text-[32px]">💡</Typography>
              <View className="flex-1">
                <Typography variant="body-sm-medium" color="secondary">
                  Buddy's Tip
                </Typography>
                <Typography variant="body-sm">
                  Tap any exercise to see step-by-step instructions. Short,
                  focused sessions work best — even 5 minutes counts!
                </Typography>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Bottom spacer */}
        <View className="h-[40px]" />
      </ScrollView>

      {/* ── Celebration Overlays ── */}
      <AchievementUnlock
        achievement={gam.pendingCelebration}
        onDismiss={gam.dismissCelebration}
      />
      <LevelUpOverlay
        levelDef={gam.pendingLevelUp}
        onDismiss={gam.dismissLevelUp}
      />
    </SafeAreaView>
  );
}
