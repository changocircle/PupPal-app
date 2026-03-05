import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { Typography, Card, Button } from "@/components/ui";

/**
 * Buddy AI Chat Tab
 * PRD-02
 *
 * Shell screen — full streaming chat implementation in Phase 3.
 */
export default function ChatScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-xl justify-center items-center">
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 500 }}
          className="items-center"
        >
          {/* Buddy avatar */}
          <View className="w-[120px] h-[120px] rounded-full bg-primary-light items-center justify-center mb-xl">
            <Typography className="text-[60px]">🐕</Typography>
          </View>

          <Typography variant="h2" className="text-center mb-sm">
            Meet Buddy
          </Typography>
          <Typography variant="body" color="secondary" className="text-center mb-2xl max-w-[280px]">
            Your AI puppy mentor. Ask anything about training, behavior, or
            health — Buddy knows your pup personally.
          </Typography>

          <Card variant="featured" className="w-full mb-xl">
            <Typography variant="body-sm" color="secondary" className="text-center">
              💬 AI Chat coming in Phase 3
            </Typography>
            <Typography variant="caption" color="tertiary" className="text-center mt-xs">
              Streaming chat with context injection, conversation memory, and safety
            </Typography>
          </Card>
        </MotiView>
      </View>
    </SafeAreaView>
  );
}
