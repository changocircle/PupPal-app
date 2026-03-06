import React from "react";
import { Text, type TextProps } from "react-native";

/**
 * Typography component matching PupPal Design System.
 *
 * Variants:
 * - display: 36px ExtraBold, onboarding headlines, celebration screens
 * - h1: 30px Bold, screen titles
 * - h2: 24px Bold, section headers
 * - h3: 20px SemiBold, card titles, feature names
 * - body-lg: 18px Regular, Buddy chat, primary content
 * - body: 16px Regular, default body text
 * - body-medium: 16px Medium, emphasized body, labels
 * - body-sm: 14px Regular, secondary text, captions
 * - body-sm-medium: 14px Medium, badges, tags
 * - caption: 12px Medium, timestamps, fine print
 * - overline: 11px SemiBold, category labels (uppercase)
 */

type TypographyVariant =
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "body-lg"
  | "body"
  | "body-medium"
  | "body-sm"
  | "body-sm-medium"
  | "caption"
  | "overline";

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: "primary" | "secondary" | "tertiary" | "inverse" | "error" | "success" | "accent";
  children: React.ReactNode;
}

const VARIANT_CLASSES: Record<TypographyVariant, string> = {
  display: "text-display font-brand-extrabold",
  h1: "text-h1 font-brand-bold",
  h2: "text-h2 font-brand-bold",
  h3: "text-h3 font-brand-semibold",
  "body-lg": "text-body-lg font-brand-regular",
  body: "text-body font-brand-regular",
  "body-medium": "text-body font-brand-medium",
  "body-sm": "text-body-sm font-brand-regular",
  "body-sm-medium": "text-body-sm font-brand-medium",
  caption: "text-caption font-brand-medium",
  overline: "text-overline font-brand-semibold uppercase tracking-wider",
};

const COLOR_CLASSES: Record<NonNullable<TypographyProps["color"]>, string> = {
  primary: "text-text-primary",
  secondary: "text-text-secondary",
  tertiary: "text-text-tertiary",
  inverse: "text-text-inverse",
  error: "text-error",
  success: "text-success",
  accent: "text-accent",
};

export function Typography({
  variant = "body",
  color = "primary",
  className,
  children,
  ...props
}: TypographyProps) {
  const variantClass = VARIANT_CLASSES[variant];
  const colorClass = COLOR_CLASSES[color];

  return (
    <Text className={`${variantClass} ${colorClass} ${className ?? ""}`} {...props}>
      {children}
    </Text>
  );
}
