/**
 * Health Status Badge, PRD-05 §3
 *
 * Colour-coded badge for vaccination/health status.
 */

import React from "react";
import { View } from "react-native";
import { Typography } from "@/components/ui";

interface StatusBadgeProps {
  status: "up_to_date" | "due_soon" | "overdue" | "not_set_up" | "none";
  label: string;
}

const STATUS_STYLES: Record<
  StatusBadgeProps["status"],
  { bg: string; text: string }
> = {
  up_to_date: { bg: "#E8F5EE", text: "#5CB882" },
  due_soon: { bg: "#FFF6E5", text: "#F5A623" },
  overdue: { bg: "#FDEDED", text: "#EF6461" },
  not_set_up: { bg: "#F3F4F6", text: "#9CA3AF" },
  none: { bg: "#F3F4F6", text: "#9CA3AF" },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const style = STATUS_STYLES[status];

  return (
    <View
      className="px-md py-xs rounded-full"
      style={{ backgroundColor: style.bg }}
    >
      <Typography
        variant="caption"
        style={{ color: style.text, fontWeight: "600" }}
      >
        {label}
      </Typography>
    </View>
  );
}
