import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
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
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
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

/**
 * Confidence badge with optional pulse+shimmer animation.
 * `pulse` triggers when confidence silently upgrades (photos 2/3 background scan).
 */
function ConfidenceBadge({
  confidence,
  photoCount,
  pulse = false,
}: {
  confidence: number;
  photoCount: number;
  pulse?: boolean;
}) {
  // Per spec: only multi-photo (2-3) can show "High match"
  // Single photo is capped at 65 by the edge function, so >70 only happens with multiple photos
  const isHigh = confidence > 70;
  const isMedium = confidence >= 40 && confidence <= 70;

  const label = isHigh ? "High match" : isMedium ? "Best guess" : "Possible match";
  const bg = isHigh ? "#5CB882" : isMedium ? "#FFB547" : "#F0EBE6";
  const textColor = isHigh ? "#FFFFFF" : isMedium ? "#1B2333" : "#6B7280";

  const scale = useSharedValue(1);
  const shimmerOpacity = useSharedValue(0);

  useEffect(() => {
    if (!pulse) return;
    // Scale pulse: 1 -> 1.18 -> 1
    scale.value = withSequence(
      withTiming(1.18, { duration: 200, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) }),
    );
    // Gold shimmer flash
    shimmerOpacity.value = withSequence(
      withTiming(0.35, { duration: 150 }),
      withTiming(0, { duration: 400 }),
    );
  }, [pulse, confidence]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        badgeStyle,
        {
          marginTop: 12,
          paddingHorizontal: 16,
          paddingVertical: 6,
          borderRadius: 9999,
          backgroundColor: bg,
          overflow: "hidden",
        },
      ]}
    >
      {/* Gold shimmer overlay -- flashes on confidence upgrade */}
      <Animated.View
        style={[
          shimmerStyle,
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#FFD700",
            borderRadius: 9999,
          },
        ]}
        pointerEvents="none"
      />
      <Typography
        variant="body-sm-medium"
        style={{ color: textColor }}
      >
        {label}
      </Typography>
    </Animated.View>
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

// --- Breed-specific Buddy reveal lines ---
// PRD-01 §655: "Buddy's breed-specific response should include one genuinely useful breed fact"

