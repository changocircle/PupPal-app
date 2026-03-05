/**
 * Breed Encyclopedia Browser
 * Per PRD-12: Search, filter by size, "Your Dog" quick access, popular breeds list
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, FlatList, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../src/components/ui';
import { BreedCard, SizeFilter } from '../../src/components/breed';
import {
  ALL_BREEDS,
  searchBreeds,
  filterBreedsBySize,
} from '../../src/data/breedData';
import { useDogStore } from '../../src/stores/dogStore';
import { getBreedByName } from '../../src/data/breedData';
import type { SizeCategory } from '../../src/types/breed';
import type { BreedProfile } from '../../src/types/breed';
import { COLORS, RADIUS, SHADOWS } from '../../src/constants/theme';

export default function BreedBrowserScreen() {
  const router = useRouter();
  const dog = useDogStore((s) => s.dog);
  const [searchQuery, setSearchQuery] = useState('');
  const [sizeFilter, setSizeFilter] = useState<SizeCategory | null>(null);

  // Find user's breed
  const userBreed = useMemo(() => {
    if (!dog?.breed) return null;
    return getBreedByName(dog.breed);
  }, [dog?.breed]);

  // Filtered breeds
  const filteredBreeds = useMemo(() => {
    let results = searchQuery
      ? searchBreeds(searchQuery)
      : sizeFilter
        ? filterBreedsBySize(sizeFilter)
        : ALL_BREEDS;

    // If both search and size filter, intersect
    if (searchQuery && sizeFilter) {
      results = results.filter((b) => b.size_category === sizeFilter);
    }

    return results;
  }, [searchQuery, sizeFilter]);

  const renderBreed = useCallback(
    ({ item }: { item: BreedProfile }) => (
      <BreedCard
        breed={item}
        isUserBreed={userBreed?.slug === item.slug}
      />
    ),
    [userBreed]
  );

  const keyExtractor = useCallback((item: BreedProfile) => item.id, []);

  const ListHeader = useMemo(
    () => (
      <View style={{ paddingBottom: 8 }}>
        {/* User's breed quick access */}
        {userBreed && !searchQuery && !sizeFilter && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Typography
              variant="h3"
              style={{
                fontSize: 13,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                color: COLORS.text.secondary,
                marginBottom: 8,
              }}
            >
              Your Dog
            </Typography>
            <BreedCard breed={userBreed} isUserBreed />
          </View>
        )}

        {/* Size filter */}
        <View style={{ marginBottom: 16 }}>
          <SizeFilter selected={sizeFilter} onSelect={setSizeFilter} />
        </View>

        {/* Results count */}
        <View style={{ paddingHorizontal: 16 }}>
          <Typography
            variant="h3"
            style={{
              fontSize: 13,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              color: COLORS.text.secondary,
              marginBottom: 8,
            }}
          >
            {searchQuery || sizeFilter
              ? `${filteredBreeds.length} Breed${filteredBreeds.length !== 1 ? 's' : ''}`
              : 'All Breeds'}
          </Typography>
        </View>
      </View>
    ),
    [userBreed, searchQuery, sizeFilter, filteredBreeds.length]
  );

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
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Typography variant="h3" style={{ fontSize: 24 }}>
            ←
          </Typography>
        </Pressable>
        <Typography variant="h2">Breed Encyclopedia</Typography>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search breeds..."
          placeholderTextColor={COLORS.text.tertiary}
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: RADIUS.md,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            color: COLORS.text.primary,
            borderWidth: 1,
            borderColor: COLORS.border,
            ...SHADOWS.sm,
          }}
        />
      </View>

      {/* Breed list */}
      <FlatList
        data={filteredBreeds}
        renderItem={renderBreed}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Typography variant="body" style={{ fontSize: 48, marginBottom: 16 }}>
              🔍
            </Typography>
            <Typography variant="h3" style={{ marginBottom: 8 }}>
              No breeds found
            </Typography>
            <Typography variant="body" color="secondary">
              Try a different search or filter
            </Typography>
          </View>
        }
      />
    </SafeAreaView>
  );
}
