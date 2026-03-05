import React from "react";
import { MotiView } from "moti";

/**
 * Skeleton loader per PupPal Design System.
 * "Never empty white screens" — always show skeleton while loading.
 */

interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
}

export function Skeleton({ width = "100%", height = 20, radius = 8 }: SkeletonProps) {
  return (
    <MotiView
      from={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{
        type: "timing",
        duration: 800,
        loop: true,
      }}
      className="bg-border"
      style={{
        width: width as number,
        height,
        borderRadius: radius,
      }}
    />
  );
}

/** Pre-built skeleton for a card with title + 2 lines */
export function CardSkeleton() {
  return (
    <MotiView className="bg-surface rounded-md p-base gap-md shadow-card">
      <Skeleton width="60%" height={24} />
      <Skeleton width="100%" height={16} />
      <Skeleton width="80%" height={16} />
    </MotiView>
  );
}
