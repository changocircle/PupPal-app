import React, { useState, useMemo, useCallback } from "react";
import { View, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Typography, Card } from "@/components/ui";
import {
  JournalEntryCard,
  MonthHeader,
  FilterTabs,
  AddEntryFAB,
} from "@/components/journal";
import { useJournalStore } from "@/stores/journalStore";
import { useDogStore } from "@/stores/dogStore";
import { useTrainingStore } from "@/stores/trainingStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useSubscription } from "@/hooks/useSubscription";
import type { JournalFilter, JournalEntry } from "@/types/journal";

/**
 * Journal Timeline Screen, PRD-10 §3
 * Chronological feed grouped by month. Filter tabs at top. FAB for adding.
 */

export default function JournalScreen() {
  const router = useRouter();
  const { isPremium } = useSubscription();
  const [filter, setFilter] = useState<JournalFilter>("all");

  // Dog context
  // Individual selectors → stable refs, prevents render loops
  const activeDogId = useDogStore((s) => s.activeDogId);
  const dogs = useDogStore((s) => s.dogs);
  const dog = useMemo(
    () => dogs.find((d) => d.id === activeDogId) ?? null,
    [dogs, activeDogId]
  );
  const plan = useTrainingStore((s) => s.plan);
  const onboardingData = useOnboardingStore((s) => s.data);
  const dogName = dog?.name ?? plan?.dogName ?? (onboardingData.puppyName || "Your Pup");

  // Journal data
  // Stable: select raw entries + memoize grouping
  const journalEntries = useJournalStore((s) => s.entries);
  const monthGroups = useMemo(() => {
    const filtered = filter === "all"
      ? journalEntries
      : filter === "photos"
        ? journalEntries.filter((e) => e.photos && e.photos.length > 0)
        : journalEntries.filter((e) => e.type === filter);
    const groups: Record<string, typeof filtered> = {};
    for (const entry of filtered) {
      const key = entry.date.slice(0, 7); // "YYYY-MM"
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    }
    return Object.entries(groups)
      .map(([month, entries]) => ({ month, entries }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [journalEntries, filter]);
  const entryCount = useJournalStore((s) => s.entries.length);
  const allEntries = useJournalStore((s) => s.entries);
  const photoCount = useMemo(
    () => allEntries.filter((e) => e.photos && e.photos.length > 0).length,
    [allEntries]
  );
  const togglePin = useJournalStore((s) => s.togglePin);
  const deleteEntry = useJournalStore((s) => s.deleteEntry);
  const hideEntry = useJournalStore((s) => s.hideEntry);

  // Filter counts
  const allCount = useJournalStore((s) => s.entries.length);
  const photosCount = useMemo(
    () => allEntries.filter((e) => e.photos && e.photos.length > 0).length,
    [allEntries]
  );
  const milestonesCount = useMemo(
    () => allEntries.filter((e) => e.type === "milestones").length,
    [allEntries]
  );

  const handleEntryPress = useCallback(
    (entry: JournalEntry) => {
      // TODO: open entry detail / photo gallery
    },
    []
  );

  const handleEntryLongPress = useCallback(
    (entry: JournalEntry) => {
      const actions: { text: string; onPress: () => void; style?: "destructive" | "cancel" }[] = [];

      // Pin / Unpin
      actions.push({
        text: entry.isPinned ? "Unpin" : "📌 Pin",
        onPress: () => togglePin(entry.id),
      });

      if (entry.source === "user") {
        // Delete manual entry
        actions.push({
          text: "🗑️ Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Delete Memory",
              "Are you sure you want to delete this entry?",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteEntry(entry.id) },
              ]
            );
          },
        });
      } else {
        // Hide auto entry
        actions.push({
          text: "👁️ Hide",
          onPress: () => hideEntry(entry.id),
        });
      }

      actions.push({ text: "Cancel", style: "cancel", onPress: () => {} });

      Alert.alert(entry.title, undefined, actions);
    },
    [togglePin, deleteEntry, hideEntry]
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Header ── */}
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
          className="px-xl mb-sm"
        >
          <Typography variant="h1">📖 {dogName}'s Journal</Typography>
          <Typography variant="body" color="secondary">
            {entryCount} {entryCount === 1 ? "memory" : "memories"}
            {photoCount > 0 ? ` · ${photoCount} photo${photoCount !== 1 ? "s" : ""}` : ""}
          </Typography>
        </Animated.View>

        {/* ── Filter Tabs ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(60)}
          className="px-xl"
        >
          <FilterTabs
            active={filter}
            onChange={setFilter}
            counts={{
              all: allCount,
              photos: photosCount,
              milestones: milestonesCount,
            }}
          />
        </Animated.View>

        {/* ── Timeline ── */}
        {monthGroups.length === 0 ? (
          <Animated.View
            entering={FadeInDown.duration(400).delay(120)}
            className="px-xl"
          >
            <Card className="items-center py-3xl">
              <Typography className="text-[48px] mb-base">📖</Typography>
              <Typography variant="h3" className="text-center mb-sm">
                {dogName}'s story starts here
              </Typography>
              <Typography
                variant="body-sm"
                color="secondary"
                className="text-center mb-lg px-lg"
              >
                Add photos and notes to capture {dogName}'s growth. Training
                milestones and achievements will appear here automatically!
              </Typography>
              <Pressable
                onPress={() =>
                  isPremium
                    ? router.push("/journal/add")
                    : router.push({ pathname: "/paywall", params: { trigger: "feature_gate_journal", source: "journal_add" } })
                }
                className="bg-primary px-xl py-md rounded-full"
              >
                <Typography variant="body-medium" color="inverse" className="text-text-inverse">
                  {isPremium ? "+ Add First Memory" : "🔒 Unlock Journal"}
                </Typography>
              </Pressable>
            </Card>
          </Animated.View>
        ) : (
          <View className="px-xl">
            {monthGroups.map((group, gi) => (
              <Animated.View
                key={`${group.year}-${group.month}`}
                entering={FadeInDown.duration(350).delay(100 + gi * 40)}
              >
                {/* Month header */}
                <MonthHeader
                  label={group.label}
                  entryCount={group.entries.length}
                />

                {/* Entries for this month */}
                <View className="gap-base mb-lg">
                  {group.entries.map((entry, ei) => (
                    <JournalEntryCard
                      key={entry.id}
                      entry={entry}
                      index={ei}
                      onPress={handleEntryPress}
                      onLongPress={handleEntryLongPress}
                    />
                  ))}
                </View>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Bottom spacer */}
        <View className="h-[40px]" />
      </ScrollView>

      {/* ── FAB ── */}
      <AddEntryFAB onPress={() =>
        isPremium
          ? router.push("/journal/add")
          : router.push({ pathname: "/paywall", params: { trigger: "feature_gate_journal", source: "journal_fab" } })
      } />
    </SafeAreaView>
  );
}
