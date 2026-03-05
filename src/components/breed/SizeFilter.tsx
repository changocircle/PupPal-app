/**
 * Size filter pills for the breed browser
 * Per PRD: [Toy] [Small] [Medium] [Large] [Giant]
 */

import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Typography } from '../ui';
import type { SizeCategory } from '../../types/breed';
import { SIZE_LABELS } from '../../types/breed';
import { COLORS, RADIUS } from '../../constants/theme';

interface SizeFilterProps {
  selected: SizeCategory | null;
  onSelect: (size: SizeCategory | null) => void;
}

const SIZES: (SizeCategory | 'all')[] = ['all', 'toy', 'small', 'medium', 'large', 'giant'];

export function SizeFilter({ selected, onSelect }: SizeFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
    >
      {SIZES.map((size) => {
        const isActive = size === 'all' ? selected === null : selected === size;
        return (
          <Pressable
            key={size}
            onPress={() => onSelect(size === 'all' ? null : (size as SizeCategory))}
            style={{
              backgroundColor: isActive ? COLORS.primary.DEFAULT : COLORS.surface,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: RADIUS.full,
              borderWidth: 1,
              borderColor: isActive ? COLORS.primary.DEFAULT : COLORS.border,
            }}
          >
            <Typography
              variant="caption"
              style={{
                color: isActive ? '#FFF' : COLORS.text.secondary,
                fontWeight: '600',
              }}
            >
              {size === 'all' ? 'All' : SIZE_LABELS[size as SizeCategory]}
            </Typography>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
