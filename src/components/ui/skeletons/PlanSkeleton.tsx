import React from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Skeleton } from "../Skeleton";

/**
 * Plan screen skeleton, header, quick stats row, tab switcher, week cards
 */
export function PlanSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-xl" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="pt-3xl mb-lg">
          <Skeleton width="60%" height={28} radius={8} />
          <View className="h-[6px]" />
          <Skeleton width="75%" height={16} />
        </View>

        {/* Quick stats row */}
        <View className="flex-row gap-md mb-lg">
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              className="flex-1 bg-surface rounded-md py-sm items-center gap-xs shadow-card"
            >
              <Skeleton width={36} height={24} />
              <Skeleton width="50%" height={11} />
            </View>
          ))}
        </View>

        {/* Tab switcher */}
        <View className="bg-surface rounded-xl p-[3px] mb-lg border border-border">
          <View className="flex-row">
            {[1, 2, 3].map((i) => (
              <View key={i} className="flex-1 py-sm items-center">
                <Skeleton width="60%" height={14} radius={7} />
              </View>
            ))}
          </View>
        </View>

        {/* Week card (featured) */}
        <View className="bg-surface rounded-md p-base gap-md mb-lg shadow-card border border-border">
          <View className="flex-row items-center justify-between">
            <Skeleton width="55%" height={20} />
            <Skeleton width={60} height={22} radius={11} />
          </View>
          <Skeleton width="85%" height={14} />
          {/* Day dots */}
          <View className="flex-row gap-sm">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} width={24} height={24} radius={12} />
            ))}
          </View>
          {/* Progress bar */}
          <Skeleton width="100%" height={6} radius={3} />
          <View className="flex-row justify-between">
            <Skeleton width="30%" height={10} />
            <Skeleton width="35%" height={10} />
          </View>
        </View>

        {/* Day exercises */}
        {[1, 2].map((day) => (
          <View key={day} className="mb-lg">
            <View className="flex-row items-center gap-sm mb-sm">
              <Skeleton width={24} height={24} radius={12} />
              <Skeleton width={80} height={16} />
              <Skeleton width={50} height={12} />
            </View>
            <View className="ml-[36px] gap-sm">
              {[1, 2].map((ex) => (
                <View
                  key={ex}
                  className="bg-surface rounded-md p-base gap-sm shadow-card"
                >
                  <View className="flex-row items-center gap-md">
                    <Skeleton width={40} height={40} radius={8} />
                    <View className="flex-1 gap-sm">
                      <Skeleton width="60%" height={15} />
                      <Skeleton width="35%" height={11} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View className="h-[40px]" />
      </ScrollView>
    </SafeAreaView>
  );
}
