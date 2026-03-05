import React from "react";
import { View, type ViewProps } from "react-native";

/**
 * Card component matching PupPal Design System.
 *
 * Variants:
 * - default: White surface with subtle shadow — standard card
 * - featured: Coral-tinted background with emphasis — highlighted content
 * - outline: White with border, no shadow — subtle grouping
 */

type CardVariant = "default" | "featured" | "outline";

interface CardProps extends ViewProps {
  variant?: CardVariant;
  padded?: boolean;
  children: React.ReactNode;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: "bg-surface shadow-card",
  featured: "bg-primary-extralight border border-primary-light",
  outline: "bg-surface border border-border",
};

export function Card({
  variant = "default",
  padded = true,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <View
      className={`
        rounded-md
        ${VARIANT_CLASSES[variant]}
        ${padded ? "p-base" : ""}
        ${className ?? ""}
      `}
      {...props}
    >
      {children}
    </View>
  );
}
