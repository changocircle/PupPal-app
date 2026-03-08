/**
 * Breed Scan Animation
 * PRD-01 Screen 3, DESIGN-SYSTEM.md "Photo scan animation"
 *
 * Premium "magic moment" loading sequence during breed detection.
 * Three layers:
 *   1. Light sweep overlay on the photo (gradient shimmer left->right)
 *   2. Cycling fun text messages below the photo
 *   3. Animated dot progress indicator
 *
 * Uses Reanimated 4 only (Moti is banned).
 */

import React, { useEffect, useState } from "react";
import { View, Dimensions, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  FadeIn,
  FadeOut,
  Easing,
  LinearTransition,
} from "react-native-reanimated";
import { Typography } from "@/components/ui";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// --- Config ---

const SWEEP_DURATION = 1500;
const SWEEP_WIDTH = 80;
const TEXT_CYCLE_MS = 2200;

// --- Buddy Expression Component ---

/**
 * Buddy character display using Image assets.
 * Three modes: thinking (scan), excited (high confidence result), teaching (alternatives).
 */
export type BuddyMode = "thinking" | "excited" | "teaching";

const BUDDY_IMAGES: Record<BuddyMode, any> = {
  thinking: require('../../../assets/buddy/buddy-thinking.png'),
  excited:  require('../../../assets/buddy/buddy-celebrating.png'),
  teaching: require('../../../assets/buddy/buddy-teaching.png'),
};

interface BuddyExpressionProps {
  mode: BuddyMode;
  size?: number;
}

export function BuddyExpression({ mode, size = 48 }: BuddyExpressionProps) {
  // Gentle float — 4px bob at 1.8s period, no aggressive scale pulse.
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0,  { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Image
        source={BUDDY_IMAGES[mode]}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

// --- Scan Overlay ---

/**
 * Translucent light sweep that slides left-to-right across the photo.
 * Pure Reanimated, no LinearGradient dependency.
 *
 * Uses multiple stacked semi-transparent white strips at varying opacities
 * to simulate a gradient sweep effect.
 */
function ScanOverlay({ size }: { size: number }) {
  const translateX = useSharedValue(-SWEEP_WIDTH);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(size + SWEEP_WIDTH, {
        duration: SWEEP_DURATION,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      false,
    );
  }, [size]);

  // Build 5 strips to simulate a gradient (edge->center->edge opacity)
  const strips = [
    { offset: 0, opacity: 0.03, width: SWEEP_WIDTH * 0.2 },
    { offset: SWEEP_WIDTH * 0.2, opacity: 0.08, width: SWEEP_WIDTH * 0.2 },
    { offset: SWEEP_WIDTH * 0.4, opacity: 0.15, width: SWEEP_WIDTH * 0.2 },
    { offset: SWEEP_WIDTH * 0.6, opacity: 0.08, width: SWEEP_WIDTH * 0.2 },
    { offset: SWEEP_WIDTH * 0.8, opacity: 0.03, width: SWEEP_WIDTH * 0.2 },
  ];

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        borderRadius: 12,
      }}
      pointerEvents="none"
    >
      {strips.map((strip, i) => {
        const style = useAnimatedStyle(() => ({
          transform: [{ translateX: translateX.value + strip.offset }],
        }));

        return (
          <Animated.View
            key={i}
            style={[
              style,
              {
                position: "absolute",
                top: 0,
                bottom: 0,
                width: strip.width,
                backgroundColor: `rgba(255, 255, 255, ${strip.opacity})`,
              },
            ]}
          />
        );
      })}

      {/* Subtle pulsing border glow */}
      <PulsingBorder size={size} />
    </View>
  );
}

/** Subtle pulsing coral border around the photo during scan */
function PulsingBorder({ size }: { size: number }) {
  const borderOpacity = useSharedValue(0.3);

  useEffect(() => {
    borderOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    borderColor: `rgba(255, 107, 92, ${borderOpacity.value})`,
  }));

  return (
    <Animated.View
      style={[
        style,
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderWidth: 2,
          borderRadius: 12,
        },
      ]}
    />
  );
}

