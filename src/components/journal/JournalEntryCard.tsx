import React from "react";
import { View, Image, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Typography, Card, Badge } from "@/components/ui";
import type { JournalEntry } from "@/types/journal";
import {
  ENTRY_TYPE_ICON,
  ENTRY_TYPE_CATEGORY,
  MILESTONE_COLORS,
} from "@/types/journal";

/**
 * JournalEntryCard — Renders any journal entry type.
 *
 * Photo entries: show thumbnail grid + caption
 * Note entries: warm gold-tinted card with text
 * Milestone/auto entries: compact icon + title + description, color-coded
 */

interface JournalEntryCardProps {
  entry: JournalEntry;
  index?: number;
  onPress?: (entry: JournalEntry) => void;
  onLongPress?: (entry: JournalEntry) => void;
}

function formatEntryDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Photo thumbnail grid — 1, 2, or 3+ photos */
function PhotoGrid({ uris }: { uris: string[] }) {
  if (uris.length === 0) return null;

  if (uris.length === 1) {
    return (
      <Image
        source={{ uri: uris[0] }}
        className="w-full h-[200px] rounded-sm mb-md"
        resizeMode="cover"
      />
    );
  }

  if (uris.length === 2) {
    return (
      <View className="flex-row gap-xs mb-md">
        {uris.map((uri, i) => (
          <Image
            key={i}
            source={{ uri }}
            className="flex-1 h-[160px] rounded-sm"
            resizeMode="cover"
          />
        ))}
      </View>
    );
  }

  // 3+ photos: first large, rest small grid
  return (
    <View className="gap-xs mb-md">
      <Image
        source={{ uri: uris[0] }}
        className="w-full h-[180px] rounded-sm"
        resizeMode="cover"
      />
      <View className="flex-row gap-xs">
        {uris.slice(1, 4).map((uri, i) => (
          <View key={i} className="flex-1 relative">
            <Image
              source={{ uri }}
              className="w-full h-[80px] rounded-sm"
              resizeMode="cover"
            />
            {i === 2 && uris.length > 4 && (
              <View className="absolute inset-0 bg-secondary/50 rounded-sm items-center justify-center">
                <Typography variant="body-medium" color="inverse">
                  +{uris.length - 4}
                </Typography>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

/** Renders a photo or note entry */
function UserEntryContent({ entry }: { entry: JournalEntry }) {
  const isNote = entry.entryType === "note";

  return (
    <Card
      variant={isNote ? "outline" : "default"}
      className={isNote ? "bg-accent-light border-accent/20" : ""}
    >
      {/* Photo grid */}
      {entry.photoUris.length > 0 && <PhotoGrid uris={entry.photoUris} />}

      {/* Title */}
      <Typography variant="body-medium" className="mb-[2px]">
        {entry.title}
      </Typography>

      {/* Body / caption */}
      {entry.body && (
        <Typography variant="body-sm" color="secondary" numberOfLines={4}>
          {entry.body}
        </Typography>
      )}

      {/* Meta row */}
      <View className="flex-row items-center mt-sm gap-sm">
        {entry.isPinned && <Badge variant="accent" label="📌 Pinned" size="sm" />}
        {entry.isBackdated && <Badge variant="neutral" label="Backdated" size="sm" />}
      </View>
    </Card>
  );
}

/** Renders a milestone / auto-generated entry */
function MilestoneEntryContent({ entry }: { entry: JournalEntry }) {
  const category = ENTRY_TYPE_CATEGORY[entry.entryType];
  const colors = MILESTONE_COLORS[category];
  const icon = ENTRY_TYPE_ICON[entry.entryType];

  return (
    <View
      className="flex-row items-center p-base rounded-md"
      style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1 }}
    >
      {/* Icon circle */}
      <View
        className="w-[40px] h-[40px] rounded-full items-center justify-center mr-md"
        style={{ backgroundColor: colors.border }}
      >
        <Typography className="text-[18px]">{icon}</Typography>
      </View>

      {/* Content */}
      <View className="flex-1">
        <Typography variant="body-sm-medium" style={{ color: colors.text }}>
          {entry.title}
        </Typography>
        {entry.body && (
          <Typography variant="caption" color="secondary" numberOfLines={2}>
            {entry.body}
          </Typography>
        )}
      </View>
    </View>
  );
}

export function JournalEntryCard({
  entry,
  index = 0,
  onPress,
  onLongPress,
}: JournalEntryCardProps) {
  const isUserEntry = entry.source === "user";
  const icon = ENTRY_TYPE_ICON[entry.entryType];

  return (
    <Animated.View entering={FadeInDown.duration(350).delay(index * 50)}>
      <Pressable
        onPress={() => onPress?.(entry)}
        onLongPress={() => onLongPress?.(entry)}
      >
        {/* Date + age row */}
        <View className="flex-row items-center mb-xs px-[2px]">
          <Typography variant="caption" color="tertiary">
            {formatEntryDate(entry.entryDate)}
          </Typography>
          {entry.dogAgeLabel && (
            <>
              <Typography variant="caption" color="tertiary">
                {" · "}
              </Typography>
              <Typography variant="caption" color="secondary">
                {entry.dogAgeLabel} old
              </Typography>
            </>
          )}
        </View>

        {/* Entry content by type */}
        {isUserEntry ? (
          <UserEntryContent entry={entry} />
        ) : (
          <MilestoneEntryContent entry={entry} />
        )}
      </Pressable>
    </Animated.View>
  );
}
