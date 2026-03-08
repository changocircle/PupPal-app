import React from 'react';
import { Image } from 'react-native';

export type BuddyMood =
  | 'happy'
  | 'thinking'
  | 'excited'
  | 'teaching'
  | 'celebrating'
  | 'concerned'
  | 'greeting';

const BUDDY_ASSETS: Record<BuddyMood, any> = {
  happy: require('../../../assets/buddy/buddy-happy.png'),
  thinking: require('../../../assets/buddy/buddy-thinking.png'),
  excited: require('../../../assets/buddy/buddy-excited.png'),
  teaching: require('../../../assets/buddy/buddy-teaching.png'),
  celebrating: require('../../../assets/buddy/buddy-celebrating.png'),
  concerned: require('../../../assets/buddy/buddy-concerned.png'),
  greeting: require('../../../assets/buddy/buddy-greeting.png'),
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
