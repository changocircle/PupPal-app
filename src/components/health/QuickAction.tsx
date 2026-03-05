/**
 * Quick Action Button — PRD-05 §3
 *
 * Horizontal action button for Health dashboard.
 */

import React from "react";
import { Pressable, View } from "react-native";
import { Typography } from "@/components/ui";

interface QuickActionProps {
  icon: string;
  label: string;
  onPress: () => void;
}

export function QuickAction({ icon, label, onPress }: QuickActionProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center gap-sm bg-primary-light py-md rounded-xl"
    >
      <Typography className="text-[16px]">{icon}</Typography>
      <Typography variant="body-sm-medium" style={{ color: "#FF6B5C" }}>
        {label}
      </Typography>
    </Pressable>
  );
}
