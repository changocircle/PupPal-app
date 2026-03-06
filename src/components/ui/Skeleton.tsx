import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

/**
 * Skeleton loader per PupPal Design System.
 * "Never empty white screens", always show skeleton while loading.
 */

interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
}

export function Skeleton({ width = "100%", height = 20, radius = 8 }: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[animatedStyle, { width: width as number, height, borderRadius: radius }]}
      className="bg-border"
    />
  );
}

/** Pre-built skeleton for a card with title + 2 lines */
export function CardSkeleton() {
  return (
    <View className="bg-surface rounded-md p-base gap-md shadow-card">
      <Skeleton width="60%" height={24} />
      <Skeleton width="100%" height={16} />
      <Skeleton width="80%" height={16} />
    </View>
  );
}
