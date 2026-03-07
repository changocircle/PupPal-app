/**
 * Dog Management Screen
 * PRD-11 §8: Edit name/photo/breed, archive, delete with sensitive handling
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Image,
  Platform,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { loadDogPhotos, saveDogPhotos } from '@/lib/dogPhotos';
import { getDogAge } from '@/lib/dogAge';
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
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Load stored photos on mount
  useEffect(() => {
    if (id) {
      loadDogPhotos(id).then((photos) => {
        if (photos.allUris.length > 0) {
          setAllPhotos(photos.allUris);
        } else if (dog?.photo_url) {
          setAllPhotos([dog.photo_url]);
        }
      });
    }
  }, [id]);

  // DOB: start with stored date_of_birth, or estimate from age_months_at_creation
  const estimatedDob = useMemo(() => {
    if (dog?.date_of_birth) return new Date(dog.date_of_birth);
    if (dog?.age_months_at_creation && dog?.created_at) {
      const created = new Date(dog.created_at);
      const est = new Date(created);
      est.setMonth(est.getMonth() - dog.age_months_at_creation);
      return est;
    }
    return null;
  }, [dog]);

  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(estimatedDob);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (_: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) {
      setDateOfBirth(selectedDate);
      setHasChanges(true);
    }
  };

  const formatDob = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

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
      const newUri = result.assets[0].uri;
      setPhotoUri(newUri);
      // Add to allPhotos if not already present, cap at 3
      setAllPhotos((prev) => {
        const updated = prev.includes(newUri)
          ? prev
          : [...prev, newUri].slice(-3);
        return updated;
      });
      setHasChanges(true);
    }
  };

  /** Set one of the existing photos as the profile photo */
  const handleSetProfilePhoto = (uri: string) => {
    setPhotoUri(uri);
    setHasChanges(true);
  };

  /** Remove a photo from the gallery */
  const handleRemovePhoto = (uri: string) => {
    setAllPhotos((prev) => {
      const updated = prev.filter((p) => p !== uri);
      // If removing the current profile photo, switch to first available
      if (uri === photoUri) {
        setPhotoUri(updated[0] ?? null);
      }
      return updated;
    });
    setHasChanges(true);
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
    const newDob = dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : null;
    if (newDob !== (dog.date_of_birth ?? null)) updates.date_of_birth = newDob;

    // Always persist photo gallery changes
    const savePhotosAndApply = () => {
      updateDog(dog.id, updates as any);
      saveDogPhotos(dog.id, {
        profileUri: photoUri,
        allUris: allPhotos,
      });
      setHasChanges(false);
      router.back();
    };

    if (Object.keys(updates).length > 0) {
      // Warn about breed change → plan regen
      if (updates.breed !== undefined && dog.breed && updates.breed !== dog.breed) {
        Alert.alert(
          'Breed Changed',
          `Changing ${dog.name}'s breed may affect the training plan. The plan will be regenerated.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Update', onPress: savePhotosAndApply },
          ]
        );
      } else {
        savePhotosAndApply();
      }
    } else if (hasChanges) {
      // Only photo gallery changed but not the dog record fields
      saveDogPhotos(dog.id, {
        profileUri: photoUri,
        allUris: allPhotos,
      });
      setHasChanges(false);
      router.back();
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

        {/* Profile photo */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(50)}
          style={{ alignItems: 'center', marginBottom: 16 }}
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
          <Typography variant="caption" color="secondary" style={{ marginTop: 8 }}>
            Tap to change profile photo
          </Typography>
        </Animated.View>

        {/* All photos gallery */}
        {allPhotos.length > 1 && (
          <Animated.View
            entering={FadeInDown.duration(300).delay(75)}
            style={{ marginBottom: 24 }}
          >
            <Typography variant="caption" style={{ fontWeight: '600', marginBottom: 8 }}>
              All Photos
            </Typography>
            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
              {allPhotos.map((uri, idx) => {
                const isProfile = uri === photoUri;
                return (
                  <View key={`${uri}-${idx}`} style={{ alignItems: 'center' }}>
                    <Pressable
                      onPress={() => handleSetProfilePhoto(uri)}
                      onLongPress={() => {
                        Alert.alert(
                          'Remove Photo',
                          'Remove this photo from your gallery?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Remove', style: 'destructive', onPress: () => handleRemovePhoto(uri) },
                          ],
                        );
                      }}
                    >
                      <Image
                        source={{ uri }}
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 12,
                          borderWidth: isProfile ? 3 : 1,
                          borderColor: isProfile ? COLORS.primary.DEFAULT : COLORS.border,
                        }}
                      />
                      {isProfile && (
                        <View
                          style={{
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            backgroundColor: COLORS.primary.DEFAULT,
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Typography style={{ color: '#fff', fontSize: 10 }}>✓</Typography>
                        </View>
                      )}
                    </Pressable>
                    <Typography variant="caption" color={isProfile ? 'accent' : 'secondary'} style={{ marginTop: 4, fontSize: 10 }}>
                      {isProfile ? 'Profile' : ['Front', 'Side', 'Body'][idx] ?? ''}
                    </Typography>
                  </View>
                );
              })}
              {allPhotos.length < 3 && (
                <Pressable onPress={handlePickPhoto} style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderStyle: 'dashed',
                      borderColor: COLORS.border,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: COLORS.surface,
                    }}
                  >
                    <Typography style={{ fontSize: 24, color: COLORS.text.secondary }}>+</Typography>
                  </View>
                  <Typography variant="caption" color="secondary" style={{ marginTop: 4, fontSize: 10 }}>
                    Add
                  </Typography>
                </Pressable>
              )}
            </View>
            <Typography variant="caption" color="tertiary" style={{ textAlign: 'center', marginTop: 6 }}>
              Tap to set as profile photo. Long press to remove.
            </Typography>
          </Animated.View>
        )}

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

        {/* Date of Birth */}
        <Animated.View entering={FadeInDown.duration(300).delay(175)}>
          <Typography variant="caption" style={{ fontWeight: '600', marginBottom: 6 }}>
            Date of Birth
          </Typography>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: RADIUS.md,
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderWidth: 1,
              borderColor: COLORS.border,
              marginBottom: 4,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography
              variant="body"
              color={dateOfBirth ? 'primary' : 'tertiary'}
            >
              {dateOfBirth ? formatDob(dateOfBirth) : 'Tap to set date of birth'}
            </Typography>
            <Typography style={{ fontSize: 16 }}>📅</Typography>
          </Pressable>
          {!dog.date_of_birth && dateOfBirth && (
            <Typography variant="caption" color="tertiary" style={{ marginBottom: 12 }}>
              Estimated from age at signup. Tap to set the exact date.
            </Typography>
          )}
          {!dateOfBirth && (
            <Typography variant="caption" color="tertiary" style={{ marginBottom: 12 }}>
              Exact DOB helps with milestone tracking, vaccinations, and growth curves.
            </Typography>
          )}
          {dog.date_of_birth && dateOfBirth && (
            <View style={{ height: 12 }} />
          )}
          {showDatePicker && (
            <View style={{ marginBottom: 12 }}>
              <DateTimePicker
                value={dateOfBirth ?? new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={handleDateChange}
              />
              {Platform.OS === 'ios' && (
                <Pressable
                  onPress={() => setShowDatePicker(false)}
                  style={{ alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 4 }}
                >
                  <Typography
                    variant="body-sm-medium"
                    style={{ color: COLORS.primary.DEFAULT }}
                  >
                    Done
                  </Typography>
                </Pressable>
              )}
            </View>
          )}
        </Animated.View>

        {/* Info card */}
        <Animated.View entering={FadeInDown.duration(300).delay(200)}>
          <Card style={{ marginBottom: 24 }}>
            {/* Age — dynamic from DOB or estimated */}
            {(() => {
              const age = getDogAge(
                dog.date_of_birth ?? (dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : null),
                dog.age_months_at_creation,
                dog.created_at,
              );
              if (!age) return null;
              return (
                <View style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="secondary">
                      Age
                    </Typography>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Typography variant="caption">
                        {age.label}
                      </Typography>
                      {age.estimated && (
                        <Typography variant="caption" color="tertiary" style={{ fontSize: 11 }}>
                          (estimated)
                        </Typography>
                      )}
                    </View>
                  </View>
                  {age.estimated && !dog.date_of_birth && (
                    <Pressable onPress={() => setShowDatePicker(true)}>
                      <Typography
                        variant="caption"
                        style={{ color: COLORS.primary.DEFAULT, marginTop: 2, fontSize: 11 }}
                      >
                        Set date of birth for exact age →
                      </Typography>
                    </Pressable>
                  )}
                </View>
              );
            })()}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Typography variant="caption" color="secondary">
                Added
              </Typography>
              <Typography variant="caption">
                {new Date(dog.created_at).toLocaleDateString()}
              </Typography>
            </View>
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
