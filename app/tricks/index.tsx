import React, { useEffect, useMemo } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Typography, Card, Badge, ProgressBar } from '@/components/ui';
import { useDogStore } from '@/stores/dogStore';
import { useTrainingStore } from '@/stores/trainingStore';
import { useTrickStore } from '@/stores/trickStore';
import { useSubscription } from '@/hooks/useSubscription';
import { getAllPacks, getTricksForPack } from '@/data/trickData';
import { TRICK_LEVEL_META, FREE_TRICK_ID } from '@/types/tricks';
import type { TrickPack, TrickProgress } from '@/types/tricks';

/**
 * Trick Library Screen, PRD-03 §6
 *
 * Shows all trick packs in a 2-column grid with unlock status,
 * a "Tricks Known" section showing completed tricks with star ratings,
 * and a "Suggested Next" section with recommended tricks.
 *
 * PRD-07: All pack names and trick titles visible to free users,
 * but only Shake (trick-starter-001) is fully unlocked for free.
 */

export default function TrickLibraryScreen() {
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
  const currentWeek = plan?.currentWeek ?? 1;
  const planComplete = (plan?.currentWeek ?? 1) > 12;

  // Refresh pack unlocks based on plan progress
  const refreshPackUnlocks = useTrickStore((s) => s.refreshPackUnlocks);
  useEffect(() => {
    refreshPackUnlocks(currentWeek, planComplete);
  }, [currentWeek, planComplete, refreshPackUnlocks]);

  const trickProgress = useTrickStore((s) => s.trickProgress);
  const packProgressMap = useTrickStore((s) => s.packProgress);
  const totalTricksCompleted = useTrickStore((s) => s.totalTricksCompleted);

  const packs = useMemo(() => getAllPacks(), []);

  // Tricks the user has started/completed (for "Tricks Known" section)
  const knownTricks = useMemo(() => {
    return Object.values(trickProgress)
      .filter((t) => t.completedLevels.length > 0)
      .sort((a, b) => b.completedLevels.length - a.completedLevels.length);
  }, [trickProgress]);

  // Suggested next tricks: from unlocked packs, not yet started, with prereqs met
  const suggestedTricks = useMemo(() => {
    const completedIds = new Set(
      Object.values(trickProgress)
        .filter((t) => t.completedLevels.includes('learning'))
        .map((t) => t.trickId)
    );

    const suggestions: Array<{ trickId: string; packId: string; title: string; time: number; difficulty: number }> = [];

    for (const pack of packs) {
      const isUnlocked = packProgressMap[pack.id]?.unlocked ?? false;
      if (!isUnlocked) continue;

      const packTricks = getTricksForPack(pack.id);
      for (const trick of packTricks) {
        if (completedIds.has(trick.id)) continue;
        if (trickProgress[trick.id]) continue; // already in progress

        // Check prereqs
        const prereqsMet = trick.prerequisites.every((p) => completedIds.has(p));
        if (!prereqsMet) continue;

        suggestions.push({
          trickId: trick.id,
          packId: pack.id,
          title: trick.title,
          time: trick.time_minutes,
          difficulty: trick.difficulty,
        });

        if (suggestions.length >= 3) break;
      }
      if (suggestions.length >= 3) break;
    }

    return suggestions;
  }, [packs, trickProgress, packProgressMap]);

  const getStars = (progress: TrickProgress): string => {
    const count = progress.completedLevels.length;
    return '★'.repeat(count) + '☆'.repeat(3 - count);
  };

  const getDifficultyPaws = (d: number): string => {
    return '🐾'.repeat(Math.min(d, 3));
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Back + Header */}
        <Pressable
          onPress={() => router.back()}
          className="px-xl pt-base pb-sm"
        >
          <Typography variant="body-medium" style={{ color: '#FF6B5C' }}>
            ← Back
          </Typography>
        </Pressable>

        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-xl mb-lg"
        >
          <Typography variant="h1" className="mb-xs">
            🎪 Trick Library
          </Typography>
          <Typography variant="body" color="secondary">
            {totalTricksCompleted > 0
              ? `${dogName} knows ${totalTricksCompleted} trick${totalTricksCompleted !== 1 ? 's' : ''}!`
              : `Teach ${dogName} fun tricks, start with Shake!`}
          </Typography>
        </Animated.View>

        {/* ── Pack Grid (2-col) ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(80)}
          className="px-xl mb-xl"
        >
          <Typography variant="h3" className="mb-base">
            Trick Packs
          </Typography>
          <View className="flex-row flex-wrap" style={{ gap: 12 }}>
            {packs.map((pack, idx) => {
              const pp = packProgressMap[pack.id];
              const isUnlocked = pp?.unlocked ?? false;
              const completed = pp?.tricksCompleted ?? 0;
              const total = pack.total_tricks;
              const progress = total > 0 ? completed / total : 0;

              return (
                <Animated.View
                  key={pack.id}
                  entering={FadeInDown.delay(100 + idx * 60).springify()}
                  style={{ width: '48%' }}
                >
                  <Pressable
                    onPress={() => router.push(`/tricks/${pack.slug}`)}
                  >
                    <Card
                      variant={isUnlocked ? 'default' : 'outline'}
                      style={!isUnlocked ? { opacity: 0.7 } : undefined}
                    >
                      <Typography style={{ fontSize: 28, marginBottom: 4 }}>
                        {pack.icon}
                      </Typography>
                      <Typography variant="body-medium" className="mb-xs">
                        {pack.name}
                      </Typography>
                      {isUnlocked ? (
                        <>
                          <ProgressBar progress={progress} variant="accent" />
                          <Typography
                            variant="caption"
                            color="secondary"
                            className="mt-xs"
                          >
                            {completed}/{total} complete
                          </Typography>
                        </>
                      ) : (
                        <View className="flex-row items-center gap-xs">
                          <Typography variant="caption" color="secondary">
                            🔒
                          </Typography>
                          <Typography variant="caption" color="secondary">
                            {pack.unlock_condition === 'plan_week'
                              ? `Week ${pack.unlock_value ?? '?'}+`
                              : pack.unlock_condition === 'plan_complete'
                              ? 'Post-Graduation'
                              : pack.unlock_condition === 'tricks_completed'
                              ? `${pack.unlock_value ?? '?'} tricks`
                              : 'Locked'}
                          </Typography>
                        </View>
                      )}
                    </Card>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Tricks Known ── */}
        {knownTricks.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(200)}
            className="px-xl mb-xl"
          >
            <Typography variant="h3" className="mb-base">
              Tricks {dogName} Knows
            </Typography>
            {knownTricks.map((tp, idx) => {
              const packTricks = getTricksForPack(tp.packId);
              const trick = packTricks.find((t) => t.id === tp.trickId);
              if (!trick) return null;

              return (
                <Pressable
                  key={tp.trickId}
                  onPress={() => router.push(`/tricks/detail/${tp.trickId}`)}
                >
                  <Animated.View
                    entering={FadeInRight.delay(240 + idx * 50).springify()}
                  >
                    <Card className="mb-sm">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-sm flex-1">
                          <Typography style={{ fontSize: 16, color: '#F5A623' }}>
                            {getStars(tp)}
                          </Typography>
                          <Typography variant="body-medium" className="flex-1">
                            {trick.title}
                          </Typography>
                        </View>
                        <Badge
                          variant={
                            tp.completedLevels.includes('mastered')
                              ? 'success'
                              : tp.completedLevels.includes('fluent')
                              ? 'accent'
                              : 'neutral'
                          }
                          label={
                            tp.completedLevels.includes('mastered')
                              ? 'Mastered'
                              : tp.completedLevels.includes('fluent')
                              ? 'Fluent'
                              : 'Learning'
                          }
                          size="sm"
                        />
                      </View>
                    </Card>
                  </Animated.View>
                </Pressable>
              );
            })}
          </Animated.View>
        )}

        {/* ── Suggested Next ── */}
        {suggestedTricks.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(320)}
            className="px-xl mb-xl"
          >
            <Typography variant="h3" className="mb-base">
              Suggested Next
            </Typography>
            {suggestedTricks.map((st, idx) => (
              <Pressable
                key={st.trickId}
                onPress={() => {
                  if (!isPremium && st.trickId !== FREE_TRICK_ID) {
                    router.push('/paywall');
                  } else {
                    router.push(`/tricks/detail/${st.trickId}`);
                  }
                }}
              >
                <Animated.View
                  entering={FadeInRight.delay(360 + idx * 50).springify()}
                >
                  <Card className="mb-sm">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Typography variant="body-medium">
                          {st.title}
                        </Typography>
                        <View className="flex-row items-center gap-sm mt-xs">
                          <Typography variant="caption" color="secondary">
                            {getDifficultyPaws(st.difficulty)}
                          </Typography>
                          <Typography variant="caption" color="secondary">
                            ~{st.time} min
                          </Typography>
                        </View>
                      </View>
                      {!isPremium && st.trickId !== FREE_TRICK_ID && (
                        <Badge variant="warning" label="🔒 Premium" size="sm" />
                      )}
                    </View>
                  </Card>
                </Animated.View>
              </Pressable>
            ))}
          </Animated.View>
        )}

        {/* ── Free tier hint ── */}
        {!isPremium && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(400)}
            className="px-xl mb-lg"
          >
            <Card className="bg-accent-light border-accent/20">
              <View className="items-center">
                <Typography variant="body-sm-medium" className="mb-xs text-center">
                  🎁 Shake / Paw is free to try!
                </Typography>
                <Typography variant="caption" color="secondary" className="text-center">
                  Unlock all 30 tricks with Premium
                </Typography>
              </View>
            </Card>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
