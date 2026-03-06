import React, { useMemo, useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Typography, Card, ProgressBar, Badge, Button, ErrorBoundary, PlanSkeleton } from "@/components/ui";
import {
  WeekCard,
  ExerciseCard,
  DayProgress,
  PremiumGate,
} from "@/components/training";
import { useTrainingStore } from "@/stores/trainingStore";
import { useDogStore } from "@/stores/dogStore";
import { useSubscription } from "@/hooks/useSubscription";
import { useHydration } from "@/hooks/useHydration";
import { useTrickStore } from "@/stores/trickStore";

/**
 * Training Plan Tab
 * PRD-03 §7/§9: week overview, day drill-down, progress, free/premium gating
 *
 * Tabs: "This Week" | "Full Plan"
 */

type PlanTab = "this_week" | "full_plan" | "tricks";

export default function PlanScreen() {
  const hydrated = useHydration(useDogStore, useTrainingStore, useTrickStore);

  if (!hydrated) {
    return <PlanSkeleton />;
  }

  return (
    <ErrorBoundary screen="Plan">
      <PlanScreenContent />
    </ErrorBoundary>
  );
}

function PlanScreenContent() {
  const [activeTab, setActiveTab] = useState<PlanTab>("this_week");
  const router = useRouter();
  // Individual selectors → stable refs, prevents render loops
  const activeDogId = useDogStore((s) => s.activeDogId);
  const dogs = useDogStore((s) => s.dogs);
  const dog = useMemo(
    () => dogs.find((d) => d.id === activeDogId) ?? null,
    [dogs, activeDogId]
  );
  const { isPremium } = useSubscription();
  const totalTricksCompleted = useTrickStore((s) => s.totalTricksCompleted);

  const plan = useTrainingStore((s) => s.plan);
  const totalXp = useTrainingStore((s) => s.totalXp);
  const streak = useTrainingStore((s) => s.streak);
  const getCurrentWeek = useTrainingStore((s) => s.getCurrentWeek);
  const getWeekProgress = useTrainingStore((s) => s.getWeekProgress);
  const getTotalCompleted = useTrainingStore((s) => s.getTotalCompleted);

  const currentWeek = useMemo(() => getCurrentWeek(), [plan]);
  const totalCompleted = useMemo(() => getTotalCompleted(), [plan]);
  const dogName = dog?.name ?? plan?.dogName ?? "Your Pup";

  // ── No plan state ──
  if (!plan) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView className="flex-1 px-xl" showsVerticalScrollIndicator={false}>
          <View className="pt-3xl mb-xl">
            <Typography variant="h1">Training Plan</Typography>
            <Typography variant="body" color="secondary">
              Your personalised weekly plan
            </Typography>
          </View>
          <Card className="items-center py-3xl">
            <Typography className="text-[48px] mb-base">📋</Typography>
            <Typography variant="h3" className="text-center mb-sm">
              No plan yet
            </Typography>
            <Typography
              variant="body-sm"
              color="secondary"
              className="text-center"
            >
              Complete onboarding to generate your personalised 12-week
              training plan!
            </Typography>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-xl" showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="pt-3xl mb-lg"
        >
          <Typography variant="h1">{dogName}'s Plan</Typography>
          <Typography variant="body" color="secondary">
            12-week personalised training roadmap
          </Typography>
        </Animated.View>

        {/* ── Quick stats ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(80)}
          className="flex-row gap-md mb-lg"
        >
          <Card className="flex-1 items-center py-sm">
            <Typography variant="h3">{totalCompleted}</Typography>
            <Typography variant="caption" color="secondary">
              Exercises
            </Typography>
          </Card>
          <Card className="flex-1 items-center py-sm">
            <Typography variant="h3">{totalXp}</Typography>
            <Typography variant="caption" color="secondary">
              XP
            </Typography>
          </Card>
          <Card className="flex-1 items-center py-sm">
            <Typography variant="h3">
              Wk {plan.currentWeek}
            </Typography>
            <Typography variant="caption" color="secondary">
              Current
            </Typography>
          </Card>
        </Animated.View>

        {/* ── Tab switcher ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(120)}
          className="flex-row bg-surface rounded-xl p-[3px] mb-lg border border-border"
        >
          {(["this_week", "full_plan", "tricks"] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => {
                if (tab === "tricks") {
                  router.push("/tricks");
                } else {
                  setActiveTab(tab);
                }
              }}
              className={`flex-1 py-sm rounded-lg items-center ${
                activeTab === tab ? "bg-primary" : ""
              }`}
            >
              <Typography
                variant="body-sm-medium"
                color={activeTab === tab ? "inverse" : "secondary"}
              >
                {tab === "this_week"
                  ? "This Week"
                  : tab === "full_plan"
                  ? "Full Plan"
                  : `Tricks${totalTricksCompleted > 0 ? ` (${totalTricksCompleted})` : ""}`}
              </Typography>
            </Pressable>
          ))}
        </Animated.View>

        {/* ── Tab content ── */}
        {plan.status === "completed" && activeTab === "this_week" ? (
          <PostGraduationView dogName={dogName} />
        ) : activeTab === "this_week" ? (
          <ThisWeekView
            plan={plan}
            currentWeek={currentWeek}
            getWeekProgress={getWeekProgress}
            dogName={dogName}
          />
        ) : (
          <FullPlanView
            plan={plan}
            isPremium={isPremium}
            getWeekProgress={getWeekProgress}
            dogName={dogName}
          />
        )}

        <View className="h-[40px]" />
      </ScrollView>
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────
// This Week sub-view
// ──────────────────────────────────────────────

function ThisWeekView({
  plan,
  currentWeek,
  getWeekProgress,
  dogName,
}: {
  plan: NonNullable<ReturnType<typeof useTrainingStore.getState>["plan"]>;
  currentWeek: ReturnType<
    ReturnType<typeof useTrainingStore.getState>["getCurrentWeek"]
  >;
  getWeekProgress: (w: number) => number;
  dogName: string;
}) {
  if (!currentWeek) return null;
  const progress = getWeekProgress(plan.currentWeek);

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      {/* Week header card */}
      <Card variant="featured" className="mb-lg">
        <View className="flex-row items-center justify-between mb-sm">
          <Typography variant="h3">
            Week {currentWeek.weekNumber}: {currentWeek.title}
          </Typography>
          <Badge
            variant="accent"
            label={currentWeek.phase.charAt(0).toUpperCase() + currentWeek.phase.slice(1)}
            size="sm"
          />
        </View>
        <Typography variant="body-sm" color="secondary" className="mb-md">
          {currentWeek.description}
        </Typography>

        {/* Day dots */}
        <DayProgress
          days={currentWeek.days}
          currentDay={plan.currentDay}
        />

        {/* Progress */}
        <View className="mt-md">
          <ProgressBar progress={progress / 100} height={6} />
          <View className="flex-row justify-between mt-[4px]">
            <Typography variant="caption" color="tertiary">
              {progress}% complete
            </Typography>
            <Typography variant="caption" color="tertiary">
              🎯 {currentWeek.milestone}
            </Typography>
          </View>
        </View>
      </Card>

      {/* Day-by-day breakdown */}
      {currentWeek.days.map((day) => {
        const isCurrentDay = day.dayNumber === plan.currentDay;
        const dayCompleted = day.exercises.every(
          (e) => e.status === "completed" || e.status === "skipped"
        );

        return (
          <View key={day.dayNumber} className="mb-lg">
            <View className="flex-row items-center gap-sm mb-sm">
              <View
                className={`w-[24px] h-[24px] rounded-full items-center justify-center ${
                  dayCompleted
                    ? "bg-success"
                    : isCurrentDay
                      ? "bg-primary"
                      : "bg-border"
                }`}
              >
                <Typography
                  variant="caption"
                  color={dayCompleted || isCurrentDay ? "inverse" : "secondary"}
                  style={{ fontSize: 11 }}
                >
                  {dayCompleted ? "✓" : day.dayNumber}
                </Typography>
              </View>
              <Typography variant="body-medium">
                Day {day.dayNumber}
                {isCurrentDay ? " — Today" : ""}
              </Typography>
              <Typography variant="caption" color="tertiary">
                ~{day.estimatedMinutes} min
              </Typography>
            </View>

            <View className="gap-sm ml-[36px]">
              {day.exercises.map((planEx, idx) => (
                <ExerciseCard
                  key={planEx.id}
                  planExercise={planEx}
                  index={idx}
                  locked={
                    day.dayNumber > plan.currentDay &&
                    day.status === "upcoming"
                  }
                />
              ))}
            </View>
          </View>
        );
      })}
    </Animated.View>
  );
}

