/**
 * BuddyAvatar — two-tier Buddy display system.
 *
 * LARGE (>= 64px): Detailed brand-kit illustration PNGs — transparent bg,
 *   no circular crop so the full illustration shows.
 *
 * SMALL (< 64px): BuddyIcon SVG — simplified face, clean at 32px, no fur
 *   texture, coral bandana. Used in chat bubbles, typing indicator, banners.
 *
 * Mood → tier mapping:
 *   happy, waving, proud               → main / waving illustration
 *   thinking                           → thinking illustration / BuddyIcon thinking
 *   celebrating, excited               → celebrating illustration / BuddyIcon celebrating
 *   empathetic                         → empathetic illustration / BuddyIcon empathetic
 *   teaching, sleeping                 → respective illustrations (large only → happy icon fallback)
 */

import React from 'react';
import { Image, View } from 'react-native';
import { BuddyIcon, BuddyIconMood } from './BuddyIcon';

export type BuddyMood =
  | 'happy'
  | 'thinking'
  | 'excited'
  | 'teaching'
  | 'celebrating'
  | 'empathetic'
  | 'proud'
  | 'sleeping'
  | 'waving';

const LARGE_ASSETS: Record<BuddyMood, any> = {
  happy:       require('../../../assets/buddy/buddy-main.png'),
  waving:      require('../../../assets/buddy/buddy-waving.png'),
  thinking:    require('../../../assets/buddy/buddy-thinking.png'),
  celebrating: require('../../../assets/buddy/buddy-celebrating.png'),
  empathetic:  require('../../../assets/buddy/buddy-empathetic.png'),
  proud:       require('../../../assets/buddy/buddy-proud.png'),
  teaching:    require('../../../assets/buddy/buddy-teaching.png'),
  sleeping:    require('../../../assets/buddy/buddy-sleeping.png'),
  excited:     require('../../../assets/buddy/buddy-celebrating.png'),
};

// Map BuddyMood → BuddyIconMood for small tier
const SMALL_MOOD_MAP: Record<BuddyMood, BuddyIconMood> = {
  happy:       'happy',
  waving:      'happy',
  proud:       'happy',
  thinking:    'thinking',
  teaching:    'thinking',
  sleeping:    'thinking',
  empathetic:  'empathetic',
  celebrating: 'celebrating',
  excited:     'celebrating',
};

const LARGE_THRESHOLD = 64; // px

export function BuddyAvatar({
  mood = 'happy',
  size = 40,
}: {
  mood?: BuddyMood;
  size?: number;
}) {
  if (size < LARGE_THRESHOLD) {
    // Small tier — SVG icon, clean at any small size
    return <BuddyIcon mood={SMALL_MOOD_MAP[mood]} size={size} />;
  }

  // Large tier — detailed illustration, no circular crop
  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={LARGE_ASSETS[mood]}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}
