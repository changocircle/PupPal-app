/**
 * Settings Store, Zustand + AsyncStorage
 * PRD-14: user preferences, units, and notification settings.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { WeightUnit } from "@/types/health";

export type TemperatureUnit = "F" | "C";
export type AppLanguage = "en" | "es" | "fr" | "de" | "pt";

interface SettingsState {
  // Profile
  userName: string;
  userEmail: string;
  userAvatar: string | null;

  // Preferences
  weightUnit: WeightUnit;
  temperatureUnit: TemperatureUnit;
  notificationsEnabled: boolean;
  trainingReminderEnabled: boolean;
  trainingReminderTime: string; // "HH:MM" format
  healthRemindersEnabled: boolean;
  dailyTipEnabled: boolean;
  language: AppLanguage;

  /** Dev-only: force premium ON for testing (persisted) */
  devPremiumOverride: boolean;

  // Actions
  setUserName: (name: string) => void;
  setUserEmail: (email: string) => void;
  setUserAvatar: (uri: string | null) => void;
  setWeightUnit: (unit: WeightUnit) => void;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setTrainingReminderEnabled: (enabled: boolean) => void;
  setTrainingReminderTime: (time: string) => void;
  setHealthRemindersEnabled: (enabled: boolean) => void;
  setDailyTipEnabled: (enabled: boolean) => void;
  setLanguage: (lang: AppLanguage) => void;

  /** Toggle dev premium override (5-tap easter egg on profile) */
  toggleDevPremium: () => void;

  /** Reset all settings to defaults (call on sign-out) */
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Defaults
      userName: "",
      userEmail: "",
      userAvatar: null,
      weightUnit: "lbs",
      temperatureUnit: "F",
      notificationsEnabled: true,
      trainingReminderEnabled: true,
      trainingReminderTime: "09:00",
      healthRemindersEnabled: true,
      dailyTipEnabled: true,
      language: "en",
      devPremiumOverride: false,

      setUserName: (name) => set({ userName: name }),
      setUserEmail: (email) => set({ userEmail: email }),
      setUserAvatar: (uri) => set({ userAvatar: uri }),
      setWeightUnit: (unit) => set({ weightUnit: unit }),
      setTemperatureUnit: (unit) => set({ temperatureUnit: unit }),
      setNotificationsEnabled: (enabled) =>
        set({ notificationsEnabled: enabled }),
      setTrainingReminderEnabled: (enabled) =>
        set({ trainingReminderEnabled: enabled }),
      setTrainingReminderTime: (time) =>
        set({ trainingReminderTime: time }),
      setHealthRemindersEnabled: (enabled) =>
        set({ healthRemindersEnabled: enabled }),
      setDailyTipEnabled: (enabled) => set({ dailyTipEnabled: enabled }),
      setLanguage: (lang) => set({ language: lang }),

      toggleDevPremium: () =>
        set((state) => ({ devPremiumOverride: !state.devPremiumOverride })),

      resetSettings: () => {
        set({
          userName: "",
          userEmail: "",
          userAvatar: null,
          weightUnit: "lbs",
          temperatureUnit: "F" as const,
          notificationsEnabled: true,
          trainingReminderEnabled: true,
          trainingReminderTime: "09:00",
          healthRemindersEnabled: true,
          dailyTipEnabled: true,
          language: "en" as const,
          devPremiumOverride: false,
        });
      },
    }),
    {
      name: "puppal-settings",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
