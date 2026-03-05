/**
 * Dog Management Screen
 * PRD-11 §8: Edit name/photo/breed, archive, delete with sensitive handling
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { Typography, Button, Card, Badge } from '@/components/ui';
import { DogAvatar } from '@/components/dog';
import { useDogStore } from '@/stores/dogStore';
import { COLORS, RADIUS, SHADOWS } from '@/constants/theme';

export default function DogManageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const dogs = useDogStore((s) => s.dogs);
  const activeDogId = useDogStore((s) => s.activeDogId);
  const updateDog = useDogStore((s) => s.updateDog);
  const archiveDog = useDogStore((s) => s.archiveDog);
  const unarchiveDog = useDogStore((s) => s.unarchiveDog);
  const deleteDog = useDogStore((s) => s.deleteDog);
  const switchDog = useDogStore((s) => s.switchDog);

  const dog = useMemo(() => dogs.find((d) => d.id === id), [dogs, id]);

  const [name, setName] = useState(dog?.name ?? '');
  const [breed, setBreed] = useState(dog?.breed ?? '');
  const [photoUri, setPhotoUri] = useState(dog?.photo_url ?? null);
  const [hasChanges, setHasChanges] = useState(false);

  if (!dog) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant="h3">Dog not found</Typography>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Typography
            variant="body"
            style={{ color: COLORS.primary.DEFAULT, fontWeight: '600' }}
          >
            ← Go Back
          </Typography>
        </Pressable>
      </SafeAreaView>
    );
  }

  const isActive = dog.id === activeDogId;
  const isArchived = dog.archived_at != null;

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name Required', 'Please enter a name for your dog.');
      return;
    }

    const updates: Record<string, unknown> = {};

    if (trimmedName !== dog.name) updates.name = trimmedName;
    if (breed.trim() !== (dog.breed ?? '')) updates.breed = breed.trim() || null;
    if (photoUri !== dog.photo_url) updates.photo_url = photoUri;

    if (Object.keys(updates).length > 0) {
      // Warn about breed change → plan regen
      if (updates.breed !== undefined && dog.breed && updates.breed !== dog.breed) {
        Alert.alert(
          'Breed Changed',
          `Changing ${dog.name}'s breed may affect the training plan. The plan will be regenerated.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Update',
              onPress: () => {
                updateDog(dog.id, updates as any);
                setHasChanges(false);
                router.back();
              },
            },
          ]
        );
      } else {
        updateDog(dog.id, updates as any);
        setHasChanges(false);
        router.back();
      }
    } else {
      router.back();
    }
  };

  const handleArchive = () => {
    if (isArchived) {
      unarchiveDog(dog.id);
      router.back();
      return;
    }

    Alert.alert(
      `Archive ${dog.name}?`,
      `${dog.name} will be hidden from the dog switcher, but all data and memories are preserved.\n\nYou can unarchive anytime.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () => {
            archiveDog(dog.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      `Delete ${dog.name}?`,
      `This will permanently delete ${dog.name}'s profile, training history, health records, journal entries, and all associated data.\n\nThis cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Double confirmation (PRD-11 §8)
            Alert.alert(
              'Are you absolutely sure?',
              `All of ${dog.name}'s data will be permanently removed.`,
              [
                { text: 'Keep Data', style: 'cancel' },
                {
                  text: `Delete ${dog.name}`,
                  style: 'destructive',
                  onPress: () => {
                    deleteDog(dog.id);
                    router.replace('/(tabs)');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleSwitchTo = async () => {
    await switchDog(dog.id);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      edges={['top']}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <Pressable onPress={() => router.back()}>
          <Typography variant="h3" style={{ fontSize: 24 }}>
            ←
          </Typography>
        </Pressable>
        <Typography variant="h3">Manage {dog.name}</Typography>
        {hasChanges ? (
          <Pressable onPress={handleSave}>
            <Typography
              variant="body"
              style={{
                color: COLORS.primary.DEFAULT,
                fontWeight: '700',
              }}
            >
              Save
            </Typography>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status badges */}
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          {isActive && <Badge label="Active Dog" variant="success" size="sm" />}
          {isArchived && <Badge label="Archived" variant="warning" size="sm" />}
        </Animated.View>

        {/* Photo */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(50)}
          style={{ alignItems: 'center', marginBottom: 24 }}
        >
          <Pressable onPress={handlePickPhoto}>
            {photoUri ? (
              <View>
                <Image
                  source={{ uri: photoUri }}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    borderWidth: 3,
                    borderColor: COLORS.primary.DEFAULT,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
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
              </View>
            ) : (
              <View>
                <DogAvatar name={dog.name} size={120} showBorder />
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: COLORS.primary.DEFAULT,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Typography style={{ color: '#fff', fontSize: 14 }}>
                    📷
                  </Typography>
                </View>
              </View>
            )}
          </Pressable>
        </Animated.View>

        {/* Name */}
        <Animated.View entering={FadeInDown.duration(300).delay(100)}>
          <Typography variant="caption" style={{ fontWeight: '600', marginBottom: 6 }}>
            Name
          </Typography>
          <TextInput
            value={name}
            onChangeText={(v) => {
              setName(v);
              setHasChanges(true);
            }}
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: RADIUS.md,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              color: COLORS.text.primary,
              borderWidth: 1,
              borderColor: COLORS.border,
              marginBottom: 16,
            }}
          />
        </Animated.View>

        {/* Breed */}
        <Animated.View entering={FadeInDown.duration(300).delay(150)}>
          <Typography variant="caption" style={{ fontWeight: '600', marginBottom: 6 }}>
            Breed
          </Typography>
          <TextInput
            value={breed}
            onChangeText={(v) => {
              setBreed(v);
              setHasChanges(true);
            }}
            placeholder="e.g. Golden Retriever"
            placeholderTextColor={COLORS.text.tertiary}
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: RADIUS.md,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              color: COLORS.text.primary,
              borderWidth: 1,
              borderColor: COLORS.border,
              marginBottom: 16,
            }}
          />
        </Animated.View>

        {/* Info card */}
        <Animated.View entering={FadeInDown.duration(300).delay(200)}>
          <Card style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Typography variant="caption" color="secondary">
                Added
              </Typography>
              <Typography variant="caption">
                {new Date(dog.created_at).toLocaleDateString()}
              </Typography>
            </View>
            {dog.age_months_at_creation && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Typography variant="caption" color="secondary">
                  Age at signup
                </Typography>
                <Typography variant="caption">
                  {dog.age_months_at_creation} months
                </Typography>
              </View>
            )}
            {dog.challenges.length > 0 && (
              <View>
                <Typography variant="caption" color="secondary" style={{ marginBottom: 4 }}>
                  Challenges
                </Typography>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                  {dog.challenges.map((c) => (
                    <Badge key={c} label={c} variant="neutral" size="sm" />
                  ))}
                </View>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInDown.duration(300).delay(250)}>
          {/* Switch to this dog */}
          {!isActive && !isArchived && (
            <Pressable
              onPress={handleSwitchTo}
              style={{
                padding: 16,
                borderRadius: RADIUS.lg,
                backgroundColor: COLORS.primary.extralight,
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Typography
                variant="body"
                style={{
                  color: COLORS.primary.DEFAULT,
                  fontWeight: '600',
                }}
              >
                Switch to {dog.name}
              </Typography>
            </Pressable>
          )}

          {/* Archive / Unarchive */}
          <Pressable
            onPress={handleArchive}
            style={{
              padding: 16,
              borderRadius: RADIUS.lg,
              backgroundColor: isArchived
                ? COLORS.success.light
                : COLORS.warning.light,
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Typography
              variant="body"
              style={{
                color: isArchived
                  ? COLORS.success.DEFAULT
                  : COLORS.warning.DEFAULT,
                fontWeight: '600',
              }}
            >
              {isArchived ? `Unarchive ${dog.name}` : `Archive ${dog.name}`}
            </Typography>
            <Typography
              variant="caption"
              color="secondary"
              style={{ marginTop: 4 }}
            >
              {isArchived
                ? 'Restore to active dogs'
                : "Data & memories are preserved"}
            </Typography>
          </Pressable>

          {/* Delete */}
          <Pressable
            onPress={handleDelete}
            style={{
              padding: 16,
              borderRadius: RADIUS.lg,
              backgroundColor: COLORS.error.light,
              alignItems: 'center',
              marginTop: 8,
            }}
          >
            <Typography
              variant="body"
              style={{
                color: COLORS.error.DEFAULT,
                fontWeight: '600',
              }}
            >
              Delete {dog.name} Permanently
            </Typography>
            <Typography
              variant="caption"
              color="secondary"
              style={{ marginTop: 4 }}
            >
              All data will be permanently removed
            </Typography>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
