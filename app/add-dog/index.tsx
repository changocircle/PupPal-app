/**
 * Add Dog — Mini-Onboarding Flow (PRD-11 §4)
 * Shortened 5-step flow for adding a new dog (premium only).
 * Steps: Name → Photo/Breed → Age → Challenges → Generating
 *
 * ~60 seconds vs 8 screens for first dog.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeOutLeft,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { nanoid } from 'nanoid/non-secure';
import { Typography, Button, Card, ProgressBar } from '@/components/ui';
import { useDogStore } from '@/stores/dogStore';
import { useTrainingStore } from '@/stores/trainingStore';
import { COLORS, RADIUS, SHADOWS } from '@/constants/theme';
import type { Dog } from '@/types/database';

// ──────────────────────────────────────────────
// Challenge Options (same as onboarding)
// ──────────────────────────────────────────────

const CHALLENGE_OPTIONS = [
  { id: 'biting', label: 'Biting & Nipping', emoji: '🦷' },
  { id: 'potty', label: 'Potty Training', emoji: '🚽' },
  { id: 'barking', label: 'Excessive Barking', emoji: '🗣️' },
  { id: 'leash', label: 'Leash Pulling', emoji: '🦮' },
  { id: 'separation', label: 'Separation Anxiety', emoji: '😢' },
  { id: 'chewing', label: 'Destructive Chewing', emoji: '👟' },
  { id: 'jumping', label: 'Jumping on People', emoji: '⬆️' },
  { id: 'recall', label: "Won't Come When Called", emoji: '🏃' },
  { id: 'socialization', label: 'Fear of Other Dogs', emoji: '🐕‍🦺' },
  { id: 'crate', label: 'Crate Training', emoji: '🏠' },
  { id: 'food_guarding', label: 'Food Guarding', emoji: '🍖' },
  { id: 'focus', label: "Won't Pay Attention", emoji: '👀' },
] as const;

const MAX_CHALLENGES = 5;
const TOTAL_STEPS = 5;

// ──────────────────────────────────────────────
// Age Options
// ──────────────────────────────────────────────

const AGE_OPTIONS = [
  { label: '8–12 weeks', months: 2.5, emoji: '🐣' },
  { label: '3–4 months', months: 3.5, emoji: '🐾' },
  { label: '5–6 months', months: 5.5, emoji: '🐕' },
  { label: '7–9 months', months: 8, emoji: '🦴' },
  { label: '10–12 months', months: 11, emoji: '🎂' },
  { label: '1–2 years', months: 18, emoji: '🐕‍🦺' },
  { label: '2+ years', months: 30, emoji: '⭐' },
] as const;

export default function AddDogScreen() {
  const router = useRouter();
  const addDog = useDogStore((s) => s.addDog);
  const switchDog = useDogStore((s) => s.switchDog);
  const generatePlan = useTrainingStore((s) => s.generatePlan);

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [breed, setBreed] = useState('');
  const [ageMonths, setAgeMonths] = useState<number | null>(null);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const nameInputRef = useRef<TextInput>(null);

  // Auto-focus name input
  useEffect(() => {
    if (step === 1) {
      setTimeout(() => nameInputRef.current?.focus(), 300);
    }
  }, [step]);

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return name.trim().length >= 1;
      case 2:
        return true; // Photo + breed optional
      case 3:
        return ageMonths !== null;
      case 4:
        return challenges.length >= 1;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else if (step === 4) {
      handleGenerate();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera Permission', 'Camera access is needed to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const toggleChallenge = (id: string) => {
    setChallenges((prev) => {
      if (prev.includes(id)) {
        return prev.filter((c) => c !== id);
      }
      if (prev.length >= MAX_CHALLENGES) return prev;
      return [...prev, id];
    });
  };

  const handleGenerate = async () => {
    setStep(5);
    setIsGenerating(true);

    // Create the new dog
    const newDogId = nanoid();
    const now = new Date().toISOString();

    const newDog: Dog = {
      id: newDogId,
      user_id: 'local-user',
      name: name.trim(),
      breed: breed.trim() || null,
      breed_detected: false,
      breed_confidence: null,
      photo_url: photoUri,
      date_of_birth: null,
      gotcha_date: null,
      age_months_at_creation: ageMonths,
      gender: null,
      weight_kg: null,
      size_category: null,
      challenges,
      owner_experience: 'some_experience',
      is_active: false,
      onboarding_completed: true,
      created_at: now,
      updated_at: now,
      archived_at: null,
    };

    // Add to dog store
    addDog(newDog);

    // Short delay for visual effect
    await new Promise((r) => setTimeout(r, 1500));

    // Switch to new dog (this saves current dog's state + loads empty state)
    await switchDog(newDogId);

    // Generate training plan for new dog
    const ageWeeks = ageMonths ? ageMonths * 4.3 : 12;
    generatePlan({
      dogName: name.trim(),
      breed: breed.trim() || null,
      ageWeeks: Math.round(ageWeeks),
      challenges,
      experience: 'some_experience',
    });

    setIsGenerating(false);

    // Brief delay then navigate home
    await new Promise((r) => setTimeout(r, 500));
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          {step < 5 && (
            <Pressable onPress={handleBack} style={{ marginRight: 12 }}>
              <Typography variant="h3" style={{ fontSize: 24 }}>
                ←
              </Typography>
            </Pressable>
          )}
          <View style={{ flex: 1 }}>
            <ProgressBar
              progress={step / TOTAL_STEPS}
              height={4}
              variant="primary"
            />
          </View>
          {step < 5 && (
            <Typography variant="caption" color="secondary" style={{ marginLeft: 12 }}>
              {step}/{TOTAL_STEPS - 1}
            </Typography>
          )}
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Step 1: Name */}
          {step === 1 && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <Typography
                variant="body"
                style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}
              >
                🐾
              </Typography>
              <Typography
                variant="h2"
                style={{ textAlign: 'center', marginBottom: 8 }}
              >
                What's your new pup's name?
              </Typography>
              <Typography
                variant="body"
                color="secondary"
                style={{ textAlign: 'center', marginBottom: 32 }}
              >
                Let's get them set up with their own training plan!
              </Typography>

              <TextInput
                ref={nameInputRef}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Luna, Max, Bella..."
                placeholderTextColor={COLORS.text.tertiary}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => canProceed() && handleNext()}
                style={{
                  backgroundColor: COLORS.surface,
                  borderRadius: RADIUS.lg,
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  fontSize: 20,
                  fontWeight: '600',
                  color: COLORS.text.primary,
                  borderWidth: 2,
                  borderColor: name.trim()
                    ? COLORS.primary.DEFAULT
                    : COLORS.border,
                  textAlign: 'center',
                }}
              />
            </Animated.View>
          )}

          {/* Step 2: Photo + Breed */}
          {step === 2 && (
            <Animated.View entering={SlideInRight.duration(300)}>
              <Typography
                variant="h2"
                style={{ textAlign: 'center', marginBottom: 8 }}
              >
                Add a photo of {name}
              </Typography>
              <Typography
                variant="body"
                color="secondary"
                style={{ textAlign: 'center', marginBottom: 24 }}
              >
                Optional — you can add one later too
              </Typography>

              {/* Photo picker */}
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                {photoUri ? (
                  <Pressable onPress={handlePickPhoto}>
                    <Image
                      source={{ uri: photoUri }}
                      style={{
                        width: 140,
                        height: 140,
                        borderRadius: 70,
                        borderWidth: 3,
                        borderColor: COLORS.primary.DEFAULT,
                      }}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        right: 4,
                        backgroundColor: COLORS.primary.DEFAULT,
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Typography style={{ color: '#fff', fontSize: 14 }}>
                        ✏️
                      </Typography>
                    </View>
                  </Pressable>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Pressable
                      onPress={handlePickPhoto}
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: 60,
                        backgroundColor: COLORS.primary.extralight,
                        borderWidth: 2,
                        borderColor: COLORS.primary.light,
                        borderStyle: 'dashed',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Typography style={{ fontSize: 32, marginBottom: 4 }}>
                        🖼️
                      </Typography>
                      <Typography variant="caption" color="secondary">
                        Library
                      </Typography>
                    </Pressable>
                    <Pressable
                      onPress={handleTakePhoto}
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: 60,
                        backgroundColor: COLORS.primary.extralight,
                        borderWidth: 2,
                        borderColor: COLORS.primary.light,
                        borderStyle: 'dashed',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Typography style={{ fontSize: 32, marginBottom: 4 }}>
                        📷
                      </Typography>
                      <Typography variant="caption" color="secondary">
                        Camera
                      </Typography>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Breed input */}
              <Typography
                variant="body"
                style={{ fontWeight: '600', marginBottom: 8 }}
              >
                Breed (optional)
              </Typography>
              <TextInput
                value={breed}
                onChangeText={setBreed}
                placeholder="e.g. Golden Retriever, Mixed..."
                placeholderTextColor={COLORS.text.tertiary}
                autoCapitalize="words"
                style={{
                  backgroundColor: COLORS.surface,
                  borderRadius: RADIUS.md,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: COLORS.text.primary,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              />
            </Animated.View>
          )}

          {/* Step 3: Age */}
          {step === 3 && (
            <Animated.View entering={SlideInRight.duration(300)}>
              <Typography
                variant="h2"
                style={{ textAlign: 'center', marginBottom: 8 }}
              >
                How old is {name}?
              </Typography>
              <Typography
                variant="body"
                color="secondary"
                style={{ textAlign: 'center', marginBottom: 24 }}
              >
                This helps us create the right training plan
              </Typography>

              <View style={{ gap: 10 }}>
                {AGE_OPTIONS.map((opt) => {
                  const isSelected = ageMonths === opt.months;
                  return (
                    <Pressable
                      key={opt.months}
                      onPress={() => setAgeMonths(opt.months)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 16,
                        borderRadius: RADIUS.lg,
                        backgroundColor: isSelected
                          ? COLORS.primary.extralight
                          : COLORS.surface,
                        borderWidth: 2,
                        borderColor: isSelected
                          ? COLORS.primary.DEFAULT
                          : COLORS.border,
                      }}
                    >
                      <Typography style={{ fontSize: 24, marginRight: 12 }}>
                        {opt.emoji}
                      </Typography>
                      <Typography
                        variant="body"
                        style={{
                          fontWeight: isSelected ? '700' : '500',
                          flex: 1,
                        }}
                      >
                        {opt.label}
                      </Typography>
                      {isSelected && (
                        <Typography style={{ fontSize: 18 }}>✓</Typography>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* Step 4: Challenges */}
          {step === 4 && (
            <Animated.View entering={SlideInRight.duration(300)}>
              <Typography
                variant="h2"
                style={{ textAlign: 'center', marginBottom: 8 }}
              >
                What are {name}'s challenges?
              </Typography>
              <Typography
                variant="body"
                color="secondary"
                style={{ textAlign: 'center', marginBottom: 24 }}
              >
                Select up to {MAX_CHALLENGES} (pick at least 1)
              </Typography>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {CHALLENGE_OPTIONS.map((ch) => {
                  const isSelected = challenges.includes(ch.id);
                  return (
                    <Pressable
                      key={ch.id}
                      onPress={() => toggleChallenge(ch.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderRadius: RADIUS.full,
                        backgroundColor: isSelected
                          ? COLORS.primary.DEFAULT
                          : COLORS.surface,
                        borderWidth: 1.5,
                        borderColor: isSelected
                          ? COLORS.primary.DEFAULT
                          : COLORS.border,
                      }}
                    >
                      <Typography style={{ marginRight: 6, fontSize: 16 }}>
                        {ch.emoji}
                      </Typography>
                      <Typography
                        variant="body"
                        style={{
                          fontSize: 14,
                          fontWeight: isSelected ? '600' : '400',
                          color: isSelected ? '#fff' : COLORS.text.primary,
                        }}
                      >
                        {ch.label}
                      </Typography>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* Step 5: Generating */}
          {step === 5 && (
            <Animated.View
              entering={FadeInDown.duration(400)}
              style={{ alignItems: 'center', paddingTop: 60 }}
            >
              <Typography style={{ fontSize: 64, marginBottom: 24 }}>
                🐕
              </Typography>
              <Typography
                variant="h2"
                style={{ textAlign: 'center', marginBottom: 12 }}
              >
                {isGenerating
                  ? `Setting up ${name}'s profile...`
                  : `${name} is ready!`}
              </Typography>
              <Typography
                variant="body"
                color="secondary"
                style={{ textAlign: 'center', marginBottom: 32 }}
              >
                {isGenerating
                  ? 'Creating a personalized training plan'
                  : "Let's start training!"}
              </Typography>
              {isGenerating && (
                <ActivityIndicator
                  size="large"
                  color={COLORS.primary.DEFAULT}
                />
              )}
            </Animated.View>
          )}
        </ScrollView>

        {/* Bottom action button */}
        {step < 5 && (
          <View
            style={{
              paddingHorizontal: 20,
              paddingBottom: 20,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: COLORS.border,
              backgroundColor: COLORS.background,
            }}
          >
            <Button
              label={step === 4 ? `Create ${name}'s Plan` : 'Continue'}
              variant="primary"
              onPress={handleNext}
              disabled={!canProceed()}
            />
            {step === 2 && !photoUri && (
              <Pressable
                onPress={handleNext}
                style={{ alignItems: 'center', marginTop: 12 }}
              >
                <Typography variant="body" color="secondary">
                  Skip for now
                </Typography>
              </Pressable>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
