import React from "react";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { Typography } from "@/components/ui";
import { COLORS } from "@/constants/theme";
import { useDogSync } from "@/hooks/useDogSync";
import { useTrainingSync } from "@/hooks/useTrainingSync";
import { useChatSync } from "@/hooks/useChatSync";
import { useGamificationSync } from "@/hooks/useGamificationSync";

/**
 * Main Tab Navigation Layout
 * PRD-01 + DESIGN-SYSTEM.md + PRD-15 Community
 *
 * 6 tabs: Home, Chat, Plan, Health, Community, Profile
 * Bottom tab bar with coral active state.
 */

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View className={`items-center justify-center ${focused ? "opacity-100" : "opacity-50"}`}>
      <Typography className="text-[24px]">{emoji}</Typography>
    </View>
  );
}

export default function TabLayout() {
  // Initialize sync layers (run when user is authenticated)
  useDogSync();
  useTrainingSync();
  useChatSync();
  useGamificationSync();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary.DEFAULT,
        tabBarInactiveTintColor: COLORS.text.tertiary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 4,
          height: 85,
        },
        tabBarLabelStyle: {
          fontFamily: "PlusJakartaSans_500Medium",
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Buddy",
          tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: "Plan",
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: "Health",
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏥" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />

    </Tabs>
  );
}
