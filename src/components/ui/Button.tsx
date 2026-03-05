import React from "react";
import { Pressable, ActivityIndicator, type PressableProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Typography } from "./Typography";

/**
 * Button component matching PupPal Design System.
 *
 * Variants:
 * - primary: Coral filled — main CTA, one per screen
 * - secondary: Navy outlined — secondary actions
 * - ghost: Transparent text — tertiary actions, inline links
 *
 * Sizes:
 * - lg: Full-width CTA (56px height) — used for main actions
 * - md: Standard (48px height) — used inline
 * - sm: Compact (36px height) — tags, small actions
 */

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "lg" | "md" | "sm";

interface ButtonProps extends Omit<PressableProps, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<ButtonVariant, { base: string; pressed: string; text: string }> = {
  primary: {
    base: "bg-primary",
    pressed: "bg-primary-dark",
    text: "text-text-inverse",
  },
  secondary: {
    base: "bg-transparent border-2 border-secondary",
    pressed: "bg-secondary/5",
    text: "text-secondary",
  },
  ghost: {
    base: "bg-transparent",
    pressed: "bg-secondary/5",
    text: "text-primary",
  },
};

const SIZE_STYLES: Record<ButtonSize, { container: string; text: string }> = {
  lg: { container: "h-[56px] px-xl rounded-sm", text: "text-body font-brand-bold" },
  md: { container: "h-[48px] px-lg rounded-sm", text: "text-body font-brand-semibold" },
  sm: { container: "h-[36px] px-base rounded-sm", text: "text-body-sm font-brand-semibold" },
};

export function Button({
  variant = "primary",
  size = "lg",
  label,
  leftIcon,
  rightIcon,
  isLoading = false,
  fullWidth = true,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];
  const isDisabled = disabled || isLoading;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      disabled={isDisabled}
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 100 });
      }}
      className={`
        ${sizeStyle.container}
        ${fullWidth ? "w-full" : ""}
        flex-row items-center justify-center gap-sm
        ${isDisabled ? "opacity-50" : ""}
        ${className ?? ""}
      `}
      {...props}
    >
      {({ pressed }) => (
        <Animated.View
          style={animatedStyle}
          className={`
            flex-1 flex-row items-center justify-center gap-sm
            rounded-sm
            ${sizeStyle.container}
            ${pressed ? variantStyle.pressed : variantStyle.base}
          `}
        >
          {isLoading ? (
            <ActivityIndicator
              color={variant === "primary" ? "#FFFFFF" : "#1B2333"}
              size="small"
            />
          ) : (
            <>
              {leftIcon}
              <Typography
                variant={size === "sm" ? "body-sm-medium" : "body-medium"}
                color={variant === "primary" ? "inverse" : variant === "ghost" ? "accent" : "primary"}
                className={`${sizeStyle.text} ${variantStyle.text}`}
              >
                {label}
              </Typography>
              {rightIcon}
            </>
          )}
        </Animated.View>
      )}
    </Pressable>
  );
}
