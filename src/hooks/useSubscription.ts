/**
 * useSubscription — THE ONLY WAY to check premium access (PRD-06 §2, PRD-07 §2)
 *
 * Single entitlement model: `premium`. No tiers, no feature-level entitlements.
 * In production: integrates with RevenueCat for IAP source of truth.
 * For now: reads from user profile + local state.
 *
 * Premium sources (PRD-07 §2):
 * 1. Active RevenueCat entitlement (subscription or lifetime)
 * 2. Active free trial via RevenueCat
 * 3. Admin override (testing, press, influencer comps)
 */

import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { SubscriptionStatus } from '@/types/database';

/** Subscription product IDs (PRD-06 §2) */
export const PRODUCTS = {
  ANNUAL: 'puppal_annual',
  MONTHLY: 'puppal_monthly',
  LIFETIME: 'puppal_lifetime',
} as const;

/** Free-tier features always available */
export const FREE_FEATURES = [
  'onboarding',
  'week1_training',
  'basic_chat',           // 3 messages/day
  'basic_health',         // 2 upcoming events, 1 weight entry
  'profile',
  'basic_gamification',   // XP/streak for Week 1
  'free_trick_shake',     // 1 free trick
  'community_read',       // Read-only community
  'basic_journal',        // Auto timeline view-only
] as const;

/** Premium-only features */
export const PREMIUM_FEATURES = [
  'full_training',        // Week 2-12
  'unlimited_chat',       // No daily limit
  'full_health',          // All health features
  'full_tricks',          // All tricks
  'multi_dog',            // Additional dogs
  'full_journal',         // Photos, notes, backdating
  'community_post',       // Post & comment
  'full_gamification',    // Streak freeze, weekly challenges
  'plan_adaptation',      // Adaptive training engine
  'breed_comparison',     // Breed vs breed
  'health_pdf_export',    // PDF export
] as const;

export type FreeTierFeature = (typeof FREE_FEATURES)[number];
export type PremiumFeature = (typeof PREMIUM_FEATURES)[number];

export function useSubscription() {
  const user = useAuthStore((s) => s.user);
  const devPremiumOverride = useSettingsStore((s) => s.devPremiumOverride);
  const status: SubscriptionStatus = user?.subscription_status ?? 'free';

  // Primary check: subscription status
  const isActive = status === 'active';
  const isTrial = status === 'trial';
  const isExpired = status === 'expired';
  const isCancelled = status === 'cancelled';

  // Combined premium check (PRD-07 §2)
  // devPremiumOverride: 5-tap easter egg on profile, persisted in settingsStore
  const isPremium = devPremiumOverride || isActive || isTrial;

  // Trial dates
  const trialStartDate = user?.trial_start_date ?? null;
  const trialEndDate = user?.trial_end_date ?? null;

  // Days remaining in trial
  const trialDaysRemaining = (() => {
    if (!isTrial || !trialEndDate) return null;
    const end = new Date(trialEndDate).getTime();
    const now = Date.now();
    const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  })();

  /**
   * Check if a specific feature is available for the current user.
   */
  const hasAccess = (feature: string): boolean => {
    if ((FREE_FEATURES as readonly string[]).includes(feature)) return true;
    return isPremium;
  };

  /**
   * Check if user will renew (for subscription management UI).
   * In production: from RevenueCat customerInfo.
   */
  const willRenew = isPremium && !isCancelled;

  return {
    // Status
    status,
    isPremium,
    isTrial,
    isActive,
    isExpired,
    isCancelled,
    willRenew,

    // Access check
    hasAccess,

    // Trial info
    trialStartDate,
    trialEndDate,
    trialDaysRemaining,

    // Product info (in production: from RevenueCat)
    productId: user?.subscription_product_id ?? null,
  };
}