// ──────────────────────────────────────────────
// Full Plan sub-view
// ──────────────────────────────────────────────

function FullPlanView({
  plan,
  isPremium,
  getWeekProgress,
  dogName,
}: {
  plan: NonNullable<ReturnType<typeof useTrainingStore.getState>["plan"]>;
  isPremium: boolean;
  getWeekProgress: (w: number) => number;
  dogName: string;
}) {
  return (
    <View className="gap-md">
      {plan.weeks.map((week, idx) => {
        const isCurrentWeek = week.weekNumber === plan.currentWeek;
        const locked = !isPremium && week.weekNumber > 1;
        const progress = getWeekProgress(week.weekNumber);

        if (locked && week.weekNumber === 2) {
          // Show premium gate after Week 1
          return (
            <React.Fragment key={week.weekNumber}>
              <WeekCard
                week={week}
                progress={progress}
                index={idx}
                isCurrentWeek={isCurrentWeek}
                locked={locked}
                onPress={() => {}}
              />
              <PremiumGate
                feature="feature_gate_week2"
                headline={`${dogName}'s Week 2 plan is ready`}
                cta="Unlock Full Plan"
              >
                <View />
              </PremiumGate>
            </React.Fragment>
          );
        }

        return (
          <WeekCard
            key={week.weekNumber}
            week={week}
            progress={progress}
            index={idx}
            isCurrentWeek={isCurrentWeek}
            locked={locked}
            onPress={() => {}}
          />
        );
      })}
    </View>
  );
}

