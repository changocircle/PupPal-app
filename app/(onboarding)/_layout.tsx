import React from "react";
import { Stack } from "expo-router";

/**
 * Onboarding Layout
 *
 * No tab bar, no header, clean full-screen flow.
 * Custom back navigation handled per-screen.
 * No progress bar (Lemonade principle, branching logic makes progress bars misleading).
 */
export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#FFFAF7" },
        animation: "slide_from_right",
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" options={{ gestureEnabled: false }} />
      <Stack.Screen name="name" />
      <Stack.Screen name="photo" />
      <Stack.Screen name="age" />
      <Stack.Screen name="challenges" />
      <Stack.Screen name="experience" />
      <Stack.Screen name="plan-preview" />
      <Stack.Screen name="paywall" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
