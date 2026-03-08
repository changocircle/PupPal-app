/**
 * Notification Settings Screen, PRD-09 §8
 *
 * Toggle notification categories, set preferred training time,
 * and manage system permission.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, Pressable, Switch, Linking, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Typography, Card, Badge } from '@/components/ui';
import {
  getPermissionStatus,
  getNotificationPrefs,
  setNotificationPrefs,
  type NotificationPreferences,
} from '@/services/notifications';
import { COLORS, RADIUS } from '@/constants/theme';

interface ToggleRowProps {
  emoji: string;
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({ emoji, label, description, value, onChange }: ToggleRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
      }}
    >
      <Typography style={{ fontSize: 22 }}>{emoji}</Typography>
      <View style={{ flex: 1 }}>
        <Typography variant="body" style={{ fontWeight: '600' }}>
          {label}
        </Typography>
        <Typography variant="caption" color="secondary">
          {description}
        </Typography>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: COLORS.border, true: COLORS.primary.DEFAULT }}
        thumbColor="#fff"
      />
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [permission, setPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    (async () => {
      const [status, savedPrefs] = await Promise.all([
        getPermissionStatus(),
        getNotificationPrefs(),
      ]);
      setPermission(status);
      setPrefs(savedPrefs);
    })();
  }, []);

  const updatePref = useCallback(
    async (key: keyof NotificationPreferences, value: boolean) => {
      if (!prefs) return;
      const updated = { ...prefs, [key]: value };
      setPrefs(updated);
      await setNotificationPrefs({ [key]: value });
    },
    [prefs]
  );

  const handleOpenSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openSettings();
    } else {
      Linking.openSettings();
    }
  };

  const handleTimeSelect = () => {
    // Simple hour picker via alert (in production: use a time picker)
    const hours = ['7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'];
    const hourValues = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '18:00', '19:00', '20:00'];

    Alert.alert(
      'Training Reminder Time',
      'When should we remind you to train?',
      hours.map((label, i) => ({
        text: label,
        onPress: async () => {
          const updated = { ...prefs!, preferred_time: hourValues[i]! };
          setPrefs(updated);
          await setNotificationPrefs({ preferred_time: hourValues[i] });
        },
      }))
    );
  };

  if (!prefs) return null;

  const formatTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    if (h === undefined || m === undefined) return t;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <Pressable onPress={() => router.back()}>
          <Typography variant="h3" style={{ fontSize: 24 }}>←</Typography>
        </Pressable>
        <Typography variant="h3" style={{ flex: 1, textAlign: 'center' }}>
          Notifications
        </Typography>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission status */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <Card style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body" style={{ fontWeight: '700' }}>
                Push Notifications
              </Typography>
              <Badge
                label={permission === 'granted' ? 'Enabled' : permission === 'denied' ? 'Disabled' : 'Not Set'}
                variant={permission === 'granted' ? 'success' : 'warning'}
                size="sm"
              />
            </View>

            {permission !== 'granted' && (
              <Pressable
                onPress={handleOpenSettings}
                style={{
                  marginTop: 12,
                  backgroundColor: COLORS.primary.light,
                  padding: 12,
                  borderRadius: RADIUS.md,
                  alignItems: 'center',
                }}
              >
                <Typography variant="body" style={{ color: COLORS.primary.DEFAULT, fontWeight: '600' }}>
                  Enable in Settings →
                </Typography>
              </Pressable>
            )}
          </Card>
        </Animated.View>

        {/* Preferred time */}
        <Animated.View entering={FadeInDown.duration(300).delay(100)}>
          <Pressable onPress={handleTimeSelect}>
            <Card style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Typography style={{ fontSize: 22 }}>⏰</Typography>
                  <View>
                    <Typography variant="body" style={{ fontWeight: '600' }}>
                      Training Time
                    </Typography>
                    <Typography variant="caption" color="secondary">
                      Daily reminder time
                    </Typography>
                  </View>
                </View>
                <Typography variant="body" style={{ color: COLORS.primary.DEFAULT, fontWeight: '600' }}>
                  {formatTime(prefs.preferred_time)}
                </Typography>
              </View>
            </Card>
          </Pressable>
        </Animated.View>

        {/* Category toggles */}
        {/* SET-02: NOTE: OneSignal not yet connected - preferences saved locally only */}
        <Animated.View entering={FadeInDown.duration(300).delay(200)}>
          <Typography variant="h3" style={{ marginBottom: 12 }}>
            Categories
          </Typography>
          <Card>
            <ToggleRow
              emoji="📋"
              label="Training Reminders"
              description="Daily nudge to train with your pup"
              value={prefs.training_reminders}
              onChange={(v) => updatePref('training_reminders', v)}
            />
            <ToggleRow
              emoji="🔥"
              label="Streak Reminders"
              description="Evening alert when streak is at risk"
              value={prefs.streak_reminders}
              onChange={(v) => updatePref('streak_reminders', v)}
            />
            <ToggleRow
              emoji="💉"
              label="Health Reminders"
              description="Vaccination, vet visits, medication"
              value={prefs.health_reminders}
              onChange={(v) => updatePref('health_reminders', v)}
            />
            <ToggleRow
              emoji="🏆"
              label="Achievements"
              description="Celebrations when you hit milestones"
              value={prefs.achievements}
              onChange={(v) => updatePref('achievements', v)}
            />
            <ToggleRow
              emoji="🐕"
              label="Buddy Tips"
              description="Contextual tips based on your plan"
              value={prefs.buddy_tips}
              onChange={(v) => updatePref('buddy_tips', v)}
            />
            <View style={{ paddingVertical: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Typography style={{ fontSize: 22 }}>📢</Typography>
                <View style={{ flex: 1 }}>
                  <Typography variant="body" style={{ fontWeight: '600' }}>
                    Product Updates
                  </Typography>
                  <Typography variant="caption" color="secondary">
                    New features and improvements
                  </Typography>
                </View>
                <Switch
                  value={prefs.marketing}
                  onValueChange={(v) => updatePref('marketing', v)}
                  trackColor={{ false: COLORS.border, true: COLORS.primary.DEFAULT }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Info */}
        <Animated.View entering={FadeInDown.duration(300).delay(300)}>
          <View
            style={{
              marginTop: 24,
              backgroundColor: COLORS.accent.light,
              padding: 16,
              borderRadius: RADIUS.lg,
            }}
          >
            <Typography variant="caption" color="secondary" style={{ textAlign: 'center', lineHeight: 18 }}>
              PupPal only sends notifications that help your training journey.
              We'll never spam you, promise! 🐾
            </Typography>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
