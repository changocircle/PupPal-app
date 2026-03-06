import React from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Skeleton } from "../Skeleton";

/**
 * Profile screen skeleton, header, avatar card, dog card,
 * progress/level card, achievements, settings rows.
 */
export function ProfileSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="px-xl pt-3xl mb-lg">
          <Skeleton width="30%" height={28} radius={8} />
        </View>

        {/* User profile card */}
        <View className="px-xl mb-lg">
          <View className="bg-surface rounded-md p-base shadow-card">
            <View className="flex-row items-center gap-base">
              <Skeleton width={64} height={64} radius={32} />
              <View className="flex-1 gap-sm">
                <Skeleton width="50%" height={20} />
                <Skeleton width="35%" height={13} />
              </View>
            </View>
          </View>
        </View>

        {/* Dog card */}
        <View className="px-xl mb-lg">
          <View className="bg-surface rounded-md p-base shadow-card">
            <View className="flex-row items-center gap-base">
              <Skeleton width={56} height={56} radius={28} />
              <View className="flex-1 gap-sm">
                <Skeleton width="40%" height={20} />
                <Skeleton width="55%" height={13} />
              </View>
            </View>
          </View>
        </View>

        {/* Progress / Level card */}
        <View className="px-xl mb-lg">
          <Skeleton width="25%" height={20} className="mb-sm" />
          <View className="bg-surface rounded-md p-base gap-md shadow-card">
            <View className="flex-row justify-between">
              <View className="gap-xs">
                <Skeleton width={40} height={11} />
                <View className="flex-row items-center gap-xs">
                  <Skeleton width={32} height={28} />
                  <Skeleton width={80} height={16} />
                </View>
              </View>
              <View className="items-end gap-xs">
                <Skeleton width={50} height={11} />
                <Skeleton width={48} height={28} />
              </View>
            </View>
            {/* XP progress bar */}
            <Skeleton width="100%" height={8} radius={4} />
            <Skeleton width="55%" height={10} />
          </View>
        </View>

        {/* Achievements card */}
        <View className="px-xl mb-lg">
          <View className="bg-surface rounded-md p-base shadow-card">
            <View className="flex-row items-center gap-md">
              <Skeleton width={40} height={40} radius={8} />
              <View className="flex-1 gap-sm">
                <Skeleton width="55%" height={16} />
                <Skeleton width="45%" height={12} />
              </View>
            </View>
          </View>
        </View>

        {/* Settings section */}
        <View className="px-xl mb-lg">
          <Skeleton width="25%" height={20} className="mb-sm" />
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              className="bg-surface rounded-md p-base mb-sm shadow-card"
            >
              <View className="flex-row items-center gap-md">
                <Skeleton width={24} height={24} radius={6} />
                <View className="flex-1 gap-xs">
                  <Skeleton width="45%" height={15} />
                  <Skeleton width="65%" height={11} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
