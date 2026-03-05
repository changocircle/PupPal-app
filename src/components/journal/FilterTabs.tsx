import React from "react";
import { View, Pressable } from "react-native";
import { Typography } from "@/components/ui";
import type { JournalFilter } from "@/types/journal";

/**
 * FilterTabs — All / Photos / Milestones pill tabs.
 */

interface FilterTabsProps {
  active: JournalFilter;
  onChange: (filter: JournalFilter) => void;
  counts?: { all: number; photos: number; milestones: number };
}

const TABS: { key: JournalFilter; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "📋" },
  { key: "photos", label: "Photos", icon: "📸" },
  { key: "milestones", label: "Milestones", icon: "🏆" },
];

export function FilterTabs({ active, onChange, counts }: FilterTabsProps) {
  return (
    <View className="flex-row gap-sm mb-lg">
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        const count = counts?.[tab.key];

        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            className={`
              flex-row items-center px-base py-sm rounded-full
              ${isActive ? "bg-primary" : "bg-surface border border-border"}
            `}
          >
            <Typography
              variant="body-sm-medium"
              color={isActive ? "inverse" : "secondary"}
              className={isActive ? "text-text-inverse" : ""}
            >
              {tab.icon} {tab.label}
            </Typography>
            {count != null && count > 0 && (
              <View
                className={`
                  ml-xs px-[6px] py-[1px] rounded-full
                  ${isActive ? "bg-white/20" : "bg-border"}
                `}
              >
                <Typography
                  variant="caption"
                  color={isActive ? "inverse" : "tertiary"}
                  className={isActive ? "text-text-inverse" : ""}
                >
                  {count}
                </Typography>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
