/**
 * XpFloatUp, "+15 XP" animated label that floats up and fades
 * DESIGN-SYSTEM.md: accent gold, float up 40px over 600ms, fade out
 */

import React, { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { COLORS } from "@/constants/theme";

interface XpFloatUpProps {
  amount: number;
  visible: boolean;
  onComplete?: () => void;
}

export function XpFloatUp({ amount, visible, onComplete }: XpFloatUpProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    translateY.value = 0;
    opacity.value = 0;

    // Animate: appear → float up → fade out
    opacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withDelay(300, withTiming(0, { duration: 200 }))
    );

    translateY.value = withTiming(-40, { duration: 600 }, (finished) => {
      if (finished && onComplete) {
        runOnJS(onComplete)();
      }
    });
  }, [visible, amount]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.Text
      style={[
        {
          color: COLORS.accent.dark,
          fontWeight: "700",
          fontSize: 16,
          textAlign: "center",
        },
        style,
      ]}
    >
      +{amount} points
    </Animated.Text>
  );
}
