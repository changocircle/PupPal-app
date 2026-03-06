/**
 * Push Notification Service, PRD-09
 *
 * Handles notification permissions, scheduling, and deep link routing.
 * Uses Expo Notifications locally. In production: OneSignal for
 * segmentation, journeys, A/B testing, and delivery optimization.
 *
 * The Golden Rule (PRD-09 §1): Every notification must pass:
 * "Would the user thank me for this notification?"
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analytics, EVENTS } from './analytics';

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────

const STORAGE_KEYS = {
  PERMISSION_ASKED: 'puppal-notif-permission-asked',
  PERMISSION_ASKED_COUNT: 'puppal-notif-permission-ask-count',
  PUSH_TOKEN: 'puppal-push-token',
  NOTIFICATION_PREFS: 'puppal-notification-prefs',
} as const;

// OneSignal App ID (add when ready)
// const ONESIGNAL_APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID ?? '';

/** Notification categories (PRD-09 §3) */
export type NotificationCategory =
  | 'training_reminder'
  | 'streak_reminder'
  | 'health_reminder'
  | 'achievement'
  | 'milestone'
  | 'buddy_tip'
  | 'subscription'
  | 'winback'
  | 'system';

export interface NotificationPreferences {
  training_reminders: boolean;
  streak_reminders: boolean;
  health_reminders: boolean;
  achievements: boolean;
  buddy_tips: boolean;
  marketing: boolean;
  preferred_time: string; // HH:MM format, default "09:00"
}

const DEFAULT_PREFS: NotificationPreferences = {
  training_reminders: true,
  streak_reminders: true,
  health_reminders: true,
  achievements: true,
  buddy_tips: true,
  marketing: false,
  preferred_time: '09:00',
};

// ──────────────────────────────────────────────
// Setup
// ──────────────────────────────────────────────

/**
 * Configure notification handlers. Call once at app start.
 */
export function setupNotifications(): void {
  // Set default notification behavior (show even when app is foreground)
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
  });

  // Set notification categories for iOS
  if (Platform.OS === 'ios') {
    Notifications.setNotificationCategoryAsync('training', [
      {
        identifier: 'start_training',
        buttonTitle: 'Start Training',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'snooze',
        buttonTitle: 'Remind Later',
        options: { opensAppToForeground: false },
      },
    ]);

    Notifications.setNotificationCategoryAsync('streak', [
      {
        identifier: 'open_app',
        buttonTitle: "Let's Go!",
        options: { opensAppToForeground: true },
      },
    ]);
  }
}

// ──────────────────────────────────────────────
// Permission
// ──────────────────────────────────────────────

/**
 * Check current notification permission status.
 */
export async function getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/**
 * Request notification permission (PRD-09 §2).
 * Only call after user has experienced value (post first exercise).
 *
 * Returns true if permission granted.
 */
export async function requestPermission(): Promise<boolean> {
  // Note: In production, check Device.isDevice from expo-device
  // to prevent requesting permissions on simulator

  // Track how many times we've asked
  const countStr = await AsyncStorage.getItem(STORAGE_KEYS.PERMISSION_ASKED_COUNT);
  const count = countStr ? parseInt(countStr, 10) : 0;

  // Don't ask more than twice (PRD-09 §2)
  if (count >= 2) {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') {
    await registerPushToken();
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  await AsyncStorage.setItem(STORAGE_KEYS.PERMISSION_ASKED, 'true');
  await AsyncStorage.setItem(STORAGE_KEYS.PERMISSION_ASKED_COUNT, String(count + 1));

  if (status === 'granted') {
    await registerPushToken();
    analytics.track(EVENTS.NOTIFICATION_RECEIVED, { action: 'permission_granted' });
    return true;
  }

  analytics.track(EVENTS.NOTIFICATION_RECEIVED, { action: 'permission_denied', ask_count: count + 1 });
  return false;
}

/**
 * Register push token with server / OneSignal.
 */
async function registerPushToken(): Promise<string | null> {
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'puppal', // Replace with actual projectId
    });
    const token = tokenData.data;
    await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token);

    // In production: send to OneSignal
    // OneSignal.setExternalUserId(userId);

    return token;
  } catch (error) {
    console.error('[Notifications] Token registration failed:', error);
    return null;
  }
}

/**
 * Check if we should show the pre-permission screen.
 * Returns true if permission not yet asked and conditions met.
 */
