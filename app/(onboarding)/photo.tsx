import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Button, Typography } from "@/components/ui";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { detectBreed, type BreedPrediction } from "@/lib/breedDetect";
import {
  BreedScanAnimation,
  BuddyExpression,
  ScanOverlay,
} from "@/components/onboarding/BreedScanAnimation";
import BREEDS_JSON from "@/data/breeds.json";

/**
 * Screen 3: Photo Upload + Breed Detection
 * PRD-01 Section 3, Screen 3
 *
 * Eye flow: photos -> result -> actions (spec change)
 *
 * Confidence thresholds:
 *   >70%  → high: "Cowboy looks like a Pomeranian!" (no emoji, bold, confident)
 *   40-70 → medium: "Looks like a Pomeranian?" (question mark in wording only)
 *   <40%  → low: offer alternatives, no confused emoji
 *   fail  → "What breed is [Name]?" + searchable breed selector
 *
 * Special options:
 *   "Mixed Breed" -> shows two breed selectors for the mix
 *   "I'm not sure" -> continues with a general plan (breed = null)
 */

// --- Breed list from breeds.json + special options ---
const BREED_NAMES: string[] = BREEDS_JSON.map((b: { name: string }) => b.name);
if (!BREED_NAMES.includes("Mixed Breed")) {
  BREED_NAMES.push("Mixed Breed");
}
const SPECIAL_OPTION = "I'm not sure";

type DetectionState =
  | { status: "idle" }
  | { status: "detecting" }
  | { status: "high"; breed: string; confidence: number }
  | {
      status: "medium";
      breed: string;
      confidence: number;
      suggestions: BreedPrediction[];
    }
  | { status: "low"; suggestions: BreedPrediction[] }
  | { status: "different_dogs"; message: string }
  | { status: "manual" };

// --- Confidence badge ---

function ConfidenceBadge({ confidence, photoCount }: { confidence: number; photoCount: number }) {
  // Per spec: only multi-photo (2-3) can show "High match"
  // Single photo is capped at 65 by the edge function, so >70 only happens with multiple photos
  const isHigh = confidence > 70;
  const isMedium = confidence >= 40 && confidence <= 70;

  const label = isHigh ? "High match" : isMedium ? "Best guess" : "Possible match";
  const bg = isHigh ? "#5CB882" : isMedium ? "#FFB547" : "#F0EBE6";
  const textColor = isHigh ? "#FFFFFF" : isMedium ? "#1B2333" : "#6B7280";

  return (
    <View
      style={{
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 9999,
        backgroundColor: bg,
      }}
    >
      <Typography
        variant="body-sm-medium"
        style={{ color: textColor }}
      >
        {label}
      </Typography>
    </View>
  );
}

