import React from "react";
import { View } from "react-native";
import { Typography } from "@/components/ui";

/**
 * MonthHeader — Month/year divider with entry count.
 * Visually separates timeline sections.
 */

interface MonthHeaderProps {
  label: string;
  entryCount: number;
}

export function MonthHeader({ label, entryCount }: MonthHeaderProps) {
  return (
    <View className="flex-row items-center justify-between py-md mb-xs">
      <View className="flex-row items-center gap-sm">
        <View className="w-[6px] h-[6px] rounded-full bg-primary" />
        <Typography variant="h3">{label}</Typography>
      </View>
      <Typography variant="caption" color="tertiary">
        {entryCount} {entryCount === 1 ? "entry" : "entries"}
      </Typography>
    </View>
  );
}
