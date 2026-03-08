import React from 'react';
import { Image } from 'react-native';

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

const BUDDY_ASSETS: Record<BuddyMood, any> = {
  happy:       require('../../../assets/buddy/buddy-main.png'),
  waving:      require('../../../assets/buddy/buddy-waving.png'),
  thinking:    require('../../../assets/buddy/buddy-thinking.png'),
  celebrating: require('../../../assets/buddy/buddy-celebrating.png'),
  empathetic:  require('../../../assets/buddy/buddy-empathetic.png'),
  proud:       require('../../../assets/buddy/buddy-proud.png'),
  teaching:    require('../../../assets/buddy/buddy-teaching.png'),
  sleeping:    require('../../../assets/buddy/buddy-sleeping.png'),
  // 'excited' maps to celebrating for high-energy moments
  excited:     require('../../../assets/buddy/buddy-waving.png'),
};

export function BuddyAvatar({
  mood = 'happy',
  size = 40,
}: {
  mood?: BuddyMood;
  size?: number;
}) {
  return (
    <Image
      source={BUDDY_ASSETS[mood]}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      resizeMode="cover"
    />
  );
}
