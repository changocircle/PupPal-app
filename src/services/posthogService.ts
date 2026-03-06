// PRD-13: PostHog Analytics Service
// Compatible with posthog-react-native v3 (no initAsync)
// The PostHogProvider in AnalyticsProvider.tsx handles initialization.
// This module provides standalone tracking functions for non-component code.

import PostHog from 'posthog-react-native';
import { Platform } from 'react-native';
import type { AnalyticsEvent, EventProperties, UserProperties, FeatureFlag } from './types';

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || '';
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

let posthogClient: PostHog | null = null;

/**
 * Initialize PostHog client (v3 API, constructor, not initAsync)
 * Called once from AnalyticsProvider useEffect
 */
export async function initPostHog(): Promise<void> {
  if (!POSTHOG_API_KEY) {
    console.warn('[Analytics] PostHog API key not set. Analytics disabled.');
    return;
  }

  if (posthogClient) return;

  try {
    // posthog-react-native v3: use constructor, not initAsync
    posthogClient = new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
      // Flush events every 30 seconds
      flushInterval: 30000,
      // Flush after 20 events
      flushAt: 20,
    });

    console.log('[Analytics] PostHog initialized');
  } catch (error) {
    console.error('[Analytics] Failed to initialize PostHog:', error);
  }
}

/**
 * Get the PostHog instance (for hooks and direct access)
 */
export function getPostHog(): PostHog | null {
  return posthogClient;
}

/**
 * Identify user with properties
 * Call after auth and on property changes
 */
export function identify(userId: string, properties: Partial<UserProperties>): void {
  if (!posthogClient) return;

  // Filter out undefined values
  const cleanProps: Record<string, any> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value !== undefined) {
      cleanProps[key] = value;
    }
  }

  posthogClient.identify(userId, cleanProps);
}

/**
 * Track an analytics event
 */
export function track(event: AnalyticsEvent | string, properties?: EventProperties): void {
  if (!posthogClient) return;

  posthogClient.capture(event, {
    ...properties,
    platform: Platform.OS,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track a screen view
 */
export function trackScreen(screenName: string, properties?: Record<string, any>): void {
  if (!posthogClient) return;

  posthogClient.screen(screenName, properties);
}

/**
 * Set a persistent user property
 */
export function setUserProperty(key: string, value: any): void {
  if (!posthogClient) return;

  posthogClient.identify(undefined as any, { [key]: value });
}

/**
 * Set properties for all future events (super properties)
 */
export function setSuperProperties(properties: Record<string, any>): void {
  if (!posthogClient) return;

  posthogClient.register(properties);
}

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag | string): boolean {
  if (!posthogClient) return false;

  return posthogClient.isFeatureEnabled(flag) ?? false;
}

/**
 * Get feature flag payload
 */
export function getFeatureFlagPayload(flag: FeatureFlag | string): any {
  if (!posthogClient) return undefined;

  return posthogClient.getFeatureFlagPayload(flag);
}

/**
 * Reset user identity (on sign out)
 */
export function resetAnalytics(): void {
  if (!posthogClient) return;

  posthogClient.reset();
}

/**
 * Flush pending events immediately
 */
export function flushAnalytics(): void {
  if (!posthogClient) return;

  posthogClient.flush();
}

/**
 * Group user for B2B analytics
 */
export function setGroup(groupType: string, groupKey: string, properties?: Record<string, any>): void {
  if (!posthogClient) return;

  posthogClient.group(groupType, groupKey, properties);
}
