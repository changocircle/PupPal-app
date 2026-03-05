/**
 * Medication Card — PRD-05 §5
 *
 * Card for an active medication with quick "Log Dose" action.
 */

import React from "react";
import { View, Pressable } from "react-native";
import { Typography, Card, Badge } from "@/components/ui";
import type { Medication } from "@/types/health";
import { MEDICATION_CATEGORY_META } from "@/types/health";

interface MedicationCardProps {
  medication: Medication;
  onLogDose: (med: Medication) => void;
  onPress: (med: Medication) => void;
}

export function MedicationCard({
  medication,
  onLogDose,
  onPress,
}: MedicationCardProps) {
  const meta = MEDICATION_CATEGORY_META[medication.category];
  const today = new Date().toISOString().split("T")[0]!;
  const isDue =
    medication.nextDue != null && medication.nextDue <= today;

  const nextDueLabel = medication.nextDue
    ? (() => {
        const daysUntil = Math.round(
          (new Date(medication.nextDue!).getTime() - new Date(today).getTime()) /
            86_400_000
        );
        if (daysUntil < 0)
          return `${Math.abs(daysUntil)}d overdue`;
        if (daysUntil === 0) return "Due today";
        return `Due in ${daysUntil}d`;
      })()
    : "As needed";

  return (
    <Pressable onPress={() => onPress(medication)}>
      <Card
        className={`mb-sm ${isDue ? "border-warning/30" : ""}`}
      >
        <View className="flex-row items-center gap-md">
          <Typography className="text-[24px]">{meta.icon}</Typography>
          <View className="flex-1">
            <Typography variant="body-medium">{medication.name}</Typography>
            <View className="flex-row items-center gap-sm mt-xs">
              {medication.dosage && (
                <Typography variant="caption" color="secondary">
                  {medication.dosage}
                </Typography>
              )}
              <Typography variant="caption" color="secondary">
                · {medication.frequency}
              </Typography>
            </View>
            <Typography
              variant="caption"
              style={{
                color: isDue ? "#F5A623" : "#9CA3AF",
                marginTop: 2,
              }}
            >
              {nextDueLabel}
            </Typography>
          </View>

          {medication.frequency !== "as_needed" &&
            medication.frequency !== "one_time" && (
              <Pressable
                onPress={() => onLogDose(medication)}
                className="bg-primary-light px-md py-sm rounded-xl"
              >
                <Typography
                  variant="caption"
                  style={{ color: "#FF6B5C", fontWeight: "600" }}
                >
                  Log Dose
                </Typography>
              </Pressable>
            )}
        </View>
      </Card>
    </Pressable>
  );
}
