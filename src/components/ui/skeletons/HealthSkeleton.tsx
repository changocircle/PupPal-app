import React from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Skeleton } from "../Skeleton";

/**
 * Health screen skeleton, header, status badges, upcoming events,
 * quick actions grid, weight card, health notes.
 */
export function HealthSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="px-xl pt-3xl mb-lg">
          <Skeleton width="60%" height={28} radius={8} />
          <View className="h-[6px]" />
          <Skeleton width="70%" height={16} />
        </View>

        {/* Status badges */}
        <View className="px-xl mb-lg">
          <View className="flex-row flex-wrap gap-sm">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} width={100} height={28} radius={14} />
            ))}
          </View>
        </View>

        {/* Upcoming events card */}
        <View className="px-xl mb-lg">
          <View className="bg-surface rounded-md p-base gap-md shadow-card">
            <Skeleton width="35%" height={20} />
            {[1, 2].map((i) => (
              <View key={i} className="flex-row items-center gap-md">
                <Skeleton width={32} height={32} radius={8} />
                <View className="flex-1 gap-xs">
                  <Skeleton width="60%" height={14} />
                  <Skeleton width="40%" height={11} />
                </View>
                <Skeleton width={50} height={20} radius={10} />
              </View>
            ))}
          </View>
        </View>

        {/* Quick actions 2x2 grid */}
        <View className="px-xl mb-lg">
          <View className="flex-row gap-sm">
            {[1, 2].map((i) => (
              <View
                key={i}
                className="flex-1 bg-surface rounded-md p-base items-center gap-sm shadow-card"
              >
                <Skeleton width={36} height={36} radius={18} />
                <Skeleton width="60%" height={13} />
              </View>
            ))}
          </View>
          <View className="flex-row gap-sm mt-sm">
            {[3, 4].map((i) => (
              <View
                key={i}
                className="flex-1 bg-surface rounded-md p-base items-center gap-sm shadow-card"
              >
                <Skeleton width={36} height={36} radius={18} />
                <Skeleton width="60%" height={13} />
              </View>
            ))}
          </View>
        </View>

        {/* Weight card */}
        <View className="px-xl mb-lg">
          <View className="bg-surface rounded-md p-base gap-md shadow-card">
            <View className="flex-row items-center justify-between">
              <Skeleton width="30%" height={20} />
              <Skeleton width={80} height={14} />
            </View>
            <View className="flex-row items-end gap-md">
              <Skeleton width={80} height={36} radius={8} />
              <Skeleton width={100} height={14} />
            </View>
          </View>
        </View>

        {/* Health notes card */}
        <View className="px-xl mb-lg">
          <View className="bg-surface rounded-md p-base gap-md shadow-card">
            <View className="flex-row items-center justify-between">
              <Skeleton width="40%" height={20} />
              <Skeleton width={70} height={14} />
            </View>
            <Skeleton width="85%" height={13} />
            <Skeleton width="60%" height={13} />
          </View>
        </View>

        {/* Milestones link card */}
        <View className="px-xl mb-xl">
          <View className="bg-surface rounded-md p-base shadow-card">
            <View className="flex-row items-center gap-md">
              <Skeleton width={36} height={36} radius={8} />
              <View className="flex-1 gap-xs">
                <Skeleton width="65%" height={16} />
                <Skeleton width="50%" height={12} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
