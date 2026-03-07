import React from "react";
import { View, ScrollView, Pressable, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Typography, Card } from "@/components/ui";
import { useSettingsStore, type AppLanguage } from "@/stores/settingsStore";
import { useHealthStore } from "@/stores/healthStore";

const LANGUAGES: { key: AppLanguage; label: string; flag: string }[] = [
  { key: "en", label: "English", flag: "🇬🇧" },
  { key: "es", label: "Español", flag: "🇪🇸" },
  { key: "fr", label: "Français", flag: "🇫🇷" },
  { key: "de", label: "Deutsch", flag: "🇩🇪" },
  { key: "pt", label: "Português", flag: "🇧🇷" },
];

/**
 * Preferences Screen, PRD-14 §5
 *
 * Notifications, units, training reminders.
 */

export default function PreferencesScreen() {
  const router = useRouter();

  const {
    weightUnit,
    temperatureUnit,
    notificationsEnabled,
    trainingReminderEnabled,
    trainingReminderTime,
    healthRemindersEnabled,
    dailyTipEnabled,
    setWeightUnit,
    setTemperatureUnit,
    setNotificationsEnabled,
    setTrainingReminderEnabled,
    setHealthRemindersEnabled,
    setDailyTipEnabled,
    language,
    setLanguage,
  } = useSettingsStore();

  const setHealthUnit = useHealthStore((s) => s.setPreferredWeightUnit);

  const handleWeightToggle = () => {
    const newUnit = weightUnit === "lbs" ? "kg" : "lbs";
    setWeightUnit(newUnit);
    setHealthUnit(newUnit);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <Pressable
          onPress={() => router.back()}
          className="px-xl pt-base pb-sm"
        >
          <Typography variant="body-medium" style={{ color: "#FF6B5C" }}>
            ← Back
          </Typography>
        </Pressable>

        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-xl mb-xl"
        >
          <Typography variant="h1">⚙️ Preferences</Typography>
        </Animated.View>

        {/* ── Units ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(60)}
          className="px-xl mb-lg"
        >
          <Typography
            variant="body-sm-medium"
            color="secondary"
            className="mb-sm uppercase tracking-wide"
          >
            Units
          </Typography>

          <Card>
            {/* Weight */}
            <Pressable
              onPress={handleWeightToggle}
              className="flex-row items-center justify-between py-md border-b border-border"
            >
              <View>
                <Typography variant="body-medium">Weight</Typography>
                <Typography variant="caption" color="secondary">
                  Weight entries & growth chart
                </Typography>
              </View>
              <View className="flex-row bg-surface border border-border rounded-xl overflow-hidden">
                <View
                  className={`px-lg py-sm ${weightUnit === "lbs" ? "bg-primary" : ""}`}
                >
                  <Typography
                    variant="body-sm-medium"
                    color={weightUnit === "lbs" ? "inverse" : "secondary"}
                  >
                    lbs
                  </Typography>
                </View>
                <View
                  className={`px-lg py-sm ${weightUnit === "kg" ? "bg-primary" : ""}`}
                >
                  <Typography
                    variant="body-sm-medium"
                    color={weightUnit === "kg" ? "inverse" : "secondary"}
                  >
                    kg
                  </Typography>
                </View>
              </View>
            </Pressable>

            {/* Temperature */}
            <Pressable
              onPress={() =>
                setTemperatureUnit(temperatureUnit === "F" ? "C" : "F")
              }
              className="flex-row items-center justify-between py-md"
            >
              <View>
                <Typography variant="body-medium">Temperature</Typography>
                <Typography variant="caption" color="secondary">
                  Health observations
                </Typography>
              </View>
              <View className="flex-row bg-surface border border-border rounded-xl overflow-hidden">
                <View
                  className={`px-lg py-sm ${temperatureUnit === "F" ? "bg-primary" : ""}`}
                >
                  <Typography
                    variant="body-sm-medium"
                    color={temperatureUnit === "F" ? "inverse" : "secondary"}
                  >
                    °F
                  </Typography>
                </View>
                <View
                  className={`px-lg py-sm ${temperatureUnit === "C" ? "bg-primary" : ""}`}
                >
                  <Typography
                    variant="body-sm-medium"
                    color={temperatureUnit === "C" ? "inverse" : "secondary"}
                  >
                    °C
                  </Typography>
                </View>
              </View>
            </Pressable>
          </Card>
        </Animated.View>

        {/* ── Language ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(90)}
          className="px-xl mb-lg"
        >
          <Typography
            variant="body-sm-medium"
            color="secondary"
            className="mb-sm uppercase tracking-wide"
          >
            Language
          </Typography>

          <Card>
            {LANGUAGES.map((lang, index) => (
              <Pressable
                key={lang.key}
                onPress={() => setLanguage(lang.key)}
                className={`flex-row items-center justify-between py-md ${
                  index < LANGUAGES.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <View className="flex-row items-center gap-sm">
                  <Typography className="text-[20px]">{lang.flag}</Typography>
                  <Typography variant="body-medium">{lang.label}</Typography>
                </View>
                {language === lang.key && (
                  <Typography variant="body-medium" style={{ color: "#FF6B5C" }}>
                    ✓
                  </Typography>
                )}
              </Pressable>
            ))}
          </Card>
          <Typography variant="caption" color="tertiary" className="mt-xs px-sm">
            More languages coming soon!
          </Typography>
        </Animated.View>

        {/* ── Notifications ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(150)}
          className="px-xl mb-lg"
        >
          <Typography
            variant="body-sm-medium"
            color="secondary"
            className="mb-sm uppercase tracking-wide"
          >
            Notifications
          </Typography>

          <Card>
            {/* Push notifications */}
            <View className="flex-row items-center justify-between py-md border-b border-border">
              <View className="flex-1 mr-md">
                <Typography variant="body-medium">
                  Push Notifications
                </Typography>
                <Typography variant="caption" color="secondary">
                  Allow PupPal to send notifications
                </Typography>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ true: "#FF6B5C" }}
              />
            </View>

            {/* Training reminder */}
            <View className="flex-row items-center justify-between py-md border-b border-border">
              <View className="flex-1 mr-md">
                <Typography variant="body-medium">
                  Training Reminders
                </Typography>
                <Typography variant="caption" color="secondary">
                  Daily reminder at {trainingReminderTime}
                </Typography>
              </View>
              <Switch
                value={trainingReminderEnabled}
                onValueChange={setTrainingReminderEnabled}
                trackColor={{ true: "#FF6B5C" }}
              />
            </View>

            {/* Health reminders */}
            <View className="flex-row items-center justify-between py-md border-b border-border">
              <View className="flex-1 mr-md">
                <Typography variant="body-medium">
                  Health Reminders
                </Typography>
                <Typography variant="caption" color="secondary">
                  Vaccination, medication & vet reminders
                </Typography>
              </View>
              <Switch
                value={healthRemindersEnabled}
                onValueChange={setHealthRemindersEnabled}
                trackColor={{ true: "#FF6B5C" }}
              />
            </View>

            {/* Daily tip */}
            <View className="flex-row items-center justify-between py-md">
              <View className="flex-1 mr-md">
                <Typography variant="body-medium">Daily Tips</Typography>
                <Typography variant="caption" color="secondary">
                  Buddy's daily training tip
                </Typography>
              </View>
              <Switch
                value={dailyTipEnabled}
                onValueChange={setDailyTipEnabled}
                trackColor={{ true: "#FF6B5C" }}
              />
            </View>
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
