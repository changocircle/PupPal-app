/**
 * PremiumGate, PRD-07 §4
 *
 * Reusable component wrapping any premium content.
 * Premium users: renders children normally.
 * Free users: shows preview + lock overlay with upgrade CTA.
 *
 * Design principles (PRD-07 §1):
 * - Show what's behind the gate (never blank screens)
 * - Personalize with dog name
 * - Soft walls, not hard blocks
 */

import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
// Direct imports to avoid require cycle (PremiumGate → index.ts → PremiumGate)
import { Typography } from './Typography';
import { Button } from './Button';
import { useSubscription } from '@/hooks/useSubscription';
import { canShowGate, recordGateShown } from '@/lib/gateThrottle';
import { COLORS, RADIUS, SHADOWS } from '@/constants/theme';
import type { GateTrigger } from '@/hooks/useFeatureGate';

interface PremiumGateProps {
  /** Superwall trigger / gate name */
  feature: GateTrigger;
  /** Premium content (rendered when user has access) */
  children: React.ReactNode;
  /** What free users see behind the lock overlay */
  preview?: React.ReactNode;
  /** Gate headline, personalize with dog name! */
  headline?: string;
  /** CTA button text */
  cta?: string;
  /** Optional subtitle text */
  subtitle?: string;
  /** Lock icon emoji (default 🔒) */
  lockIcon?: string;
  /** If true, show preview blurred (vs dimmed) */
  blurred?: boolean;
  /** Compact mode for inline usage */
  compact?: boolean;
  /** Called after user taps upgrade */
  onUpgrade?: () => void;
}

export function PremiumGate({
  feature,
  children,
  preview,
  headline = 'Unlock with Premium',
  cta = 'Upgrade to Premium',
  subtitle,
  lockIcon = '🔒',
  blurred = false,
  compact = false,
  onUpgrade,
}: PremiumGateProps) {
  const { isPremium } = useSubscription();
  const router = useRouter();

  // Premium users see content directly
  if (isPremium) return <>{children}</>;

  const handleUpgrade = async () => {
    const canShow = await canShowGate(feature);
    if (canShow) {
      await recordGateShown(feature);
      router.push({
        pathname: '/paywall',
        params: { trigger: feature, source: feature },
      });
    }
    onUpgrade?.();
  };

  if (compact) {
    return (
      <Animated.View entering={FadeIn.duration(200)}>
        {preview && (
          <View style={{ opacity: 0.4 }} pointerEvents="none">
            {preview}
          </View>
        )}
        <Pressable onPress={handleUpgrade} style={styles.compactOverlay}>
          <Typography style={{ fontSize: 14 }}>{lockIcon}</Typography>
          <Typography
            variant="caption"
            style={styles.compactText}
          >
            {headline}
          </Typography>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      {/* Preview content (dimmed/blurred) */}
      {preview && (
        <View
          style={[
            styles.previewContainer,
            blurred && styles.previewBlurred,
          ]}
          pointerEvents="none"
        >
          {preview}
        </View>
      )}

      {/* Lock overlay */}
      <View style={[styles.overlay, !preview && styles.overlayStandalone]}>
        <View style={styles.lockBadge}>
          <Typography style={{ fontSize: 28 }}>{lockIcon}</Typography>
        </View>

        <Typography
          variant="h3"
          style={styles.headline}
        >
          {headline}
        </Typography>

        {subtitle && (
          <Typography
            variant="body"
            color="secondary"
            style={styles.subtitle}
          >
            {subtitle}
          </Typography>
        )}

        <Button
          label={cta}
          variant="primary"
          onPress={handleUpgrade}
        />

        <Pressable
          onPress={() => router.back()}
          style={styles.maybeLater}
        >
          <Typography variant="caption" color="tertiary">
            Maybe Later
          </Typography>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: RADIUS.lg,
  },
  previewContainer: {
    opacity: 0.35,
  },
  previewBlurred: {
    opacity: 0.25,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: RADIUS.lg,
  },
  overlayStandalone: {
    position: 'relative',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 40,
  },
  lockBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary.extralight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headline: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  maybeLater: {
    marginTop: 12,
    padding: 8,
  },
  compactOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary.extralight,
    borderRadius: RADIUS.md,
    marginTop: 8,
  },
  compactText: {
    color: COLORS.primary.DEFAULT,
    fontWeight: '600',
  },
});
