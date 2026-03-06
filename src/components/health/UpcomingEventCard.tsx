/**
 * Upcoming Health Event Card, PRD-05 §3
 *
 * Shows a single upcoming health event (vaccination, med, vet follow-up).
 */

import React from "react";
import { View, Pressable } from "react-native";
import { Typography } from "@/components/ui";

interface UpcomingEventCardProps {
  icon: string;
  title: string;
  dueDate: string;
  daysUntil: number;
  onPress?: () => void;
}

export function UpcomingEventCard({
  icon,
  title,
  dueDate,
  daysUntil,
  onPress,
}: UpcomingEventCardProps) {
  const isOverdue = daysUntil < 0;
  const isDueSoon = daysUntil >= 0 && daysUntil <= 3;

  const dueLabel = isOverdue
    ? `${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? "s" : ""} overdue`
    : daysUntil === 0
      ? "Due today"
      : `Due in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`;

  const dueColor = isOverdue
    ? "#EF6461"
    : isDueSoon
      ? "#F5A623"
      : "#6B7280";

  const formattedDate = new Date(dueDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-md py-md border-b border-border"
    >
      <Typography className="text-[24px]">{icon}</Typography>
      <View className="flex-1">
        <Typography variant="body-medium" numberOfLines={1}>
          {title}
        </Typography>
        <Typography variant="caption" style={{ color: dueColor }}>
          {dueLabel} ({formattedDate})
        </Typography>
      </View>
      <Typography color="tertiary" variant="body-sm">→</Typography>
    </Pressable>
  );
}
