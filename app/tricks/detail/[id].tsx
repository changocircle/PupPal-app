import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInLeft, FadeIn } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Typography, Card, Button, Badge, PremiumGate } from '@/components/ui';
import { AchievementUnlock, LevelUpOverlay } from '@/components/gamification';
import { useDogStore } from '@/stores/dogStore';
import { useTrainingStore } from '@/stores/trainingStore';
import { useTrickStore } from '@/stores/trickStore';
import { useSubscription } from '@/hooks/useSubscription';
import { useGamification } from '@/hooks/useGamification';
import { getTrickById, personaliseTrick } from '@/data/trickData';
import { TRICK_LEVEL_META, FREE_TRICK_ID } from '@/types/tricks';
import type { TrickLevel } from '@/types/tricks';

/**
 * Trick Detail Screen, PRD-03 §6
 *
 * Full instructions for a single trick with 3-level progression tabs
 * (Learning → Fluent → Mastered), supplies, steps, tips, breed notes.
 *
 * PRD-07: Only Shake (FREE_TRICK_ID) is fully accessible for free users.
 * All other tricks show title + difficulty + first line, rest locked.
 */

const LEVELS: TrickLevel[] = ['learning', 'fluent', 'mastered'];

export default function TrickDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
  const gam = useGamification();

  const dogName = dog?.name ?? plan?.dogName ?? 'Your Pup';
  const breed = dog?.breed ?? plan?.breed;

  const trick = useMemo(() => {
    if (!id) return null;
    return getTrickById(id) ?? null;
  }, [id]);

  const personalised = useMemo(() => {
    if (!trick) return null;
    return personaliseTrick(trick, dogName, breed);
  }, [trick, dogName, breed]);

  // Trick store
  const startTrick = useTrickStore((s) => s.startTrick);
  const completeTrickLevel = useTrickStore((s) => s.completeTrickLevel);
  const trickProgress = useTrickStore((s) => (id ? s.getTrickProgress(id) : undefined));

  // PRD-07: free access check
  const isFree = id === FREE_TRICK_ID;
  const isAccessible = isPremium || isFree;

  // Active level tab
  const [activeLevel, setActiveLevel] = useState<TrickLevel>('learning');

  // Sync active level to current progress
  useEffect(() => {
    if (trickProgress) {
      if (trickProgress.completedLevels.includes('mastered')) {
        setActiveLevel('mastered');
      } else if (trickProgress.completedLevels.includes('fluent')) {
        setActiveLevel('mastered');
      } else if (trickProgress.completedLevels.includes('learning')) {
        setActiveLevel('fluent');
      }
    }
  }, [trickProgress?.completedLevels.length]);

  // Start trick on first visit
  useEffect(() => {
    if (id && trick && isAccessible && !trickProgress) {
      startTrick(id, trick.trick_pack_id);
    }
  }, [id, trick, isAccessible, trickProgress, startTrick]);

  // Completion
  const [showSharePrompt, setShowSharePrompt] = useState(false);

  const handleCompleteLevel = useCallback(() => {
    if (!id || !trick) return;
    const xp = completeTrickLevel(id, activeLevel);
    if (xp > 0) {
      // Wire into gamification
      gam.onExerciseCompleted(id, id, xp);
      setShowSharePrompt(true);
    }
  }, [id, trick, activeLevel, completeTrickLevel, gam.onExerciseCompleted]);

  const handleShare = useCallback(async () => {
    if (!personalised) return;
    try {
      await Share.share({
        message: `${dogName} just learned "${personalised.title}"! 🐾 ${personalised.share_moment} #PupPal`,
      });
    } catch {
      // User cancelled
    }
    setShowSharePrompt(false);
  }, [personalised, dogName]);

  // Error state
  if (!trick || !personalised) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Typography className="text-[40px] mb-base">🤔</Typography>
        <Typography variant="h3" className="mb-sm">
          Trick not found
        </Typography>
        <Button onPress={() => router.back()} variant="secondary" label="Go Back" />
      </SafeAreaView>
    );
  }

  const isLevelCompleted = trickProgress?.completedLevels.includes(activeLevel) ?? false;
  const canCompleteLevel = !isLevelCompleted && isAccessible;
  const levelMeta = TRICK_LEVEL_META[activeLevel];
  const progressionDesc = activeLevel === 'learning'
    ? trick.progression_levels.level_1
    : activeLevel === 'fluent'
    ? trick.progression_levels.level_2
    : trick.progression_levels.level_3;

  const completedCount = trickProgress?.completedLevels.length ?? 0;
  const stars = '★'.repeat(completedCount) + '☆'.repeat(3 - completedCount);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Back */}
        <Pressable
          onPress={() => router.back()}
          className="px-xl pt-base pb-sm"
        >
          <Typography variant="body-medium" style={{ color: '#FF6B5C' }}>
            ← Back
          </Typography>
        </Pressable>

        {/* ── Header (always visible per PRD-07) ── */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-xl mb-lg"
        >
          <View className="flex-row items-center gap-sm mb-sm">
            <Badge variant="accent" label="⭐ Trick" size="sm" />
            <Badge
              variant="neutral"
              label={'🐾'.repeat(Math.min(trick.difficulty, 3))}
              size="sm"
            />
            <Badge variant="neutral" label={`${trick.time_minutes} min`} size="sm" />
            {!isAccessible && (
              <Badge variant="warning" label="🔒 Premium" size="sm" />
            )}
          </View>

          <Typography variant="h1" className="mb-xs">
            {personalised.title}
          </Typography>

          {/* Star rating */}
          <Typography style={{ fontSize: 18, color: '#F5A623', marginBottom: 8 }}>
            {stars}
          </Typography>

          <Typography variant="body" color="secondary">
            {personalised.overview}
          </Typography>

          {/* Breed-specific learning time estimate */}
          {personalised.breedLearningTime && (
            <View className="flex-row items-center gap-xs mt-sm" style={{ opacity: 0.85 }}>
              <Typography style={{ fontSize: 14 }}>⏱️</Typography>
              <Typography variant="body-sm" color="secondary" style={{ fontStyle: 'italic' }}>
                {personalised.breedLearningTime}
              </Typography>
            </View>
          )}

          {/* Breed tip */}
          {personalised.breedTip && (
            <Card className="bg-accent-light border-accent/20 mt-sm">
              <Typography variant="body-sm">
                🐕 {personalised.breedTip}
              </Typography>
            </Card>
          )}
        </Animated.View>

        {/* ── PRD-07: Lock gate for non-free, non-premium ── */}
        {!isAccessible ? (
          <Animated.View
            entering={FadeInDown.duration(400).delay(80)}
            className="px-xl mb-lg"
          >
            <PremiumGate
              feature="feature_gate_tricks"
              headline={`Unlock "${personalised.title}" for ${dogName}`}
              subtitle="Get access to all 30 tricks with 3-level progression, breed-specific tips, and share moments."
              cta="Unlock Tricks"
              lockIcon="🎪"
              preview={
                <Card>
                  <View style={{ gap: 8 }}>
                    {[1, 2, 3].map((i) => (
                      <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#E5E7EB' }} />
                        <View style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: '#E5E7EB' }} />
                      </View>
                    ))}
                  </View>
                </Card>
              }
            >
              <View />
            </PremiumGate>

            {/* Prerequisites info (always visible) */}
            {trick.prerequisites.length > 0 && (
              <Card className="mt-sm">
                <Typography variant="body-sm-medium" className="mb-xs">
                  Prerequisites
                </Typography>
                {trick.prerequisites.map((prereqId) => {
                  const prereq = getTrickById(prereqId);
                  const done = trickProgress
                    ? false
                    : false;
                  return (
                    <Typography key={prereqId} variant="body-sm" color="secondary">
                      {done ? '✅' : '⬜'} {prereq?.title ?? prereqId}
                    </Typography>
                  );
                })}
              </Card>
            )}
          </Animated.View>
        ) : (
          <>
            {/* ── Level Tabs ── */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(80)}
              className="px-xl mb-base"
            >
              <View className="flex-row bg-surface rounded-xl p-xs" style={{ gap: 4 }}>
                {LEVELS.map((level) => {
                  const meta = TRICK_LEVEL_META[level];
                  const isActive = activeLevel === level;
                  const isDone = trickProgress?.completedLevels.includes(level) ?? false;

                  return (
                    <Pressable
                      key={level}
                      onPress={() => setActiveLevel(level)}
                      className={`flex-1 py-sm items-center rounded-lg ${
                        isActive ? 'bg-primary' : ''
                      }`}
                    >
                      <Typography
                        variant="body-sm-medium"
                        color={isActive ? 'inverse' : 'secondary'}
                      >
                        {isDone ? '✓ ' : ''}{meta.label}
                      </Typography>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {/* Level description */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(120)}
              className="px-xl mb-base"
            >
              <Card className="bg-accent-light border-accent/20">
                <Typography variant="body-sm-medium" className="mb-xs">
                  {levelMeta.emoji} Level: {levelMeta.label}
                </Typography>
                <Typography variant="body-sm" color="secondary">
                  {progressionDesc}
                </Typography>
                <Typography variant="caption" color="secondary" className="mt-xs">
                  +{levelMeta.xp} XP on completion
                </Typography>
              </Card>
            </Animated.View>

            {/* Prerequisites */}
            {trick.prerequisites.length > 0 && (
              <Animated.View
                entering={FadeInDown.duration(400).delay(140)}
                className="px-xl mb-base"
              >
                <Card>
                  <Typography variant="body-sm-medium" className="mb-xs">
                    📋 Prerequisites
                  </Typography>
                  {trick.prerequisites.map((prereqId) => {
                    const prereq = getTrickById(prereqId);
                    const prereqProg = useTrickStore.getState().getTrickProgress(prereqId);
                    const done = prereqProg?.completedLevels.includes('learning') ?? false;
                    return (
                      <View key={prereqId} className="flex-row items-center gap-sm">
                        <Typography variant="body-sm">
                          {done ? '✅' : '⬜'}
                        </Typography>
                        <Typography
                          variant="body-sm"
                          color={done ? undefined : 'secondary'}
                        >
                          {prereq?.title ?? prereqId}
                        </Typography>
                      </View>
                    );
                  })}
                </Card>
              </Animated.View>
            )}

            {/* Supplies */}
            {trick.supplies.length > 0 && (
              <Animated.View
                entering={FadeInDown.duration(400).delay(160)}
                className="px-xl mb-base"
              >
                <Card className="bg-accent-light border-accent/20">
                  <Typography variant="body-sm-medium" className="mb-sm">
                    🧺 What you'll need
                  </Typography>
                  <View className="flex-row flex-wrap gap-sm">
                    {trick.supplies.map((supply, i) => (
                      <View key={i} className="bg-surface px-md py-xs rounded-full">
                        <Typography variant="body-sm">{supply}</Typography>
                      </View>
                    ))}
                  </View>
                </Card>
              </Animated.View>
            )}

            {/* Steps */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(200)}
              className="px-xl mb-base"
            >
              <Typography variant="h3" className="mb-base">
                Step-by-Step
              </Typography>
              {personalised.steps.map((step, idx) => (
                <Animated.View
                  key={idx}
                  entering={FadeInLeft.delay(240 + idx * 60).springify()}
                  className="flex-row gap-md mb-md"
                >
                  <View className="w-[28px] h-[28px] rounded-full bg-primary items-center justify-center mt-[2px]">
                    <Typography variant="caption" color="inverse" style={{ fontSize: 12 }}>
                      {idx + 1}
                    </Typography>
                  </View>
                  <View className="flex-1">
                    <Typography variant="body">{step}</Typography>
                  </View>
                </Animated.View>
              ))}
            </Animated.View>

            {/* Success criteria */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(280)}
              className="px-xl mb-base"
            >
              <Card className="bg-success-light border-success/20">
                <Typography variant="body-sm-medium" className="mb-xs">
                  ✅ Success looks like
                </Typography>
                <Typography variant="body-sm">
                  {personalised.success_criteria}
                </Typography>
              </Card>
            </Animated.View>

            {/* Pro Tips */}
            {personalised.pro_tips.length > 0 && (
              <Animated.View
                entering={FadeInDown.duration(400).delay(320)}
                className="px-xl mb-base"
              >
                <Typography variant="h3" className="mb-sm">
                  💡 Pro Tips
                </Typography>
                {personalised.pro_tips.map((tip, idx) => (
                  <View key={idx} className="flex-row gap-sm mb-sm">
                    <Typography variant="body-sm" color="secondary">•</Typography>
                    <Typography variant="body-sm" color="secondary" className="flex-1">
                      {tip}
                    </Typography>
                  </View>
                ))}
              </Animated.View>
            )}

            {/* Common Mistakes */}
            {personalised.common_mistakes.length > 0 && (
              <Animated.View
                entering={FadeInDown.duration(400).delay(360)}
                className="px-xl mb-base"
              >
                <Typography variant="h3" className="mb-sm">
                  ⚠️ Common Mistakes
                </Typography>
                {personalised.common_mistakes.map((mistake, idx) => (
                  <View key={idx} className="flex-row gap-sm mb-sm">
                    <Typography variant="body-sm" style={{ color: '#EF6461' }}>✗</Typography>
                    <Typography variant="body-sm" color="secondary" className="flex-1">
                      {mistake}
                    </Typography>
                  </View>
                ))}
              </Animated.View>
            )}

            {/* Troubleshooting */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(400)}
              className="px-xl mb-lg"
            >
              <Card>
                <Typography variant="body-sm-medium" className="mb-xs">
                  🔧 Troubleshooting
                </Typography>
                <Typography variant="body-sm" color="secondary">
                  {personalised.troubleshooting}
                </Typography>
              </Card>
            </Animated.View>
          </>
        )}
      </ScrollView>

      {/* ── Bottom Action Bar ── */}
      {isAccessible && (
        <Animated.View
          entering={FadeIn.delay(400)}
          className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border px-xl pb-[34px] pt-base"
        >
          {showSharePrompt ? (
            <View>
              <Typography variant="body-medium" className="text-center mb-sm">
                🎉 {personalised?.title}, {TRICK_LEVEL_META[activeLevel].label} complete!
              </Typography>
              <View className="flex-row gap-sm">
                <Button
                  label="📸 Share This Trick!"
                  variant="primary"
                  onPress={handleShare}
                  fullWidth
                />
              </View>
              <Pressable
                onPress={() => setShowSharePrompt(false)}
                className="mt-sm items-center"
              >
                <Typography variant="body-sm" color="secondary">
                  Maybe later
                </Typography>
              </Pressable>
            </View>
          ) : isLevelCompleted ? (
            <View className="items-center">
              <Typography variant="body-medium" className="mb-xs">
                ✅ {TRICK_LEVEL_META[activeLevel].label} level complete!
              </Typography>
              {activeLevel !== 'mastered' && (
                <Typography variant="body-sm" color="secondary">
                  Try the next level above ↑
                </Typography>
              )}
              {activeLevel === 'mastered' && (
                <Button
                  label="📸 Share This Trick!"
                  variant="secondary"
                  size="sm"
                  onPress={handleShare}
                />
              )}
            </View>
          ) : (
            <Button
              label={`✅ Mark ${TRICK_LEVEL_META[activeLevel].label} Complete (+${levelMeta.xp} XP)`}
              variant="primary"
              onPress={handleCompleteLevel}
            />
          )}
        </Animated.View>
      )}

      {/* Gamification celebrations */}
      <AchievementUnlock
        achievement={gam.pendingCelebration}
        onDismiss={gam.dismissCelebration}
      />
      <LevelUpOverlay
        levelDef={gam.pendingLevelUp}
        onDismiss={gam.dismissLevelUp}
      />
    </SafeAreaView>
  );
}
