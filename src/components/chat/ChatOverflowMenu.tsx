/**
 * ChatOverflowMenu — PRD-02 Section 5
 *
 * Three-dot overflow button in the chat header.
 * Shows: "New conversation" and "Chat history".
 */

import React, { useState } from "react";
import {
  View,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Typography } from "@/components/ui";
import { ChatHistoryModal } from "./ChatHistoryModal";

interface ChatOverflowMenuProps {
  onNewConversation: () => void;
}

export function ChatOverflowMenu({ onNewConversation }: ChatOverflowMenuProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);

  function handleNewConversation() {
    setMenuVisible(false);
    Alert.alert(
      "New Conversation",
      "Start a new conversation? Your current chat will be saved to history.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start Fresh",
          onPress: onNewConversation,
        },
      ]
    );
  }

  function handleChatHistory() {
    setMenuVisible(false);
    setHistoryVisible(true);
  }

  return (
    <>
      {/* Three-dot button */}
      <Pressable
        onPress={() => setMenuVisible(true)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="w-[36px] h-[36px] items-center justify-center rounded-full"
      >
        <View className="gap-[3px] items-center">
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              className="w-[4px] h-[4px] rounded-full bg-text-secondary"
            />
          ))}
        </View>
      </Pressable>

      {/* Dropdown menu */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View className="flex-1">
            <Animated.View
              entering={FadeIn.duration(150)}
              className="absolute top-[52px] right-[16px] bg-surface rounded-lg border border-border overflow-hidden"
              style={{
                minWidth: 200,
                shadowColor: "#1B2333",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <MenuItem
                icon="✨"
                label="New conversation"
                onPress={handleNewConversation}
              />
              <View className="h-[1px] bg-border mx-base" />
              <MenuItem
                icon="🕐"
                label="Chat history"
                onPress={handleChatHistory}
              />
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Chat history modal */}
      <ChatHistoryModal
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
      />
    </>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-sm px-base py-md active:bg-background"
    >
      <Typography style={{ fontSize: 16, lineHeight: 20 }}>{icon}</Typography>
      <Typography
        variant="body-sm-medium"
        style={destructive ? { color: "#EF6461" } : undefined}
      >
        {label}
      </Typography>
    </Pressable>
  );
}
