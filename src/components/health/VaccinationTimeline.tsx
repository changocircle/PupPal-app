/**
 * Vaccination Timeline Item — PRD-05 §4
 *
 * A single row in the vertical vaccination timeline.
 */

import React from "react";
import { View, Pressable } from "react-native";
import { Typography, Badge } from "@/components/ui";
import type { ScheduledVaccination } from "@/types/health";

interface VaccinationTimelineItemProps {
  vaccination: ScheduledVaccination;
  onPress: (v: ScheduledVaccination) => void;
  isLast?: boolean;
}

const STATUS_CONFIG = {
  completed: { icon: "✅", badgeVariant: "success" as const, label: "Done" },
  upcoming: { icon: "🔵", badgeVariant: "info" as const, label: "Upcoming" },
  due_soon: { icon: "🟡", badgeVariant: "warning" as const, label: "Due Soon" },
  overdue: { icon: "🔴", badgeVariant: "error" as const, label: "Overdue" },
  skipped: { icon: "⏭", badgeVariant: "neutral" as const, label: "Skipped" },
  unknown: { icon: "❓", badgeVariant: "neutral" as const, label: "Not Logged" },
};

export function VaccinationTimelineItem({
  vaccination,
  onPress,
  isLast = false,
}: VaccinationTimelineItemProps) {
  const config = STATUS_CONFIG[vaccination.status];
  const dateStr = vaccination.completedAt ?? vaccination.dueDate;
  const formattedDate = new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Pressable
      onPress={() => onPress(vaccination)}
      className="flex-row"
    >
      {/* Timeline rail */}
      <View className="items-center mr-md" style={{ width: 28 }}>
        <Typography className="text-[16px]">{config.icon}</Typography>
        {!isLast && (
          <View className="w-[2px] flex-1 bg-border mt-xs" />
        )}
      </View>

      {/* Content */}
      <View className="flex-1 pb-lg">
        <View className="flex-row items-center gap-sm mb-xs">
          <Typography variant="body-medium" className="flex-1">
            {vaccination.vaccineName}
          </Typography>
          <Badge
            variant={config.badgeVariant}
            label={config.label}
            size="sm"
          />
        </View>
        <Typography variant="caption" color="secondary">
          {vaccination.status === "completed"
            ? `Completed ${formattedDate}`
            : `Due ${formattedDate}`}
          {vaccination.vetName ? ` · ${vaccination.vetName}` : ""}
        </Typography>
        {vaccination.breedNote && (
          <View className="mt-xs bg-warning-light rounded-lg px-sm py-xs">
            <Typography variant="caption" style={{ color: "#F5A623" }}>
              ⚠️ {vaccination.breedNote}
            </Typography>
          </View>
        )}
      </View>
    </Pressable>
  );
}
