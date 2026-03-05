import React, { forwardRef } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { Typography } from "./Typography";

/**
 * Input component matching PupPal Design System.
 *
 * Features:
 * - Label + helper text + error state
 * - Auto-sized with NativeWind
 * - Focus ring in primary color
 */

interface InputProps extends TextInputProps {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, helperText, error, leftIcon, className, ...props }, ref) => {
    const hasError = !!error;

    return (
      <View className="w-full gap-xs">
        {label && (
          <Typography variant="body-sm-medium" color="secondary">
            {label}
          </Typography>
        )}
        <View
          className={`
            flex-row items-center
            bg-surface border rounded-sm
            px-base h-[52px]
            ${hasError ? "border-error" : "border-border"}
          `}
        >
          {leftIcon && <View className="mr-sm">{leftIcon}</View>}
          <TextInput
            ref={ref}
            className="flex-1 text-body font-brand-regular text-text-primary"
            placeholderTextColor="#9CA3AF"
            autoCorrect={false}
            {...props}
          />
        </View>
        {(helperText || error) && (
          <Typography
            variant="caption"
            color={hasError ? "error" : "tertiary"}
          >
            {error ?? helperText}
          </Typography>
        )}
      </View>
    );
  },
);

Input.displayName = "Input";
