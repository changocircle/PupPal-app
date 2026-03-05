/**
 * Dog Switcher — Bottom sheet for switching between dogs
 * PRD-11 §3: Shows all active dogs, checkmark on current, "+ Add Another Dog"
 *
 * Rendered as a modal overlay (no @gorhom/bottom-sheet dependency needed).
 */

import React, { useCallback } from 'react';
import {
  View,
  Pressable,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Typography, Badge } from '../ui';
import { DogAvatar } from './DogAvatar';
import { useDogStore } from '@/stores/dogStore';
import { useSubscription } from '@/hooks/useSubscription';
import { COLORS, RADIUS, SHADOWS } from '@/constants/theme';
import type { Dog } from '@/types/database';

interface DogSwitcherProps {
  visible: boolean;
  onClose: () => void;
}

export function DogSwitcher({ visible, onClose }: DogSwitcherProps) {
  const router = useRouter();
  const activeDogId = useDogStore((s) => s.activeDogId);
  const activeDogs = useDogStore((s) => s.activeDogs());
  const archivedDogs = useDogStore((s) => s.archivedDogs());
  const switchDog = useDogStore((s) => s.switchDog);
  const isSwitching = useDogStore((s) => s.isSwitching);
  const { isPremium } = useSubscription();

  const handleSwitchDog = useCallback(
    async (dogId: string) => {
      if (dogId === activeDogId) {
        onClose();
        return;
      }
      await switchDog(dogId);
      onClose();
    },
    [activeDogId, switchDog, onClose]
  );

  const handleAddDog = useCallback(() => {
    if (!isPremium) {
      Alert.alert(
        'Premium Feature',
        'Multi-dog support is available for Premium subscribers. Upgrade to add more dogs!',
        [
          { text: 'Maybe Later', style: 'cancel' },
          {
            text: 'Upgrade',
            onPress: () => {
              onClose();
              router.push({
                pathname: '/paywall',
                params: { trigger: 'feature_gate_multi_dog', source: 'dog_switcher' },
              } as any);
            },
          },
        ]
      );
      return;
    }
    onClose();
    router.push('/add-dog');
  }, [isPremium, onClose, router]);

  const handleManageDog = useCallback(
    (dog: Dog) => {
      onClose();
      router.push(`/dog/${dog.id}/manage`);
    },
    [onClose, router]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
        onPress={onClose}
      >
        <View style={{ flex: 1 }} />
      </Pressable>

      {/* Sheet */}
      <Animated.View
        entering={SlideInDown.duration(300)}
        style={{
          backgroundColor: COLORS.background,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 12,
          paddingBottom: 40,
          maxHeight: '70%',
          ...SHADOWS.lg,
        }}
      >
        {/* Handle */}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: COLORS.border,
              borderRadius: 2,
            }}
          />
        </View>

        {/* Title */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            marginBottom: 16,
          }}
        >
          <Typography variant="h3">Your Dogs</Typography>
          {activeDogs.length > 1 && (
            <Typography variant="caption" color="secondary">
              {activeDogs.length} dogs
            </Typography>
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ paddingHorizontal: 20 }}
        >
          {/* Active dogs */}
          {activeDogs.map((dog) => {
            const isActive = dog.id === activeDogId;
            return (
              <Pressable
                key={dog.id}
                onPress={() => handleSwitchDog(dog.id)}
                onLongPress={() => handleManageDog(dog)}
                disabled={isSwitching}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  marginBottom: 8,
                  borderRadius: RADIUS.lg,
                  backgroundColor: isActive
                    ? COLORS.primary.extralight
                    : COLORS.surface,
                  borderWidth: isActive ? 2 : 1,
                  borderColor: isActive
                    ? COLORS.primary.DEFAULT
                    : COLORS.border,
                  opacity: isSwitching ? 0.6 : 1,
                }}
              >
                <DogAvatar
                  name={dog.name}
                  photoUrl={dog.photo_url}
                  size={44}
                  showBorder={isActive}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Typography
                    variant="body"
                    style={{ fontWeight: isActive ? '700' : '500' }}
                  >
                    {dog.name}
                  </Typography>
                  <Typography variant="caption" color="secondary">
                    {dog.breed ?? 'Unknown breed'}
                  </Typography>
                </View>
                {isActive && (
                  <Typography style={{ fontSize: 18 }}>✓</Typography>
                )}
              </Pressable>
            );
          })}

          {/* Archived dogs (collapsed) */}
          {archivedDogs.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Typography
                variant="caption"
                color="tertiary"
                style={{
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                Archived
              </Typography>
              {archivedDogs.map((dog) => (
                <Pressable
                  key={dog.id}
                  onPress={() => handleManageDog(dog)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    marginBottom: 8,
                    borderRadius: RADIUS.lg,
                    backgroundColor: COLORS.surface,
                    opacity: 0.6,
                  }}
                >
                  <DogAvatar
                    name={dog.name}
                    photoUrl={dog.photo_url}
                    size={36}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Typography variant="caption" style={{ fontWeight: '500' }}>
                      {dog.name}
                    </Typography>
                    <Typography variant="caption" color="tertiary">
                      Archived
                    </Typography>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* Add Dog button */}
          <Pressable
            onPress={handleAddDog}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 14,
              marginTop: 8,
              marginBottom: 8,
              borderRadius: RADIUS.lg,
              borderWidth: 2,
              borderColor: COLORS.primary.DEFAULT,
              borderStyle: 'dashed',
            }}
          >
            <Typography
              variant="body"
              style={{
                color: COLORS.primary.DEFAULT,
                fontWeight: '600',
                fontSize: 16,
              }}
            >
              + Add Another Dog
            </Typography>
            {!isPremium && (
              <Badge
                label="Premium"
                variant="accent"
                size="sm"
              />
            )}
          </Pressable>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}
