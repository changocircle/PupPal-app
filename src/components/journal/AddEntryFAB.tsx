import React from "react";
import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Typography } from "@/components/ui";
import { COLORS, SHADOWS } from "@/constants/theme";

/**
 * AddEntryFAB — Floating action button for "+ Add Memory".
 * Fixed to bottom-right of the timeline screen.
 */

interface AddEntryFABProps {
  onPress: () => void;
}

export function AddEntryFAB({ onPress }: AddEntryFABProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: "absolute",
          bottom: 24,
          right: 20,
          ...SHADOWS.elevated,
        },
      ]}
    >
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.92, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
        onPress={onPress}
        className="flex-row items-center px-lg py-md rounded-full"
        style={{ backgroundColor: COLORS.primary.DEFAULT }}
      >
        <Typography variant="body-medium" color="inverse" className="text-text-inverse">
          + Add Memory
        </Typography>
      </Pressable>
    </Animated.View>
  );
}
