/**
 * ScoreGauge, circular Good Boy Score display
 * PRD-04 §5, DESIGN-SYSTEM.md: 120px, color gradient, animated fill
 *
 * Animated SVG circle with score number in center.
 * Color transitions: red → orange → green as score increases.
 */

import React, { useEffect } from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  useDerivedValue,
} from "react-native-reanimated";
import { Typography } from "@/components/ui";
import { getGbsLabel } from "@/types/gamification";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ScoreGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

function getScoreColor(score: number): string {
  if (score < 20) return "#EF6461";  // red
  if (score < 40) return "#F5A623";  // orange
  if (score < 60) return "#FFB547";  // gold
  if (score < 80) return "#5CB882";  // green
  return "#2ECC71";                   // bright green
}

export function ScoreGauge({
  score,
  size = 100,
  strokeWidth = 8,
  showLabel = true,
}: ScoreGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(score / 100, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [score]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const color = getScoreColor(score);
  const label = getGbsLabel(score);

  return (
    <View className="items-center">
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* Background track */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#F0EBE6"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress arc */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
            rotation="-90"
            origin={`${center}, ${center}`}
          />
        </Svg>

        {/* Center number */}
        <View
          className="absolute items-center justify-center"
          style={{ width: size, height: size }}
        >
          <Typography
            variant="h2"
            style={{ color, fontSize: size * 0.28, lineHeight: size * 0.34 }}
          >
            {score}
          </Typography>
        </View>
      </View>

      {showLabel && (
        <Typography
          variant="caption"
          color="secondary"
          className="mt-[2px] text-center"
        >
          {label}
        </Typography>
      )}
    </View>
  );
}
