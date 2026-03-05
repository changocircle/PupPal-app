import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Typography, Card, Button } from "@/components/ui";
import { useJournalStore } from "@/stores/journalStore";
import { useDogStore } from "@/stores/dogStore";
import { useTrainingStore } from "@/stores/trainingStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useSubscription } from "@/hooks/useSubscription";
import { useGamificationStore } from "@/stores/gamificationStore";
import { resolveDateOfBirth, calculateDogAgeLabel } from "@/types/journal";

/**
 * Add Journal Entry Screen — PRD-10 §4
 * Photo picker (1-5 photos), caption, date picker (backdating to DOB).
 * Toggle between photo mode and note mode.
 */

type EntryMode = "photo" | "note";

const MAX_PHOTOS = 5;

export default function AddEntryScreen() {
  const router = useRouter();
  const { isPremium } = useSubscription();

  // PRD-07: Redirect free users to paywall
  React.useEffect(() => {
    if (!isPremium) {
      router.replace({ pathname: "/paywall", params: { trigger: "feature_gate_journal", source: "journal_add" } });
    }
  }, [isPremium]);

  // Dog context
  const dog = useDogStore((s) => s.activeDog());
  const plan = useTrainingStore((s) => s.plan);
  const onboardingData = useOnboardingStore((s) => s.data);
  const dogName = dog?.name ?? plan?.dogName ?? (onboardingData.puppyName || "Your Pup");
  const dogId = dog?.id ?? plan?.dogName ?? "default-dog";

  const dob = useMemo(
    () =>
      resolveDateOfBirth({
        dogDateOfBirth: dog?.date_of_birth,
        onboardingDateOfBirth: onboardingData.dateOfBirth,
        onboardingAgeMonths: onboardingData.ageMonths,
      }),
    [dog, onboardingData]
  );

  // Store
  const addManualEntry = useJournalStore((s) => s.addManualEntry);
  const earnXp = useGamificationStore((s) => s.earnXp);

  // Form state
  const [mode, setMode] = useState<EntryMode>("photo");
  const [photos, setPhotos] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [noteText, setNoteText] = useState("");
  const [entryDate, setEntryDate] = useState(() => {
    return new Date().toISOString().split("T")[0]!;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Computed age label for selected date
  const ageLabel = useMemo(
    () => calculateDogAgeLabel(dob, entryDate),
    [dob, entryDate]
  );

  // ── Photo picking ──
  const pickPhotos = useCallback(async () => {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      Alert.alert("Limit Reached", `Maximum ${MAX_PHOTOS} photos per entry.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Needed",
        "Please allow access to your photo library to add photos."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newUris = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...newUris].slice(0, MAX_PHOTOS));
    }
  }, [photos.length]);

  const takePhoto = useCallback(async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert("Limit Reached", `Maximum ${MAX_PHOTOS} photos per entry.`);
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Needed", "Please allow camera access to take photos.");
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

  // ── Date editing (simple text-based for now) ──
  const handleDateChange = useCallback(
    (text: string) => {
      // Validate format YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(text)) {
        const selected = new Date(text);
        const today = new Date();
        const minDate = dob ? new Date(dob) : new Date("2020-01-01");

        if (selected <= today && selected >= minDate) {
          setEntryDate(text);
          return;
        }
      }
      setEntryDate(text);
    },
    [dob]
  );

  // ── Submit ──
  const handleSave = useCallback(() => {
    const isPhoto = mode === "photo";
    const title = isPhoto
      ? caption.trim() || "Photo memory"
      : noteText.trim().slice(0, 60) || "Note";
    const body = isPhoto ? caption.trim() : noteText.trim();

    if (isPhoto && photos.length === 0) {
      Alert.alert("No Photos", "Please add at least one photo.");
      return;
    }

    if (!isPhoto && !noteText.trim()) {
      Alert.alert("Empty Note", "Please write something before saving.");
      return;
    }

    setIsSubmitting(true);

    const entryId = addManualEntry({
      dogId,
      entryType: isPhoto ? "photo" : "note",
      title,
      body: body || undefined,
      photoUris: isPhoto ? photos : undefined,
      entryDate,
      dogDateOfBirth: dob,
    });

    // Award XP for journal entries
    const xpSource = isPhoto ? "photo" : "notes";
    earnXp(10, xpSource, `journal-${entryId}`, "+10 XP");

    setIsSubmitting(false);

    Alert.alert(
      isPhoto ? "📸 Memory Saved!" : "📝 Note Saved!",
      `Added to ${dogName}'s journal. +10 XP 🎉`,
      [{ text: "OK", onPress: () => router.back() }]
    );
  }, [mode, caption, noteText, photos, entryDate, dogId, dob, dogName, addManualEntry, earnXp, router]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Header ── */}
        <View className="flex-row items-center justify-between px-xl pt-base pb-sm">
          <Pressable onPress={() => router.back()}>
            <Typography variant="body-medium" style={{ color: "#FF6B5C" }}>
              Cancel
            </Typography>
          </Pressable>
          <Typography variant="h3">Add Memory</Typography>
          <View className="w-[60px]" />
        </View>

        {/* ── Mode Toggle ── */}
        <Animated.View
          entering={FadeInDown.duration(300)}
          className="px-xl mb-lg"
        >
          <View className="flex-row bg-surface border border-border rounded-sm overflow-hidden">
            <Pressable
              onPress={() => setMode("photo")}
              className={`flex-1 py-md items-center ${mode === "photo" ? "bg-primary" : ""}`}
            >
              <Typography
                variant="body-sm-medium"
                color={mode === "photo" ? "inverse" : "secondary"}
                className={mode === "photo" ? "text-text-inverse" : ""}
              >
                📸 Photo
              </Typography>
            </Pressable>
            <Pressable
              onPress={() => setMode("note")}
              className={`flex-1 py-md items-center ${mode === "note" ? "bg-primary" : ""}`}
            >
              <Typography
                variant="body-sm-medium"
                color={mode === "note" ? "inverse" : "secondary"}
                className={mode === "note" ? "text-text-inverse" : ""}
              >
                📝 Note
              </Typography>
            </Pressable>
          </View>
        </Animated.View>

        {/* ── Photo Mode ── */}
        {mode === "photo" && (
          <Animated.View
            entering={FadeInDown.duration(300).delay(60)}
            className="px-xl mb-lg"
          >
            {/* Photo grid */}
            <View className="flex-row flex-wrap gap-sm mb-base">
              {photos.map((uri, i) => (
                <View key={i} className="relative">
                  <Image
                    source={{ uri }}
                    className="w-[100px] h-[100px] rounded-sm"
                    resizeMode="cover"
                  />
                  <Pressable
                    onPress={() => removePhoto(i)}
                    className="absolute -top-[6px] -right-[6px] w-[22px] h-[22px] rounded-full bg-error items-center justify-center"
                  >
                    <Typography variant="caption" color="inverse" className="text-text-inverse">
                      ×
                    </Typography>
                  </Pressable>
                </View>
              ))}

              {/* Add photo buttons */}
              {photos.length < MAX_PHOTOS && (
                <View className="flex-row gap-sm">
                  <Pressable
                    onPress={pickPhotos}
                    className="w-[100px] h-[100px] rounded-sm bg-primary-extralight border-2 border-dashed border-primary/30 items-center justify-center"
                  >
                    <Typography className="text-[24px]">🖼️</Typography>
                    <Typography variant="caption" style={{ color: "#FF6B5C" }}>
                      Library
                    </Typography>
                  </Pressable>
                  <Pressable
                    onPress={takePhoto}
                    className="w-[100px] h-[100px] rounded-sm bg-primary-extralight border-2 border-dashed border-primary/30 items-center justify-center"
                  >
                    <Typography className="text-[24px]">📷</Typography>
                    <Typography variant="caption" style={{ color: "#FF6B5C" }}>
                      Camera
                    </Typography>
                  </Pressable>
                </View>
              )}
            </View>

            <Typography variant="caption" color="tertiary">
              {photos.length}/{MAX_PHOTOS} photos
            </Typography>

            {/* Caption */}
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder={`What's ${dogName} up to?`}
              multiline
              numberOfLines={3}
              className="bg-surface border border-border rounded-sm px-base py-md mt-base text-[16px] min-h-[80px]"
              style={{ fontFamily: "PlusJakartaSans_400Regular", textAlignVertical: "top" }}
              placeholderTextColor="#9CA3AF"
            />
          </Animated.View>
        )}

        {/* ── Note Mode ── */}
        {mode === "note" && (
          <Animated.View
            entering={FadeInDown.duration(300).delay(60)}
            className="px-xl mb-lg"
          >
            <Card className="bg-accent-light border-accent/20" variant="outline">
              <TextInput
                value={noteText}
                onChangeText={setNoteText}
                placeholder={`Write about ${dogName}'s day, a funny moment, or something you noticed...`}
                multiline
                numberOfLines={6}
                className="text-[16px] min-h-[140px]"
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  textAlignVertical: "top",
                  color: "#1B2333",
                }}
                placeholderTextColor="#9CA3AF"
              />
            </Card>
          </Animated.View>
        )}

        {/* ── Date Picker ── */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(120)}
          className="px-xl mb-lg"
        >
          <Card variant="outline">
            <Typography variant="body-sm-medium" color="secondary" className="mb-sm">
              📅 Date
            </Typography>
            <TextInput
              value={entryDate}
              onChangeText={handleDateChange}
              placeholder="YYYY-MM-DD"
              className="bg-surface border border-border rounded-sm px-base py-md text-[16px]"
              style={{ fontFamily: "PlusJakartaSans_500Medium" }}
              placeholderTextColor="#9CA3AF"
              keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "default"}
            />
            <View className="flex-row items-center mt-sm gap-sm">
              <Typography variant="caption" color="tertiary">
                Defaults to today. Change to backdate.
              </Typography>
              {ageLabel && (
                <Typography variant="caption" color="secondary">
                  · {dogName} was {ageLabel} old
                </Typography>
              )}
            </View>
          </Card>
        </Animated.View>

        {/* ── Save ── */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(180)}
          className="px-xl"
        >
          <Button
            label={mode === "photo" ? "📸 Save Memory" : "📝 Save Note"}
            variant="primary"
            isLoading={isSubmitting}
            onPress={handleSave}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
