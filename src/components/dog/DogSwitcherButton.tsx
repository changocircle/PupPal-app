/**
 * Dog Switcher Button — Compact header button
 * PRD-11 §3: Active dog photo + name + dropdown arrow in home header
 */

import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Typography } from '../ui';
import { DogAvatar } from './DogAvatar';
import { DogSwitcher } from './DogSwitcher';
import { useDogStore } from '@/stores/dogStore';
import { COLORS, RADIUS } from '@/constants/theme';

export function DogSwitcherButton() {
  const [showSwitcher, setShowSwitcher] = useState(false);
  const activeDog = useDogStore((s) => s.activeDog());
  const dogCount = useDogStore((s) => s.dogCount());

  if (!activeDog) return null;

  return (
    <>
      <Pressable
        onPress={() => setShowSwitcher(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 8,
          backgroundColor: COLORS.surface,
          borderRadius: RADIUS.full,
          borderWidth: 1,
          borderColor: COLORS.border,
        }}
      >
        <DogAvatar
          name={activeDog.name}
          photoUrl={activeDog.photo_url}
          size={28}
        />
        <Typography
          variant="body"
          style={{ fontWeight: '600', marginLeft: 8, marginRight: 4 }}
          numberOfLines={1}
        >
          {activeDog.name}
        </Typography>
        {dogCount > 1 && (
          <Typography variant="caption" color="tertiary" style={{ fontSize: 10 }}>
            ▼
          </Typography>
        )}
      </Pressable>

      <DogSwitcher
        visible={showSwitcher}
        onClose={() => setShowSwitcher(false)}
      />
    </>
  );
}
