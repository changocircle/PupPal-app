import React, { useState, useCallback } from 'react';
import { View, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Typography, Card, Button } from '@/components/ui';
import { useSettingsStore } from '@/stores/settingsStore';
import { useOnboardingStore } from '@/stores/onboardingStore';

/**
 * Data & Privacy Screen — PRD-14 §6
 *
 * Data export, privacy toggles (analytics, session recording, targeting),
 * and account deletion with double confirmation.
 */

export default function DataPrivacyScreen() {
  const router = useRouter();
  const settings = useSettingsStore();
  const resetOnboarding = useOnboardingStore((s) => s.reset);

  // Privacy toggles
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [sessionReplayEnabled, setSessionReplayEnabled] = useState(true);
  const [personalizedNotifs, setPersonalizedNotifs] = useState(true);

  // Delete account flow
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleExportAllData = useCallback(() => {
    setExporting(true);
    // In production: calls Supabase Edge Function to generate JSON export
    setTimeout(() => {
      setExporting(false);
      Alert.alert(
        'Export Requested',
        'Your data export has been queued. You\'ll receive a download link via email within 48 hours.',
        [{ text: 'OK' }]
      );
    }, 1500);
  }, []);

  const handleExportHealthRecords = useCallback(() => {
    Alert.alert(
      'Export Health Records',
      'A PDF of your dog\'s health records will be sent to your email within 24 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            Alert.alert('Requested!', 'Check your email for the health records PDF.');
          },
        },
      ]
    );
  }, []);

  const handleDeleteAccount = useCallback(() => {
    if (deleteText !== 'DELETE') return;

    Alert.alert(
      '⚠️ Final Confirmation',
      'This will permanently delete your account, all dogs, training data, health records, photos, and chat history. This cannot be undone.\n\nYour subscription (if any) will also be cancelled.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            // In production: calls Edge Function to queue deletion
            // Clear local state
            resetOnboarding();
            Alert.alert(
              'Account Deleted',
              'Your account and all data have been queued for permanent deletion.',
              [
                {
                  text: 'OK',
                  onPress: () => router.replace('/'),
                },
              ]
            );
          },
        },
      ]
    );
  }, [deleteText, resetOnboarding, router]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Back */}
        <Pressable
          onPress={() => router.back()}
          className="px-xl pt-base pb-sm"
        >
          <Typography variant="body-medium" style={{ color: '#FF6B5C' }}>
            ← Back
          </Typography>
        </Pressable>

        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-xl mb-lg"
        >
          <Typography variant="h1" className="mb-xs">
            Data & Privacy
          </Typography>
          <Typography variant="body-sm" color="secondary">
            We never sell your data. Your privacy matters.
          </Typography>
        </Animated.View>

        {/* ── Your Data ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(80)}
          className="px-xl mb-lg"
        >
          <Typography variant="h3" className="mb-base">
            Your Data
          </Typography>

          <Card className="mb-sm">
            <Pressable onPress={handleExportAllData} disabled={exporting}>
              <View className="flex-row items-center justify-between">
                <View>
                  <Typography variant="body-medium">
                    Export All Data
                  </Typography>
                  <Typography variant="caption" color="secondary">
                    Download everything as JSON
                  </Typography>
                </View>
                <Typography variant="body" color="tertiary">
                  {exporting ? '⏳' : '→'}
                </Typography>
              </View>
            </Pressable>
          </Card>

          <Card>
            <Pressable onPress={handleExportHealthRecords}>
              <View className="flex-row items-center justify-between">
                <View>
                  <Typography variant="body-medium">
                    Export Health Records
                  </Typography>
                  <Typography variant="caption" color="secondary">
                    PDF for your veterinarian
                  </Typography>
                </View>
                <Typography variant="body" color="tertiary">→</Typography>
              </View>
            </Pressable>
          </Card>
        </Animated.View>

        {/* ── Privacy Toggles ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(160)}
          className="px-xl mb-lg"
        >
          <Typography variant="h3" className="mb-base">
            Privacy
          </Typography>

          <Card className="mb-sm">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-md">
                <Typography variant="body-medium">Analytics</Typography>
                <Typography variant="caption" color="secondary">
                  Help us improve PupPal with anonymous usage data
                </Typography>
              </View>
              <Pressable
                onPress={() => setAnalyticsEnabled(!analyticsEnabled)}
                className={`w-[50px] h-[30px] rounded-full justify-center ${
                  analyticsEnabled ? 'bg-primary items-end' : 'bg-neutral-300 items-start'
                }`}
              >
                <View className="w-[26px] h-[26px] rounded-full bg-white mx-[2px]" />
              </Pressable>
            </View>
          </Card>

          <Card className="mb-sm">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-md">
                <Typography variant="body-medium">Session Recording</Typography>
                <Typography variant="caption" color="secondary">
                  Screen recordings help us fix bugs (never shared)
                </Typography>
              </View>
              <Pressable
                onPress={() => setSessionReplayEnabled(!sessionReplayEnabled)}
                className={`w-[50px] h-[30px] rounded-full justify-center ${
                  sessionReplayEnabled ? 'bg-primary items-end' : 'bg-neutral-300 items-start'
                }`}
              >
                <View className="w-[26px] h-[26px] rounded-full bg-white mx-[2px]" />
              </Pressable>
            </View>
          </Card>

          <Card>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-md">
                <Typography variant="body-medium">Personalized Notifications</Typography>
                <Typography variant="caption" color="secondary">
                  Notifications tailored to your training progress
                </Typography>
              </View>
              <Pressable
                onPress={() => setPersonalizedNotifs(!personalizedNotifs)}
                className={`w-[50px] h-[30px] rounded-full justify-center ${
                  personalizedNotifs ? 'bg-primary items-end' : 'bg-neutral-300 items-start'
                }`}
              >
                <View className="w-[26px] h-[26px] rounded-full bg-white mx-[2px]" />
              </Pressable>
            </View>
          </Card>
        </Animated.View>

        {/* ── Delete Account ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(240)}
          className="px-xl mb-xl"
        >
          <Typography variant="h3" className="mb-base" style={{ color: '#EF6461' }}>
            Delete Account
          </Typography>

          {!showDeleteConfirm ? (
            <Card className="border-error/20">
              <Typography variant="body-sm" color="secondary" className="mb-base">
                Permanently delete your account and all associated data including
                dogs, training progress, health records, photos, chat history,
                and subscription.
              </Typography>
              <Button
                label="Delete Account & All Data"
                variant="ghost"
                onPress={() => setShowDeleteConfirm(true)}
              />
            </Card>
          ) : (
            <Card className="bg-error-light border-error/30">
              <Typography variant="body-sm-medium" className="mb-sm" style={{ color: '#EF6461' }}>
                ⚠️ This action is irreversible
              </Typography>
              <Typography variant="body-sm" color="secondary" className="mb-base">
                Type DELETE below to confirm:
              </Typography>
              <TextInput
                value={deleteText}
                onChangeText={setDeleteText}
                placeholder="Type DELETE"
                className="bg-surface border border-error/30 rounded-lg px-md py-sm mb-base text-[15px]"
                autoCapitalize="characters"
              />
              <View className="flex-row gap-sm">
                <Button
                  label="Cancel"
                  variant="secondary"
                  size="sm"
                  onPress={() => {
                    setShowDeleteConfirm(false);
                    setDeleteText('');
                  }}
                  fullWidth
                />
                <Button
                  label="Delete Forever"
                  variant="primary"
                  size="sm"
                  onPress={handleDeleteAccount}
                  fullWidth
                />
              </View>
            </Card>
          )}
        </Animated.View>

        {/* ── Privacy Policy link ── */}
        <View className="px-xl items-center mb-xl">
          <Typography variant="caption" color="secondary" className="text-center">
            Read our{' '}
            <Typography
              variant="caption"
              style={{ color: '#FF6B5C', textDecorationLine: 'underline' }}
              onPress={() => Alert.alert('Privacy Policy', 'Opens privacy policy page.')}
            >
              Privacy Policy
            </Typography>
          </Typography>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
