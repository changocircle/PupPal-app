import React from 'react';
import Svg, { Circle, Ellipse, Path, G } from 'react-native-svg';

export type BuddyIconMood = 'happy' | 'thinking' | 'empathetic' | 'celebrating';

interface Props {
  mood?: BuddyIconMood;
  size?: number;
}

export function BuddyIcon({ mood = 'happy', size = 32 }: Props) {
  const fur = '#E8C98A';
  const furDark = '#C9A460';
  const nose = '#3D2B1F';
  const coral = '#FF6B5C';
  const coralDark = '#E5523F';
  const white = '#FFFAF7';
  const pupil = '#2A1A0E';
  const eyeWhite = '#FFFFFF';

  const mouthPath =
    mood === 'thinking'
      ? 'M 42 67 Q 50 64 58 67'
      : mood === 'empathetic'
      ? 'M 42 69 Q 50 66 58 69'
      : mood === 'celebrating'
      ? 'M 40 64 Q 50 75 60 64'
      : 'M 41 66 Q 50 73 59 66';

  const leftEyeRY = mood === 'thinking' ? 5 : 6;
  const rightEyeRY = mood === 'thinking' ? 4 : 6;

  const leftBrow =
    mood === 'thinking'
      ? 'M 35 38 Q 41 34 47 36'
      : mood === 'empathetic'
      ? 'M 35 40 Q 41 37 47 39'
      : 'M 35 41 Q 41 37 47 40';

  const rightBrow =
    mood === 'thinking'
      ? 'M 53 36 Q 59 34 65 38'
      : mood === 'empathetic'
      ? 'M 53 39 Q 59 37 65 40'
      : 'M 53 40 Q 59 37 65 41';

  const showBlush = mood === 'celebrating';

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Ellipse cx={26} cy={42} rx={13} ry={17} fill={furDark} />
      <Ellipse cx={26} cy={43} rx={9} ry={13} fill={fur} />
      <Ellipse cx={74} cy={42} rx={13} ry={17} fill={furDark} />
      <Ellipse cx={74} cy={43} rx={9} ry={13} fill={fur} />
      <Circle cx={50} cy={50} r={34} fill={fur} />
      <Ellipse cx={50} cy={38} rx={18} ry={10} fill="#EDD49A" opacity={0.5} />
      <Path
        d="M 22 74 Q 50 82 78 74 Q 78 84 50 88 Q 22 84 22 74 Z"
        fill={coral}
      />
      <Circle cx={50} cy={83} r={5} fill={coralDark} />
      <Path
        d="M 47 83 L 43 88 M 53 83 L 57 88"
        stroke={coralDark}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Ellipse cx={50} cy={66} rx={16} ry={11} fill="#EDD49A" />
      <Ellipse cx={50} cy={61} rx={6} ry={4} fill={nose} />
      <Ellipse cx={48} cy={59.5} rx={2} ry={1.2} fill="#6B4F3A" opacity={0.7} />
      <Path
        d={mouthPath}
        stroke={nose}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />
      <Ellipse cx={41} cy={50} rx={7.5} ry={leftEyeRY} fill={eyeWhite} />
      <Circle cx={41} cy={50} r={4.2} fill={pupil} />
      <Circle cx={39.5} cy={48.5} r={1.4} fill={white} />
      <Ellipse cx={59} cy={50} rx={7.5} ry={rightEyeRY} fill={eyeWhite} />
      <Circle cx={59} cy={50} r={4.2} fill={pupil} />
      <Circle cx={57.5} cy={48.5} r={1.4} fill={white} />
      <Path d={leftBrow} stroke={furDark} strokeWidth={2.5} strokeLinecap="round" fill="none" />
      <Path d={rightBrow} stroke={furDark} strokeWidth={2.5} strokeLinecap="round" fill="none" />
      {showBlush && (
        <G opacity={0.45}>
          <Circle cx={30} cy={58} r={7} fill={coral} />
          <Circle cx={70} cy={58} r={7} fill={coral} />
        </G>
      )}
    </Svg>
  );
}
