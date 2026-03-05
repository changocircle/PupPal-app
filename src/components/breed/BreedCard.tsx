/**
 * Breed card for the breed browser list
 * Shows breed name, group, size, and key temperament tags
 */

import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../ui';
import { Badge } from '../ui';
import type { BreedProfile } from '../../types/breed';
import { SIZE_LABELS } from '../../types/breed';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

interface BreedCardProps {
  breed: BreedProfile;
  isUserBreed?: boolean;
}

const GROUP_ICONS: Record<string, string> = {
  Sporting: '🏃',
  Hound: '🔍',
  Working: '💪',
  Terrier: '⚡',
  Toy: '💎',
  'Non-Sporting': '🌟',
  Herding: '🐑',
  'Foundation Stock Service': '🐶',
};

export function BreedCard({ breed, isUserBreed }: BreedCardProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/breeds/${breed.slug}`)}
      style={({ pressed }) => ({
        backgroundColor: isUserBreed ? COLORS.primary.light : COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: 16,
        marginBottom: 12,
        borderWidth: isUserBreed ? 2 : 1,
        borderColor: isUserBreed ? COLORS.primary.DEFAULT : COLORS.border,
        opacity: pressed ? 0.9 : 1,
        ...SHADOWS.sm,
      })}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
            }}
          >
            <Typography
              variant="body"
              style={{ fontSize: 22 }}
            >
              {GROUP_ICONS[breed.akc_group] || '🐶'}
            </Typography>
            <Typography variant="h3" style={{ flex: 1 }}>
              {breed.name}
            </Typography>
          </View>

          <Typography variant="caption" color="secondary" style={{ marginBottom: 8 }}>
            {breed.akc_group} · {SIZE_LABELS[breed.size_category]}
            {breed.popularity_rank ? ` · #${breed.popularity_rank}` : ''}
          </Typography>

          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {breed.temperament_tags.slice(0, 3).map((tag) => (
              <Badge key={tag} label={tag} variant="neutral" size="sm" />
            ))}
            {isUserBreed && (
              <Badge label="Your Breed" variant="accent" size="sm" />
            )}
          </View>
        </View>

        <Typography variant="body" color="tertiary" style={{ fontSize: 20, marginTop: 4 }}>
          →
        </Typography>
      </View>
    </Pressable>
  );
}
