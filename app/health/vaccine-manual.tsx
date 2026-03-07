import React, { useMemo, useState, useCallback } from "react";
import { View, ScrollView, Pressable, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Typography, Card, Button } from "@/components/ui";
import { useDogStore } from "@/stores/dogStore";
import { useTrainingStore } from "@/stores/trainingStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useHealthStore } from "@/stores/healthStore";
import {
  CORE_VACCINES,
  NON_CORE_VACCINES,
} from "@/data/vaccinationSchedule";
import { COLORS } from "@/constants/theme";
import type { VaccineTemplate } from "@/types/health";

/**
 * Manual Vaccine Entry Screen
 *
 * Core vaccines shown by default. Non-core hidden behind an
 * expandable "Add more vaccines" section. Each vaccine can
 * be toggled on/off and assigned a completion date per dose.
 */

interface DoseEntry {
  vaccineKey: string;
  doseNumber: number;
  completedAt: string; // ISO date
}

export default function VaccineManualScreen() {
  const router = useRouter();

  const activeDogId = useDogStore((s) => s.activeDogId);
  const dogs = useDogStore((s) => s.dogs);
  const dog = useMemo(
    () => dogs.find((d) => d.id === activeDogId) ?? null,
    [dogs, activeDogId],
  );
  const plan = useTrainingStore((s) => s.plan);
  const onboardingData = useOnboardingStore((s) => s.data);
  const dogName =
    dog?.name ?? plan?.dogName ?? onboardingData.puppyName ?? "Your Pup";
  const dogId = dog?.id ?? plan?.dogName ?? "default-dog";
  const breed = dog?.breed ?? plan?.breed ?? onboardingData.breed ?? null;
  const ageMonths = onboardingData.ageMonths ?? 3;
  const ageWeeks = ageMonths * 4;

  const completeVaccinationSetup = useHealthStore(
    (s) => s.completeVaccinationSetup,
  );

  const dob = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - ageWeeks * 7);
    return d;
  }, [ageWeeks]);

  // State
  const [completedDoses, setCompletedDoses] = useState<DoseEntry[]>([]);
  const [showNonCore, setShowNonCore] = useState(false);
  const [datePicker, setDatePicker] = useState<{
    vaccineKey: string;
    doseNumber: number;
    visible: boolean;
  } | null>(null);

  // Toggle a dose: add or remove it
  const toggleDose = useCallback(
    (vaccineKey: string, doseNumber: number) => {
      setCompletedDoses((prev) => {
        const exists = prev.find(
          (d) => d.vaccineKey === vaccineKey && d.doseNumber === doseNumber,
        );
        if (exists) {
          return prev.filter(
            (d) =>
              !(d.vaccineKey === vaccineKey && d.doseNumber === doseNumber),
          );
        }
        // Default date: today
        return [
          ...prev,
          {
            vaccineKey,
            doseNumber,
            completedAt: new Date().toISOString().split("T")[0]!,
          },
        ];
      });
    },
    [],
  );

  // Update the date for a completed dose
  const updateDoseDate = useCallback(
    (vaccineKey: string, doseNumber: number, date: string) => {
      setCompletedDoses((prev) =>
        prev.map((d) =>
          d.vaccineKey === vaccineKey && d.doseNumber === doseNumber
            ? { ...d, completedAt: date }
            : d,
        ),
      );
    },
    [],
  );

  const handleDateChange = useCallback(
    (_: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === "android") setDatePicker(null);
      if (selectedDate && datePicker) {
        updateDoseDate(
          datePicker.vaccineKey,
          datePicker.doseNumber,
          selectedDate.toISOString().split("T")[0]!,
        );
      }
    },
    [datePicker, updateDoseDate],
  );

  // Save
  const handleSave = useCallback(() => {
    completeVaccinationSetup({
      method: "manual",
      completedVaccines: completedDoses,
      dogId,
      dateOfBirth: dob,
      ageWeeks,
      breed,
    });

    router.replace("/health/vaccinations");
  }, [completedDoses, completeVaccinationSetup, dogId, dob, ageWeeks, breed, router]);

  // Helper to render a vaccine section
  const renderVaccineGroup = (
    vaccines: readonly VaccineTemplate[],
    label: string,
    delay: number,
  ) => (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay)}
      className="mb-lg"
    >
      <Typography
        variant="body-sm-medium"
        color="secondary"
        className="px-xl mb-sm uppercase"
      >
        {label}
      </Typography>

      {vaccines.map((vaccine) => {
        const isMultiDose = vaccine.doses.length > 1;

        return (
          <View key={vaccine.key} className="px-xl mb-sm">
            <Card>
              <View className="flex-row items-center gap-sm mb-sm">
                <Typography variant="body-medium">
                  {vaccine.name}
                </Typography>
                {vaccine.core && (
                  <Typography
                    variant="caption"
                    style={{
                      color: COLORS.primary.DEFAULT,
                      fontSize: 10,
                      fontWeight: "600",
                    }}
                  >
                    CORE
                  </Typography>
                )}
              </View>

              {/* Each dose */}
              {vaccine.doses.map((dose) => {
                const entry = completedDoses.find(
                  (d) =>
                    d.vaccineKey === vaccine.key &&
                    d.doseNumber === dose.doseNumber,
                );
                const isChecked = !!entry;

                return (
                  <View
                    key={`${vaccine.key}-${dose.doseNumber}`}
                    className="flex-row items-center gap-sm py-sm"
                    style={{
                      borderTopWidth: dose.doseNumber > 1 ? 1 : 0,
                      borderTopColor: COLORS.border,
                    }}
                  >
                    <Pressable
                      onPress={() =>
                        toggleDose(vaccine.key, dose.doseNumber)
                      }
                      hitSlop={8}
                    >
                      <Typography className="text-[18px]">
                        {isChecked ? "✅" : "⬜"}
                      </Typography>
                    </Pressable>

                    <View className="flex-1">
                      <Typography variant="body-sm">
                        {isMultiDose
                          ? `Dose ${dose.doseNumber}`
                          : vaccine.name}
                      </Typography>
                      <Typography variant="caption" color="tertiary">
                        Due around {dose.ageWeeks} weeks
                      </Typography>
                    </View>

                    {/* Date selector when checked */}
                    {isChecked && entry && (
                      <Pressable
                        onPress={() =>
                          setDatePicker({
                            vaccineKey: vaccine.key,
                            doseNumber: dose.doseNumber,
                            visible: true,
                          })
                        }
                        className="px-sm py-xs rounded-lg"
                        style={{ backgroundColor: COLORS.primary.light }}
                      >
                        <Typography
                          variant="caption"
                          style={{
                            color: COLORS.primary.DEFAULT,
                            fontWeight: "600",
                          }}
                        >
                          {new Date(entry.completedAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" },
                          )}
                        </Typography>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </Card>
          </View>
        );
      })}
    </Animated.View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
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
          <Typography variant="h1">✏️ Enter Vaccines</Typography>
          <Typography variant="body" color="secondary" className="mt-xs">
            Tick each vaccine {dogName} has already had and pick the date. Don't
            worry if you're not sure of exact dates.
          </Typography>
        </Animated.View>

        {/* Core vaccines */}
        {renderVaccineGroup(CORE_VACCINES, "Core Vaccines", 100)}

        {/* Non-core expandable */}
        <View className="px-xl mb-md">
          <Pressable
            onPress={() => setShowNonCore((p) => !p)}
            className="flex-row items-center gap-sm py-md"
          >
            <Typography variant="body-medium" style={{ color: COLORS.primary.DEFAULT }}>
              {showNonCore ? "▾" : "▸"} Add more vaccines
            </Typography>
            <Typography variant="caption" color="tertiary">
              ({NON_CORE_VACCINES.length} optional)
            </Typography>
          </Pressable>
        </View>

        {showNonCore && renderVaccineGroup(NON_CORE_VACCINES, "Non-Core / Optional", 0)}

        {/* Save */}
        <View className="px-xl mt-md">
          <Button
            label={
              completedDoses.length > 0
                ? `Save ${completedDoses.length} Vaccine${completedDoses.length !== 1 ? "s" : ""}`
                : "Skip, None Done Yet"
            }
            onPress={handleSave}
            variant="primary"
          />
          <Typography
            variant="caption"
            color="tertiary"
            className="text-center mt-sm"
          >
            You can always add more later
          </Typography>
        </View>
      </ScrollView>

      {/* Date picker modal (iOS shows inline, Android shows dialog) */}
      {datePicker?.visible && (
        <>
          {Platform.OS === "ios" && (
            <View
              className="absolute bottom-0 left-0 right-0 bg-surface pt-md pb-xl px-xl"
              style={{
                borderTopWidth: 1,
                borderTopColor: COLORS.border,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
              }}
            >
              <View className="flex-row justify-between items-center mb-sm">
                <Typography variant="body-sm-medium">Pick date</Typography>
                <Pressable onPress={() => setDatePicker(null)}>
                  <Typography
                    variant="body-sm-medium"
                    style={{ color: COLORS.primary.DEFAULT }}
                  >
                    Done
                  </Typography>
                </Pressable>
              </View>
              <DateTimePicker
                value={
                  new Date(
                    completedDoses.find(
                      (d) =>
                        d.vaccineKey === datePicker.vaccineKey &&
                        d.doseNumber === datePicker.doseNumber,
                    )?.completedAt ?? new Date().toISOString(),
                  )
                }
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                minimumDate={dob}
                onChange={handleDateChange}
              />
            </View>
          )}
          {Platform.OS === "android" && (
            <DateTimePicker
              value={
                new Date(
                  completedDoses.find(
                    (d) =>
                      d.vaccineKey === datePicker.vaccineKey &&
                      d.doseNumber === datePicker.doseNumber,
                  )?.completedAt ?? new Date().toISOString(),
                )
              }
              mode="date"
              display="default"
              maximumDate={new Date()}
              minimumDate={dob}
              onChange={handleDateChange}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}
