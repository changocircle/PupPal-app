import React from "react";
import { View, Image, Pressable } from "react-native";
import { Typography, Card } from "@/components/ui";
import type { JournalEntry } from "@/types/journal";

/**
 * ThrowbackCard, "On This Day" card for the home screen.
 *
 * Shows an old entry (preferably a photo) from 1/3/6/12 months ago.
 */

interface ThrowbackCardProps {
  entry: JournalEntry;
  monthsAgo: number;
  onPress?: () => void;
}

function getThrowbackLabel(monthsAgo: number): string {
  if (monthsAgo === 1) return "1 month ago";
  if (monthsAgo < 12) return `${monthsAgo} months ago`;
  if (monthsAgo === 12) return "1 year ago";
  return `${Math.floor(monthsAgo / 12)} years ago`;
}

export function ThrowbackCard({ entry, monthsAgo, onPress }: ThrowbackCardProps) {
  const hasPhoto = entry.photoUris.length > 0;
  const label = getThrowbackLabel(monthsAgo);

  return (
    <Pressable onPress={onPress}>
      <Card className="overflow-hidden" padded={false}>
        {/* Header */}
        <View className="flex-row items-center px-base pt-base pb-sm">
          <View className="bg-accent-light px-sm py-[2px] rounded-full mr-sm">
            <Typography variant="caption" style={{ color: "#F5A623" }}>
              ✨ ON THIS DAY
            </Typography>
          </View>
          <Typography variant="caption" color="tertiary">
            {label}
          </Typography>
        </View>

        {/* Photo */}
        {hasPhoto && (
          <Image
            source={{ uri: entry.photoUris[0] }}
            className="w-full h-[140px]"
            resizeMode="cover"
          />
        )}

        {/* Content */}
        <View className="px-base py-md">
          <Typography variant="body-medium" numberOfLines={1}>
            {entry.title}
          </Typography>
          {entry.body && (
            <Typography variant="body-sm" color="secondary" numberOfLines={2}>
              {entry.body}
            </Typography>
          )}
          {entry.dogAgeLabel && (
            <Typography variant="caption" color="tertiary" className="mt-xs">
              {entry.dogAgeLabel} old
            </Typography>
          )}
        </View>
      </Card>
    </Pressable>
  );
}
