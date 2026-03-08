import React, { useMemo, useState, useCallback } from "react";
import { View, ScrollView, Pressable, Image, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Typography, Card, Button, Badge } from "@/components/ui";
import { useDogStore } from "@/stores/dogStore";
import { useTrainingStore } from "@/stores/trainingStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useHealthStore } from "@/stores/healthStore";
import { extractVaccinesFromPhotos, type ExtractedVaccine } from "@/lib/vaccineExtract";
import { matchExtractedVaccines, type MatchedVaccine } from "@/lib/vaccineMatch";
import { COLORS } from "@/constants/theme";

/**
 * Vaccine Upload Screen
 *
 * Multi-photo upload flow that uses Claude vision to extract
 * vaccination data from vet records. Shows a confirmation screen
 * before saving.
 */

const MAX_PHOTOS = 5;

export default function VaccineUploadScreen() {
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

  // State
  const [photos, setPhotos] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [matchedVaccines, setMatchedVaccines] = useState<MatchedVaccine[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [extractionNotes, setExtractionNotes] = useState<string>("");
  const [confidence, setConfidence] = useState<string>("high");

  const dob = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - ageWeeks * 7);
    return d;
  }, [ageWeeks]);

  // ── Photo picking ──
  const pickPhoto = useCallback(async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert("Limit reached", `You can upload up to ${MAX_PHOTOS} photos.`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newUris = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...newUris].slice(0, MAX_PHOTOS));
    }
  }, [photos.length]);

  const takePhoto = useCallback(async () => {
    if (photos.length >= MAX_PHOTOS) return;

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera access is needed to take photos of your records.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => [...prev, result.assets[0]!.uri].slice(0, MAX_PHOTOS));
    }
  }, [photos.length]);

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── Extraction ──
  const handleExtract = useCallback(async () => {
    if (photos.length === 0) return;

    setIsExtracting(true);
    try {
      const result = await extractVaccinesFromPhotos(photos);

      // HEALTH-02: handle empty or unreadable results with a friendly message
      // HEALTH-02: treat result as unreadable if no vaccines or all have empty name+date
      const hasNoMeaningfulData =
        !result ||
        result.vaccines.length === 0 ||
        result.vaccines.every((v) => !v.name && !v.date);

      if (hasNoMeaningfulData) {
        Alert.alert(
          "Couldn't read this record",
          "We couldn't read this record automatically. Please enter the details manually.",
          [
            { text: "Try Again", style: "cancel" },
            {
              text: "Enter Manually",
              onPress: () => router.replace("/health/vaccine-manual"),
            },
          ],
        );
        setIsExtracting(false);
        return;
      }

      // Match extracted vaccines against our templates
      const matched = matchExtractedVaccines(result.vaccines, dob);
      setMatchedVaccines(matched);
      setExtractionNotes(result.notes);
      setConfidence(result.confidence);

      // Select all by default
      setSelectedIds(new Set(matched.map((m) => `${m.vaccineKey}-${m.doseNumber}`)));
    } catch (err) {
      console.error("[VaccineUpload] Extraction error:", err);
      Alert.alert("Something went wrong", "Please try again or enter vaccines manually.");
    }
    setIsExtracting(false);
  }, [photos, dob, router]);

  // ── Toggle selection ──
  const toggleVaccine = useCallback((key: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // ── Save ──
  const handleSave = useCallback(() => {
    if (!matchedVaccines) return;

    const selected = matchedVaccines.filter((m) =>
      selectedIds.has(`${m.vaccineKey}-${m.doseNumber}`),
    );

    completeVaccinationSetup({
      method: "upload",
      completedVaccines: selected.map((m) => ({
        vaccineKey: m.vaccineKey,
        doseNumber: m.doseNumber,
        completedAt: m.completedAt,
        vetName: m.vetName,
      })),
      dogId,
      dateOfBirth: dob,
      ageWeeks,
      breed,
    });

    router.replace("/health/vaccinations");
  }, [matchedVaccines, selectedIds, completeVaccinationSetup, dogId, dob, ageWeeks, breed, router]);

  // ── Render: Confirmation ──
  if (matchedVaccines) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <Pressable
            onPress={() => setMatchedVaccines(null)}
            className="px-xl pt-base pb-sm"
          >
            <Typography variant="body-medium" style={{ color: "#FF6B5C" }}>
              ← Retake Photos
            </Typography>
          </Pressable>

          <Animated.View
            entering={FadeInDown.duration(400)}
            className="px-xl mb-lg"
          >
            <Typography variant="h1">Confirm Vaccines</Typography>
            <Typography variant="body" color="secondary" className="mt-xs">
              We found {matchedVaccines.length} vaccine
              {matchedVaccines.length !== 1 ? "s" : ""} in your records.
              Uncheck anything that looks wrong.
            </Typography>
            {confidence !== "high" && (
              <View className="mt-sm">
                <Badge
                  variant={confidence === "medium" ? "warning" : "error"}
                  label={
                    confidence === "medium"
                      ? "⚠️ Some parts were hard to read"
                      : "⚠️ Low confidence, please double-check"
                  }
                />
              </View>
            )}
          </Animated.View>

          {/* Matched vaccines list */}
          <View className="px-xl">
            {matchedVaccines.map((vax, i) => {
              const key = `${vax.vaccineKey}-${vax.doseNumber}`;
              const isSelected = selectedIds.has(key);
              const dateStr = new Date(vax.completedAt).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric", year: "numeric" },
              );

              return (
                <Animated.View
                  key={key}
                  entering={FadeInDown.duration(300).delay(i * 60)}
                >
                  <Pressable onPress={() => toggleVaccine(key)}>
                    <Card
                      className="mb-sm flex-row items-center gap-md"
                      style={{
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? COLORS.success.DEFAULT : COLORS.border,
                      }}
                    >
                      <Typography className="text-[20px]">
                        {isSelected ? "✅" : "⬜"}
                      </Typography>
                      <View className="flex-1">
                        <Typography variant="body-medium">
                          {vax.matchedName} #{vax.doseNumber}
                        </Typography>
                        <Typography variant="caption" color="secondary">
                          {dateStr}
                          {vax.vetName ? ` · ${vax.vetName}` : ""}
                        </Typography>
                        {vax.originalName.toLowerCase() !==
                          vax.matchedName.toLowerCase() && (
                          <Typography
                            variant="caption"
                            color="tertiary"
                            className="mt-xs"
                          >
                            Read as: "{vax.originalName}"
                          </Typography>
                        )}
                      </View>
                    </Card>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          {extractionNotes ? (
            <View className="px-xl mt-sm mb-lg">
              <Typography variant="caption" color="tertiary">
                📝 {extractionNotes}
              </Typography>
            </View>
          ) : null}

          {/* Save */}
          <View className="px-xl mt-lg">
            <Button
              label={`Save ${selectedIds.size} Vaccine${selectedIds.size !== 1 ? "s" : ""}`}
              onPress={handleSave}
              variant="primary"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Render: Photo selection ──
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
          <Typography variant="h1">📸 Upload Vet Records</Typography>
          <Typography variant="body" color="secondary" className="mt-xs">
            Take photos of {dogName}'s vaccination card, vet booklet, or
            any documents showing vaccine dates. We'll read them
            automatically.
          </Typography>
        </Animated.View>

        {/* Photo grid */}
        <View className="px-xl mb-lg">
          <View className="flex-row flex-wrap gap-md">
            {photos.map((uri, i) => (
              <Animated.View
                key={`${uri}-${i}`}
                entering={FadeIn.duration(300)}
              >
                <Pressable
                  onPress={() => removePhoto(i)}
                  className="relative"
                >
                  <Image
                    source={{ uri }}
                    className="w-[100px] h-[100px] rounded-xl"
                    resizeMode="cover"
                  />
                  <View
                    className="absolute -top-[6px] -right-[6px] w-[22px] h-[22px] rounded-full items-center justify-center"
                    style={{ backgroundColor: COLORS.error.DEFAULT }}
                  >
                    <Typography
                      style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}
                    >
                      ✕
                    </Typography>
                  </View>
                </Pressable>
              </Animated.View>
            ))}

            {/* Add photo button */}
            {photos.length < MAX_PHOTOS && (
              <Pressable
                onPress={() => {
                  Alert.alert("Add Photo", "Choose a source", [
                    { text: "Camera", onPress: takePhoto },
                    { text: "Photo Library", onPress: pickPhoto },
                    { text: "Cancel", style: "cancel" },
                  ]);
                }}
                className="w-[100px] h-[100px] rounded-xl border-2 border-dashed items-center justify-center"
                style={{ borderColor: COLORS.border }}
              >
                <Typography className="text-[24px] mb-xs">+</Typography>
                <Typography variant="caption" color="tertiary">
                  Add
                </Typography>
              </Pressable>
            )}
          </View>

          <Typography variant="caption" color="tertiary" className="mt-sm">
            Up to {MAX_PHOTOS} photos. Tap a photo to remove it.
          </Typography>
        </View>

        {/* Tips */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          className="px-xl mb-lg"
        >
          <Card>
            <Typography variant="body-sm-medium" className="mb-sm">
              📋 Tips for best results
            </Typography>
            <Typography variant="caption" color="secondary">
              • Make sure vaccine names and dates are visible{"\n"}
              • Flat, well-lit surface works best{"\n"}
              • Include front and back of vaccination cards{"\n"}
              • Handwritten records work too
            </Typography>
          </Card>
        </Animated.View>

        {/* Scan button */}
        <View className="px-xl">
          {isExtracting ? (
            <View className="items-center py-xl">
              <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
              <Typography
                variant="body-medium"
                color="secondary"
                className="mt-md"
              >
                Reading your records...
              </Typography>
              <Typography variant="caption" color="tertiary" className="mt-xs">
                This usually takes 10-20 seconds
              </Typography>
            </View>
          ) : (
            <Button
              label={`Scan ${photos.length} Photo${photos.length !== 1 ? "s" : ""}`}
              onPress={handleExtract}
              variant="primary"
              disabled={photos.length === 0}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
