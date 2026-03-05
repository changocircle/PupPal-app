/**
 * NotificationPrompt — PRD-09 §2
 *
 * Pre-permission screen shown after user completes first exercise.
 * "Buddy" asks if the user wants reminders — framed as helpful, not pushy.
 * On "Yes" → triggers iOS system permission dialog.
 * On "Maybe Later" → defers (re-ask after 3rd exercise).
 */

import React from 'react';
import { View, Modal, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInUp, BounceIn } from 'react-native-reanimated';
import { Typography, Button } from '@/components/ui';
import { requestPermission } from '@/services/notifications';
import { analytics, EVENTS } from '@/services/analytics';
import { COLORS, RADIUS, SHADOWS } from '@/constants/theme';

interface NotificationPromptProps {
  visible: boolean;
  dogName: string;
  variant?: 'first_exercise' | 'third_exercise';
  onDismiss: () => void;
  onComplete: (granted: boolean) => void;
}

export function NotificationPrompt({
  visible,
  dogName,
  variant = 'first_exercise',
  onDismiss,
  onComplete,
}: NotificationPromptProps) {
  const handleAccept = async () => {
    analytics.track('notification_prompt_accepted', { variant });
    const granted = await requestPermission();
    onComplete(granted);
  };

  const handleDecline = () => {
    analytics.track('notification_prompt_declined', { variant });
    onDismiss();
  };

  const title =
    variant === 'first_exercise'
      ? `Great start! Want me to remind you when ${dogName}'s next training is ready?`
      : `${dogName} has a 3-day streak! Want reminders so you never miss a day?`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <Animated.View
          entering={FadeInUp.duration(400).springify()}
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: RADIUS.xl,
            padding: 32,
            width: '100%',
            maxWidth: 340,
            alignItems: 'center',
            ...SHADOWS.modal,
          }}
        >
          {/* Buddy avatar */}
          <Animated.View
            entering={BounceIn.delay(200)}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: COLORS.primary.light,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <Typography style={{ fontSize: 40 }}>🐕</Typography>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeIn.delay(300)}>
            <Typography
              variant="h3"
              style={{ textAlign: 'center', marginBottom: 16, lineHeight: 26 }}
            >
              {title}
            </Typography>
          </Animated.View>

          {/* Benefits */}
          <Animated.View entering={FadeIn.delay(400)} style={{ width: '100%', marginBottom: 24 }}>
            {[
              { emoji: '🔥', text: 'Streak reminders' },
              { emoji: '💉', text: 'Vaccination due dates' },
              { emoji: '🏆', text: `${dogName}'s achievements` },
            ].map((item, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <Typography style={{ fontSize: 18 }}>{item.emoji}</Typography>
                <Typography variant="body" color="secondary">
                  {item.text}
                </Typography>
              </View>
            ))}
          </Animated.View>

          {/* Accept */}
          <Animated.View entering={FadeIn.delay(500)} style={{ width: '100%' }}>
            <Button
              label="Yes, remind me! →"
              variant="primary"
              onPress={handleAccept}
            />
          </Animated.View>

          {/* Decline */}
          <Animated.View entering={FadeIn.delay(600)}>
            <Pressable
              onPress={handleDecline}
              style={{ marginTop: 16, padding: 8 }}
            >
              <Typography variant="body" color="tertiary">
                Maybe later
              </Typography>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}
