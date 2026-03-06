/**
 * Community Screen, PRD-15
 *
 * P3 post-launch feature. This is the scaffolded UI with sample data.
 * Full implementation requires:
 * - Supabase tables (posts, comments, reports)
 * - Content moderation pipeline (AI + human review)
 * - 1,000+ active users (ghost town prevention)
 *
 * Free users: read-only. Premium: post & comment.
 */

import React, { useState, useMemo } from 'react';
import { View, ScrollView, Pressable, Image, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Typography, Button, Card, Badge, ErrorBoundary, CommunitySkeleton } from '@/components/ui';
import { useSubscription } from '@/hooks/useSubscription';
import { useDogStore } from '@/stores/dogStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHydration } from '@/hooks/useHydration';
import type { CommunityPost, FeedFilter } from '@/types/community';
import { COLORS, RADIUS, SHADOWS } from '@/constants/theme';

// ──────────────────────────────────────────────
// Sample Data (replaced by Supabase feed in production)
// ──────────────────────────────────────────────

const SAMPLE_POSTS: CommunityPost[] = [
  {
    id: '1',
    authorId: 'u1',
    authorName: "Luna's Mom",
    authorBreed: 'Golden Retriever',
    authorPlanWeek: 3,
    type: 'win',
    content:
      "Luna finally stopped pulling on the leash!! Week 3 exercises worked like magic 🎉 She's walking perfectly by my side now",
    photoUrl: null,
    likes: 24,
    commentCount: 8,
    isLikedByUser: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    authorId: 'u2',
    authorName: "Max's Dad",
    authorBreed: 'German Shepherd',
    authorPlanWeek: 1,
    type: 'question',
    category: 'biting',
    content:
      'My 12-week GSD puppy is biting HARD during play. I know it\'s normal but any tips on what worked for you? The "ouch and ignore" method isn\'t clicking yet.',
    photoUrl: null,
    likes: 12,
    commentCount: 15,
    isLikedByUser: true,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    authorId: 'u3',
    authorName: "Bella's Family",
    authorBreed: 'French Bulldog',
    authorPlanWeek: 6,
    type: 'photo',
    content: "Someone graduated from Week 6! 🎓 So proud of this little face",
    photoUrl: 'https://images.unsplash.com/photo-1583337130417-13219ce08117?w=400',
    likes: 56,
    commentCount: 12,
    isLikedByUser: false,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    authorId: 'u4',
    authorName: "Charlie's Human",
    authorBreed: 'Labrador Retriever',
    authorPlanWeek: 4,
    type: 'milestone',
    achievementId: 'streak_7',
    content: "7-day streak! Charlie and I haven't missed a single day of training 🔥",
    photoUrl: null,
    likes: 31,
    commentCount: 5,
    isLikedByUser: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ──────────────────────────────────────────────
// Components
// ──────────────────────────────────────────────

const FILTERS: { key: FeedFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'wins', label: '🏆 Wins' },
  { key: 'questions', label: '❓ Questions' },
  { key: 'photos', label: '📸 Photos' },
  { key: 'my_breed', label: '🐕 My Breed' },
];

function PostTypeIcon({ type }: { type: CommunityPost['type'] }) {
  const icons: Record<CommunityPost['type'], string> = {
    win: '🏆',
    question: '❓',
    photo: '📸',
    milestone: '🎉',
  };
  return <Typography style={{ fontSize: 14 }}>{icons[type]}</Typography>;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

interface PostCardProps {
  post: CommunityPost;
  isPremium: boolean;
  onPress: () => void;
}

function PostCard({ post, isPremium, onPress }: PostCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card style={{ marginBottom: 12 }}>
        {/* Author row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: COLORS.primary.light,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <Typography style={{ fontSize: 18 }}>🐾</Typography>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <PostTypeIcon type={post.type} />
              <Typography variant="body" style={{ fontWeight: '600' }}>
                {post.authorName}
              </Typography>
              <Typography variant="caption" color="tertiary">
                · {formatTimeAgo(post.createdAt)}
              </Typography>
            </View>
            {post.authorBreed && (
              <Typography variant="caption" color="secondary">
                {post.authorBreed}
                {post.authorPlanWeek ? ` · Week ${post.authorPlanWeek}` : ''}
              </Typography>
            )}
          </View>
        </View>

        {/* Content */}
        <Typography variant="body" style={{ lineHeight: 22, marginBottom: 10 }}>
          {post.content}
        </Typography>

        {/* Photo */}
        {post.photoUrl && (
          <View
            style={{
              borderRadius: RADIUS.md,
              overflow: 'hidden',
              marginBottom: 10,
              height: 200,
              backgroundColor: COLORS.border,
            }}
          >
            <Image
              source={{ uri: post.photoUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border }}>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Typography style={{ fontSize: 16, color: post.isLikedByUser ? COLORS.primary.DEFAULT : COLORS.text.secondary }}>
              {post.isLikedByUser ? '❤️' : '🤍'}
            </Typography>
            <Typography variant="caption" color="secondary">
              {post.likes}
            </Typography>
          </Pressable>

          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Typography style={{ fontSize: 16 }}>💬</Typography>
            <Typography variant="caption" color="secondary">
              {post.commentCount}
            </Typography>
          </Pressable>

          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Typography style={{ fontSize: 16 }}>🐾</Typography>
            <Typography variant="caption" color="secondary">
              Share
            </Typography>
          </Pressable>
        </View>
      </Card>
    </Pressable>
  );
}

// ──────────────────────────────────────────────
// Screen
// ──────────────────────────────────────────────

export default function CommunityScreen() {
  const hydrated = useHydration(useDogStore, useOnboardingStore, useSettingsStore);

  if (!hydrated) {
    // Skeleton while stores hydrate (prevents flash of premium gate)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Typography style={{ fontSize: 40 }}>👥</Typography>
          <Typography variant="body" color="secondary" style={{ marginTop: 12 }}>
            Loading Community...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary screen="Community">
      <CommunityScreenContent />
    </ErrorBoundary>
  );
}

function CommunityScreenContent() {
  const router = useRouter();
  const { isPremium } = useSubscription();
  // Individual selectors → stable refs, prevents render loops
  const activeDogId = useDogStore((s) => s.activeDogId);
  const dogs = useDogStore((s) => s.dogs);
  const dog = useMemo(
    () => dogs.find((d) => d.id === activeDogId) ?? null,
    [dogs, activeDogId]
  );
  const onboarding = useOnboardingStore((s) => s.data);
  const userBreed = dog?.breed ?? onboarding.breed ?? null;

  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');

  const filteredPosts = useMemo(() => {
    switch (activeFilter) {
      case 'wins':
        return SAMPLE_POSTS.filter((p) => p.type === 'win' || p.type === 'milestone');
      case 'questions':
        return SAMPLE_POSTS.filter((p) => p.type === 'question');
      case 'photos':
        return SAMPLE_POSTS.filter((p) => p.photoUrl !== null);
      case 'my_breed':
        return SAMPLE_POSTS.filter(
          (p) => userBreed && p.authorBreed?.toLowerCase().includes(userBreed.toLowerCase())
        );
      default:
        return SAMPLE_POSTS;
    }
  }, [activeFilter, userBreed]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header (tab screen, no back button) */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <Typography variant="h3" style={{ textAlign: 'center' }}>
          Community
        </Typography>
      </View>

      {/* Filter tabs */}
      <Animated.View entering={FadeIn.duration(300)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            padding: 12,
            paddingBottom: 8,
            gap: 8,
          }}
        >
          {FILTERS.map((filter) => (
            <Pressable
              key={filter.key}
              onPress={() => setActiveFilter(filter.key)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: RADIUS.full,
                backgroundColor:
                  activeFilter === filter.key
                    ? COLORS.primary.DEFAULT
                    : COLORS.surface,
                borderWidth: 1,
                borderColor:
                  activeFilter === filter.key
                    ? COLORS.primary.DEFAULT
                    : COLORS.border,
              }}
            >
              <Typography
                variant="caption"
                style={{
                  fontWeight: '600',
                  color:
                    activeFilter === filter.key ? '#fff' : COLORS.text.secondary,
                }}
              >
                {filter.label}
              </Typography>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Coming soon banner */}
      <Animated.View entering={FadeInDown.duration(300)}>
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 12,
            backgroundColor: COLORS.accent.light,
            padding: 14,
            borderRadius: RADIUS.lg,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Typography style={{ fontSize: 20 }}>🚧</Typography>
          <View style={{ flex: 1 }}>
            <Typography variant="body" style={{ fontWeight: '600' }}>
              Community is Coming Soon!
            </Typography>
            <Typography variant="caption" color="secondary">
              Connect with fellow puppy parents, share wins, and get advice.
              Preview below!
            </Typography>
          </View>
        </View>
      </Animated.View>

      {/* Feed */}
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.duration(300).delay(index * 80)}>
            <PostCard
              post={item}
              isPremium={isPremium}
              onPress={() => {
                // In production: navigate to post detail
              }}
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Typography style={{ fontSize: 40, marginBottom: 8 }}>🐕</Typography>
            <Typography variant="body" color="secondary">
              No posts in this category yet
            </Typography>
          </View>
        }
      />

      {/* Floating compose button (premium only) */}
      {isPremium && (
        <Animated.View
          entering={FadeIn.delay(500)}
          style={{
            position: 'absolute',
            right: 20,
            bottom: 100,
          }}
        >
          <Pressable
            onPress={() => {
              // In production: open compose modal
            }}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: COLORS.primary.DEFAULT,
              alignItems: 'center',
              justifyContent: 'center',
              ...SHADOWS.elevated,
            }}
          >
            <Typography style={{ fontSize: 24, color: '#fff' }}>✏️</Typography>
          </Pressable>
        </Animated.View>
      )}

      {/* Free user CTA */}
      {!isPremium && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: COLORS.surface,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            padding: 16,
            paddingBottom: 34,
          }}
        >
          <Button
            label="Unlock Community Access 🐾"
            variant="primary"
            onPress={() =>
              router.push({
                pathname: '/paywall',
                params: { trigger: 'feature_gate_community', source: 'community' },
              })
            }
          />
          <Typography variant="caption" color="tertiary" style={{ textAlign: 'center', marginTop: 8 }}>
            Premium members can post, comment, and connect
          </Typography>
        </View>
      )}
    </SafeAreaView>
  );
}