// --- Searchable Breed Dropdown ---
// onMixedBreed: called when user selects "Mixed breed" -- parent handles mix flow
// Selecting a breed, mixed breed, or free-text all close the dropdown
function BreedSearchDropdown({
  label,
  placeholder,
  onSelect,
  selectedBreed,
  excludeBreed,
  onMixedBreed,
}: {
  label?: string;
  placeholder?: string;
  onSelect: (breed: string) => void;
  selectedBreed: string | null;
  excludeBreed?: string | null;
  onMixedBreed?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [freeTextMode, setFreeTextMode] = useState(false);
  const [freeTextValue, setFreeTextValue] = useState("");
  const inputRef = useRef<TextInput>(null);
  const freeTextRef = useRef<TextInput>(null);

  const filteredBreeds = useMemo(() => {
    const q = query.toLowerCase().trim();
    // Exclude "Mixed Breed" from list -- it's a top-level option
    let list = BREED_NAMES.filter((b) => b !== excludeBreed && b !== "Mixed Breed");
    if (q) {
      list = list.filter((b) => b.toLowerCase().includes(q));
    }
    return list;
  }, [query, excludeBreed]);

  const handleSelect = (breed: string) => {
    onSelect(breed);
    setQuery("");
    setIsOpen(false);
    setFreeTextMode(false);
    setFreeTextValue("");
    inputRef.current?.blur();
  };

  const handleMixedBreed = () => {
    setQuery("");
    setIsOpen(false);
    setFreeTextMode(false);
    inputRef.current?.blur();
    onMixedBreed?.();
  };

  const handleFreeTextSubmit = () => {
    const trimmed = freeTextValue.trim();
    if (!trimmed) return;
    onSelect(trimmed);
    setQuery("");
    setIsOpen(false);
    setFreeTextMode(false);
    setFreeTextValue("");
    freeTextRef.current?.blur();
  };

  if (selectedBreed && !isOpen) {
    return (
      <View className="w-full">
        {label && (
          <Typography variant="body-sm-medium" color="secondary" className="mb-xs">
            {label}
          </Typography>
        )}
        <Pressable
          onPress={() => {
            setIsOpen(true);
            setFreeTextMode(false);
            setQuery("");
          }}
          className="flex-row items-center justify-between bg-surface border border-primary rounded-sm px-base h-[48px]"
        >
          <Typography variant="body-medium">{selectedBreed}</Typography>
          <Typography variant="caption" color="accent">
            Change
          </Typography>
        </Pressable>
      </View>
    );
  }

  // Free-text entry mode -- shown inline when "Don't see your breed?" is tapped
  if (freeTextMode) {
    return (
      <View className="w-full gap-sm">
        {label && (
          <Typography variant="body-sm-medium" color="secondary" className="mb-xs">
            {label}
          </Typography>
        )}
        <View className="flex-row gap-sm items-center">
          <TextInput
            ref={freeTextRef}
            className="flex-1 bg-surface border border-border rounded-sm px-base h-[48px] text-body font-brand-regular text-text-primary"
            placeholder="e.g. Cavapoo, Bernedoodle..."
            placeholderTextColor="#9CA3AF"
            value={freeTextValue}
            onChangeText={setFreeTextValue}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleFreeTextSubmit}
            autoFocus
          />
          <Pressable
            onPress={handleFreeTextSubmit}
            className="bg-primary rounded-sm h-[48px] px-lg items-center justify-center"
          >
            <Typography variant="body-sm-medium" color="inverse">
              Set
            </Typography>
          </Pressable>
        </View>
        <Pressable
          onPress={() => {
            setFreeTextMode(false);
            setFreeTextValue("");
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
        >
          <Typography variant="caption" color="secondary" className="text-center">
            Back to breed list
          </Typography>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="w-full">
      {label && (
        <Typography variant="body-sm-medium" color="secondary" className="mb-xs">
          {label}
        </Typography>
      )}
      <View className="bg-surface border border-border rounded-sm overflow-hidden">
        <TextInput
          ref={inputRef}
          className="px-base h-[48px] text-body font-brand-regular text-text-primary"
          placeholder={placeholder ?? "Search breeds..."}
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          autoCorrect={false}
          autoCapitalize="words"
        />
        {isOpen && (
          <ScrollView
            className="max-h-[240px] border-t border-border"
            keyboardShouldPersistTaps="handled"
          >
            {/* "I'm not sure" always at top */}
            <Pressable
              onPress={() => handleSelect(SPECIAL_OPTION)}
              className="px-base py-sm border-b border-border bg-surface"
            >
              <Typography variant="body-sm" color="secondary">
                {SPECIAL_OPTION}
              </Typography>
            </Pressable>

            {/* Mixed breed always at top, before the list */}
            {onMixedBreed && (
              <Pressable
                onPress={handleMixedBreed}
                className="px-base py-sm border-b border-border bg-surface"
              >
                <Typography variant="body-sm" color="secondary">
                  Mixed breed
                </Typography>
              </Pressable>
            )}

            {filteredBreeds.map((breed) => (
              <Pressable
                key={breed}
                onPress={() => handleSelect(breed)}
                className="px-base py-sm border-b border-border"
              >
                <Typography variant="body-sm">{breed}</Typography>
              </Pressable>
            ))}

            {/* "Don't see your breed?" always at bottom */}
            <Pressable
              onPress={() => {
                setIsOpen(false);
                setFreeTextMode(true);
                inputRef.current?.blur();
              }}
              className="px-base py-sm"
            >
              <Typography variant="body-sm" color="accent">
                Don't see your breed? Type it in
              </Typography>
            </Pressable>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

/** Silhouette guide labels for each photo slot */
const PHOTO_GUIDES = [
  { emoji: "🐕", label: "Front face" },
  { emoji: "🐕‍🦺", label: "Side profile" },
  { emoji: "🐩", label: "Full body" },
] as const;

const MAX_PHOTOS = 3;

// --- Main Screen ---
export default function PhotoScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboardingStore();
  const [detection, setDetection] = useState<DetectionState>({
    status: "idle",
  });
  const [showManualSelector, setShowManualSelector] = useState(false);
  const [detectionStage, setDetectionStage] = useState<"classifying" | "confirming">("classifying");
  const [isMixedBreed, setIsMixedBreed] = useState(false);
  const [notSure, setNotSure] = useState(false);
  // Tracks last successful detection so adding a 2nd/3rd photo never blanks the result on failure
  const lastSuccessRef = useRef<typeof detection | null>(null);

  /**
   * Hybrid detection stage for two-step progress UI.
   * "classifying" = HuggingFace fast scan in progress
   * "confirming"  = Sonnet reasoning/validation in progress
   */

  /** Array of up to 3 photo URIs for multi-angle breed detection */
  const [photoUris, setPhotoUris] = useState<string[]>(
    data.photoUri ? [data.photoUri] : [],
  );
  const puppyName = data.puppyName || "your pup";

  const runDetection = useCallback(
    async (uris: string[]) => {
      if (uris.length === 0) return;

      setDetection({ status: "detecting" });
      setDetectionStage("classifying");
      setShowManualSelector(false);
      setIsMixedBreed(false);
      setNotSure(false);

      // Hybrid two-step flow: classifier first, then Sonnet reasoning
      const result = await detectBreed(uris, (stage) => {
        setDetectionStage(stage);
      });

      if (!result) {
        // Timeout, error, or no breeds found
        // If we already had a successful result (e.g. adding photo 2/3), restore it
        // so the breed result never disappears on a failed re-run
        if (lastSuccessRef.current) {
          setDetection(lastSuccessRef.current);
          return;
        }
        setDetection({ status: "manual" });
        setShowManualSelector(true);
        return;
      }

      // Handle different dogs validation
      if (result.differentDogs) {
        setDetection({
          status: "different_dogs",
          message: result.errorMessage ?? "These look like different dogs!",
        });
        return;
      }

      if (result.lowConfidence || result.confidence < 40) {
        // Low confidence -> show selector with alternatives
        setDetection({
          status: "low",
          suggestions: result.suggestions,
        });
        setShowManualSelector(true);
        return;
      }

      if (result.confidence > 70) {
        // High confidence -> auto-fill
        updateData({
          breed: result.topBreed,
          breedConfidence: result.confidence,
          breedDetected: true,
        });
        const highDetection = {
          status: "high" as const,
          breed: result.topBreed,
          confidence: result.confidence,
        };
        lastSuccessRef.current = highDetection;
        setDetection(highDetection);
      } else {
        // Medium confidence (40-70) -> suggest with confirm/change
        const mediumDetection = {
          status: "medium" as const,
          breed: result.topBreed,
          confidence: result.confidence,
          suggestions: result.suggestions,
        };
        lastSuccessRef.current = mediumDetection;
        setDetection(mediumDetection);
      }
    },
    [updateData],
  );

  /** Pick/replace a photo at the given slot index */
  const pickImage = async (slotIndex?: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1.0,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      const idx = slotIndex ?? photoUris.length;
      const next = [...photoUris];
      next[idx] = uri;
      const validUris = next.filter(Boolean);

      // Update local state first (pure state update, no side effects)
      setPhotoUris(next);

      // Side effects outside of setState to avoid render-during-update
      // Front face (index 0) is the profile photo
      updateData({
        photoUri: validUris[0] ?? uri,
        allPhotoUris: validUris,
        breed: undefined,
        breedConfidence: undefined,
        breedDetected: false,
        breedMix1: null,
        breedMix2: null,
      });
      runDetection(validUris);
    }
  };

  /** Remove a photo from the given slot */
  const removePhoto = (index: number) => {
    const next = photoUris.filter((_, i) => i !== index);

    // Update local state first
    setPhotoUris(next);

    // Side effects outside of setState
    if (next.length === 0) {
      updateData({ photoUri: null, allPhotoUris: [], breed: undefined, breedDetected: false });
      setDetection({ status: "idle" });
      lastSuccessRef.current = null;
    } else {
      updateData({ photoUri: next[0], allPhotoUris: next });
      runDetection(next);
    }
  };

  const confirmBreed = (breed: string) => {
    updateData({
      breed,
      breedDetected: true,
    });
    setDetection((prev) =>
      prev.status === "medium"
        ? { status: "high", breed, confidence: prev.confidence }
        : { status: "high", breed, confidence: 50 },
    );
    setShowManualSelector(false);
    setIsMixedBreed(false);
    setNotSure(false);
  };

  const handleBreedSelect = (breed: string) => {
    if (breed === SPECIAL_OPTION) {
      // "I'm not sure" -> continue with general plan
      setNotSure(true);
      setIsMixedBreed(false);
      setShowManualSelector(false);
      updateData({ breed: null, breedDetected: false, breedMix1: null, breedMix2: null });
      return;
    }

    if (breed === "Mixed Breed") {
      setIsMixedBreed(true);
      updateData({ breed: "Mixed Breed", breedDetected: true, breedMix1: null, breedMix2: null });
      return;
    }

    confirmBreed(breed);
  };

  const handleMixBreed1 = (breed: string) => {
    if (breed === SPECIAL_OPTION) {
      updateData({ breedMix1: null });
      return;
    }
    updateData({ breedMix1: breed });
  };

  const handleMixBreed2 = (breed: string) => {
    if (breed === SPECIAL_OPTION) {
      updateData({ breedMix2: null });
      return;
    }
    updateData({ breedMix2: breed });
  };

  const showSelectorSection = () => {
    setShowManualSelector(true);
  };

  const handleContinue = () => {
    router.push("/(onboarding)/age");
  };

  // Buddy speech bubble text (top of screen, context-setting only)
  const getBuddySpeech = (): string => {
    if (detection.status === "detecting") {
      return `Hold tight, working my magic on ${puppyName}...`;
    }
    if (detection.status === "high" || detection.status === "medium") {
      return `Got it! Here's what I found for ${puppyName}`;
    }
    if (detection.status === "low") {
      return `I couldn't get a clear read -- what breed is ${puppyName}?`;
    }
    if (detection.status === "different_dogs") {
      return `Hmm, these look like different pups! Upload photos of just ${puppyName} so I can get the breed right.`;
    }
    if (detection.status === "manual") {
      return `What breed is ${puppyName}?`;
    }
    if (notSure) {
      return `No worries! We'll make a great plan for ${puppyName} either way!`;
    }
    if (isMixedBreed) {
      return `A mix! What breeds make up ${puppyName}?`;
    }
    return `Let's see that cute face! Upload a photo of ${puppyName}`;
  };

  // Can continue if breed is confirmed, notSure, or mixed breed with at least one component
  const canContinue =
    notSure ||
    (data.breed && data.breed !== "Mixed Breed") ||
    (data.breed === "Mixed Breed" && (data.breedMix1 || data.breedMix2));

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-xl pb-3xl"
          keyboardShouldPersistTaps="handled"
        >
          <View className="pt-3xl items-center">
            {/* Buddy avatar + speech bubble -- context setter at top */}
            <View className="mb-base">
              {detection.status === "detecting" ? (
                <BuddyExpression mode="thinking" size={80} />
              ) : detection.status === "high" || detection.status === "medium" ? (
                <BuddyExpression mode="excited" size={80} />
              ) : detection.status === "low" || detection.status === "manual" || detection.status === "different_dogs" ? (
                <BuddyExpression mode="teaching" size={80} />
              ) : (
                <BuddyExpression mode="thinking" size={80} />
              )}
            </View>

            <View className="bg-surface rounded-lg p-lg shadow-card mb-2xl w-full">
              <Typography variant="body-lg" className="text-center">
                {getBuddySpeech()}
              </Typography>
            </View>

            {/* Multi-photo upload area */}
            <Animated.View entering={FadeIn.duration(200)}>
              {photoUris.length === 0 ? (
                /* No photos yet -- single large upload target */
                <>
                  <Pressable onPress={() => pickImage(0)}>
                    <View className="w-[200px] h-[200px] rounded-xl bg-surface border-2 border-dashed border-border items-center justify-center">
                      <Typography className="text-[48px]">📸</Typography>
                      <Typography variant="body-sm" color="secondary">
                        Tap to upload
                      </Typography>
                    </View>
                  </Pressable>
                  <Typography
                    variant="caption"
                    color="secondary"
                    style={{ textAlign: "center", marginTop: 10 }}
                  >
                    A clear front-facing photo works best
                  </Typography>
                </>
              ) : (
                /* Photo thumbnail row -- up to 3 slots */
                <View className="flex-row gap-sm justify-center">
                  {PHOTO_GUIDES.map((guide, idx) => {
                    const uri = photoUris[idx];
                    const isNextEmpty = idx === photoUris.length && idx < MAX_PHOTOS;

                    if (uri) {
                      // Filled slot -- show photo with remove button
                      const isDetecting = detection.status === "detecting";
                      return (
                        <View key={idx} style={{ alignItems: "center" }}>
                          <Pressable onPress={() => pickImage(idx)} disabled={isDetecting}>
                            <View
                              className="rounded-lg overflow-hidden"
                              style={{
                                width: 100,
                                height: 100,
                                borderWidth: 2,
                                borderColor: isDetecting ? "transparent" : "#FF6B5C",
                                borderRadius: 12,
                              }}
                            >
                              <Image
                                source={{ uri }}
                                style={{ width: 100, height: 100 }}
                                contentFit="cover"
                              />
                              {isDetecting && <ScanOverlay size={100} />}
                            </View>
                          </Pressable>
                          {!isDetecting && (
                            <Pressable
                              onPress={() => removePhoto(idx)}
                              style={{
                                position: "absolute",
                                top: -6,
                                right: -6,
                                backgroundColor: "#FF6B5C",
                                width: 22,
                                height: 22,
                                borderRadius: 11,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Typography
                                style={{ color: "#fff", fontSize: 12, lineHeight: 14, fontWeight: "700" }}
                              >
                                x
                              </Typography>
                            </Pressable>
                          )}
                          <Typography variant="caption" color="secondary" className="mt-xs text-center">
                            {guide.label}
                          </Typography>
                        </View>
                      );
                    }

                    if (isNextEmpty) {
                      // Next empty slot -- show add button with silhouette guide
                      return (
                        <Pressable key={idx} onPress={() => pickImage(idx)}>
                          <View style={{ alignItems: "center" }}>
                            <View
                              style={{
                                width: 100,
                                height: 100,
                                borderRadius: 12,
                                borderWidth: 2,
                                borderStyle: "dashed",
                                borderColor: "#ccc",
                                backgroundColor: "#f9f9f9",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Typography style={{ fontSize: 28, opacity: 0.4 }}>
                                {guide.emoji}
                              </Typography>
                              <Typography style={{ fontSize: 20, marginTop: 2 }}>+</Typography>
                            </View>
                            <Typography variant="caption" color="secondary" className="mt-xs text-center">
                              {guide.label}
                            </Typography>
                          </View>
                        </Pressable>
                      );
                    }

                    // Future empty slot -- show faded guide only
                    return (
                      <View key={idx} style={{ alignItems: "center", opacity: 0.3 }}>
                        <View
                          style={{
                            width: 100,
                            height: 100,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderStyle: "dashed",
                            borderColor: "#ddd",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Typography style={{ fontSize: 28, opacity: 0.3 }}>
                            {guide.emoji}
                          </Typography>
                        </View>
                        <Typography variant="caption" color="secondary" className="mt-xs text-center">
                          {guide.label}
                        </Typography>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Multi-photo cross-reference note (only when 2+ photos, scan not in progress) */}
              {photoUris.length > 1 && detection.status !== "detecting" && detection.status !== "different_dogs" && (
                <Typography variant="caption" color="secondary" className="text-center mt-xs" style={{ opacity: 0.6 }}>
                  {photoUris.length} photos of {puppyName} will be cross-referenced
                </Typography>
              )}
            </Animated.View>

            {/* --- Detection states (all BELOW the photos per spec) --- */}

            {/* SCANNING state */}
            {detection.status === "detecting" && (
              <View className="mt-2xl w-full">
                <BreedScanAnimation dogName={puppyName} photoSize={100} stage={detectionStage} />
              </View>
            )}

            {/* DIFFERENT DOGS -- validation error */}
            {detection.status === "different_dogs" && (
              <Animated.View
                entering={FadeInDown.duration(200)}
                className="mt-2xl items-center w-full px-lg"
              >
                <View className="rounded-md px-lg py-md mb-sm w-full" style={{ backgroundColor: "#FDEDED" }}>
                  <Typography variant="body-sm-medium" className="text-center" style={{ color: "#EF6461" }}>
                    These photos look like different dogs
                  </Typography>
                  <Typography variant="caption" color="secondary" className="text-center mt-xs">
                    Replace one or more photos so they're all of {puppyName}
                  </Typography>
                </View>
              </Animated.View>
            )}

            {/* HIGH confidence result -- reveal moment */}
            {detection.status === "high" && !isMixedBreed && !showManualSelector && (
              <Animated.View
                entering={FadeInDown.duration(200)}
                style={{ marginTop: 32, alignItems: "center", width: "100%" }}
              >
                {/* Result card -- the magic moment */}
                <Animated.View
                  entering={FadeInDown.duration(200).delay(100)}
                  style={{
                    width: "100%",
                    backgroundColor: "#FFFAF7",
                    borderRadius: 16,
                    padding: 24,
                    marginTop: 16,
                    shadowColor: "#1B2333",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    elevation: 3,
                    alignItems: "center",
                    gap: 20,
                  }}
                >
                  <Typography
                    variant="h2"
                    className="text-center"
                    style={{ fontWeight: "700", color: "#1B2333" }}
                  >
                    {puppyName !== "your pup"
                      ? `${puppyName} looks like a ${detection.breed}!`
                      : `Looks like a ${detection.breed}!`}
                  </Typography>

                  {/* Confidence badge */}
                  <ConfidenceBadge confidence={detection.confidence} photoCount={photoUris.length} />
                </Animated.View>
              </Animated.View>
            )}

            {/* MEDIUM confidence -- question in wording, no emoji */}
            {detection.status === "medium" && !showManualSelector && (
              <Animated.View
                entering={FadeInDown.duration(200)}
                style={{ marginTop: 32, alignItems: "center", gap: 8, width: "100%" }}
              >
                {/* Result with question mark in wording only */}
                <Typography
                  variant="h2"
                  className="text-center mt-base"
                  style={{ fontWeight: "700" }}
                >
                  {puppyName !== "your pup"
                    ? `${puppyName} looks like a ${detection.breed}?`
                    : `Looks like a ${detection.breed}?`}
                </Typography>

                {/* Confidence badge */}
                <ConfidenceBadge confidence={detection.confidence} photoCount={photoUris.length} />

                {/* Yes / Change breed buttons */}
                <View className="flex-row gap-sm w-full px-lg mt-sm">
                  <View className="flex-1">
                    <Button
                      label="Yes!"
                      variant="primary"
                      size="sm"
                      onPress={() => confirmBreed(detection.breed)}
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      label="Change breed"
                      variant="secondary"
                      size="sm"
                      onPress={showSelectorSection}
                    />
                  </View>
                </View>
              </Animated.View>
            )}

            {/* LOW confidence -- alternatives, Buddy teaching mode */}
            {detection.status === "low" && !showManualSelector && (
              <Animated.View
                entering={FadeInDown.duration(200)}
                className="mt-2xl items-center w-full"
              >
                <Typography variant="body-medium" className="text-center mt-base" color="secondary">
                  I couldn't get a clear read. Here are my best guesses for {puppyName}:
                </Typography>
              </Animated.View>
            )}

            {/* Secondary action -- change breed link (high confidence only, not shown when selector already open) */}
            {photoUris.length > 0 && detection.status !== "idle" && detection.status !== "detecting" && !isMixedBreed && !notSure && !showManualSelector && (
              <Animated.View
                entering={FadeInDown.duration(200).delay(200)}
                style={{ marginTop: 24, width: "100%", alignItems: "center" }}
              >
                <Pressable
                  onPress={showSelectorSection}
                  style={{ paddingVertical: 10, paddingHorizontal: 16 }}
                >
                  <Typography variant="body-sm-medium" color="accent" style={{ textAlign: "center" }}>
                    That's not right, change breed
                  </Typography>
                </Pressable>
              </Animated.View>
            )}

            {/* --- Searchable breed selector (low / manual / user clicked change) --- */}
            {showManualSelector && !isMixedBreed && !notSure && (
              <Animated.View
                entering={FadeInDown.duration(200)}
                className="mt-lg w-full gap-sm"
              >
                {/* Low-confidence suggestions as quick-pick buttons */}
                {detection.status === "low" &&
                  detection.suggestions.length > 0 && (
                    <View className="gap-xs mb-sm">
                      <Typography
                        variant="body-sm"
                        color="secondary"
                        className="text-center"
                      >
                        Best guesses:
                      </Typography>
                      <View className="flex-row flex-wrap justify-center gap-xs">
                        {detection.suggestions.map((s, si) => (
                          <Pressable
                            key={`${s.name}-${si}`}
                            onPress={() => confirmBreed(s.name)}
                          >
                            <View className="bg-surface rounded-md px-base py-xs border border-border">
                              <Typography variant="body-sm">
                                {s.name}
                              </Typography>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}

                <BreedSearchDropdown
                  placeholder={`Search breeds for ${puppyName}...`}
                  onSelect={handleBreedSelect}
                  selectedBreed={null}
                  onMixedBreed={() => {
                    setIsMixedBreed(true);
                    setShowManualSelector(false);
                    updateData({ breed: "Mixed Breed", breedDetected: true, breedMix1: null, breedMix2: null });
                  }}
                />
              </Animated.View>
            )}

            {/* --- Mixed breed -- two selectors --- */}
            {isMixedBreed && (
              <Animated.View
                entering={FadeInDown.duration(200)}
                className="mt-lg w-full gap-base"
              >
                <View className="bg-accent-light rounded-md px-lg py-sm">
                  <Typography
                    variant="body-medium"
                    className="text-center"
                  >
                    Mixed Breed
                  </Typography>
                </View>

                <BreedSearchDropdown
                  label="Breed 1"
                  placeholder="First breed in the mix..."
                  onSelect={handleMixBreed1}
                  selectedBreed={data.breedMix1}
                  excludeBreed="Mixed Breed"
                />

                <BreedSearchDropdown
                  label="Breed 2"
                  placeholder="Second breed in the mix..."
                  onSelect={handleMixBreed2}
                  selectedBreed={data.breedMix2}
                  excludeBreed={data.breedMix1 ?? "Mixed Breed"}
                />

                <Pressable
                  onPress={() => {
                    setIsMixedBreed(false);
                    setShowManualSelector(true);
                    updateData({
                      breed: null,
                      breedMix1: null,
                      breedMix2: null,
                    });
                  }}
                >
                  <Typography
                    variant="body-sm"
                    color="accent"
                    className="text-center"
                  >
                    Not a mix? Choose a different breed
                  </Typography>
                </Pressable>
              </Animated.View>
            )}

            {/* --- "I'm not sure" confirmation --- */}
            {notSure && (
              <Animated.View
                entering={FadeInDown.duration(200)}
                className="mt-lg items-center gap-sm"
              >
                <View className="bg-surface rounded-md px-lg py-sm border border-border">
                  <Typography variant="body-sm" className="text-center">
                    No problem! We'll create a general training plan.
                  </Typography>
                </View>
                <Pressable
                  onPress={() => {
                    setNotSure(false);
                    setShowManualSelector(true);
                  }}
                  className="bg-surface border border-border rounded-sm px-lg py-sm"
                >
                  <Typography variant="body-sm" color="accent" className="text-center">
                    Actually, I know the breed
                  </Typography>
                </Pressable>
              </Animated.View>
            )}

            {/* Show confirmed breed chip when breed was selected via manual selector */}
            {data.breed &&
              data.breed !== "Mixed Breed" &&
              !notSure &&
              detection.status !== "high" &&
              detection.status !== "medium" &&
              !showManualSelector && (
                <Animated.View
                  entering={FadeInDown.duration(200)}
                  className="mt-lg items-center w-full px-lg"
                >
                  <View className="bg-accent-light rounded-md px-lg py-sm">
                    <Typography variant="body-medium">
                      {data.breed}
                    </Typography>
                  </View>
                  <Pressable
                    onPress={showSelectorSection}
                    className="mt-base bg-surface border border-border rounded-sm px-lg py-sm"
                  >
                    <Typography variant="body-sm" color="accent" className="text-center">
                      Change breed
                    </Typography>
                  </Pressable>
                </Animated.View>
              )}
          </View>
        </ScrollView>

        {/* Bottom actions -- fixed at bottom */}
        <View className="px-xl pb-3xl gap-sm bg-background">
          <Button
            label="Continue"
            onPress={handleContinue}
            disabled={!canContinue && photoUris.length > 0}
          />
          {photoUris.length === 0 && (
            <Button
              variant="ghost"
              label="Skip for now"
              size="sm"
              onPress={handleContinue}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