const BREED_BUDDY_LINES: Record<string, string> = {
  "Golden Retriever": "A Golden Retriever! Great choice -- they're incredibly smart but can be mouthy as puppies. We'll work on that!",
  "Labrador Retriever": "A Lab! One of the most trainable breeds out there. They love to please, which makes our job easy.",
  "French Bulldog": "A Frenchie! Super charming, but they have a stubborn streak. Short, fun sessions work best for them.",
  "German Shepherd": "A German Shepherd! Highly intelligent and driven -- they need both mental and physical challenges to stay happy.",
  "Poodle": "A Poodle! One of the smartest breeds alive. They pick up new skills incredibly fast -- you'll be amazed.",
  "Miniature Poodle": "A Mini Poodle! All the brains of a Standard Poodle in a smaller package. Fast learner, big personality.",
  "Toy Poodle": "A Toy Poodle! Don't let the size fool you -- they're razor sharp and absolutely love learning tricks.",
  "Bulldog": "A Bulldog! Loveable, laid-back, and a little food-motivated. We'll use that to our advantage.",
  "Beagle": "A Beagle! Fantastic nose, but a wandering mind. Scent-based games will keep them totally engaged.",
  "Rottweiler": "A Rottweiler! Confident and loyal -- they respond best to calm, consistent training. Great dogs when guided well.",
  "Yorkshire Terrier": "A Yorkie! Big personality, tiny body. They can be feisty, but with the right approach they're surprisingly trainable.",
  "Dachshund": "A Dachshund! Independent and clever, they were bred to think for themselves. Patience pays off big with these guys.",
  "Boxer": "A Boxer! Energetic and playful -- they stay puppy-like for years. Channel that energy and you'll have a brilliant dog.",
  "Siberian Husky": "A Husky! Beautiful and smart, but famously independent. Consistent boundaries early on make a huge difference.",
  "Australian Shepherd": "An Aussie! One of the most intelligent herding breeds. They need a job -- let's give them one.",
  "Pomeranian": "A Pom! Full of personality and surprisingly trainable. They love showing off once they know what's expected.",
  "Shih Tzu": "A Shih Tzu! Bred to be companions, so they're very people-focused. Short, positive sessions are their sweet spot.",
  "Doberman Pinscher": "A Doberman! Athletic and highly intelligent -- one of the easiest large breeds to train when you're consistent.",
  "Great Dane": "A Great Dane! Gentle giants. They mature slowly, so early socialisation is the single most important thing right now.",
  "Chihuahua": "A Chihuahua! Fearless and incredibly smart for their size. Early confidence-building is key.",
  "Havanese": "A Havanese! Happy, social, and eager to please. One of the easiest small breeds to train.",
  "Maltese": "A Maltese! Gentle and sweet. They can be sensitive, so keep sessions upbeat and always end on a win.",
  "Border Collie": "A Border Collie! Arguably the most intelligent dog breed. They need mental challenges every single day.",
  "Corgi": "A Corgi! Smart, energetic, and a little bossy. They'll try to herd you -- we'll channel that instinct.",
  "Pembroke Welsh Corgi": "A Pembroke Corgi! Smart, energetic, and a little bossy. They'll try to herd you -- we'll channel that instinct.",
  "Bernese Mountain Dog": "A Berner! Big, gentle, and eager to please. They respond beautifully to calm, encouraging training.",
  "Cavalier King Charles Spaniel": "A Cavalier! Sweet and gentle, they're born to be companions. They bond deeply and learn quickly.",
  "Cocker Spaniel": "A Cocker Spaniel! Sensitive and smart -- they pick up on your energy, so keep sessions positive and relaxed.",
  "Jack Russell Terrier": "A Jack Russell! Energetic and quick-witted. Short bursts of training keep them focused and out of mischief.",
  "Samoyed": "A Samoyed! Friendly and clever, but they have a bit of an independent streak. Make training feel like play.",
  "Shiba Inu": "A Shiba Inu! Ancient breed, bold personality. They respond to respect and consistency, not repetition.",
  "Bichon Frise": "A Bichon! Cheerful and smart -- one of the great hypoallergenic companion breeds. They love to learn.",
  "Goldendoodle": "A Goldendoodle! Gets the best of both worlds -- Golden loyalty and Poodle brains. Super easy to work with.",
  "Labradoodle": "A Labradoodle! Friendly, smart, and social. They thrive on interaction and pick up new commands quickly.",
  "Cockapoo": "A Cockapoo! Intelligent and affectionate. One of the most popular mixes for good reason -- very trainable.",
  "Cavapoo": "A Cavapoo! Gentle, smart, and people-loving. They're natural students -- this is going to be fun.",
  "Schnauzer": "A Schnauzer! Clever and spirited. They love having a challenge -- puzzle games and new tricks are their thing.",
  "Miniature Schnauzer": "A Mini Schnauzer! Alert, smart, and surprisingly energetic for their size. Great at learning commands fast.",
  "Whippet": "A Whippet! Elegant and sensitive -- they respond best to gentle encouragement, never harsh corrections.",
  "Weimaraner": "A Weimaraner! Athletic and intelligent, but they get bored fast. Variety and challenge are essential.",
  "Vizsla": "A Vizsla! Gentle, affectionate, and incredibly responsive. Often called the Velcro dog -- they want to be with you.",
};

const DEFAULT_BUDDY_REVEAL = (breed: string, name: string) =>
  name !== "your pup"
    ? `${name}'s a ${breed}! I know this breed well -- let's build a plan that fits them perfectly.`
    : `A ${breed}! I know this breed well -- let's build a plan that fits them perfectly.`;

