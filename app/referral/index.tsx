/**
 * Referral Screen — PRD-08 §2-5
 *
 * Shows user's referral code/link, sharing options,
 * referral progress, and rewards earned.
 */

import React, { useEffect, useCallback } from 'react';
import { View, ScrollView, Pressable, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn, BounceIn } from 'react-native-reanimated';
import { Typography, Button, Card, Badge } from '@/components/ui';
import { useReferralStore } from '@/stores/referralStore';
import { useDogStore } from '@/stores/dogStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { analytics, EVENTS } from '@/services/analytics';
import { COLORS, RADIUS, SHADOWS } from '@/constants/theme';

/** Reward tiers (PRD-08 §2) */
const REWARD_TIERS = [
  { action: 'Friend installs PupPal', referrer: '50 XP', referee: '—', emoji: '📲' },
  { action: 'Friend starts trial', referrer: '100 XP', referee: '+1 free msg/day', emoji: '🎯' },
  { action: 'Friend goes Premium', referrer: '1 free month', referee: '—', emoji: '⭐' },
];

export default function ReferralScreen() {
  const router = useRouter();
  const {
    referralCode,
    customCode,
    referrals,
    totalReferrals,
    totalXpFromReferrals,
    totalSharesSent,
    initializeCode,
    getReferralLink,
    getShareMessage,
    incrementShareCount,
    setCustomCode,
  } = useReferralStore();

  const dog = useDogStore((s) => s.activeDog());
  const dogName = dog?.name ?? useOnboardingStore.getState().data.puppyName ?? 'your pup';

  // Ensure code is initialized
  useEffect(() => {
    initializeCode();
  }, [initializeCode]);

  const displayCode = customCode ?? referralCode;
  const referralLink = getReferralLink();

  const handleShare = useCallback(async () => {
    try {
      const message = getShareMessage(dogName);
      const result = await Share.share({
        message,
        title: 'Train your puppy with PupPal!',
      });

      if (result.action === Share.sharedAction) {
        incrementShareCount();
        analytics.track(EVENTS.SHARE_COMPLETED, {
          type: 'referral',
          method: result.activityType ?? 'unknown',
        });
      }
    } catch (error) {
      if (__DEV__) console.error('Share failed:', error);
    }
  }, [dogName, getShareMessage, incrementShareCount]);

  const handleCopyLink = useCallback(async () => {
    // Share the link — acts as both clipboard + sharing
    await Share.share({ message: referralLink });
    analytics.track(EVENTS.REFERRAL_LINK_SHARED, { method: 'copy' });
  }, [referralLink]);

  const handleCopyCode = useCallback(async () => {
    await Share.share({ message: displayCode });
    analytics.track(EVENTS.REFERRAL_CODE_COPIED);
  }, [displayCode]);

  const handleCustomCode = useCallback(() => {
    Alert.prompt(
      'Set Custom Code',
      'Choose a personalized referral code (3-20 characters, letters & numbers only):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (text?: string) => {
            if (text) {
              const success = setCustomCode(text);
              if (!success) {
                Alert.alert('Invalid Code', 'Code must be 3-20 alphanumeric characters.');
              }
            }
          },
        },
      ],
      'plain-text',
      customCode ?? ''
    );
  }, [customCode, setCustomCode]);

  const convertedCount = referrals.filter((r) => r.status === 'converted').length;

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
          Invite Friends
        </Typography>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Card
            style={{
              marginBottom: 20,
              alignItems: 'center',
              paddingVertical: 28,
              backgroundColor: COLORS.primary.light,
            }}
          >
            <Animated.View entering={BounceIn.delay(200)}>
              <Typography style={{ fontSize: 48, marginBottom: 8 }}>🎁</Typography>
            </Animated.View>
            <Typography variant="h2" style={{ textAlign: 'center', marginBottom: 8 }}>
              Share PupPal, Get Rewards!
            </Typography>
            <Typography
              variant="body"
              color="secondary"
              style={{ textAlign: 'center', maxWidth: 280 }}
            >
              Invite fellow puppy parents — you both get rewarded when they join
            </Typography>
          </Card>
        </Animated.View>

        {/* Referral code card */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <Card style={{ marginBottom: 20 }}>
            <Typography variant="caption" color="secondary" style={{ marginBottom: 8 }}>
              YOUR REFERRAL CODE
            </Typography>

            <Pressable onPress={handleCopyCode}>
              <View
                style={{
                  backgroundColor: COLORS.background,
                  borderRadius: RADIUS.md,
                  padding: 16,
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: COLORS.primary.DEFAULT,
                  borderStyle: 'dashed',
                  marginBottom: 12,
                }}
              >
                <Typography
                  variant="h2"
                  style={{
                    letterSpacing: 4,
                    color: COLORS.primary.DEFAULT,
                    fontWeight: '800',
                  }}
                >
                  {displayCode}
                </Typography>
                <Typography variant="caption" color="tertiary" style={{ marginTop: 4 }}>
                  Tap to copy
                </Typography>
              </View>
            </Pressable>

            <Button
              label="Share Invite Link 🔗"
              variant="primary"
              onPress={handleShare}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 12 }}>
              <Pressable onPress={handleCopyLink}>
                <Typography variant="caption" style={{ color: COLORS.primary.DEFAULT }}>
                  Copy Link
                </Typography>
              </Pressable>
              <Pressable onPress={handleCustomCode}>
                <Typography variant="caption" style={{ color: COLORS.primary.DEFAULT }}>
                  Customize Code
                </Typography>
              </Pressable>
            </View>
          </Card>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            {[
              { value: totalSharesSent, label: 'Invites Sent', emoji: '📤' },
              { value: totalReferrals, label: 'Friends Joined', emoji: '👥' },
              { value: totalXpFromReferrals, label: 'XP Earned', emoji: '⭐' },
            ].map((stat, i) => (
              <Card key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 16 }}>
                <Typography style={{ fontSize: 20 }}>{stat.emoji}</Typography>
                <Typography variant="h3" style={{ marginVertical: 4 }}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" color="secondary" style={{ textAlign: 'center' }}>
                  {stat.label}
                </Typography>
              </Card>
            ))}
          </View>
        </Animated.View>

        {/* Reward tiers */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <Typography variant="h3" style={{ marginBottom: 12 }}>
            How Rewards Work
          </Typography>
          <Card style={{ marginBottom: 20 }}>
            {REWARD_TIERS.map((tier, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 14,
                  borderBottomWidth: i < REWARD_TIERS.length - 1 ? 1 : 0,
                  borderBottomColor: COLORS.border,
                }}
              >
                <Typography style={{ fontSize: 24 }}>{tier.emoji}</Typography>
                <View style={{ flex: 1 }}>
                  <Typography variant="body" style={{ fontWeight: '600', marginBottom: 2 }}>
                    {tier.action}
                  </Typography>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Badge label={`You: ${tier.referrer}`} variant="success" size="sm" />
                    {tier.referee !== '—' && (
                      <Badge label={`Friend: ${tier.referee}`} variant="info" size="sm" />
                    )}
                  </View>
                </View>
              </View>
            ))}
          </Card>
        </Animated.View>

        {/* Referral history */}
        {referrals.length > 0 && (
          <Animated.View entering={FadeIn.delay(400)}>
            <Typography variant="h3" style={{ marginBottom: 12 }}>
              Your Referrals
            </Typography>
            <Card>
              {referrals.map((ref, i) => (
                <View
                  key={ref.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 12,
                    borderBottomWidth: i < referrals.length - 1 ? 1 : 0,
                    borderBottomColor: COLORS.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: COLORS.primary.light,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography style={{ fontSize: 16 }}>🐾</Typography>
                    </View>
                    <View>
                      <Typography variant="body" style={{ fontWeight: '600' }}>
                        {ref.referredUserName}
                      </Typography>
                      <Typography variant="caption" color="tertiary">
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </Typography>
                    </View>
                  </View>
                  <Badge
                    label={
                      ref.status === 'converted'
                        ? 'Premium! 🎉'
                        : ref.status === 'trial_started'
                          ? 'Trial'
                          : 'Installed'
                    }
                    variant={
                      ref.status === 'converted'
                        ? 'success'
                        : ref.status === 'trial_started'
                          ? 'accent'
                          : 'neutral'
                    }
                    size="sm"
                  />
                </View>
              ))}
            </Card>
          </Animated.View>
        )}

        {/* Empty state for no referrals */}
        {referrals.length === 0 && (
          <Animated.View entering={FadeIn.delay(400)}>
            <View
              style={{
                alignItems: 'center',
                paddingVertical: 24,
                backgroundColor: COLORS.surface,
                borderRadius: RADIUS.lg,
                ...SHADOWS.card,
              }}
            >
              <Typography style={{ fontSize: 40, marginBottom: 8 }}>🐕‍🦺</Typography>
              <Typography variant="body" color="secondary" style={{ textAlign: 'center' }}>
                Share your code to start earning rewards!
              </Typography>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
