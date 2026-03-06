/**
 * Dog Avatar, Reusable avatar component for dog profiles
 * Shows photo if available, otherwise shows first letter + dog emoji
 */

import React from 'react';
import { View, Image } from 'react-native';
import { Typography } from '../ui';
import { COLORS, RADIUS } from '@/constants/theme';

interface DogAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: number;
  showBorder?: boolean;
}

export function DogAvatar({
  name,
  photoUrl,
  size = 40,
  showBorder = false,
}: DogAvatarProps) {
  const borderSize = showBorder ? 2 : 0;
  const containerSize = size + borderSize * 2;

  if (photoUrl) {
    return (
      <View
        style={{
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
          borderWidth: borderSize,
          borderColor: showBorder ? COLORS.primary.DEFAULT : 'transparent',
          overflow: 'hidden',
        }}
      >
        <Image
          source={{ uri: photoUrl }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      </View>
    );
  }

  // Fallback: colored circle with first letter
  const initial = name.charAt(0).toUpperCase();
  const bgColors = [
    '#FFE0DB', '#DBEDFF', '#E0F5DB', '#FFF0DB', '#F0DBFF',
    '#DBFFF0', '#FFE0F5', '#DBF5FF',
  ];
  const bgColor = bgColors[name.length % bgColors.length] ?? bgColors[0];

  return (
    <View
      style={{
        width: containerSize,
        height: containerSize,
        borderRadius: containerSize / 2,
        borderWidth: borderSize,
        borderColor: showBorder ? COLORS.primary.DEFAULT : 'transparent',
        backgroundColor: bgColor,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Typography
        variant="body"
        style={{
          fontSize: size * 0.4,
          fontWeight: '700',
          color: COLORS.text.primary,
        }}
      >
        {initial}
      </Typography>
    </View>
  );
}