/**
 * Post-Graduation View — PRD-03 §Post-Graduation Experience
 *
 * When the 12-week plan is complete, the "This Week" tab transitions
 * to show maintenance recommendations and points to the Trick Library.
 */
function PostGraduationView({ dogName }: { dogName: string }) {
  const router = useRouter();
  const totalTricksCompleted = useTrickStore((s) => s.totalTricksCompleted);
  const totalTricksMastered = useTrickStore((s) => s.totalTricksMastered);

  return (
    <View className="gap-lg pb-3xl">
      {/* Graduation banner */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <Card variant="featured" className="items-center">
          <Typography className="text-[48px] mb-sm">🎓</Typography>
          <Typography variant="h2" className="text-center mb-xs">
            Plan Complete!
          </Typography>
          <Typography variant="body-sm" color="secondary" className="text-center">
            {dogName}'s foundation is solid. The 12-week journey is done
            — keep growing with tricks, practice, and daily consistency.
          </Typography>
        </Card>
      </Animated.View>

      {/* Today's Practice section */}
      <Animated.View entering={FadeInDown.duration(400).delay(80)}>
        <Typography variant="h3" className="mb-sm">
          Today's Practice
        </Typography>
        <Card className="bg-accent-light border-accent/20 mb-sm">
          <View className="flex-row items-start gap-md">
            <Typography className="text-[28px]">🔄</Typography>
            <View className="flex-1">
              <Typography variant="body-medium">Maintenance Review</Typography>
              <Typography variant="body-sm" color="secondary" className="mt-[2px]">
                Practise a core skill from {dogName}'s plan — pick one from
                Sit/Stay, Recall, or Loose-Lead Walking. 5-10 min session.
              </Typography>
            </View>
          </View>
        </Card>

        <Pressable onPress={() => router.push("/tricks")}>
          <Card className="bg-primary-light border-primary/20">
            <View className="flex-row items-start gap-md">
              <Typography className="text-[28px]">🎪</Typography>
              <View className="flex-1">
                <Typography variant="body-medium">Learn a New Trick</Typography>
                <Typography variant="body-sm" color="secondary" className="mt-[2px]">
                  {dogName}'s ready for fun! Explore the Trick Library for new
                  challenges — {totalTricksCompleted > 0
                    ? `${totalTricksCompleted} trick${totalTricksCompleted !== 1 ? 's' : ''} learned so far.`
                    : 'start with Shake to warm up.'}
                </Typography>
              </View>
            </View>
          </Card>
        </Pressable>
      </Animated.View>

      {/* Trick progress */}
      <Animated.View entering={FadeInDown.duration(400).delay(160)}>
        <Typography variant="h3" className="mb-sm">
          Trick Progress
        </Typography>
        <View className="flex-row gap-md mb-sm">
          <Card className="flex-1 items-center py-sm">
            <Typography variant="h3">{totalTricksCompleted}</Typography>
            <Typography variant="caption" color="secondary">Tricks Learned</Typography>
          </Card>
          <Card className="flex-1 items-center py-sm">
            <Typography variant="h3">{totalTricksMastered}</Typography>
            <Typography variant="caption" color="secondary">Mastered</Typography>
          </Card>
        </View>
        <Button
          label="🎪 Browse Trick Library"
          variant="primary"
          fullWidth
          onPress={() => router.push("/tricks")}
        />
      </Animated.View>

      {/* Tips */}
      <Animated.View entering={FadeInDown.duration(400).delay(240)}>
        <Card className="bg-success-light border-success/20">
          <View className="flex-row items-start gap-md">
            <Typography className="text-[28px]">💡</Typography>
            <View className="flex-1">
              <Typography variant="body-sm-medium" className="mb-xs">
                Post-Graduation Tips
              </Typography>
              <Typography variant="body-sm" color="secondary">
                • Keep practising core commands 3-5 min daily{'\n'}
                • Teach one new trick per week to stay sharp{'\n'}
                • Log walks and sessions in the Health tracker{'\n'}
                • Share milestones — it builds consistency!
              </Typography>
            </View>
          </View>
        </Card>
      </Animated.View>
    </View>
  );
}
