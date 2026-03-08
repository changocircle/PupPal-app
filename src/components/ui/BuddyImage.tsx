/**
 * BuddyImage — single source of truth for the Buddy mascot illustrations.
 *
 * Usage:
 *   <BuddyImage expression="waving" size={120} />
 *   <BuddyImage expression="happy" size={32} style={{ borderRadius: 16 }} />
 *
 * All 8 expressions are sourced from assets/buddy/*.png
 */

import React from "react";
import { Image, ImageStyle, StyleProp, View, ViewStyle } from "react-native";

export type BuddyExpression =
  | "happy"
  | "waving"
  | "excited"
  | "thinking"
  | "empathetic"
  | "encouraging"
  | "party"
  | "sleeping";

const BUDDY_IMAGES: Record<BuddyExpression, ReturnType<typeof require>> = {
  happy:       require("@/../assets/buddy/buddy_happy.png"),
  waving:      require("@/../assets/buddy/buddy_waving.png"),
  excited:     require("@/../assets/buddy/buddy_excited.png"),
  thinking:    require("@/../assets/buddy/buddy_thinking.png"),
  empathetic:  require("@/../assets/buddy/buddy_empathetic.png"),
  encouraging: require("@/../assets/buddy/buddy_encouraging.png"),
  party:       require("@/../assets/buddy/buddy_party.png"),
  sleeping:    require("@/../assets/buddy/buddy_sleeping.png"),
};

interface BuddyImageProps {
  expression?: BuddyExpression;
  size?: number;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export function BuddyImage({
  expression = "happy",
  size = 64,
  style,
  containerStyle,
}: BuddyImageProps) {
  return (
    <View style={containerStyle}>
      <Image
        source={BUDDY_IMAGES[expression]}
        style={[{ width: size, height: size }, style]}
        resizeMode="contain"
      />
    </View>
  );
}
