import React, { useMemo } from "react";
import { View, Pressable, Image } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Typography, Card } from "@/components/ui";
import { useJournalStore } from "@/stores/journalStore";
import { ENTRY_TYPE_ICON } from "@/types/journal";

/**
 * JournalPreview, Home screen section showing the most recent 2-3 entries.
 * Includes a "View Journal →" link.
 */

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface MiniEntryProps {
  title: string;
  date: string;
  icon: string;
  photoUri?: string;
  ageLabel?: string | null;
}

function MiniEntry({ title, date, icon, photoUri, ageLabel }: MiniEntryProps) {
  return (
    <View className="flex-row items-center py-md border-b border-border">
      {/* Photo or icon */}
      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          className="w-[44px] h-[44px] rounded-sm mr-md"
          resizeMode="cover"
        />
      ) : (
        <View className="w-[44px] h-[44px] rounded-sm bg-primary-extralight items-center justify-center mr-md">
          <Typography className="text-[20px]">{icon}</Typography>
        </View>
      )}

      {/* Content */}
      <View className="flex-1">
        <Typography variant="body-sm-medium" numberOfLines={1}>
          {title}
        </Typography>
        <Typography variant="caption" color="tertiary">
          {formatShortDate(date)}
          {ageLabel ? ` · ${ageLabel}` : ""}
        </Typography>
      </View>
    </View>
  );
}

export function JournalPreview() {
  const router = useRouter();
  const recentEntries = useJournalStore((s) => s.getRecentEntries(3));
  const entryCount = useJournalStore((s) => s.getEntryCount());

  // Don't render if no entries
  if (recentEntries.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(340)}>
      <Pressable onPress={() => router.push("/journal")}>
        <Card>
          {/* Header */}
          <View className="flex-row items-center justify-between mb-sm">
            <View className="flex-row items-center gap-sm">
              <Typography className="text-[22px]">📖</Typography>
              <Typography variant="h3">Growth Journal</Typography>
            </View>
            <Typography variant="body-sm" style={{ color: "#FF6B5C" }}>
              View All →
            </Typography>
          </View>

          {entryCount > 0 && (
            <Typography variant="caption" color="tertiary" className="mb-xs">
              {entryCount} {entryCount === 1 ? "memory" : "memories"} captured
            </Typography>
          )}

          {/* Mini entries */}
          {recentEntries.map((entry) => (
            <MiniEntry
              key={entry.id}
              title={entry.title}
              date={entry.entryDate}
              icon={ENTRY_TYPE_ICON[entry.entryType]}
              photoUri={entry.photoUris[0]}
              ageLabel={entry.dogAgeLabel}
            />
          ))}
        </Card>
      </Pressable>
    </Animated.View>
  );
}