// --- Cycling Text ---

interface CyclingTextProps {
  dogName: string;
}

function CyclingText({ dogName }: CyclingTextProps) {
  const name = dogName && dogName !== "your pup" ? dogName : null;

  const messages = name
    ? [
        `Analyzing ${name}'s features...`,
        "Checking ear shape...",
        "Examining coat pattern...",
        "Comparing with 51 breeds...",
        "Looking at facial structure...",
        "Checking paw size...",
        `Almost there, ${name}...`,
      ]
    : [
        "Analyzing your pup's features...",
        "Checking ear shape...",
        "Examining coat pattern...",
        "Comparing with 51 breeds...",
        "Looking at facial structure...",
        "Checking paw size...",
        "Almost there...",
      ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, TEXT_CYCLE_MS);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <View style={{ height: 24, justifyContent: "center", alignItems: "center" }}>
      <Animated.View
        key={index}
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        layout={LinearTransition.duration(200)}
      >
        <Typography variant="body-sm" color="secondary" style={{ textAlign: "center" }}>
          {messages[index]}
        </Typography>
      </Animated.View>
    </View>
  );
}

// --- Progress Dots ---

/** Three animated dots that pulse in sequence, similar to the chat typing indicator */
function ProgressDots() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
      <AnimatedDot delay={0} />
      <AnimatedDot delay={150} />
      <AnimatedDot delay={300} />
      <AnimatedDot delay={450} />
      <AnimatedDot delay={600} />
    </View>
  );
}

function AnimatedDot({ delay }: { delay: number }) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
          withTiming(0.6, { duration: 400, easing: Easing.in(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 400 }),
          withTiming(0.3, { duration: 400 }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        style,
        {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: "#FF6B5C",
        },
      ]}
    />
  );
}

// --- Scan Progress Bar ---

/**
 * Indeterminate progress bar that sweeps back and forth.
 * Not a percentage, just animated movement to show activity.
 */
function ScanProgressBar() {
  const position = useSharedValue(0);

  useEffect(() => {
    position.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const barStyle = useAnimatedStyle(() => {
    const trackWidth = SCREEN_WIDTH - 96;
    const fillWidth = trackWidth * 0.35;
    const maxTranslate = trackWidth - fillWidth;

    return {
      width: fillWidth,
      transform: [{ translateX: position.value * maxTranslate }],
    };
  });

  return (
    <View
      style={{
        height: 3,
        backgroundColor: "#F0EBE6",
        borderRadius: 2,
        overflow: "hidden",
        marginHorizontal: 16,
      }}
    >
      <Animated.View
        style={[
          barStyle,
          {
            height: 3,
            borderRadius: 2,
            backgroundColor: "#FF6B5C",
          },
        ]}
      />
    </View>
  );
}

// --- Main Export ---

interface BreedScanAnimationProps {
  /** The dog's name for personalized text */
  dogName: string;
  /** Width/height of the photo being scanned */
  photoSize: number;
}

/**
 * Full breed scan loading sequence.
 *
 * Renders as an overlay on the photo grid area + status below.
 * Mount when detection starts, unmount when it completes.
 *
 * Usage:
 *   {detection.status === "detecting" && (
 *     <BreedScanAnimation dogName={puppyName} photoSize={100} />
 *   )}
 */
export function BreedScanAnimation({ dogName, photoSize }: BreedScanAnimationProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={{ alignItems: "center", gap: 16 }}
    >
      {/* Cycling status text */}
      <CyclingText dogName={dogName} />

      {/* Indeterminate progress bar */}
      <View style={{ width: "100%", paddingHorizontal: 8 }}>
        <ScanProgressBar />
      </View>

      {/* Progress dots */}
      <ProgressDots />
    </Animated.View>
  );
}

/**
 * Scan overlay to position on top of photo thumbnails.
 * Wrap each photo in a relative container and render this inside.
 */
export { ScanOverlay };
