/**
 * Visual rating bar for breed stats (1-4 scale)
 * Shows filled dots to represent low/moderate/high/very_high
 */

import React from 'react';
import { View } from 'react-native';
import { Typography } from '../ui';
import { RATING_VALUES } from '../../types/breed';
import { COLORS } from '../../constants/theme';

interface RatingBarProps {
  label: string;
  icon: string;
  value: string; // 'low' | 'moderate' | 'high' | 'very_high'
  maxDots?: number;
  color?: string;
}

const RATING_LABELS: Record<string, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  very_high: 'Very High',
  critical: 'Critical',
  slow: 'Slow',
  average: 'Average',
  fast: 'Fast',
  very_fast: 'Very Fast',
};

export function RatingBar({
  label,
  icon,
  value,
  maxDots = 4,
  color = COLORS.primary.DEFAULT,
}: RatingBarProps) {
  const numericValue = RATING_VALUES[value] ?? 2;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
      }}
    >
      <Typography variant="body" style={{ fontSize: 18, width: 28 }}>
        {icon}
      </Typography>
      <View style={{ flex: 1 }}>
        <Typography
          variant="caption"
          color="secondary"
          style={{ marginBottom: 4 }}
        >
          {label}
        </Typography>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {Array.from({ length: maxDots }).map((_, i) => (
            <View
              key={i}
              style={{
                width: 24,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  i < numericValue ? color : COLORS.border,
              }}
            />
          ))}
        </View>
      </View>
      <Typography variant="caption" color="tertiary" style={{ marginLeft: 8 }}>
        {RATING_LABELS[value] || value}
      </Typography>
    </View>
  );
}
