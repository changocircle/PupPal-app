/**
 * ReminderPicker — reusable reminder option for medications, vet visits, etc.
 * Uses expo-notifications for local notifications.
 */

import React, { useState, useCallback } from "react";
import { View, Pressable, Alert, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { Typography } from "@/components/ui";

export type ReminderOption = "1_day_before" | "1_hour_before" | "on_the_day" | "none";

const REMINDER_OPTIONS: { key: ReminderOption; label: string; icon: string }[] = [
  { key: "1_day_before", label: "1 day before", icon: "📅" },
  { key: "1_hour_before", label: "1 hour before", icon: "⏰" },
  { key: "on_the_day", label: "On the day", icon: "🔔" },
  { key: "none", label: "No reminder", icon: "🔕" },
];

interface ReminderPickerProps {
  selected: ReminderOption;
  onSelect: (option: ReminderOption) => void;
  label?: string;
}

export function ReminderPicker({
  selected,
  onSelect,
  label = "Reminder",
}: ReminderPickerProps) {
  return (
    <View className="mb-base">
      <Typography variant="caption" color="secondary" className="mb-xs">
        {label}
      </Typography>
      <View className="flex-row flex-wrap gap-sm">
        {REMINDER_OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            onPress={() => onSelect(opt.key)}
            className={`px-md py-sm rounded-full flex-row items-center gap-xs ${
              selected === opt.key
                ? "bg-primary"
                : "bg-surface border border-border"
            }`}
          >
            <Typography className="text-[12px]">{opt.icon}</Typography>
            <Typography
              variant="caption"
              color={selected === opt.key ? "inverse" : "secondary"}
            >
              {opt.label}
            </Typography>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/**
 * Schedule a local notification for a reminder.
 * Returns the notification identifier for potential cancellation.
 */
export async function scheduleReminder({
  title,
  body,
  dueDate,
  reminderOption,
}: {
  title: string;
  body: string;
  dueDate: Date;
  reminderOption: ReminderOption;
}): Promise<string | null> {
  if (reminderOption === "none") return null;

  // Request permissions
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Notifications Disabled",
      "Enable notifications in Settings to receive reminders.",
    );
    return null;
  }

  // Configure notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Calculate trigger time
  let triggerDate = new Date(dueDate);
  switch (reminderOption) {
    case "1_day_before":
      triggerDate.setDate(triggerDate.getDate() - 1);
      triggerDate.setHours(9, 0, 0, 0); // 9 AM day before
      break;
    case "1_hour_before":
      triggerDate.setHours(triggerDate.getHours() - 1);
      break;
    case "on_the_day":
      triggerDate.setHours(9, 0, 0, 0); // 9 AM on the day
      break;
  }

  // Don't schedule in the past
  if (triggerDate <= new Date()) {
    return null;
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  return identifier;
}
