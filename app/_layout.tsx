// Polyfill crypto.getRandomValues for Hermes (must be first import)
import "react-native-get-random-values";
import "../global.css";
import React, { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/ui";
import { setupNotifications, addNotificationResponseListener } from "@/services/notifications";
import { analytics } from "@/services/analytics";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import * as SplashScreen from "expo-splash-screen";

// Prevent splash screen from auto-hiding until fonts are loaded
SplashScreen.preventAutoHideAsync();

// TanStack Query client with offline persistence config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const router = useRouter();

  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Initialize notifications and analytics
  useEffect(() => {
    setupNotifications();
    analytics.initialize();

    // Deep link handler for notification taps
    const cleanup = addNotificationResponseListener((screen) => {
      router.push(screen as any);
    });

    return cleanup;
  }, [router]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ErrorBoundary screen="root">
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#FFFAF7" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="exercise/[id]"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen name="journal/index" />
        <Stack.Screen
          name="journal/add"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen name="breeds/index" />
        <Stack.Screen name="breeds/[slug]" />
        <Stack.Screen
          name="add-dog/index"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen name="dog/[id]/manage" />
        <Stack.Screen
          name="paywall"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen name="achievements/index" />
        <Stack.Screen name="health/vaccinations" />
        <Stack.Screen name="health/medications" />
        <Stack.Screen name="health/weight" />
        <Stack.Screen name="health/vet-visits" />
        <Stack.Screen name="health/milestones" />
        <Stack.Screen name="health/notes" />
        <Stack.Screen name="tricks/index" />
        <Stack.Screen name="tricks/[slug]" />
        <Stack.Screen
          name="tricks/detail/[id]"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen name="settings/subscription" />
        <Stack.Screen name="settings/notifications" />
        <Stack.Screen name="settings/data-privacy" />
        <Stack.Screen name="settings/edit-profile" />
        <Stack.Screen name="settings/preferences" />
        <Stack.Screen name="referral/index" />
      </Stack>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}
