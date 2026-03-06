/**
 * Fallback Native Paywall — PRD-06 §4 + §15 Edge Cases
 *
 * In production, Superwall handles paywall presentation with A/B testing.
 * This is the native fallback if Superwall fails or isn't configured yet.
 *
 * Design matches PRD-06 §4 "Primary Paywall":
 * - Personalized headline with dog name
 * - Annual (hero) vs Monthly plan cards
 * - Feature checklist
 * - Trial timeline visualization
 * - Trust/reassurance elements
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Alert,
  Linking,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Typography, Button } from '@/components/ui';
import { useDogStore } from '@/stores/dogStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { COLORS, RADIUS, SHADOWS } from '@/constants/theme';

// ──────────────────────────────────────────────
// Product definitions (PRD-06 §2)
// ──────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  price: string;
  pricePerMonth: string;
  savings?: string;
  trial?: string;
  badge?: string;
  isHero: boolean;
}

const PRODUCTS: Product[] = [
  {
    id: 'puppal_annual',
    name: 'Annual',
    price: '$39.99/year',
    pricePerMonth: '$3.33/mo',
    savings: 'Save 67%',
    trial: '3-day free trial',
    badge: 'Best Value',
    isHero: true,
  },
  {
    id: 'puppal_monthly',
    name: 'Monthly',
    price: '$9.99/month',
    pricePerMonth: '$9.99/mo',
    isHero: false,
  },
];

// ──────────────────────────────────────────────
// Premium Features
// ──────────────────────────────────────────────

const FEATURES = [
  { emoji: '📋', text: 'Full 12-week personalized training plan' },
  { emoji: '🤖', text: 'Unlimited Buddy AI chat' },
  { emoji: '🎯', text: '30+ tricks with step-by-step guides' },
  { emoji: '🏥', text: 'Complete health tracking & reminders' },
  { emoji: '📓', text: 'Growth journal with photo timeline' },
  { emoji: '🐾', text: 'Multi-dog support' },
];

// ──────────────────────────────────────────────
// Context-specific headlines
// ──────────────────────────────────────────────

function getHeadline(trigger: string, dogName: string): { title: string; subtitle: string } {
  switch (trigger) {
    case 'onboarding_complete':
      return {
        title: `Start ${dogName}'s 3-day free trial`,
        subtitle: 'Get the full training experience, cancel anytime',
      };
    case 'feature_gate_week2':
      return {
        title: `${dogName}'s Week 2 is ready!`,
        subtitle: 'Unlock the full 12-week training plan',
      };
    case 'feature_gate_chat':
      return {
        title: `Unlimited Buddy access for ${dogName}`,
        subtitle: 'Ask anything, anytime — no daily limits',
      };
    case 'feature_gate_health':
      return {
        title: `Track ${dogName}'s complete health`,
        subtitle: 'Vaccinations, weight, milestones & more',
      };
    case 'feature_gate_tricks':
      return {
        title: `Unlock all tricks for ${dogName}`,
        subtitle: '30+ tricks with step-by-step guides',
      };
    case 'feature_gate_multi_dog':
      return {
        title: 'Train multiple pups!',
        subtitle: 'Premium lets you add and manage multiple dogs',
      };
    case 'feature_gate_journal':
      return {
        title: `${dogName}'s growth journal`,
        subtitle: 'Capture photos, notes & milestones',
      };
    case 'streak_milestone_7':
      return {
        title: `${dogName}'s on a 7-day streak! 🔥`,
        subtitle: "Don't lose momentum — keep training",
      };
    case 'plan_week1_complete':
      return {
        title: `Week 1 complete! 🎉`,
        subtitle: `${dogName} is ready for Week 2`,
      };
    default:
      return {
        title: `Unlock Premium for ${dogName}`,
        subtitle: 'Everything, unlimited, one price',
      };
  }
}

export default function PaywallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ trigger?: string; source?: string }>();
  const trigger = params.trigger ?? 'settings_upgrade';

  const dog = useDogStore((s) => s.activeDog());
  const onboardingData = useOnboardingStore((s) => s.data);
  const dogName = dog?.name ?? onboardingData.puppyName ?? 'your pup';

  const [selectedProduct, setSelectedProduct] = useState('puppal_annual');
  const [isProcessing, setIsProcessing] = useState(false);

  const { title, subtitle } = useMemo(
    () => getHeadline(trigger, dogName),
    [trigger, dogName]
  );

  const handlePurchase = async () => {
    setIsProcessing(true);

    // In production: RevenueCat purchase flow
    // const product = await Purchases.getProducts([selectedProduct]);
    // const result = await Purchases.purchaseProduct(selectedProduct);

    // For now: show placeholder
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert(
        'Coming Soon! 🐾',
        "Premium subscriptions are launching very soon! We'll notify you the moment they're available.",
        [{ text: 'Got it', onPress: () => router.back() }]
      );
    }, 1000);
  };

  const handleRestore = async () => {
    // In production: Purchases.restorePurchases()
    Alert.alert(
      'Restore Purchases',
      'No previous purchases found. If you believe this is an error, please contact support@puppal.app.',
      [{ text: 'OK' }]
    );
  };

  const isCelebration =
    trigger === 'streak_milestone_7' || trigger === 'plan_week1_complete';

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      edges={['top', 'bottom']}
    >
      {/* Close button */}
      <View style={styles.closeRow}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Typography style={{ fontSize: 18, color: COLORS.text.secondary }}>
            ✕
          </Typography>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero section */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
          {isCelebration && (
            <Typography style={{ fontSize: 48, textAlign: 'center', marginBottom: 8 }}>
              {trigger === 'streak_milestone_7' ? '🔥' : '🎉'}
            </Typography>
          )}
          {!isCelebration && (
            <Typography style={{ fontSize: 48, textAlign: 'center', marginBottom: 8 }}>
              🐾
            </Typography>
          )}

          <Typography variant="h1" style={styles.heroTitle}>
            {title}
          </Typography>
          <Typography
            variant="body"
            color="secondary"
            style={styles.heroSubtitle}
          >
            {subtitle}
          </Typography>
        </Animated.View>

        {/* Trial timeline (only for trial-eligible) */}
        {selectedProduct === 'puppal_annual' && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(100)}
            style={styles.timeline}
          >
            <View style={styles.timelineRow}>
              <View style={[styles.timelineDot, styles.timelineDotActive]} />
              <View style={styles.timelineContent}>
                <Typography variant="body" style={{ fontWeight: '600' }}>
                  Today
                </Typography>
                <Typography variant="caption" color="secondary">
                  Full access starts — $0.00
                </Typography>
              </View>
            </View>
            <View style={styles.timelineLine} />
            <View style={styles.timelineRow}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Typography variant="body" style={{ fontWeight: '600' }}>
                  Day 2
                </Typography>
                <Typography variant="caption" color="secondary">
                  We'll remind you
                </Typography>
              </View>
            </View>
            <View style={styles.timelineLine} />
            <View style={styles.timelineRow}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Typography variant="body" style={{ fontWeight: '600' }}>
                  Day 3
                </Typography>
                <Typography variant="caption" color="secondary">
                  Trial ends · $39.99/year begins
                </Typography>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Plan cards */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.plans}
        >
          {PRODUCTS.map((product) => {
            const isSelected = selectedProduct === product.id;
            return (
              <Pressable
                key={product.id}
                onPress={() => setSelectedProduct(product.id)}
                style={[
                  styles.planCard,
                  isSelected && styles.planCardSelected,
                ]}
              >
                {/* Badge */}
                {product.badge && (
                  <View style={styles.planBadge}>
                    <Typography
                      variant="caption"
                      style={styles.planBadgeText}
                    >
                      {product.badge}
                    </Typography>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <View
                    style={[
                      styles.planRadio,
                      isSelected && styles.planRadioSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.planRadioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="h3">{product.name}</Typography>
                    <Typography variant="caption" color="secondary">
                      {product.price}
                    </Typography>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Typography
                      variant="h3"
                      style={{ color: COLORS.primary.DEFAULT }}
                    >
                      {product.pricePerMonth}
                    </Typography>
                    {product.savings && (
                      <Typography
                        variant="caption"
                        style={{ color: COLORS.success.DEFAULT, fontWeight: '600' }}
                      >
                        {product.savings}
                      </Typography>
                    )}
                  </View>
                </View>

                {product.trial && isSelected && (
                  <View style={styles.trialBanner}>
                    <Typography
                      variant="caption"
                      style={{ color: COLORS.primary.DEFAULT, fontWeight: '600' }}
                    >
                      ✓ {product.trial}
                    </Typography>
                  </View>
                )}
              </Pressable>
            );
          })}
        </Animated.View>

        {/* Feature list */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(300)}
          style={styles.features}
        >
          {FEATURES.map((feat, i) => (
            <View key={i} style={styles.featureRow}>
              <Typography style={{ fontSize: 18 }}>{feat.emoji}</Typography>
              <Typography variant="body" style={{ flex: 1 }}>
                {feat.text}
              </Typography>
              <Typography style={{ color: COLORS.success.DEFAULT }}>✓</Typography>
            </View>
          ))}
        </Animated.View>

        {/* Reassurance */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(400)}
          style={styles.reassurance}
        >
          <Typography variant="caption" color="tertiary" style={{ textAlign: 'center' }}>
            No payment now · Cancel anytime · Reminder before charge
          </Typography>
        </Animated.View>
      </ScrollView>

      {/* Bottom CTA */}
      <Animated.View entering={FadeInUp.duration(300).delay(500)} style={styles.cta}>
        <Button
          label={
            isProcessing
              ? 'Processing...'
              : selectedProduct === 'puppal_annual'
                ? 'Start Free Trial →'
                : 'Subscribe Now →'
          }
          variant="primary"
          onPress={handlePurchase}
          disabled={isProcessing}
        />
        <View style={styles.ctaLinks}>
          <Pressable onPress={handleRestore}>
            <Typography variant="caption" color="tertiary">
              Restore purchases
            </Typography>
          </Pressable>
          <Typography variant="caption" color="tertiary">
            ·
          </Typography>
          <Pressable onPress={() => Linking.openURL('https://puppal.app/terms')}>
            <Typography variant="caption" color="tertiary">
              Terms
            </Typography>
          </Pressable>
          <Typography variant="caption" color="tertiary">
            ·
          </Typography>
          <Pressable onPress={() => Linking.openURL('https://puppal.app/privacy')}>
            <Typography variant="caption" color="tertiary">
              Privacy
            </Typography>
          </Pressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 26,
  },
  heroSubtitle: {
    textAlign: 'center',
  },
  timeline: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 20,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.border,
  },
  timelineDotActive: {
    backgroundColor: COLORS.primary.DEFAULT,
  },
  timelineLine: {
    width: 2,
    height: 16,
    backgroundColor: COLORS.border,
    marginLeft: 5,
  },
  timelineContent: {
    flex: 1,
  },
  plans: {
    gap: 12,
    marginBottom: 20,
  },
  planCard: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: 16,
    backgroundColor: COLORS.surface,
    position: 'relative',
    overflow: 'hidden',
  },
  planCardSelected: {
    borderColor: COLORS.primary.DEFAULT,
    backgroundColor: COLORS.primary.extralight,
  },
  planBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderBottomLeftRadius: RADIUS.sm,
  },
  planBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planRadioSelected: {
    borderColor: COLORS.primary.DEFAULT,
  },
  planRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary.DEFAULT,
  },
  trialBanner: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.primary.light,
    alignItems: 'center',
  },
  features: {
    gap: 14,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reassurance: {
    marginBottom: 8,
  },
  cta: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  ctaLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
});
