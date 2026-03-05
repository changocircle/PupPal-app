/**
 * DayProgress — horizontal day dots for the current week
 * Shows which day the user is on within the week
 */

import React from "react";
import { View } from "react-native";
import { Typography } from "@/components/ui";
import type { PlanDay } from "@/types/training";

interface DayProgressProps {
  days: PlanDay[];
  currentDay: number;
}

export function DayProgress({ days, currentDay }: DayProgressProps) {
  return (
    <View className="flex-row items-center justify-center gap-sm">
      {days.map((day) => {
        const isCurrent = day.dayNumber === currentDay;
        const isCompleted = day.status === "completed";
        const hasActivity =
          day.exercises.some((e) => e.status === "completed") &&
          day.status !== "completed";

        return (
          <View key={day.dayNumber} className="items-center">
            <View
              className={`w-[32px] h-[32px] rounded-full items-center justify-center ${
                isCompleted
                  ? "bg-success"
                  : isCurrent
                    ? "bg-primary"
                    : hasActivity
                      ? "bg-primary-light"
                      : "bg-border"
              }`}
            >
              {isCompleted ? (
                <Typography variant="caption" color="inverse">
                  ✓
                </Typography>
              ) : (
                <Typography
                  variant="caption"
                  color={isCurrent ? "inverse" : "secondary"}
                >
                  {day.dayNumber}
                </Typography>
              )}
            </View>
            {isCurrent && (
              <View className="w-[4px] h-[4px] rounded-full bg-primary mt-[3px]" />
            )}
          </View>
        );
      })}
    </View>
  );
}