function getBreedBuddyLine(breed: string, puppyName: string): string {
  // Exact match first
  if (BREED_BUDDY_LINES[breed]) return BREED_BUDDY_LINES[breed]!;
  // Partial match for variants (e.g. "Standard Poodle" -> Poodle)
  for (const [key, line] of Object.entries(BREED_BUDDY_LINES)) {
    if (breed.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(breed.toLowerCase())) {
      return line;
    }
  }
  return DEFAULT_BUDDY_REVEAL(breed, puppyName);
}

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

  // Minimum cycle gate: API result is held until at least 3 text cycles have played (~4.8s)
  // This prevents a "too-instant" result that feels cheap
  const MIN_CYCLES = 3;
  const cycleCountRef = useRef(0);
  const pendingResultRef = useRef<(() => void) | null>(null);
  const isDetectingRef = useRef(false);

  // Queue for photo 2/3 added while photo 1 is still scanning
  const pendingPhotoUrisRef = useRef<string[] | null>(null);
  // Stable ref to runBackgroundDetection so runInitialDetection can call it without
  // creating a circular dependency in useCallback deps
  const runBackgroundDetectionRef = useRef<((uris: string[]) => void) | null>(null);

  // Badge pulse: fires when background re-scan silently upgrades confidence
  const [badgePulse, setBadgePulse] = useState(false);

  /** Array of up to 3 photo URIs for multi-angle breed detection */
  const [photoUris, setPhotoUris] = useState<string[]>(
    data.photoUri ? [data.photoUri] : [],
  );
  const puppyName = data.puppyName || "your pup";
  const nameForDisplay = data.puppyName || null;

  /**
   * Called by BreedScanAnimation each time cycling text advances.
   * Once MIN_CYCLES have passed, release any held result.
   */
  const handleCycle = useCallback(() => {
    cycleCountRef.current += 1;
    if (cycleCountRef.current >= MIN_CYCLES && pendingResultRef.current) {
      const release = pendingResultRef.current;
      pendingResultRef.current = null;
      release();
    }
  }, []);

  /**
   * Apply a detection result to state (shared between initial and background paths).
   * `isBackground` = true for photos 2/3 silent re-scans.
   */
  const applyResult = useCallback(
    (result: NonNullable<Awaited<ReturnType<typeof detectBreed>>>, isBackground: boolean) => {
      if (result.differentDogs) {
        if (!isBackground) {
          setDetection({
            status: "different_dogs",
            message: result.errorMessage ?? "These look like different dogs!",
          });
        }
        // Background: ignore different_dogs (user may have valid pair, keep existing result)
        return;
      }

      if (result.lowConfidence || result.confidence < 40) {
        if (!isBackground) {
          setDetection({ status: "low", suggestions: result.suggestions });
          setShowManualSelector(true);
        }
        return;
      }

      if (result.confidence > 70) {
        updateData({ breed: result.topBreed, breedConfidence: result.confidence, breedDetected: true });
        const next: DetectionState = { status: "high", breed: result.topBreed, confidence: result.confidence };
        if (isBackground) {
          // Check if confidence actually changed meaningfully before pulsing
          const prev = lastSuccessRef.current;
          lastSuccessRef.current = next;
          setDetection((cur) => {
            if (
              (cur.status === "high" || cur.status === "medium") &&
              "confidence" in cur &&
              Math.abs(cur.confidence - result.confidence) < 1 &&
              "breed" in cur &&
              cur.breed === result.topBreed
            ) {
              return cur; // no meaningful change
            }
            return next;
          });
          setBadgePulse(true);
          setTimeout(() => setBadgePulse(false), 700);
        } else {
          lastSuccessRef.current = next;
          setDetection(next);
          if (Platform.OS === "ios") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          }
        }
      } else {
        // Medium confidence (40-70)
        const next: DetectionState = {
          status: "medium",
          breed: result.topBreed,
          confidence: result.confidence,
          suggestions: result.suggestions,
        };
        if (isBackground) {
          lastSuccessRef.current = next;
          setDetection((cur) => {
            if (
              (cur.status === "high" || cur.status === "medium") &&
              "confidence" in cur &&
              Math.abs(cur.confidence - result.confidence) < 1 &&
              "breed" in cur &&
              cur.breed === result.topBreed
            ) {
              return cur;
            }
            return next;
          });
          setBadgePulse(true);
          setTimeout(() => setBadgePulse(false), 700);
        } else {
          lastSuccessRef.current = next;
          setDetection(next);
          if (Platform.OS === "ios") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          }
        }
      }
    },
    [updateData],
  );

  /**
   * PHOTO 1 detection: full scan UX, minimum 3 cycles (~4.8s), haptic on reveal.
   * After 8s: shows "Almost there..." (handled in CyclingText messages).
   * After 15s: graceful fallback to manual selection.
   */
  const runInitialDetection = useCallback(
    async (uris: string[]) => {
      if (uris.length === 0) return;

      isDetectingRef.current = true;
      cycleCountRef.current = 0;
      pendingResultRef.current = null;

      setDetection({ status: "detecting" });
      setDetectionStage("classifying");
      setShowManualSelector(false);
      setIsMixedBreed(false);
      setNotSure(false);

      // Hard timeout -- fallback to manual breed selection.
      // Must be >= detectBreed's internal DETECT_TIMEOUT_MS (35s) to avoid racing it.
      // Sonnet vision calls regularly take 15-25s; 38s gives plenty of headroom.
      const timeoutHandle = setTimeout(() => {
        if (isDetectingRef.current) {
          isDetectingRef.current = false;
          pendingResultRef.current = null;
          setDetection({ status: "manual" });
          setShowManualSelector(true);
        }
      }, 38_000);

      const result = await detectBreed(uris, (stage) => {
        setDetectionStage(stage);
      });

      clearTimeout(timeoutHandle);

      if (!isDetectingRef.current) return; // timed out already
      isDetectingRef.current = false;

      if (!result) {
        if (lastSuccessRef.current) {
          setDetection(lastSuccessRef.current);
        } else {
          setDetection({ status: "manual" });
          setShowManualSelector(true);
        }
        return;
      }

      // Define the reveal function
      const reveal = () => {
        applyResult(result, false);
        // Process any queued photo 2/3 as silent background scan
        if (pendingPhotoUrisRef.current) {
          const queued = pendingPhotoUrisRef.current;
          pendingPhotoUrisRef.current = null;
          runBackgroundDetectionRef.current?.(queued);
        }
      };

      // Hold reveal until MIN_CYCLES have passed
      if (cycleCountRef.current >= MIN_CYCLES) {
        reveal();
      } else {
        pendingResultRef.current = reveal;
      }
    },
    [applyResult],
  );

  /**
   * PHOTOS 2+: completely silent background re-scan.
   * No UI change while running. Updates confidence badge with pulse on success.
   * Failure: keep existing result (lastSuccessRef already handles this).
   */
  const runBackgroundDetection = useCallback(
    async (uris: string[]) => {
      if (uris.length === 0) return;

      const result = await detectBreed(uris, () => {});
      if (!result) return; // keep existing result silently

      applyResult(result, true);
    },
    [applyResult],
  );
  // Keep ref in sync so runInitialDetection can call it safely
  runBackgroundDetectionRef.current = runBackgroundDetection;

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

      setPhotoUris(next);

      if (idx === 0) {
        // Slot 0 (front face) -- always a full initial scan
        updateData({
          photoUri: uri,
          allPhotoUris: validUris,
          breed: undefined,
          breedConfidence: undefined,
          breedDetected: false,
          breedMix1: null,
          breedMix2: null,
        });
        runInitialDetection(validUris);
      } else {
        // Slots 1/2 (side profile / full body) -- silent background re-scan
        // Photo slots in immediately, breed result stays exactly where it is
        updateData({ photoUri: validUris[0]!, allPhotoUris: validUris });

        if (isDetectingRef.current) {
          // Photo 1 still scanning -- queue this for after it completes
          pendingPhotoUrisRef.current = validUris;
        } else {
          runBackgroundDetection(validUris);
        }
      }
    }
  };

  /** Remove a photo from the given slot */
  const removePhoto = (index: number) => {
    const next = photoUris.filter((_, i) => i !== index);

    setPhotoUris(next);

    if (index === 0) {
      // Removing front face -- full reset
      updateData({ photoUri: null, allPhotoUris: [], breed: undefined, breedDetected: false });
      setDetection({ status: "idle" });
      lastSuccessRef.current = null;
      isDetectingRef.current = false;
      pendingResultRef.current = null;
      pendingPhotoUrisRef.current = null;
    } else {
      // Removing a supplemental photo -- just update data, no UI change
      updateData({ allPhotoUris: next });
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
      return nameForDisplay
        ? `Analyzing ${nameForDisplay}'s photo...`
        : "Analyzing your pup's photo...";
    }
    if (detection.status === "high" && "breed" in detection) {
      // Breed-specific reveal line -- the magic moment
      return getBreedBuddyLine(detection.breed, puppyName);
    }
    if (detection.status === "medium" && "breed" in detection) {
      return nameForDisplay
        ? `${nameForDisplay} looks like a ${detection.breed} to me -- does that sound right?`
        : `Looks like a ${detection.breed} to me -- does that sound right?`;
    }
    if (detection.status === "low") {
      return nameForDisplay
        ? `I couldn't get a clear read on ${nameForDisplay} -- what breed is ${nameForDisplay}?`
        : "I couldn't get a clear read -- what breed is your pup?";
    }
    if (detection.status === "different_dogs") {
      return nameForDisplay
        ? `Hmm, these look like different pups! Upload photos of just ${nameForDisplay} so I can get the breed right.`
        : "Hmm, these look like different pups! Upload photos of just your dog so I can get the breed right.";
    }
    if (detection.status === "manual") {
      return nameForDisplay ? `What breed is ${nameForDisplay}?` : "What breed is your pup?";
    }
    if (notSure) {
      return nameForDisplay
        ? `No worries! We'll make a great plan for ${nameForDisplay} either way!`
        : "No worries! We'll make a great plan either way!";
    }
    if (isMixedBreed) {
      return nameForDisplay ? `A mix! What breeds make up ${nameForDisplay}?` : "A mix! What breeds are in the mix?";
    }
    return nameForDisplay
      ? `Let's see ${nameForDisplay}'s face! Upload a photo so I can detect the breed.`
      : "Let's see that cute face! Upload a photo so I can detect the breed.";
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
              ) : detection.status === "high" ? (
                <Animated.View entering={FadeIn.duration(400)}>
                  <BuddyExpression mode="excited" size={80} />
                </Animated.View>
              ) : detection.status === "medium" ? (
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
                      // ScanOverlay only on slot 0 (front face) during initial scan
                      // Slots 1/2 never show scan UI -- background re-scan is invisible
                      const isInitialScan = detection.status === "detecting" && idx === 0;
                      const isDetecting = detection.status === "detecting";
                      return (
                        <View key={idx} style={{ alignItems: "center" }}>
                          <Pressable onPress={() => pickImage(idx)} disabled={isInitialScan}>
                            <View
                              className="rounded-lg overflow-hidden"
                              style={{
                                width: 100,
                                height: 100,
                                borderWidth: 2,
                                borderColor: isInitialScan ? "transparent" : "#FF6B5C",
                                borderRadius: 12,
                              }}
                            >
                              <Image
                                source={{ uri }}
                                style={{ width: 100, height: 100 }}
                                contentFit="cover"
                              />
                              {isInitialScan && <ScanOverlay size={100} />}
                            </View>
                          </Pressable>
                          {!isInitialScan && (
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
                <BreedScanAnimation
                  dogName={puppyName}
                  photoSize={100}
                  stage={detectionStage}
                  onCycle={handleCycle}
                />
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
                entering={FadeInDown.duration(350)}
                style={{ marginTop: 32, alignItems: "center", width: "100%" }}
              >
                {/* Result card -- the magic moment */}
                <Animated.View
                  entering={FadeInDown.duration(300).delay(80)}
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
                  <ConfidenceBadge confidence={detection.confidence} photoCount={photoUris.length} pulse={badgePulse} />
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
                <ConfidenceBadge confidence={detection.confidence} photoCount={photoUris.length} pulse={badgePulse} />

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
