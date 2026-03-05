/**
 * Subscription Management Screen — PRD-06 §11
 *
 * Premium: Status card, plan details, manage link, restore.
 * Free: Current limits card, upgrade button, restore.
 */

import React from 'react';
import { View, ScrollView, Pressable, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Typography, Button, Card, Badge } from '@/components/ui';
import { useSubscription } from '@/hooks/useSubscription';
import { useDogStore } from '@/stores/dogStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { COLORS, RADIUS } from '@/constants/theme';

const FREE_LIMITS = [
  { feature: 'Training Plan', limit: 'Week 1 only', emoji: '📋' },
  { feature: 'Buddy Chat', limit: '3 messages/day', emoji: '🤖' },
  { feature: 'Trick Library', limit: '1 free trick (Shake)', emoji: '🎯' },
  { feature: 'Health Tracker', limit: '2 upcoming events', emoji: '🏥' },
  { feature: 'Growth Journal', limit: 'View-only timeline', emoji: '📓' },
  { feature: 'Dogs', limit: '1 dog profile', emoji: '🐾' },
];

const PREMIUM_FEATURES = [
  { feature: 'Full 12-week training plan', emoji: '📋' },
  { feature: 'Unlimited Buddy AI chat', emoji: '🤖' },
  { feature: '30+ tricks library', emoji: '🎯' },
  { feature: 'Complete health tracking', emoji: '🏥' },
  { feature: 'Growth journal with photos', emoji: '📓' },
  { feature: 'Multi-dog support', emoji: '🐾' },
  { feature: 'Priority support', emoji: '⭐' },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const { isPremium, isTrial, status, trialEndDate } = useSubscription();
  const dog = useDogStore((s) => s.activeDog());
  const dogName = dog?.name ?? useOnboardingStore.getState().data.puppyName ?? 'your pup';

  const handleManageSubscription = () => {
    // Deep link to platform subscription management
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  };

  const handleRestore = async () => {
    // In production: await Purchases.restorePurchases()
    Alert.alert(
      'Restore Purchases',
      'Purchase restoration will work once RevenueCat is configured.',
      [{ text: 'OK' }]
    );
  };

  const handleUpgrade = () => {
    router.push({
      pathname: '/paywall',
      params: { trigger: 'settings_upgrade', source: 'settings' },
    });
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
          <Typography variant="h3" style={{ fontSize: 24 }}>
            ←
          </Typography>
        </Pressable>
        <Typography variant="h3" style={{ flex: 1, textAlign: 'center' }}>
          Subscription
        </Typography>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status card */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <Card style={{ marginBottom: 20 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <Typography variant="h3">
                {isPremium ? '⭐ Premium' : '🐾 Free Plan'}
              </Typography>
              <Badge
                label={
                  isTrial
                    ? 'Trial'
                    : isPremium
                      ? 'Active'
                      : 'Free'
                }
                variant={isPremium ? 'success' : 'neutral'}
                size="sm"
              />
            </View>

            {isPremium && (
              <>
                {isTrial && trialEndDate && (
                  <View
                    style={{
                      backgroundColor: COLORS.warning.light,
                      padding: 12,
                      borderRadius: RADIUS.md,
                      marginBottom: 12,
                    }}
                  >
                    <Typography variant="body" style={{ fontWeight: '600' }}>
                      Trial ends{' '}
                      {new Date(trialEndDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Typography>
                    <Typography variant="caption" color="secondary">
                      You'll be charged after the trial period
                    </Typography>
                  </View>
                )}
                <Typography variant="body" color="secondary">
                  You have full access to all PupPal features for {dogName} and
                  all your dogs.
                </Typography>
              </>
            )}

            {!isPremium && (
              <Typography variant="body" color="secondary">
                You're on the free plan with limited access. Upgrade for the
                full experience!
              </Typography>
            )}
          </Card>
        </Animated.View>

        {/* Premium user: features & manage */}
        {isPremium && (
          <>
            <Animated.View entering={FadeInDown.duration(300).delay(100)}>
              <Typography
                variant="h3"
                style={{ marginBottom: 12 }}
              >
                Your Premium Features
              </Typography>
              <Card style={{ marginBottom: 20 }}>
                {PREMIUM_FEATURES.map((feat, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingVertical: 8,
                      borderBottomWidth:
                        i < PREMIUM_FEATURES.length - 1 ? 1 : 0,
                      borderBottomColor: COLORS.border,
                    }}
                  >
                    <Typography style={{ fontSize: 18 }}>
                      {feat.emoji}
                    </Typography>
                    <Typography variant="body" style={{ flex: 1 }}>
                      {feat.feature}
                    </Typography>
                    <Typography style={{ color: COLORS.success.DEFAULT }}>
                      ✓
                    </Typography>
                  </View>
                ))}
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(300).delay(200)}>
              <Button
                label="Manage Subscription"
                variant="secondary"
                onPress={handleManageSubscription}
              />
            </Animated.View>
          </>
        )}

        {/* Free user: limits & upgrade */}
        {!isPremium && (
          <>
            <Animated.View entering={FadeInDown.duration(300).delay(100)}>
              <Typography
                variant="h3"
                style={{ marginBottom: 12 }}
              >
                Current Limits
              </Typography>
              <Card style={{ marginBottom: 20 }}>
                {FREE_LIMITS.map((item, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingVertical: 10,
                      borderBottomWidth:
                        i < FREE_LIMITS.length - 1 ? 1 : 0,
                      borderBottomColor: COLORS.border,
                    }}
                  >
                    <Typography style={{ fontSize: 18 }}>
                      {item.emoji}
                    </Typography>
                    <Typography variant="body" style={{ flex: 1 }}>
                      {item.feature}
                    </Typography>
                    <Badge label={item.limit} variant="warning" size="sm" />
                  </View>
                ))}
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(300).delay(200)}>
              <Button
                label={`Upgrade for ${dogName} →`}
                variant="primary"
                onPress={handleUpgrade}
              />
            </Animated.View>
          </>
        )}

        {/* Restore */}
        <Animated.View entering={FadeInDown.duration(300).delay(300)}>
          <Pressable
            onPress={handleRestore}
            style={{
              alignItems: 'center',
              marginTop: 24,
              padding: 12,
            }}
          >
            <Typography variant="body" color="secondary">
              Restore Purchases
            </Typography>
          </Pressable>
        </Animated.View>

        {/* FAQ */}
        <Animated.View entering={FadeInDown.duration(300).delay(400)}>
          <Typography
            variant="h3"
            style={{ marginTop: 24, marginBottom: 12 }}
          >
            FAQ
          </Typography>
          <Card>
            {[
              {
                q: 'Can I cancel anytime?',
                a: 'Yes! Cancel through your App Store or Google Play subscriptions. You keep access until the end of your billing period.',
              },
              {
                q: 'What happens to my data if I cancel?',
                a: "All your data is preserved forever. If you re-subscribe, everything picks up right where you left off.",
              },
              {
                q: 'Do I keep my streak if I downgrade?',
                a: 'Yes! Your streak continues as long as you complete exercises. Week 1 exercises are always available.',
              },
              {
                q: 'Can I switch between plans?',
                a: 'Yes — manage your plan through your device\'s subscription settings. Changes take effect at your next billing date.',
              },
            ].map((faq, i) => (
              <View
                key={i}
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: i < 3 ? 1 : 0,
                  borderBottomColor: COLORS.border,
                }}
              >
                <Typography variant="body" style={{ fontWeight: '700', marginBottom: 4 }}>
                  {faq.q}
                </Typography>
                <Typography variant="caption" color="secondary">
                  {faq.a}
                </Typography>
              </View>
            ))}
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
