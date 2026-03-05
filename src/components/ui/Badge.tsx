import React from "react";
import { View } from "react-native";
import { Typography } from "./Typography";

/**
 * Badge component matching PupPal Design System.
 *
 * Variants: success, warning, error, info, neutral, accent
 */

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "accent";

interface BadgeProps {
  variant?: BadgeVariant;
  label: string;
  size?: "sm" | "md";
}

const VARIANT_CLASSES: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: "bg-success-light", text: "text-success" },
  warning: { bg: "bg-warning-light", text: "text-warning" },
  error: { bg: "bg-error-light", text: "text-error" },
  info: { bg: "bg-info-light", text: "text-info" },
  neutral: { bg: "bg-border", text: "text-text-secondary" },
  accent: { bg: "bg-accent-light", text: "text-accent-dark" },
};

export function Badge({ variant = "neutral", label, size = "sm" }: BadgeProps) {
  const styles = VARIANT_CLASSES[variant];

  return (
    <View
      className={`
        ${styles.bg}
        ${size === "sm" ? "px-sm py-xs" : "px-md py-xs"}
        rounded-full self-start
      `}
    >
      <Typography
        variant={size === "sm" ? "caption" : "body-sm-medium"}
        className={styles.text}
      >
        {label}
      </Typography>
    </View>
  );
}
