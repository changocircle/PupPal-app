import React, { useMemo, useCallback } from "react";
import { View, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useSubscription } from "@/hooks/useSubscription";
import { Typography, Card, Badge, ProgressBar } from "@/components/ui";
import { useHealthStore } from "@/stores/healthStore";
import { useDogStore } from "@/stores/dogStore";
import { useTrainingStore } from "@/stores/trainingStore";
import { MILESTONE_CATEGORY_META } from "@/types/health";
import { MILESTONE_TEMPLATES } from "@/data/milestones";

/**
 * Developmental Milestones Screen — PRD-05 §8
 */

export default function MilestonesScreen() {
  const router = useRouter();
  const { isPremium } = useSubscription();

  // PRD-07: Redirect free users to paywall
  React.useEffect(() => {
    if (!isPremium) {
      router.replace({ pathname: "/paywall", params: { trigger: "feature_gate_health", source: "health_milestones" } });
    }
  }, [isPremium]);
  // Individual selectors → stable refs, prevents render loops
  const activeDogId = useDogStore((s) => s.activeDogId);
  const dogs = useDogStore((s) => s.dogs);
  const dog = useMemo(
    () => dogs.find((d) => d.id === activeDogId) ?? null,
    [dogs, activeDogId]
  );
  const plan = useTrainingStore((s) => s.plan);
  const dogName = dog?.name ?? plan?.dogName ?? "Your Pup";
  const dogId = dog?.id ?? plan?.dogName ?? "default-dog";

  // Stable: select raw data + memoize filter/join with templates
  const userMilestones = useHealthStore((s) => s.userMilestones);
  const milestones = useMemo(
    () => userMilestones
      .filter((m) => m.dogId === dogId)
      .map((um) => {
        const tmpl = MILESTONE_TEMPLATES.find((t) => t.id === um.milestoneId);
        return {
          ...um,
          name: tmpl?.name ?? "Unknown",
          description: tmpl?.description ?? "",
          category: tmpl?.category ?? "health",
          tips: tmpl?.tips ?? [],
        };
      })
      .sort(
        (a, b) =>
          new Date(a.expectedDateStart).getTime() -
          new Date(b.expectedDateStart).getTime()
      ),
    [userMilestones, dogId]
  );
  const completeMilestone = useHealthStore((s) => s.completeMilestone);

  const stats = useMemo(() => {
    const total = milestones.length;
    const completed = milestones.filter((m) => m.status === "completed").length;
    const active = milestones.filter((m) => m.status === "active").length;
    return { total, completed, active, progress: total > 0 ? completed / total : 0 };
  }, [milestones]);

  const handleMilestonePress = useCallback(
    (m: (typeof milestones)[0]) => {
      if (m.status === "completed") {
        Alert.alert(
          `${m.name} ✅`,
          `${m.description}\n\n${m.tips.map((t) => `• ${t}`).join("\n")}${m.actualDate ? `\n\nCompleted: ${new Date(m.actualDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""}`
        );
        return;
      }

      if (m.status === "active") {
        Alert.alert(
          m.name,
          `${m.description}\n\n${m.tips.map((t) => `• ${t}`).join("\n")}`,
          [
            { text: "Close" },
            {
              text: "Mark Complete ✅",
              onPress: () => completeMilestone(m.id),
            },
          ]
        );
        return;
      }

      // upcoming
      Alert.alert(
        m.name,
        `${m.description}\n\nExpected: ${new Date(m.expectedDateStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${new Date(m.expectedDateEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}\n\n${m.tips.map((t) => `• ${t}`).join("\n")}`
      );
    },
    [completeMilestone]
  );

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "✅";
      case "active":
        return "🟢";
      case "upcoming":
        return "🔵";
      default:
        return "⚪";
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <Pressable
          onPress={() => router.back()}
          className="px-xl pt-base pb-sm"
        >
          <Typography variant="body-medium" style={{ color: "#FF6B5C" }}>
            ← Back
          </Typography>
        </Pressable>

        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-xl mb-lg"
        >
          <Typography variant="h1">🌱 Milestones</Typography>
          <Typography variant="body" color="secondary">
            {dogName}'s developmental journey
          </Typography>
        </Animated.View>

        {/* Progress */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(60)}
          className="px-xl mb-lg"
        >
          <Card>
            <View className="flex-row items-center justify-between mb-sm">
              <Typography variant="body-medium">Overall Progress</Typography>
              <Typography variant="body-sm-medium" style={{ color: "#5CB882" }}>
                {stats.completed}/{stats.total}
              </Typography>
            </View>
            <ProgressBar
              progress={stats.progress}
              variant="success"
              height={8}
              animated
            />
            {stats.active > 0 && (
              <Typography variant="caption" color="secondary" className="mt-sm">
                {stats.active} milestone{stats.active !== 1 ? "s" : ""}{" "}
                currently active 🟢
              </Typography>
            )}
          </Card>
        </Animated.View>

        {/* Active milestones first */}
        {milestones
          .filter((m) => m.status === "active")
          .map((m, i) => {
            const catMeta =
              MILESTONE_CATEGORY_META[
                m.category as keyof typeof MILESTONE_CATEGORY_META
              ];
            return (
              <Animated.View
                key={m.id}
                entering={FadeInDown.duration(400).delay(120 + i * 60)}
                className="px-xl mb-sm"
              >
                <Pressable onPress={() => handleMilestonePress(m)}>
                  <Card className="border-l-4" style={{ borderLeftColor: catMeta?.color ?? "#5CB882" }}>
                    <View className="flex-row items-start gap-md">
                      <Typography className="text-[20px]">
                        {statusIcon(m.status)}
                      </Typography>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-sm mb-xs">
                          <Typography variant="body-medium">{m.name}</Typography>
                          <Badge
                            variant="accent"
                            label="Active"
                            size="sm"
                          />
                        </View>
                        <Typography
                          variant="body-sm"
                          color="secondary"
                          numberOfLines={2}
                        >
                          {m.description}
                        </Typography>
                        <Typography variant="caption" color="tertiary" className="mt-xs">
                          {catMeta?.label ?? "Milestone"} ·{" "}
                          {new Date(m.expectedDateStart).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}{" "}
                          —{" "}
                          {new Date(m.expectedDateEnd).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </Typography>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              </Animated.View>
            );
          })}

        {/* Upcoming & completed */}
        {(["upcoming", "completed"] as const).map((statusGroup) => {
          const items = milestones.filter((m) => m.status === statusGroup);
          if (items.length === 0) return null;
          return (
            <Animated.View
              key={statusGroup}
              entering={FadeInDown.duration(400).delay(300)}
              className="px-xl mb-lg"
            >
              <Typography
                variant="h3"
                color={statusGroup === "completed" ? "tertiary" : "primary"}
                className="mb-sm"
              >
                {statusGroup === "upcoming" ? "🔮 Coming Up" : "✅ Completed"}
              </Typography>
              {items.map((m) => {
                const catMeta =
                  MILESTONE_CATEGORY_META[
                    m.category as keyof typeof MILESTONE_CATEGORY_META
                  ];
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => handleMilestonePress(m)}
                    className="flex-row items-center gap-md py-md border-b border-border"
                  >
                    <Typography className="text-[16px]">
                      {statusIcon(m.status)}
                    </Typography>
                    <View className="flex-1">
                      <Typography
                        variant="body-sm-medium"
                        style={{
                          opacity: statusGroup === "completed" ? 0.5 : 1,
                        }}
                      >
                        {m.name}
                      </Typography>
                      <Typography variant="caption" color="tertiary">
                        {catMeta?.label ?? "Milestone"} ·{" "}
                        {statusGroup === "completed" && m.actualDate
                          ? new Date(m.actualDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : `${new Date(m.expectedDateStart).toLocaleDateString("en-US", { month: "short" })} — ${new Date(m.expectedDateEnd).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
                      </Typography>
                    </View>
                  </Pressable>
                );
              })}
            </Animated.View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
