import React from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Skeleton } from "../Skeleton";

/**
 * Home screen skeleton, mirrors the real Home layout:
 * greeting + dog name, gamification row, week/day card, exercise cards
 */
export function HomeSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-xl" showsVerticalScrollIndicator={false}>
        {/* Header: greeting + dog name */}
        <View className="pt-3xl mb-lg">
          <Skeleton width="55%" height={20} radius={6} />
          <View className="h-[8px]" />
          <Skeleton width="70%" height={28} radius={8} />
        </View>

        {/* Gamification row, 3 stat pills */}
        <View className="flex-row gap-md mb-lg">
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              className="flex-1 bg-surface rounded-md p-base items-center gap-sm shadow-card"
            >
              <Skeleton width={32} height={32} radius={16} />
              <Skeleton width="70%" height={12} />
            </View>
          ))}
        </View>

        {/* Week/day context card */}
        <View className="bg-surface rounded-md p-base gap-md mb-lg shadow-card">
          <View className="flex-row items-center justify-between">
            <View className="gap-sm flex-1">
              <Skeleton width="40%" height={12} />
              <Skeleton width="60%" height={18} />
            </View>
            <Skeleton width={80} height={28} radius={14} />
          </View>
          {/* Day dots */}
          <View className="flex-row gap-sm mt-sm">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} width={24} height={24} radius={12} />
            ))}
          </View>
          {/* Progress bar */}
          <Skeleton width="100%" height={6} radius={3} />
          <Skeleton width="45%" height={10} />
        </View>

        {/* Today's Exercises heading */}
        <View className="flex-row items-center justify-between mb-base">
          <Skeleton width="50%" height={22} />
          <Skeleton width={60} height={14} />
        </View>

        {/* Exercise cards x3 */}
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            className="bg-surface rounded-md p-base gap-sm mb-md shadow-card"
          >
            <View className="flex-row items-center gap-md">
              <Skeleton width={44} height={44} radius={10} />
              <View className="flex-1 gap-sm">
                <Skeleton width="65%" height={16} />
                <Skeleton width="40%" height={12} />
              </View>
              <Skeleton width={24} height={24} radius={12} />
            </View>
          </View>
        ))}

        <View className="h-[40px]" />
      </ScrollView>
    </SafeAreaView>
  );
}
