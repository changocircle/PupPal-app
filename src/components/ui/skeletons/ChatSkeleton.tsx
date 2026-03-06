import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Skeleton } from "../Skeleton";

/**
 * Chat/Buddy screen skeleton, header bar + message bubbles
 * Alternates between left (assistant) and right (user) bubbles.
 */
export function ChatSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header bar */}
      <View className="flex-row items-center px-xl py-sm border-b border-border bg-surface">
        <Skeleton width={36} height={36} radius={18} />
        <View className="ml-sm gap-xs flex-1">
          <Skeleton width={60} height={16} />
          <Skeleton width={50} height={10} />
        </View>
      </View>

      {/* Messages area */}
      <View className="flex-1 px-xl pt-base">
        {/* Assistant message */}
        <View className="flex-row items-end gap-sm mb-lg">
          <Skeleton width={28} height={28} radius={14} />
          <View className="bg-surface rounded-xl p-base gap-sm max-w-[75%] shadow-card">
            <Skeleton width={200} height={14} />
            <Skeleton width={160} height={14} />
            <Skeleton width={100} height={14} />
          </View>
        </View>

        {/* User message */}
        <View className="flex-row justify-end mb-lg">
          <View className="bg-surface rounded-xl p-base gap-sm max-w-[65%] shadow-card">
            <Skeleton width={140} height={14} />
            <Skeleton width={80} height={14} />
          </View>
        </View>

        {/* Assistant message */}
        <View className="flex-row items-end gap-sm mb-lg">
          <Skeleton width={28} height={28} radius={14} />
          <View className="bg-surface rounded-xl p-base gap-sm max-w-[75%] shadow-card">
            <Skeleton width={180} height={14} />
            <Skeleton width={220} height={14} />
          </View>
        </View>

        {/* User message */}
        <View className="flex-row justify-end mb-lg">
          <View className="bg-surface rounded-xl p-base gap-sm max-w-[65%] shadow-card">
            <Skeleton width={120} height={14} />
          </View>
        </View>

        {/* Typing indicator skeleton */}
        <View className="flex-row items-end gap-sm">
          <Skeleton width={28} height={28} radius={14} />
          <View className="bg-surface rounded-xl px-base py-md shadow-card">
            <View className="flex-row gap-xs">
              <Skeleton width={8} height={8} radius={4} />
              <Skeleton width={8} height={8} radius={4} />
              <Skeleton width={8} height={8} radius={4} />
            </View>
          </View>
        </View>
      </View>

      {/* Input bar placeholder */}
      <View className="px-xl py-sm border-t border-border bg-surface">
        <Skeleton width="100%" height={42} radius={21} />
      </View>
    </SafeAreaView>
  );
}
