/**
 * Analytics Service — PRD-13
 *
 * Centralized event tracking. In production: PostHog + Sentry.
 * For now: console logging in dev, ready for PostHog drop-in.
 *
 * Usage:
 *   analytics.track('exercise_completed', { exercise_id, category, xp_earned });
 *   analytics.identify(userId, { subscription_status, breed });
 *   analytics.screen('home');
 */

import Constants from 'expo-constants';

// PostHog config (add keys when ready)
const POSTHOG_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_POSTHOG_KEY ?? '';
const POSTHOG_HOST = Constants.expoConfig?.extra?.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

// Sentry config
const SENTRY_DSN = Constants.expoConfig?.extra?.EXPO_PUBLIC_SENTRY_DSN ?? '';

const IS_DEV = __DEV__;

type EventProperties = Record<string, string | number | boolean | null | undefined | string[]>;

interface UserProperties {
  subscription_status?: string;
  breed?: string | null;
  dog_age_weeks?: number;
  plan_week?: number;
  dog_count?: number;
  experience_level?: string;
  [key: string]: string | number | boolean | null | undefined;
}

class AnalyticsService {
  private initialized = false;
  private userId: string | null = null;

  /**
   * Initialize analytics (call once at app start).
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // PostHog initialization
      if (POSTHOG_API_KEY) {
        // In production:
        // const posthog = new PostHog(POSTHOG_API_KEY, { host: POSTHOG_HOST });
        // await posthog.ready();
        if (IS_DEV) console.log('[Analytics] PostHog ready');
      }

      // Sentry initialization
      if (SENTRY_DSN) {
        // In production:
        // Sentry.init({ dsn: SENTRY_DSN, environment: IS_DEV ? 'development' : 'production' });
        if (IS_DEV) console.log('[Analytics] Sentry ready');
      }

      this.initialized = true;
      if (IS_DEV) console.log('[Analytics] Initialized');
    } catch (error) {
      console.error('[Analytics] Init failed:', error);
    }
  }

  /**
   * Identify the current user (call after auth).
   */
  identify(userId: string, properties?: UserProperties): void {
    this.userId = userId;

    if (IS_DEV) {
      console.log(`[Analytics] identify: ${userId}`, properties);
    }

    // In production:
    // posthog.identify(userId, properties);
    // Sentry.setUser({ id: userId });
  }

  /**
   * Track an event.
   * Naming: {object}_{action} in snake_case (PRD-13 §3).
   */
  track(event: string, properties?: EventProperties): void {
    if (IS_DEV) {
      console.log(`[Analytics] ${event}`, properties ?? '');
    }

    // In production:
    // posthog.capture(event, { ...properties, user_id: this.userId });
  }

  /**
   * Track a screen view.
   */
  screen(screenName: string, properties?: EventProperties): void {
    if (IS_DEV) {
      console.log(`[Analytics] screen: ${screenName}`, properties ?? '');
    }

    // In production:
    // posthog.screen(screenName, properties);
  }

  /**
   * Reset analytics (call on sign out).
   */
  reset(): void {
    this.userId = null;

    if (IS_DEV) {
      console.log('[Analytics] reset');
    }

    // In production:
    // posthog.reset();
    // Sentry.setUser(null);
  }

  /**
   * Report an error to Sentry.
   */
  captureError(error: Error, context?: Record<string, unknown>): void {
    if (IS_DEV) {
      console.error('[Analytics] Error:', error.message, context);
    }

    // In production:
    // Sentry.captureException(error, { extra: context });
  }

  /**
   * Set a super property (attached to ALL future events).
   */
  setSuperProperties(properties: EventProperties): void {
    if (IS_DEV) {
      console.log('[Analytics] setSuperProperties:', properties);
    }

    // In production:
    // posthog.register(properties);
  }

  /**
   * Check if a feature flag is enabled (PostHog feature flags).
   */
  async isFeatureEnabled(flag: string): Promise<boolean> {
    // In production:
    // return posthog.isFeatureEnabled(flag);
    return false;
  }

  /**
   * Get feature flag payload.
   */
  async getFeatureFlagPayload(flag: string): Promise<unknown> {
    // In production:
    // return posthog.getFeatureFlagPayload(flag);
    return null;
  }
}

// Singleton
export const analytics = new AnalyticsService();

// ──────────────────────────────────────────────
// Pre-defined Event Names (PRD-13 §3)
// ──────────────────────────────────────────────

export const EVENTS = {
  // Onboarding
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_SCREEN_VIEWED: 'onboarding_screen_viewed',
  ONBOARDING_COMPLETED: 'onboarding_completed',

  // Training
  EXERCISE_VIEWED: 'exercise_viewed',
  EXERCISE_STARTED: 'exercise_started',
  EXERCISE_COMPLETED: 'exercise_completed',
  EXERCISE_SKIPPED: 'exercise_skipped',

  // Chat
  CHAT_SESSION_STARTED: 'chat_session_started',
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  CHAT_RESPONSE_RECEIVED: 'chat_response_received',
  CHAT_FEEDBACK_GIVEN: 'chat_feedback_given',

  // Gamification
  XP_EARNED: 'xp_earned',
  LEVEL_UP: 'level_up',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  STREAK_UPDATED: 'streak_updated',

  // Health
  VACCINATION_LOGGED: 'vaccination_logged',
  WEIGHT_RECORDED: 'weight_recorded',
  VET_VISIT_LOGGED: 'vet_visit_logged',

  // Gate / Paywall
  GATE_ENCOUNTERED: 'gate_encountered',
  GATE_UPGRADE_TAPPED: 'gate_upgrade_tapped',
  GATE_DISMISSED: 'gate_dismissed',
  PAYWALL_PRESENTED: 'paywall_presented',
  PAYWALL_DISMISSED: 'paywall_dismissed',
  PAYWALL_PURCHASE_STARTED: 'paywall_purchase_started',
  PAYWALL_PURCHASE_COMPLETED: 'paywall_purchase_completed',

  // Subscription
  SUBSCRIPTION_TRIAL_STARTED: 'subscription_trial_started',
  SUBSCRIPTION_TRIAL_CONVERTED: 'subscription_trial_converted',
  SUBSCRIPTION_RENEWED: 'subscription_renewed',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',

  // Sharing / Referral
  SHARE_TAPPED: 'share_tapped',
  SHARE_COMPLETED: 'share_completed',
  REFERRAL_CODE_COPIED: 'referral_code_copied',
  REFERRAL_LINK_SHARED: 'referral_link_shared',

  // Community
  COMMUNITY_POST_CREATED: 'community_post_created',
  COMMUNITY_POST_LIKED: 'community_post_liked',
  COMMUNITY_COMMENT_ADDED: 'community_comment_added',

  // App lifecycle
  APP_OPENED: 'app_opened',
  APP_BACKGROUNDED: 'app_backgrounded',
  NOTIFICATION_RECEIVED: 'notification_received',
  NOTIFICATION_OPENED: 'notification_opened',

  // Multi-dog
  DOG_ADDED: 'dog_added',
  DOG_SWITCHED: 'dog_switched',
  DOG_ARCHIVED: 'dog_archived',
  DOG_DELETED: 'dog_deleted',
} as const;
