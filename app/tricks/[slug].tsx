import React, { useMemo } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Typography, Card, Badge, ProgressBar } from '@/components/ui';
import { useDogStore } from '@/stores/dogStore';
import { useTrainingStore } from '@/stores/trainingStore';
import { useTrickStore } from '@/stores/trickStore';
import { useSubscription } from '@/hooks/useSubscription';
import { getAllPacks, getTricksForPack } from '@/data/trickData';
import { FREE_TRICK_ID } from '@/types/tricks';
import type { TrickProgress } from '@/types/tricks';
import { Button } from '@/components/ui';

/**
 * Pack Detail Screen — PRD-03 §6
 *
 * Shows all tricks in a pack with lock/unlock status, 3-star ratings,
 * prerequisite info, and pack progress bar.
 *
 * PRD-07: All trick names visible. Only Shake fully free for free users.
 */

export default function PackDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  // Individual selectors → stable refs, prevents render loops
  const activeDogId = useDogStore((s) => s.activeDogId);
  const dogs = useDogStore((s) => s.dogs);
  const dog = useMemo(
    () => dogs.find((d) => d.id === activeDogId) ?? null,
    [dogs, activeDogId]
  );

  const plan = useTrainingStore((s) => s.plan);
  const { isPremium } = useSubscription();

  const dogName = dog?.name ?? plan?.dogName ?? 'Your Pup';

  const pack = useMemo(() => {
    return getAllPacks().find((p) => p.slug === slug);
  }, [slug]);

  const packTricks = useMemo(() => {
    if (!pack) return [];
    return getTricksForPack(pack.id);
  }, [pack]);

  const trickProgress = useTrickStore((s) => s.trickProgress);
  const packProgressMap = useTrickStore((s) => s.packProgress);
  const packProgress = useMemo(
    () =>
      (pack && packProgressMap[pack.id]) ?? {
        packId: '',
        unlocked: false,
        unlockedAt: null,
        tricksCompleted: 0,
        tricksMastered: 0,
      },
    [pack, packProgressMap]
  );

  const getStars = (tp: TrickProgress | undefined): string => {
    if (!tp) return '☆☆☆';
    const count = tp.completedLevels.length;
    return '★'.repeat(count) + '☆'.repeat(3 - count);
  };

  const getDifficultyLabel = (d: number): string => {
    if (d === 1) return 'Easy';
    if (d === 2) return 'Medium';
    return 'Hard';
  };

  if (!pack) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Typography className="text-[40px] mb-base">🤔</Typography>
        <Typography variant="h3" className="mb-sm">
          Pack not found
        </Typography>
        <Button onPress={() => router.back()} variant="secondary" label="Go Back" />
      </SafeAreaView>
    );
  }

  const progress = pack.total_tricks > 0
    ? (packProgress.tricksCompleted / pack.total_tricks)
    : 0;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Back */}
        <Pressable
          onPress={() => router.back()}
          className="px-xl pt-base pb-sm"
        >
          <Typography variant="body-medium" style={{ color: '#FF6B5C' }}>
            ← Back to Tricks
          </Typography>
        </Pressable>

        {/* Pack Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-xl mb-lg"
        >
          <View className="flex-row items-center gap-md mb-sm">
            <Typography style={{ fontSize: 40 }}>{pack.icon}</Typography>
            <View className="flex-1">
              <Typography variant="h1">{pack.name}</Typography>
              {!packProgress.unlocked && (
                <Badge variant="warning" label="🔒 Locked" size="sm" />
              )}
            </View>
          </View>
          <Typography variant="body" color="secondary" className="mb-base">
            {pack.description}
          </Typography>

          {packProgress.unlocked && (
            <View>
              <View className="flex-row items-center justify-between mb-xs">
                <Typography variant="caption" color="secondary">
                  Progress
                </Typography>
                <Typography variant="caption" color="secondary">
                  {packProgress.tricksCompleted}/{pack.total_tricks}
                </Typography>
              </View>
              <ProgressBar progress={progress} variant="accent" />
              {packProgress.tricksMastered > 0 && (
                <Typography variant="caption" color="secondary" className="mt-xs">
                  ⭐ {packProgress.tricksMastered} mastered
                </Typography>
              )}
            </View>
          )}

          {!packProgress.unlocked && (
            <Card className="bg-warning-light border-warning/20 mt-sm">
              <Typography variant="body-sm" className="text-center">
                {pack.unlock_condition === 'plan_week'
                  ? `Unlocks at Week ${pack.unlock_value ?? '?'} of ${dogName}'s plan`
                  : pack.unlock_condition === 'plan_complete'
                  ? `Unlocks after ${dogName} graduates the 12-week plan`
                  : pack.unlock_condition === 'tricks_completed'
                  ? `Unlocks after completing ${pack.unlock_value ?? '?'} tricks`
                  : 'Coming soon!'}
              </Typography>
            </Card>
          )}
        </Animated.View>

        {/* Trick List */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(120)}
          className="px-xl"
        >
          <Typography variant="h3" className="mb-base">
            Tricks ({packTricks.length})
          </Typography>
          {packTricks.map((trick, idx) => {
            const tp = trickProgress[trick.id];
            const isFree = trick.id === FREE_TRICK_ID;
            const isAccessible = isPremium || isFree;
            const hasPrereqs = trick.prerequisites.length > 0;
            const prereqsMet = trick.prerequisites.every(
              (p) => trickProgress[p]?.completedLevels.includes('learning')
            );

            return (
              <Pressable
                key={trick.id}
                onPress={() => {
                  if (!isAccessible) {
                    router.push('/paywall');
                  } else {
                    router.push(`/tricks/detail/${trick.id}`);
                  }
                }}
              >
                <Animated.View
                  entering={FadeInRight.delay(160 + idx * 60).springify()}
                >
                  <Card className="mb-sm">
                    <View className="flex-row items-start gap-md">
                      {/* Stars / Lock */}
                      <View className="w-[50px] items-center pt-xs">
                        {tp && tp.completedLevels.length > 0 ? (
                          <Typography style={{ fontSize: 14, color: '#F5A623' }}>
                            {getStars(tp)}
                          </Typography>
                        ) : isAccessible ? (
                          <Typography style={{ fontSize: 14, color: '#CCC' }}>
                            ☆☆☆
                          </Typography>
                        ) : (
                          <Typography style={{ fontSize: 18 }}>🔒</Typography>
                        )}
                      </View>

                      {/* Content */}
                      <View className="flex-1">
                        <Typography variant="body-medium">
                          {trick.title}
                        </Typography>
                        <View className="flex-row items-center gap-sm mt-xs flex-wrap">
                          <Badge
                            variant="neutral"
                            label={getDifficultyLabel(trick.difficulty)}
                            size="sm"
                          />
                          <Typography variant="caption" color="secondary">
                            {trick.time_minutes} min
                          </Typography>
                          {hasPrereqs && !prereqsMet && (
                            <Badge variant="warning" label="Prereqs needed" size="sm" />
                          )}
                          {isFree && !isPremium && (
                            <Badge variant="success" label="Free" size="sm" />
                          )}
                        </View>
                        {!isAccessible && (
                          <Typography
                            variant="caption"
                            color="secondary"
                            className="mt-xs"
                            numberOfLines={1}
                          >
                            {trick.overview.replace(/\{dog_name\}/g, dogName).replace(/\{breed_tip\}/g, '').substring(0, 80)}…
                          </Typography>
                        )}
                      </View>

                      {/* Arrow */}
                      <Typography variant="body" color="secondary" className="pt-xs">
                        →
                      </Typography>
                    </View>
                  </Card>
                </Animated.View>
              </Pressable>
            );
          })}
        </Animated.View>

        {/* Premium CTA for locked packs */}
        {!isPremium && packProgress.unlocked && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(400)}
            className="px-xl mt-lg mb-lg"
          >
            <Card className="bg-primary-light border-primary/20">
              <View className="items-center">
                <Typography variant="body-sm-medium" className="mb-xs text-center">
                  ✨ Unlock all tricks in {pack.name}
                </Typography>
                <Button
                  label="Go Premium"
                  variant="primary"
                  size="sm"
                  onPress={() => router.push('/paywall')}
                />
              </View>
            </Card>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
