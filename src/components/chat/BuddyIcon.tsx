/**
 * BuddyIcon — simplified Buddy face for small sizes (32–48px).
 *
 * App-icon style: just the head, clean lines, no fur texture, no body.
 * Coral bandana hint. Designed to read at 32px.
 *
 * Uses react-native-svg (already in RN/Expo tree).
 */

import React from 'react';
import Svg, {
  Circle,
  Ellipse,
  Path,
  Rect,
  G,
} from 'react-native-svg';

export type BuddyIconMood = 'happy' | 'thinking' | 'empathetic' | 'celebrating';

interface Props {
  mood?: BuddyIconMood;
  size?: number;
}

export function BuddyIcon({ mood = 'happy', size = 32 }: Props) {
  // All paths drawn in a 100x100 viewBox, scaled by size.
  // Palette
  const fur    = '#E8C98A'; // warm golden retriever
  const furDark = '#C9A460'; // shadow
  const nose   = '#3D2B1F';
  const coral  = '#FF6B5C'; // bandana
  const coralDark = '#E5523F';
  const white  = '#FFFAF7';
  const pupil  = '#2A1A0E';
  const eyeWhite = '#FFFFFF';

  // Mouth shape varies by mood
  const mouthPath = mood === 'thinking'
    ? 'M 42 67 Q 50 64 58 67'              // slight uncertain line
    : mood === 'empathetic'
    ? 'M 42 69 Q 50 66 58 69'              // gentle soft smile
    : mood === 'celebrating'
    ? 'M 40 64 Q 50 75 60 64'              // big happy smile
    : 'M 41 66 Q 50 73 59 66';             // happy default

  // Eye shape: thinking = slight squint on one side
  const leftEyeRY  = mood === 'thinking' ? 5 : 6;
  const rightEyeRY = mood === 'thinking' ? 4 : 6;

  // Eyebrow tilt for mood
  // left brow: d= "M lx1 ly1 Q lmx lmy lx2 ly2"
  const leftBrow  = mood === 'thinking'
    ? 'M 35 38 Q 41 34 47 36'
    : mood === 'empathetic'
    ? 'M 35 40 Q 41 37 47 39'
    : 'M 35 41 Q 41 37 47 40';
  const rightBrow = mood === 'thinking'
    ? 'M 53 36 Q 59 34 65 38'
    : mood === 'empathetic'
    ? 'M 53 39 Q 59 37 65 40'
    : 'M 53 40 Q 59 37 65 41';

  // Blush circles for celebrating
  const showBlush = mood === 'celebrating';

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* ── HEAD ── */}
      {/* Ear left */}
      <Ellipse cx={26} cy={42} rx={13} ry={17} fill={furDark} />
      <Ellipse cx={26} cy={43} rx={9}  ry={13} fill={fur}     />
      {/* Ear right */}
      <Ellipse cx={74} cy={42} rx={13} ry={17} fill={furDark} />
      <Ellipse cx={74} cy={43} rx={9}  ry={13} fill={fur}     />

      {/* Head circle */}
      <Circle cx={50} cy={50} r={34} fill={fur} />

      {/* Forehead lighter highlight */}
      <Ellipse cx={50} cy={38} rx={18} ry={10} fill="#EDD49A" opacity={0.5} />

      {/* ── BANDANA ── */}
      {/* Bandana sits just below the head at ~y=78, collar style */}
      <Path
        d="M 22 74 Q 50 82 78 74 Q 78 84 50 88 Q 22 84 22 74 Z"
        fill={coral}
      />
      {/* Bandana knot */}
      <Circle cx={50} cy={83} r={5} fill={coralDark} />
      <Path d="M 47 83 L 43 88 M 53 83 L 57 88" stroke={coralDark} strokeWidth={2} strokeLinecap="round" />

      {/* ── FACE ── */}
      {/* Muzzle */}
      <Ellipse cx={50} cy={66} rx={16} ry={11} fill="#EDD49A" />

      {/* Nose */}
      <Ellipse cx={50} cy={61} rx={6} ry={4} fill={nose} />
      {/* Nose highlight */}
      <Ellipse cx={48} cy={59.5} rx={2} ry={1.2} fill="#6B4F3A" opacity={0.7} />

      {/* Mouth */}
      <Path
        d={mouthPath}
        stroke={nose}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />

      {/* ── EYES ── */}
      {/* Left eye */}
      <Ellipse cx={41} cy={50} rx={7.5} ry={leftEyeRY}  fill={eyeWhite} />
      <Circle  cx={41} cy={50} r={4.2} fill={pupil}    />
      <Circle  cx={39.5} cy={48.5} r={1.4} fill={white} /> {/* catchlight */}

      {/* Right eye */}
      <Ellipse cx={59} cy={50} rx={7.5} ry={rightEyeRY} fill={eyeWhite} />
      <Circle  cx={59} cy={50} r={4.2} fill={pupil}    />
      <Circle  cx={57.5} cy={48.5} r={1.4} fill={white} />

      {/* Eyebrows */}
      <Path d={leftBrow}  stroke={furDark} strokeWidth={2.5} strokeLinecap="round" fill="none" />
      <Path d={rightBrow} stroke={furDark} strokeWidth={2.5} strokeLinecap="round" fill="none" />

      {/* Blush for celebrating */}
      {showBlush && (
        <G opacity={0.45}>
          <Circle cx={30} cy={58} r={7} fill={coral} />
          <Circle cx={70} cy={58} r={7} fill={coral} />
        </G>
      )}
    </Svg>
  );
}
