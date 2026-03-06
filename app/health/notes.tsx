import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useSubscription } from "@/hooks/useSubscription";
import { Typography, Card, Button, Badge } from "@/components/ui";
import { useHealthStore } from "@/stores/healthStore";
import { useDogStore } from "@/stores/dogStore";
import { useTrainingStore } from "@/stores/trainingStore";
import {
  NOTE_CATEGORY_META,
  NOTE_SEVERITY_META,
  type HealthNoteCategory,
  type HealthNoteSeverity,
  type HealthNote,
} from "@/types/health";

/**
 * Health Notes Screen, PRD-05 §9
 */

export default function HealthNotesScreen() {
  const router = useRouter();
  const { isPremium } = useSubscription();

  // PRD-07: Gate premium content (inline, no redirect, prevents render loops)
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

  // Stable: select raw data + memoize filter/sort
  const healthNoteEntries = useHealthStore((s) => s.healthNotes);
  const allNotes = useMemo(
    () => healthNoteEntries
      .filter((n) => n.dogId === dogId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [healthNoteEntries, dogId]
  );
  const addHealthNote = useHealthStore((s) => s.addHealthNote);
  const resolveHealthNote = useHealthStore((s) => s.resolveHealthNote);
  const deleteHealthNote = useHealthStore((s) => s.deleteHealthNote);

  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [category, setCategory] =
    useState<HealthNoteCategory>("observation");
  const [severity, setSeverity] = useState<HealthNoteSeverity>("info");
  const [filter, setFilter] = useState<"active" | "resolved" | "all">(
    "active"
  );

  const filtered = useMemo(() => {
    if (filter === "active") return allNotes.filter((n) => !n.resolved);
    if (filter === "resolved") return allNotes.filter((n) => n.resolved);
    return allNotes;
  }, [allNotes, filter]);

  const handleSave = useCallback(() => {
    if (!content.trim()) {
      Alert.alert("Content Required", "Please enter your health note.");
      return;
    }
    addHealthNote({
      dogId,
      content: content.trim(),
      category,
      severity,
    });
    setContent("");
    setShowForm(false);
    Alert.alert("Noted! 📝", "Health observation saved.");
  }, [content, category, severity, dogId, addHealthNote]);

  const handleNoteAction = useCallback(
    (note: HealthNote) => {
      const actions: { text: string; onPress?: () => void; style?: "cancel" | "destructive" }[] =
        [{ text: "Close", style: "cancel" }];

      if (!note.resolved) {
        actions.push({
          text: "✅ Resolve",
          onPress: () => resolveHealthNote(note.id),
        });
      }

      actions.push({
        text: "🗑 Delete",
        style: "destructive",
        onPress: () => {
          Alert.alert("Delete Note?", "This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => deleteHealthNote(note.id),
            },
          ]);
        },
      });

      Alert.alert(
        `${NOTE_CATEGORY_META[note.category].icon} ${NOTE_CATEGORY_META[note.category].label}`,
        note.content,
        actions
      );
    },
    [resolveHealthNote, deleteHealthNote]
  );

  const CATEGORIES = Object.entries(NOTE_CATEGORY_META) as [
    HealthNoteCategory,
    { label: string; icon: string },
  ][];

  const SEVERITIES = Object.entries(NOTE_SEVERITY_META) as [
    HealthNoteSeverity,
    { label: string; color: string; bgColor: string },
  ][];

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
          <View className="flex-row items-center justify-between">
            <View>
              <Typography variant="h1">📝 Health Notes</Typography>
              <Typography variant="body" color="secondary">
                Track observations & concerns
              </Typography>
            </View>
            <Button
              label="+ Note"
              variant="primary"
              size="sm"
              onPress={() => setShowForm(true)}
            />
          </View>
        </Animated.View>

        {/* Add form */}
        {showForm && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            className="px-xl mb-lg"
          >
            <Card className="bg-primary-extralight border border-primary/20">
              <Typography variant="h3" className="mb-base">
                New Health Note
              </Typography>

              {/* Content */}
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder={`What are you noticing about ${dogName}?`}
                className="bg-surface border border-border rounded-xl px-base py-md mb-base text-[14px]"
                style={{
                  fontFamily: "PlusJakartaSans-Regular",
                  minHeight: 80,
                  textAlignVertical: "top",
                }}
                placeholderTextColor="#9CA3AF"
                multiline
              />

              {/* Category */}
              <Typography variant="caption" color="secondary" className="mb-xs">
                Category
              </Typography>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-base"
              >
                <View className="flex-row gap-sm">
                  {CATEGORIES.map(([key, meta]) => (
                    <Pressable
                      key={key}
                      onPress={() => setCategory(key)}
                      className={`px-md py-sm rounded-full flex-row items-center gap-xs ${
                        category === key
                          ? "bg-primary"
                          : "bg-surface border border-border"
                      }`}
                    >
                      <Typography className="text-[12px]">
                        {meta.icon}
                      </Typography>
                      <Typography
                        variant="caption"
                        color={category === key ? "inverse" : "secondary"}
                      >
                        {meta.label}
                      </Typography>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              {/* Severity */}
              <Typography variant="caption" color="secondary" className="mb-xs">
                Severity
              </Typography>
              <View className="flex-row gap-sm mb-base">
                {SEVERITIES.map(([key, meta]) => (
                  <Pressable
                    key={key}
                    onPress={() => setSeverity(key)}
                    className="flex-1 py-sm items-center rounded-xl"
                    style={{
                      backgroundColor:
                        severity === key ? meta.bgColor : "#F9F5F0",
                      borderWidth: severity === key ? 1.5 : 1,
                      borderColor:
                        severity === key ? meta.color : "#E5DDD5",
                    }}
                  >
                    <Typography
                      variant="caption"
                      style={{
                        color: severity === key ? meta.color : "#9CA3AF",
                        fontWeight: severity === key ? "600" : "400",
                      }}
                    >
                      {meta.label}
                    </Typography>
                  </Pressable>
                ))}
              </View>

              {/* Actions */}
              <View className="flex-row gap-sm">
                <Pressable
                  onPress={() => setShowForm(false)}
                  className="flex-1 py-md items-center rounded-xl bg-surface border border-border"
                >
                  <Typography variant="body-sm-medium" color="secondary">
                    Cancel
                  </Typography>
                </Pressable>
                <View className="flex-1">
                  <Button
                    label="Save Note"
                    variant="primary"
                    fullWidth
                    onPress={handleSave}
                  />
                </View>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Filter pills */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(60)}
          className="px-xl mb-lg"
        >
          <View className="flex-row gap-sm">
            {(
              [
                { key: "active", label: "Active" },
                { key: "resolved", label: "Resolved" },
                { key: "all", label: "All" },
              ] as const
            ).map((f) => (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                className={`px-lg py-sm rounded-full ${
                  filter === f.key
                    ? "bg-primary"
                    : "bg-surface border border-border"
                }`}
              >
                <Typography
                  variant="body-sm-medium"
                  color={filter === f.key ? "inverse" : "secondary"}
                >
                  {f.label}
                </Typography>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Notes list */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(120)}
          className="px-xl"
        >
          {filtered.length > 0 ? (
            filtered.map((note) => {
              const catMeta = NOTE_CATEGORY_META[note.category];
              const sevMeta = NOTE_SEVERITY_META[note.severity];
              return (
                <Pressable
                  key={note.id}
                  onPress={() => handleNoteAction(note)}
                >
                  <Card className="mb-sm">
                    <View className="flex-row items-start gap-md">
                      <View
                        className="w-[6px] h-[6px] rounded-full mt-[8px]"
                        style={{ backgroundColor: sevMeta.color }}
                      />
                      <View className="flex-1">
                        <Typography
                          variant="body-sm"
                          style={{
                            textDecorationLine: note.resolved
                              ? "line-through"
                              : "none",
                            opacity: note.resolved ? 0.5 : 1,
                          }}
                        >
                          {note.content}
                        </Typography>
                        <View className="flex-row items-center gap-sm mt-sm">
                          <Badge
                            variant="neutral"
                            label={`${catMeta.icon} ${catMeta.label}`}
                            size="sm"
                          />
                          <Typography variant="caption" color="tertiary">
                            {new Date(note.createdAt).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )}
                          </Typography>
                          {note.resolved && (
                            <Typography variant="caption" color="tertiary">
                              ✅ resolved
                            </Typography>
                          )}
                        </View>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              );
            })
          ) : (
            !showForm && (
              <Card className="items-center py-xl">
                <Typography className="text-[40px] mb-sm">📝</Typography>
                <Typography variant="body-medium" className="mb-xs">
                  No {filter === "all" ? "" : filter} notes
                </Typography>
                <Typography
                  variant="body-sm"
                  color="secondary"
                  className="text-center mb-base"
                >
                  Jot down anything, behavior changes, diet notes, skin
                  observations, etc.
                </Typography>
                <Button
                  label="Add Note"
                  variant="primary"
                  onPress={() => setShowForm(true)}
                />
              </Card>
            )
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
