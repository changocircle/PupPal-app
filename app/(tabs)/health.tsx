import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Typography, Card, Badge, Button, PremiumGate, ErrorBoundary, HealthSkeleton } from "@/components/ui";
import {
  StatusBadge,
  UpcomingEventCard,
  QuickAction,
  MedicationCard,
} from "@/components/health";
import { useHealthStore } from "@/stores/healthStore";
import { useDogStore } from "@/stores/dogStore";
import { DogSwitcherButton } from "@/components/dog/DogSwitcherButton";
import { useTrainingStore } from "@/stores/trainingStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useSubscription } from "@/hooks/useSubscription";
import { useHydration } from "@/hooks/useHydration";

/**
 * Health Dashboard, PRD-05 §3
 *
 * Centralises all health tracking: vaccinations, medications,
 * weight, vet visits, milestones, and health notes.
 */

export default function HealthScreen() {
  const hydrated = useHydration(useDogStore, useHealthStore, useOnboardingStore);

  if (!hydrated) {
    return <HealthSkeleton />;
  }

  return (
    <ErrorBoundary screen="Health">
      <HealthScreenContent />
    </ErrorBoundary>
  );
}

function HealthScreenContent() {
  const router = useRouter();
  const { isPremium } = useSubscription();
  // Individual selectors → stable refs, prevents render loops
  const activeDogId = useDogStore((s) => s.activeDogId);
  const dogs = useDogStore((s) => s.dogs);
  const dog = useMemo(
    () => dogs.find((d) => d.id === activeDogId) ?? null,
    [dogs, activeDogId]
  );
  const plan = useTrainingStore((s) => s.plan);
  const onboardingData = useOnboardingStore((s) => s.data);
  const isSwitching = useDogStore((s) => s.isSwitching);
  const dogName = dog?.name ?? plan?.dogName ?? (onboardingData.puppyName || "Your Pup");
  const breed = dog?.breed ?? plan?.breed ?? onboardingData.breed ?? null;
  // Use active dog's age, fall back to onboarding data for first dog
  const ageMonths = dog?.age_months_at_creation ?? dog?.age_months ?? onboardingData.ageMonths ?? 3;
  const ageWeeks = ageMonths * 4;

  // Health store - individual selectors for reactivity
  const vaccinationsInitialized = useHealthStore((s) => s.vaccinationsInitialized);
  const vaccinationSetupComplete = useHealthStore((s) => s.vaccinationSetupComplete);
  const milestonesInitialized = useHealthStore((s) => s.milestonesInitialized);
  const initVaccinations = useHealthStore((s) => s.initVaccinations);
  const initMilestones = useHealthStore((s) => s.initMilestones);
  const getHealthSummary = useHealthStore((s) => s.getHealthSummary);
  const getUpcomingEvents = useHealthStore((s) => s.getUpcomingEvents);
  const getActiveMedications = useHealthStore((s) => s.getActiveMedications);
  const logMedicationDose = useHealthStore((s) => s.logMedicationDose);
  // Raw state arrays: subscribe to these so useMemo recomputes on change
  const weightEntries = useHealthStore((s) => s.weightEntries);
  const healthNotes = useHealthStore((s) => s.healthNotes);
  const vaccinations = useHealthStore((s) => s.vaccinations);
  const medications = useHealthStore((s) => s.medications);

  // Derive a dogId (use plan dogName as key for now)
  const dogId = dog?.id ?? plan?.dogName ?? "default-dog";

  // Auto-init vaccinations & milestones for the ACTIVE dog.
  // Skipped during dog switches — the per-dog store swap loads existing data.
  useEffect(() => {
    if (isSwitching) return;
    if (vaccinationsInitialized) return;
    const dob = new Date();
    dob.setDate(dob.getDate() - ageWeeks * 7);
    initVaccinations({
      dogId,
      dateOfBirth: dob,
      ageWeeks,
      breed,
      registrationDate: new Date().toISOString().split("T")[0],
    });
  }, [vaccinationsInitialized, dogId, breed, ageWeeks, isSwitching]);

  useEffect(() => {
    if (isSwitching) return;
    if (milestonesInitialized) return;
    const dob = new Date();
    dob.setDate(dob.getDate() - ageWeeks * 7);
    initMilestones(dogId, dob);
  }, [milestonesInitialized, dogId, ageWeeks, isSwitching]);

  // Data - include raw state arrays in deps so useMemo recomputes
  // when data changes (e.g., after adding a weight entry and navigating back)
  const summary = useMemo(
    () => getHealthSummary(dogId),
    [dogId, weightEntries, vaccinations, medications, healthNotes]
  );
  // PRD-07 §3: free users see max 2 upcoming events
  const upcomingEvents = useMemo(
    () => getUpcomingEvents(dogId, isPremium ? 5 : 2),
    [dogId, vaccinations, medications, isPremium]
  );
  const activeMeds = useMemo(
    () => getActiveMedications(dogId),
    [dogId, medications]
  );
  const weights = useMemo(
    () =>
      weightEntries
        .filter((w) => w.dogId === dogId)
        .sort(
          (a, b) =>
            new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()
        ),
    [weightEntries, dogId]
  );
  const notes = useMemo(
    () =>
      healthNotes
        .filter((n) => n.dogId === dogId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [healthNotes, dogId]
  );
  const unresolvedNotes = notes.filter((n) => !n.resolved);

  // Status labels
  const vacStatusLabel: Record<string, string> = {
    up_to_date: "Up to date",
    due_soon: "Due soon",
    overdue: "Overdue!",
    not_set_up: "Set up needed",
  };

  // Handlers
  const handleLogDose = useCallback(
    (med: { id: string }) => {
      logMedicationDose(med.id, dogId);
      Alert.alert("Logged!", "Dose recorded successfully. +3 XP 🎉");
    },
    [logMedicationDose, dogId]
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Header ── */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-xl pt-3xl mb-lg"
        >
          <View className="flex-row items-center justify-between mb-xs">
            <Typography variant="h1">{dogName}'s Health</Typography>
            <DogSwitcherButton />
          </View>
          <Typography variant="body" color="secondary">
            Vaccinations, meds, weight & more
          </Typography>
        </Animated.View>

        {/* ── Status Badges ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(60)}
          className="px-xl mb-lg"
        >
          <View className="flex-row flex-wrap gap-sm">
            <StatusBadge
              status={summary.vaccinationStatus}
              label={`💉 ${vacStatusLabel[summary.vaccinationStatus]}`}
            />
            {summary.latestWeight && (
              <StatusBadge
                status="up_to_date"
                label={`⚖️ ${summary.latestWeight.weightValue} ${summary.latestWeight.weightUnit}`}
              />
            )}
            {summary.activeMedCount > 0 && (
              <StatusBadge
                status="up_to_date"
                label={`💊 ${summary.activeMedCount} active`}
              />
            )}
            {summary.unresolvedNotes > 0 && (
              <StatusBadge
                status="due_soon"
                label={`📝 ${summary.unresolvedNotes} note${summary.unresolvedNotes !== 1 ? "s" : ""}`}
              />
            )}
          </View>
        </Animated.View>

        {/* ── Upcoming Events ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(120)}
          className="px-xl mb-lg"
        >
          <Card>
            <Typography variant="h3" className="mb-sm">
              📅 Upcoming
            </Typography>
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event, i) => (
                <UpcomingEventCard
                  key={i}
                  icon={event.icon}
                  title={event.title}
                  dueDate={event.dueDate}
                  daysUntil={event.daysUntil}
                />
              ))
            ) : (
              <Typography variant="body-sm" color="secondary">
                No upcoming health events, all clear! ✨
              </Typography>
            )}
          </Card>
        </Animated.View>

        {/* ── Quick Actions ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(180)}
          className="px-xl mb-lg"
        >
          <View className="flex-row gap-sm">
            <QuickAction
              icon="💉"
              label="Vaccinations"
              onPress={() => {
                if (!isPremium) {
                  router.push({ pathname: "/paywall", params: { trigger: "feature_gate_health", source: "health_vaccinations" } });
                } else if (!vaccinationSetupComplete) {
                  router.push("/health/vaccination-setup");
                } else {
                  router.push("/health/vaccinations");
                }
              }}
              locked={!isPremium}
            />
            <QuickAction
              icon="⚖️"
              label="Weigh In"
              onPress={() => router.push("/health/weight")}
            />
          </View>
          <View className="flex-row gap-sm mt-sm">
            <QuickAction
              icon="💊"
              label="Medications"
              onPress={() =>
                isPremium
                  ? router.push("/health/medications")
                  : router.push({ pathname: "/paywall", params: { trigger: "feature_gate_health", source: "health_medications" } })
              }
              locked={!isPremium}
            />
            <QuickAction
              icon="🏥"
              label="Vet Visits"
              onPress={() =>
                isPremium
                  ? router.push("/health/vet-visits")
                  : router.push({ pathname: "/paywall", params: { trigger: "feature_gate_health", source: "health_vet_visits" } })
              }
              locked={!isPremium}
            />
          </View>
        </Animated.View>

        {/* ── Active Medications (Premium only) ── */}
        {isPremium && activeMeds.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(240)}
            className="px-xl mb-lg"
          >
            <View className="flex-row items-center justify-between mb-sm">
              <Typography variant="h3">💊 Active Medications</Typography>
              <Pressable
                onPress={() => router.push("/health/medications")}
              >
                <Typography
                  variant="body-sm-medium"
                  style={{ color: "#FF6B5C" }}
                >
                  See All
                </Typography>
              </Pressable>
            </View>
            {activeMeds.slice(0, 3).map((med) => (
              <MedicationCard
                key={med.id}
                medication={med}
                onLogDose={handleLogDose}
                onPress={() => router.push("/health/medications")}
              />
            ))}
          </Animated.View>
        )}

        {/* ── Weight Snapshot ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(300)}
          className="px-xl mb-lg"
        >
          <Pressable onPress={() => router.push("/health/weight")}>
            <Card>
              <View className="flex-row items-center justify-between mb-sm">
                <Typography variant="h3">⚖️ Weight</Typography>
                <Typography
                  variant="body-sm-medium"
                  style={{ color: "#FF6B5C" }}
                >
                  {weights.length > 0
                    ? isPremium
                      ? "View Chart →"
                      : "Add Entry →"
                    : "Add Entry →"}
                </Typography>
              </View>
              {weights.length > 0 ? (
                <View className="flex-row items-end gap-md">
                  <View>
                    <Typography
                      variant="h1"
                      style={{ fontSize: 36, lineHeight: 42 }}
                    >
                      {weights[weights.length - 1]!.weightValue}
                    </Typography>
                    <Typography variant="caption" color="secondary">
                      {weights[weights.length - 1]!.weightUnit} · last weighed{" "}
                      {new Date(
                        weights[weights.length - 1]!.measuredAt
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </Typography>
                  </View>
                  {weights.length >= 2 && (
                    <View className="items-end">
                      {(() => {
                        const prev =
                          weights[weights.length - 2]!.weightValue;
                        const curr =
                          weights[weights.length - 1]!.weightValue;
                        const diff = curr - prev;
                        const sign = diff >= 0 ? "+" : "";
                        return (
                          <Badge
                            variant={diff >= 0 ? "success" : "warning"}
                            label={`${sign}${diff.toFixed(1)} ${weights[0]!.weightUnit}`}
                            size="sm"
                          />
                        );
                      })()}
                    </View>
                  )}
                </View>
              ) : (
                <Typography variant="body-sm" color="secondary">
                  Tap to log {dogName}'s first weigh-in
                </Typography>
              )}
            </Card>
          </Pressable>
        </Animated.View>

        {/* ── Health Notes ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(360)}
          className="px-xl mb-lg"
        >
          <Pressable onPress={() =>
            isPremium
              ? router.push("/health/notes")
              : router.push({ pathname: "/paywall", params: { trigger: "feature_gate_health", source: "health_notes" } })
          }>
            <Card>
              <View className="flex-row items-center justify-between mb-sm">
                <View className="flex-row items-center gap-xs" style={{ flex: 1 }}>
                  <Typography variant="h3">📝 Health Notes</Typography>
                  {!isPremium && <Typography style={{ fontSize: 12 }}>🔒</Typography>}
                </View>
                <Typography
                  variant="body-sm-medium"
                  style={{ color: "#FF6B5C", flexShrink: 0 }}
                >
                  {unresolvedNotes.length > 0
                    ? `${unresolvedNotes.length} active →`
                    : "Add Note →"}
                </Typography>
              </View>
              {unresolvedNotes.length > 0 ? (
                unresolvedNotes.slice(0, 2).map((note) => (
                  <View
                    key={note.id}
                    className="flex-row items-center gap-sm py-xs"
                  >
                    <View
                      className="w-[6px] h-[6px] rounded-full"
                      style={{
                        backgroundColor:
                          note.severity === "urgent"
                            ? "#DC2626"
                            : note.severity === "concern"
                              ? "#EF6461"
                              : note.severity === "monitor"
                                ? "#F5A623"
                                : "#5B9BD5",
                      }}
                    />
                    <Typography
                      variant="body-sm"
                      color="secondary"
                      numberOfLines={1}
                      className="flex-1"
                    >
                      {note.content}
                    </Typography>
                  </View>
                ))
              ) : (
                <Typography variant="body-sm" color="secondary">
                  No active notes, jot down health observations here
                </Typography>
              )}
            </Card>
          </Pressable>
        </Animated.View>

        {/* ── Milestones Link ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(420)}
          className="px-xl mb-xl"
        >
          <Pressable onPress={() =>
            isPremium
              ? router.push("/health/milestones")
              : router.push({ pathname: "/paywall", params: { trigger: "feature_gate_health", source: "health_milestones" } })
          }>
            <Card className="flex-row items-center gap-md">
              <Typography className="text-[28px]">🌱</Typography>
              <View className="flex-1">
                <Typography variant="body-medium">
                  Developmental Milestones
                </Typography>
                <Typography variant="caption" color="secondary">
                  Track {dogName}'s growth stages
                </Typography>
              </View>
              {!isPremium && <Typography style={{ fontSize: 12 }}>🔒</Typography>}
              <Typography color="tertiary">→</Typography>
            </Card>
          </Pressable>
        </Animated.View>

        {/* ── Medical Disclaimer ── */}
        <View className="px-xl mb-4xl">
          <Typography
            variant="caption"
            color="tertiary"
            className="text-center"
          >
            ⚕️ PupPal is not a substitute for veterinary care. Always consult
            your vet for medical advice.
          </Typography>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
