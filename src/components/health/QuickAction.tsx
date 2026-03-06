/**
 * Quick Action Button, PRD-05 §3
 *
 * Horizontal action button for Health dashboard.
 * Supports locked state for premium-gated features.
 */

import React from "react";
import { Pressable, View } from "react-native";
import { Typography } from "@/components/ui";
import { COLORS } from "@/constants/theme";

interface QuickActionProps {
  icon: string;
  label: string;
  onPress: () => void;
  /** Show lock indicator for premium features */
  locked?: boolean;
}

export function QuickAction({ icon, label, onPress, locked }: QuickActionProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center gap-sm bg-primary-light py-md rounded-xl"
    >
      <Typography className="text-[16px]">{icon}</Typography>
      <Typography variant="body-sm-medium" style={{ color: "#FF6B5C" }}>
        {label}
      </Typography>
      {locked && (
        <Typography style={{ fontSize: 12, marginLeft: -2 }}>🔒</Typography>
      )}
    </Pressable>
  );
}
