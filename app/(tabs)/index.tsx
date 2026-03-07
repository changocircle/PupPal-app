import React, { useEffect, useMemo } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Typography, Card, ProgressBar, PremiumGate, Button, ErrorBoundary, HomeSkeleton } from "@/components/ui";
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
import { useSubscription } from "@/hooks/useSubscription";
import { useHydration } from "@/hooks/useHydration";
import { DogSwitcherButton } from "@/components/dog";

/**
 * Home Screen, "Today's Training" + Gamification
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
  const hydrated = useHydration(useDogStore, useTrainingStore, useOnboardingStore);

  if (!hydrated) {
    return <HomeSkeleton />;
  }

  return (
    <ErrorBoundary screen="Home">
      <HomeScreenContent />
    </ErrorBoundary>
  );
}

function HomeScreenContent() {
  const router = useRouter();
  const { isPremium } = useSubscription();
  // Individual selectors → stable refs, prevents render loops
  const activeDogId = useDogStore((s) => s.activeDogId);
  const dogs = useDogStore((s) => s.dogs);
  const dog = useMemo(
    () => dogs.find((d) => d.id === activeDogId) ?? null,
    [dogs, activeDogId]
  );
  const onboardingData = useOnboardingStore((s) => s.data);

  const plan = useTrainingStore((s) => s.plan);
  const generatePlan = useTrainingStore((s) => s.generatePlan);
  const getTodayExercises = useTrainingStore((s) => s.getTodayExercises);
  const getCurrentWeek = useTrainingStore((s) => s.getCurrentWeek);
  const getCurrentDay = useTrainingStore((s) => s.getCurrentDay);
  const getWeekProgress = useTrainingStore((s) => s.getWeekProgress);

  // Gamification hook, XP, level, GBS, streak, achievements
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

  // First session = no exercises ever completed
  const isFirstSession = useMemo(() => {
    const store = useTrainingStore.getState();
    return store.completions.length === 0;
  }, [completedToday]);

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

        {/* ── First Session Welcome from Buddy ── */}
        {isFirstSession && (
          <Animated.View
            entering={FadeInDown.duration(500).delay(80)}
            className="mb-lg"
          >
            <Card className="flex-row items-start gap-md bg-primary-extralight border border-primary/20">
              <View className="w-[48px] h-[48px] rounded-full bg-primary-light items-center justify-center">
                <Typography className="text-[28px]">🐕</Typography>
              </View>
              <View className="flex-1">
                <Typography variant="body-medium" className="mb-xs">
                  Hey! I'm Buddy 👋
                </Typography>
                <Typography variant="body-sm" color="secondary">
                  I've got a personalised training plan ready for {dogName}. Tap your first exercise below to get started — it only takes 5 minutes!
                </Typography>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* ── Gamification Row (compact on first session) ── */}
        {isFirstSession ? (
          <Animated.View
            entering={FadeInDown.duration(400).delay(100)}
            className="mb-lg"
          >
            <View className="flex-row items-center justify-between bg-surface rounded-xl px-lg py-md border border-border">
              <View className="flex-row items-center gap-sm">
                <Typography className="text-[16px]">⭐️</Typography>
                <Typography variant="body-sm-medium">Level {gam.level}</Typography>
                <Typography variant="caption" color="secondary">·</Typography>
                <Typography variant="body-sm" color="secondary">{gam.totalXp} XP</Typography>
              </View>
              <View className="flex-row items-center gap-sm">
                <Typography className="text-[16px]">🔥</Typography>
                <Typography variant="body-sm-medium">{gam.currentStreak}</Typography>
              </View>
            </View>
          </Animated.View>
        ) : (
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
        )}

        {/* ── Weekly Challenge (hidden on first session) ── */}
        {!isFirstSession && gam.activeChallenge && !gam.activeChallenge.completed && (
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
              onPress={() => router.push("/(tabs)/plan")}
            />
          </Animated.View>
        )}

        {/* ── Post-Graduation: Plan Complete ── */}
        {plan?.status === 'completed' && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(160)}
            className="mb-lg"
          >
            <Card variant="featured" className="items-center">
              <Typography className="text-[48px] mb-sm">🎓</Typography>
              <Typography variant="h2" className="text-center mb-xs">
                Good Boy Graduate!
              </Typography>
              <Typography variant="body-sm" color="secondary" className="text-center mb-base">
                {dogName} completed the 12-week training plan! Foundation skills are solid, now let's have some fun with tricks.
              </Typography>
              <View className="flex-row gap-md mb-sm">
                <Card className="flex-1 items-center py-sm bg-accent-light border-accent/20">
                  <Typography variant="h3">{gam.totalXp}</Typography>
                  <Typography variant="caption" color="secondary">Total XP</Typography>
                </Card>
                <Card className="flex-1 items-center py-sm bg-success-light border-success/20">
                  <Typography variant="h3">{gam.goodBoyScore}</Typography>
                  <Typography variant="caption" color="secondary">GBS</Typography>
                </Card>
              </View>
              <Button
                label="🎪 Explore Trick Library"
                variant="primary"
                fullWidth
                onPress={() => router.push('/tricks')}
              />
            </Card>
          </Animated.View>
        )}

        {/* ── Week/Day context ── */}
        {plan?.status !== 'completed' && currentWeek && plan && (
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

        {/* ── GBS Plateau (PRD-07 §3) ── */}
        {!isPremium && plan && plan.currentWeek > 1 && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(200)}
            className="mb-lg"
          >
            <Card className="flex-row items-start gap-md bg-warning-light border-warning/20">
              <Typography className="text-[28px]">📊</Typography>
              <View className="flex-1">
                <Typography variant="body-sm-medium">
                  {dogName}'s Good Boy Score has plateaued
                </Typography>
                <Typography variant="body-sm" color="secondary" className="mt-[2px]">
                  Unlock Week {plan.currentWeek} training to keep {dogName}'s progress growing!
                </Typography>
                <Pressable
                  onPress={() => router.push({ pathname: "/paywall", params: { trigger: "feature_gate_week2", source: "home_gbs_plateau" } })}
                  className="mt-sm self-start bg-primary px-lg py-xs rounded-full"
                >
                  <Typography variant="caption" color="inverse">
                    Continue Training →
                  </Typography>
                </Pressable>
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
          ) : !isPremium && plan && plan.currentWeek > 1 ? (
            /* PRD-07: Week 2+ exercises gated on home */
            <View className="gap-md">
              <PremiumGate
                feature="feature_gate_week2"
                headline={`${dogName}'s Week ${plan.currentWeek} is ready!`}
                subtitle="Unlock to continue your training journey"
                cta="Unlock Full Plan"
                lockIcon="🏋️"
                preview={
                  <View className="gap-md" style={{ opacity: 0.4 }}>
                    {todayExercises.slice(0, 2).map((planEx, idx) => (
                      <ExerciseCard
                        key={planEx.id}
                        planExercise={planEx}
                        index={idx}
                      />
                    ))}
                  </View>
                }
              >
                <View />
              </PremiumGate>
            </View>
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

        {/* ── Achievements Shortcut (hidden on first session) ── */}
        {!isFirstSession && (
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
        )}

        {/* ── Trick Library Shortcut (hidden on first session) ── */}
        {!isFirstSession && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(300)}
            className="mb-lg"
          >
            <Pressable onPress={() => router.push("/tricks")}>
              <Card className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-md">
                  <Typography className="text-[24px]">🎪</Typography>
                  <View>
                    <Typography variant="body-medium">Trick Library</Typography>
                    <Typography variant="caption" color="secondary">
                      Teach {dogName} fun tricks
                    </Typography>
                  </View>
                </View>
                <Typography variant="body" color="tertiary">
                  →
                </Typography>
              </Card>
            </Pressable>
          </Animated.View>
        )}

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
                  focused sessions work best, even 5 minutes counts!
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