export async function shouldShowPermissionPrompt(): Promise<boolean> {
  const status = await getPermissionStatus();
  if (status === 'granted') return false;

  const asked = await AsyncStorage.getItem(STORAGE_KEYS.PERMISSION_ASKED_COUNT);
  const count = asked ? parseInt(asked, 10) : 0;

  return count < 2;
}

// ──────────────────────────────────────────────
// Preferences
// ──────────────────────────────────────────────

/**
 * Get user's notification preferences.
 */
export async function getNotificationPrefs(): Promise<NotificationPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_PREFS);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_PREFS;
}

/**
 * Update notification preferences.
 */
export async function setNotificationPrefs(
  prefs: Partial<NotificationPreferences>
): Promise<void> {
  const current = await getNotificationPrefs();
  const updated = { ...current, ...prefs };
  await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_PREFS, JSON.stringify(updated));

  // In production: sync preferences to OneSignal tags
  // OneSignal.sendTags({ training_reminders: updated.training_reminders ? '1' : '0', ... });
}

// ──────────────────────────────────────────────
// Scheduling (Local Notifications)
// ──────────────────────────────────────────────

/**
 * Schedule a daily training reminder.
 *
 * PRD-09 §4: "Today's 10 min with [Name] (~X exercises)"
 */
export async function scheduleTrainingReminder(
  dogName: string,
  exerciseCount: number,
  hour: number = 9,
  minute: number = 0
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Time to train with ${dogName}! 🐾`,
      body: `Today's session: ~10 min (${exerciseCount} exercises)`,
      data: { type: 'training_reminder', screen: '/(tabs)/plan' },
      categoryIdentifier: 'training',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return id;
}

/**
 * Schedule a streak-at-risk reminder.
 *
 * PRD-09 §5: Sent at 8 PM if no exercise completed that day.
 */
export async function scheduleStreakReminder(
  dogName: string,
  streakDays: number
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `${dogName}'s ${streakDays}-day streak is at risk! 🔥`,
      body: 'Complete one quick exercise to keep it going',
      data: { type: 'streak_reminder', screen: '/(tabs)/plan' },
      categoryIdentifier: 'streak',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });

  return id;
}

/**
 * Schedule a health reminder (vaccination, vet visit).
 *
 * PRD-09 §6: "[Name]'s [vaccination] is due in [X] days"
 */
export async function scheduleHealthReminder(
  dogName: string,
  eventName: string,
  dueDate: Date,
  daysBefore: number = 3
): Promise<string | null> {
  const reminderDate = new Date(dueDate);
  reminderDate.setDate(reminderDate.getDate() - daysBefore);
  reminderDate.setHours(10, 0, 0, 0);

  // Don't schedule if reminder date is in the past
  if (reminderDate <= new Date()) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `${dogName}'s ${eventName} coming up 💉`,
      body: `Due in ${daysBefore} days. Schedule a vet appointment`,
      data: { type: 'health_reminder', screen: '/(tabs)/health' },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
  });

  return id;
}

/**
 * Send an immediate local notification (achievements, milestones).
 */
export async function sendImmediateNotification(
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { ...data, type: data?.type ?? 'system' },
      sound: 'default',
    },
    trigger: null, // immediate
  });

  return id;
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Cancel a specific scheduled notification.
 */
export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

/**
 * Get all currently scheduled notifications.
 */
export async function getScheduledNotifications() {
  return Notifications.getAllScheduledNotificationsAsync();
}

// ──────────────────────────────────────────────
// Listeners (Deep Link Routing)
// ──────────────────────────────────────────────

/**
 * Add notification response listener (when user taps notification).
 * Returns cleanup function.
 *
 * Usage in root layout:
 *   useEffect(() => {
 *     const cleanup = addNotificationResponseListener((screen) => router.push(screen));
 *     return cleanup;
 *   }, []);
 */
export function addNotificationResponseListener(
  onNavigate: (screen: string) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;
      const screen = data?.screen as string | undefined;

      analytics.track(EVENTS.NOTIFICATION_OPENED, {
        type: data?.type as string,
        screen: screen ?? 'unknown',
        action: response.actionIdentifier,
      });

      if (screen) {
        onNavigate(screen);
      }
    }
  );

  return () => subscription.remove();
}

/**
 * Add foreground notification listener.
 * Returns cleanup function.
 */
export function addForegroundListener(
  onReceive: (notification: Notifications.Notification) => void
): () => void {
  const subscription = Notifications.addNotificationReceivedListener(onReceive);
  return () => subscription.remove();
}
