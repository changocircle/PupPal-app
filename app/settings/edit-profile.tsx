import React, { useState, useCallback } from "react";
import { View, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Typography, Card, Button } from "@/components/ui";
import { useSettingsStore } from "@/stores/settingsStore";

/**
 * Edit Profile Screen, PRD-14 §3
 */

export default function EditProfileScreen() {
  const router = useRouter();
  const { userName, userEmail, setUserName, setUserEmail } =
    useSettingsStore();

  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);

  const handleSave = useCallback(() => {
    setUserName(name.trim());
    setUserEmail(email.trim());
    Alert.alert("Saved!", "Your profile has been updated.");
    router.back();
  }, [name, email, setUserName, setUserEmail, router]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <Pressable
          onPress={() => router.back()}
          className="px-xl pt-base pb-sm"
        >
          <Typography variant="body-medium" style={{ color: "#FF6B5C" }}>
            ← Back
          </Typography>
        </Pressable>

        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-xl mb-xl"
        >
          <Typography variant="h1">Edit Profile</Typography>
        </Animated.View>

        {/* Avatar */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(60)}
          className="px-xl mb-xl items-center"
        >
          <Pressable className="w-[100px] h-[100px] rounded-full bg-primary-light items-center justify-center mb-sm">
            <Typography className="text-[40px]">👤</Typography>
          </Pressable>
          <Typography variant="body-sm" style={{ color: "#FF6B5C" }}>
            Change Photo
          </Typography>
        </Animated.View>

        {/* Form */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(120)}
          className="px-xl mb-xl"
        >
          <Typography variant="caption" color="secondary" className="mb-xs">
            Display Name
          </Typography>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            className="bg-surface border border-border rounded-xl px-base py-md mb-lg text-[16px]"
            style={{ fontFamily: "PlusJakartaSans-Medium" }}
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
          />

          <Typography variant="caption" color="secondary" className="mb-xs">
            Email
          </Typography>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            className="bg-surface border border-border rounded-xl px-base py-md mb-xl text-[16px]"
            style={{ fontFamily: "PlusJakartaSans-Regular" }}
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Button label="Save Changes" variant="primary" fullWidth onPress={handleSave} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
