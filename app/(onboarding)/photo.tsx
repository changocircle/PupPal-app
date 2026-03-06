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
import BREEDS_JSON from "@/data/breeds.json";

/**
 * Screen 3: Photo Upload + Breed Detection
 * PRD-01 Section 3, Screen 3
 *
 * Confidence thresholds:
 *   >70%  → auto-fill breed with Buddy reaction
 *   40-70 → show suggestion with confirm/change
 *   <40%  → "I couldn't get a clear read" + searchable breed selector
 *   fail  → "What breed is [Name]?" + searchable breed selector
 *
 * Special options:
 *   "Mixed Breed" → shows two breed selectors for the mix
 *   "I'm not sure" → continues with a general plan (breed = null)
 */

// ─── Breed list from breeds.json + special options ───
const BREED_NAMES: string[] = BREEDS_JSON.map((b: { name: string }) => b.name);
// Ensure "Mixed Breed" is in the list (it's in breeds.json, but just in case)
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
  | { status: "manual" };

// ─── Searchable Breed Dropdown ───
function BreedSearchDropdown({
  label,
  placeholder,
  onSelect,
  selectedBreed,
  excludeBreed,
}: {
  label?: string;
  placeholder?: string;
  onSelect: (breed: string) => void;
  selectedBreed: string | null;
  excludeBreed?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const filteredBreeds = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = BREED_NAMES.filter((b) => b !== excludeBreed);
    if (q) {
      list = list.filter((b) => b.toLowerCase().includes(q));
    }
    return list;
  }, [query, excludeBreed]);

  const handleSelect = (breed: string) => {
    onSelect(breed);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
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
            className="max-h-[200px] border-t border-border"
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

            {filteredBreeds.map((breed) => (
              <Pressable
                key={breed}
                onPress={() => handleSelect(breed)}
                className="px-base py-sm border-b border-border"
              >
                <Typography variant="body-sm">{breed}</Typography>
              </Pressable>
            ))}

            {filteredBreeds.length === 0 && (
              <View className="px-base py-sm">
                <Typography variant="body-sm" color="secondary">
                  No breeds found
                </Typography>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ───
export default function PhotoScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboardingStore();
  const [detection, setDetection] = useState<DetectionState>({
    status: "idle",
  });
  const [showManualSelector, setShowManualSelector] = useState(false);
  const [isMixedBreed, setIsMixedBreed] = useState(false);
  const [notSure, setNotSure] = useState(false);
  const puppyName = data.puppyName || "your pup";

  const runDetection = useCallback(
    async (uri: string) => {
      setDetection({ status: "detecting" });
      setShowManualSelector(false);
      setIsMixedBreed(false);
      setNotSure(false);

      const result = await detectBreed(uri);

      if (!result) {
        // Timeout, error, or no breeds found → show selector
        setDetection({ status: "manual" });
        setShowManualSelector(true);
        return;
      }

      if (result.lowConfidence || result.confidence < 40) {
        // Low confidence → show selector with message
        setDetection({
          status: "low",
          suggestions: result.suggestions,
        });
        setShowManualSelector(true);
        return;
      }

      if (result.confidence > 70) {
        // High confidence → auto-fill
        updateData({
          breed: result.topBreed,
          breedConfidence: result.confidence,
          breedDetected: true,
        });
        setDetection({
          status: "high",
          breed: result.topBreed,
          confidence: result.confidence,
        });
      } else {
        // Medium confidence → suggest with confirm/change
        setDetection({
          status: "medium",
          breed: result.topBreed,
          confidence: result.confidence,
          suggestions: result.suggestions,
        });
      }
    },
    [updateData],
  );

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      updateData({
        photoUri: uri,
        breed: undefined,
        breedConfidence: undefined,
        breedDetected: false,
        breedMix1: null,
        breedMix2: null,
      });
      await runDetection(uri);
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
      // "I'm not sure" → continue with general plan
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
      // If they're not sure about one of the mix, just use Mixed Breed
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

  // Determine the Buddy speech text
  const getBuddySpeech = (): string => {
    if (detection.status === "detecting") {
      return `Analyzing ${puppyName}'s photo... 🔍`;
    }
    if (detection.status === "high") {
      return `${detection.breed}! What a beauty! ✨`;
    }
    if (detection.status === "medium") {
      return `Looks like a ${detection.breed}? 🤔`;
    }
    if (detection.status === "low") {
      return `I couldn't get a clear read — what breed is ${puppyName}?`;
    }
    if (detection.status === "manual") {
      return `What breed is ${puppyName}?`;
    }
    if (notSure) {
      return `No worries! We'll make a great plan for ${puppyName} either way! 🐾`;
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
            {/* Buddy avatar */}
            <View className="w-[80px] h-[80px] rounded-full bg-primary-light items-center justify-center mb-base">
              <Typography className="text-[40px]">🐕</Typography>
            </View>

            {/* Buddy speech bubble */}
            <View className="bg-surface rounded-lg p-lg shadow-card mb-2xl w-full">
              <Typography variant="body-lg" className="text-center">
                {getBuddySpeech()}
              </Typography>
            </View>

            {/* Photo upload area */}
            <Pressable onPress={pickImage}>
              <Animated.View
                entering={FadeIn.duration(300)}
                className="w-[200px] h-[200px] rounded-xl bg-surface border-2 border-dashed border-border items-center justify-center overflow-hidden"
              >
                {data.photoUri ? (
                  <Image
                    source={{ uri: data.photoUri }}
                    style={{ width: 200, height: 200 }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="items-center gap-sm">
                    <Typography className="text-[48px]">📸</Typography>
                    <Typography variant="body-sm" color="secondary">
                      Tap to upload
                    </Typography>
                  </View>
                )}
              </Animated.View>
            </Pressable>

            {/* ─── Detection result states ─── */}

            {detection.status === "detecting" && (
              <Animated.View
                entering={FadeIn.duration(300)}
                className="mt-lg items-center"
              >
                <Typography variant="body-sm" color="secondary">
                  Detecting breed... 🔍
                </Typography>
              </Animated.View>
            )}

            {/* HIGH confidence — confirmed breed */}
            {detection.status === "high" && !isMixedBreed && !showManualSelector && (
              <Animated.View
                entering={FadeInDown.duration(300)}
                className="mt-lg items-center"
              >
                <View className="bg-accent-light rounded-md px-lg py-sm mb-xs">
                  <Typography variant="body-medium" className="text-center">
                    {detection.breed} detected! ✨
                  </Typography>
                </View>
                <Typography variant="caption" color="secondary">
                  {detection.confidence}% confidence
                </Typography>
                <Pressable
                  onPress={showSelectorSection}
                  className="mt-sm"
                >
                  <Typography variant="body-sm" color="accent">
                    Actually, they're a...
                  </Typography>
                </Pressable>
              </Animated.View>
            )}

            {/* MEDIUM confidence — suggestion with confirm/change */}
            {detection.status === "medium" && !showManualSelector && (
              <Animated.View
                entering={FadeInDown.duration(300)}
                className="mt-lg items-center gap-sm w-full"
              >
                <View className="flex-row gap-sm w-full px-lg">
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
                      label="Actually, they're a..."
                      variant="secondary"
                      size="sm"
                      onPress={showSelectorSection}
                    />
                  </View>
                </View>
                {detection.suggestions.length > 1 && (
                  <View className="mt-xs items-center">
                    <Typography variant="caption" color="secondary">
                      Also possible:
                    </Typography>
                    {detection.suggestions.slice(1).map((s) => (
                      <Pressable
                        key={s.name}
                        onPress={() => confirmBreed(s.name)}
                      >
                        <Typography
                          variant="body-sm"
                          color="accent"
                          className="mt-xxs"
                        >
                          {s.name} ({s.confidence}%)
                        </Typography>
                      </Pressable>
                    ))}
                  </View>
                )}
              </Animated.View>
            )}

            {/* ─── Searchable breed selector (low / manual / user clicked change) ─── */}
            {showManualSelector && !isMixedBreed && !notSure && (
              <Animated.View
                entering={FadeInDown.duration(300)}
                className="mt-lg w-full gap-sm"
              >
                {/* Show low-confidence suggestions as quick-pick buttons */}
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
                        {detection.suggestions.map((s) => (
                          <Pressable
                            key={s.name}
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
                />
              </Animated.View>
            )}

            {/* ─── Mixed breed — two selectors ─── */}
            {isMixedBreed && (
              <Animated.View
                entering={FadeInDown.duration(300)}
                className="mt-lg w-full gap-base"
              >
                <View className="bg-accent-light rounded-md px-lg py-sm">
                  <Typography
                    variant="body-medium"
                    className="text-center"
                  >
                    Mixed Breed 🐾
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

            {/* ─── "I'm not sure" confirmation ─── */}
            {notSure && (
              <Animated.View
                entering={FadeInDown.duration(300)}
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
                >
                  <Typography variant="body-sm" color="accent">
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
                  entering={FadeInDown.duration(300)}
                  className="mt-lg items-center"
                >
                  <View className="bg-accent-light rounded-md px-lg py-sm">
                    <Typography variant="body-medium">
                      {data.breed} ✨
                    </Typography>
                  </View>
                  <Pressable
                    onPress={showSelectorSection}
                    className="mt-sm"
                  >
                    <Typography variant="body-sm" color="accent">
                      Change breed
                    </Typography>
                  </Pressable>
                </Animated.View>
              )}
          </View>
        </ScrollView>

        {/* Bottom actions — fixed at bottom */}
        <View className="px-xl pb-3xl gap-sm bg-background">
          <Button
            label="Continue"
            onPress={handleContinue}
            disabled={!canContinue && !!data.photoUri}
          />
          {!data.photoUri && (
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
