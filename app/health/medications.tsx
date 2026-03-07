import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Typography, Card, Button } from "@/components/ui";
import { MedicationCard, ReminderPicker, scheduleReminder, type ReminderOption } from "@/components/health";
import { useHealthStore } from "@/stores/healthStore";
import { useDogStore } from "@/stores/dogStore";
import { useTrainingStore } from "@/stores/trainingStore";
import {
  MEDICATION_CATEGORY_META,
  type MedicationCategory,
  type MedicationFrequency,
  type Medication,
} from "@/types/health";

/**
 * Medication Tracker Screen, PRD-05 §5
 */

export default function MedicationsScreen() {
  const router = useRouter();

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

  // Stable: select raw data + memoize filter (prevents render loops)
  const medicationEntries = useHealthStore((s) => s.medications);
  const medications = useMemo(
    () => medicationEntries.filter((m) => m.dogId === dogId),
    [medicationEntries, dogId]
  );
  const addMedication = useHealthStore((s) => s.addMedication);
  const logMedicationDose = useHealthStore((s) => s.logMedicationDose);
  const deactivateMedication = useHealthStore((s) => s.deactivateMedication);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<MedicationCategory>("flea_tick");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] =
    useState<MedicationFrequency>("monthly");
  const [notes, setNotes] = useState("");
  const [reminder, setReminder] = useState<ReminderOption>("none");

  const activeMeds = useMemo(
    () => medications.filter((m) => m.active),
    [medications]
  );
  const inactiveMeds = useMemo(
    () => medications.filter((m) => !m.active),
    [medications]
  );

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      Alert.alert("Name Required", "Please enter the medication name.");
      return;
    }
    addMedication({
      dogId,
      name: name.trim(),
      category,
      dosage: dosage.trim() || undefined,
      frequency,
      startDate: new Date().toISOString().split("T")[0]!,
      notes: notes.trim() || undefined,
    });
    // Schedule reminder if selected and frequency provides a next-due
    if (reminder !== "none") {
      const nextDue = new Date();
      switch (frequency) {
        case "daily": nextDue.setDate(nextDue.getDate() + 1); break;
        case "weekly": nextDue.setDate(nextDue.getDate() + 7); break;
        case "biweekly": nextDue.setDate(nextDue.getDate() + 14); break;
        case "monthly": nextDue.setMonth(nextDue.getMonth() + 1); break;
        case "quarterly": nextDue.setMonth(nextDue.getMonth() + 3); break;
        default: break;
      }
      scheduleReminder({
        title: `💊 ${name.trim()} due`,
        body: `Time for ${dogName}'s ${name.trim()}`,
        dueDate: nextDue,
        reminderOption: reminder,
      }).catch(() => {}); // Best effort
    }

    setName("");
    setDosage("");
    setNotes("");
    setReminder("none");
    setShowForm(false);
    Alert.alert("Added!", `${name.trim()} added to ${dogName}'s medications.${reminder !== "none" ? " Reminder set! 🔔" : ""}`);
  }, [name, category, dosage, frequency, notes, reminder, dogId, dogName, addMedication]);

  const handleLogDose = useCallback(
    (med: Medication) => {
      logMedicationDose(med.id, dogId);
      Alert.alert("Logged!", `${med.name} dose recorded. +3 XP 🎉`);
    },
    [logMedicationDose, dogId]
  );

  const handleMedPress = useCallback(
    (med: Medication) => {
      Alert.alert(med.name, `Category: ${MEDICATION_CATEGORY_META[med.category].label}\nFrequency: ${med.frequency}\nDosage: ${med.dosage ?? "N/A"}\n${med.notes ? `Notes: ${med.notes}` : ""}`, [
        { text: "Close" },
        med.active
          ? {
              text: "Deactivate",
              style: "destructive",
              onPress: () => deactivateMedication(med.id),
            }
          : { text: "OK" },
      ]);
    },
    [deactivateMedication]
  );

  const FREQUENCIES: { key: MedicationFrequency; label: string }[] = [
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "biweekly", label: "Bi-weekly" },
    { key: "monthly", label: "Monthly" },
    { key: "quarterly", label: "Quarterly" },
    { key: "as_needed", label: "As Needed" },
    { key: "one_time", label: "One Time" },
  ];

  const CATEGORIES = Object.entries(MEDICATION_CATEGORY_META) as [
    MedicationCategory,
    { label: string; icon: string },
  ][];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
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
          <View className="flex-row items-center justify-between gap-sm">
            <View className="flex-1 flex-shrink">
              <Typography variant="h1">💊 Medications</Typography>
              <Typography variant="body" color="secondary" numberOfLines={1}>
                {dogName}'s medication tracker
              </Typography>
            </View>
            <View className="flex-shrink-0">
              <Button
                label="+ Add"
                variant="primary"
                size="sm"
                fullWidth={false}
                onPress={() => setShowForm(true)}
              />
            </View>
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
                Add Medication
              </Typography>

              {/* Name */}
              <Typography variant="caption" color="secondary" className="mb-xs">
                Medication Name*
              </Typography>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Heartgard Plus"
                className="bg-surface border border-border rounded-xl px-base py-md mb-base text-[14px]"
                style={{ fontFamily: "PlusJakartaSans-Medium" }}
                placeholderTextColor="#9CA3AF"
              />

              {/* Category */}
              <Typography variant="caption" color="secondary" className="mb-xs">
                Category
              </Typography>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-base">
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
                      <Typography className="text-[12px]">{meta.icon}</Typography>
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

              {/* Dosage */}
              <Typography variant="caption" color="secondary" className="mb-xs">
                Dosage (optional)
              </Typography>
              <TextInput
                value={dosage}
                onChangeText={setDosage}
                placeholder="e.g. 68-136 mcg"
                className="bg-surface border border-border rounded-xl px-base py-md mb-base text-[14px]"
                style={{ fontFamily: "PlusJakartaSans-Regular" }}
                placeholderTextColor="#9CA3AF"
              />

              {/* Frequency */}
              <Typography variant="caption" color="secondary" className="mb-xs">
                Frequency
              </Typography>
              <View className="flex-row flex-wrap gap-sm mb-base">
                {FREQUENCIES.map((f) => (
                  <Pressable
                    key={f.key}
                    onPress={() => setFrequency(f.key)}
                    className={`px-md py-sm rounded-full ${
                      frequency === f.key
                        ? "bg-primary"
                        : "bg-surface border border-border"
                    }`}
                  >
                    <Typography
                      variant="caption"
                      color={frequency === f.key ? "inverse" : "secondary"}
                    >
                      {f.label}
                    </Typography>
                  </Pressable>
                ))}
              </View>

              {/* Reminder */}
              <ReminderPicker
                selected={reminder}
                onSelect={setReminder}
                label="Set Reminder"
              />

              {/* Notes */}
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Notes (optional)"
                className="bg-surface border border-border rounded-xl px-base py-md mb-base text-[14px]"
                style={{ fontFamily: "PlusJakartaSans-Regular" }}
                placeholderTextColor="#9CA3AF"
                multiline
              />

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
                    label="Add Medication"
                    variant="primary"
                    fullWidth
                    onPress={handleSave}
                  />
                </View>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Active medications */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(60)}
          className="px-xl mb-lg"
        >
          {activeMeds.length > 0 ? (
            <>
              <Typography variant="h3" className="mb-sm">
                Active ({activeMeds.length})
              </Typography>
              {activeMeds.map((med) => (
                <MedicationCard
                  key={med.id}
                  medication={med}
                  onLogDose={handleLogDose}
                  onPress={handleMedPress}
                />
              ))}
            </>
          ) : (
            !showForm && (
              <Card className="items-center py-xl">
                <Typography className="text-[40px] mb-sm">💊</Typography>
                <Typography variant="body-medium" className="mb-xs">
                  No medications yet
                </Typography>
                <Typography
                  variant="body-sm"
                  color="secondary"
                  className="text-center mb-base"
                >
                  Add flea/tick preventatives, heartworm meds, supplements, and
                  more.
                </Typography>
                <Button
                  label="Add First Medication"
                  variant="primary"
                  onPress={() => setShowForm(true)}
                />
              </Card>
            )
          )}
        </Animated.View>

        {/* Inactive medications */}
        {inactiveMeds.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(120)}
            className="px-xl mb-xl"
          >
            <Typography variant="h3" color="tertiary" className="mb-sm">
              Past ({inactiveMeds.length})
            </Typography>
            {inactiveMeds.map((med) => (
              <MedicationCard
                key={med.id}
                medication={med}
                onLogDose={handleLogDose}
                onPress={handleMedPress}
              />
            ))}
          </Animated.View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
