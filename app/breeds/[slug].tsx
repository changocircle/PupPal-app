/**
 * Breed Detail Screen
 * Per PRD-12: Full breed profile with all sections, cross-links to app features
 *
 * Sections: About, Quick Stats, Training Tips, Health Overview,
 * Growth & Size, Key Milestones, Care, Fun Facts
 */

import React, { useMemo } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, Badge, BuddyImage } from '../../src/components/ui';
import {
  RatingBar,
  ConditionCard,
  BreedSection,
} from '../../src/components/breed';
import { getBreedBySlug } from '../../src/data/breedData';
import { SIZE_LABELS, QUICK_STATS, IMPORTANCE_COLORS } from '../../src/types/breed';
import { useDogStore } from '../../src/stores/dogStore';
import { COLORS, RADIUS, SHADOWS } from '../../src/constants/theme';

export default function BreedDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  // Individual selectors → stable refs, prevents render loops
  const activeDogId = useDogStore((s) => s.activeDogId);
  const dogs = useDogStore((s) => s.dogs);
  const dog = useMemo(
    () => dogs.find((d) => d.id === activeDogId) ?? null,
    [dogs, activeDogId]
  );

  const breed = useMemo(() => getBreedBySlug(slug || ''), [slug]);

  if (!breed) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <BuddyImage expression="empathetic" size={80} containerStyle={{ marginBottom: 16 }} />
        <Typography variant="h3" style={{ marginBottom: 8 }}>
          Breed not found
        </Typography>
        <Pressable onPress={() => router.back()}>
          <Typography
            variant="body"
            style={{ color: COLORS.primary.DEFAULT, fontWeight: '600' }}
          >
            ← Back to Encyclopedia
          </Typography>
        </Pressable>
      </SafeAreaView>
    );
  }

  const isUserBreed =
    dog?.breed?.toLowerCase() === breed.name.toLowerCase();
  const dogName = dog?.name || 'your pup';

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
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Typography variant="h3" style={{ fontSize: 24 }}>
            ←
          </Typography>
        </Pressable>
        <Typography variant="h3" style={{ flex: 1 }} numberOfLines={1}>
          {breed.name}
        </Typography>
        {isUserBreed && (
          <Badge label="Your Breed" variant="accent" size="sm" />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        {/* Hero */}
        <View
          style={{
            backgroundColor: COLORS.primary.light,
            borderRadius: RADIUS.xl,
            padding: 24,
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <BuddyImage expression="happy" size={80} containerStyle={{ marginBottom: 12 }} />
          <Typography variant="h1" style={{ textAlign: 'center', marginBottom: 4 }}>
            {breed.name}
          </Typography>
          <Typography variant="body" color="secondary" style={{ textAlign: 'center' }}>
            {breed.akc_group} · {SIZE_LABELS[breed.size_category]}
            {breed.popularity_rank
              ? ` · #${breed.popularity_rank} Most Popular`
              : ''}
          </Typography>
          <View
            style={{
              flexDirection: 'row',
              gap: 6,
              marginTop: 12,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {breed.temperament_tags.map((tag) => (
              <Badge key={tag} label={tag} variant="neutral" size="sm" />
            ))}
            {breed.hypoallergenic && (
              <Badge label="Hypoallergenic" variant="success" size="sm" />
            )}
          </View>
        </View>

        {/* Quick Stats */}
        <BreedSection title="Quick Stats">
          {QUICK_STATS.map((stat) => (
            <RatingBar
              key={stat.key}
              label={stat.label}
              icon={stat.icon}
              value={breed[stat.key] as string}
            />
          ))}
        </BreedSection>

        {/* About */}
        <BreedSection title="About">
          <Typography variant="body" color="secondary" style={{ lineHeight: 22 }}>
            {breed.breed_description}
          </Typography>
          {breed.history && (
            <View style={{ marginTop: 12 }}>
              <Typography
                variant="body"
                style={{ fontWeight: '600', marginBottom: 4 }}
              >
                History
              </Typography>
              <Typography variant="body" color="secondary" style={{ lineHeight: 22 }}>
                {breed.history}
              </Typography>
            </View>
          )}
        </BreedSection>

        {/* Training Tips */}
        <BreedSection
          title={`Training Tips for ${breed.name === 'Mixed Breed' ? 'Mixed Breeds' : breed.name + 's'}`}
          actionLabel={`View ${dogName}'s Plan →`}
          onAction={() => router.push('/(tabs)/plan')}
        >
          <View
            style={{
              backgroundColor: COLORS.primary.extralight,
              borderRadius: RADIUS.md,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <Typography
              variant="caption"
              style={{ fontWeight: '600', marginBottom: 4 }}
            >
              Recommended Style
            </Typography>
            <Typography variant="body" color="secondary" style={{ lineHeight: 20 }}>
              {breed.recommended_training_style}
            </Typography>
          </View>

          {breed.training_tips.map((tip, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 8 }}>
              <Typography variant="body" style={{ marginRight: 8, color: COLORS.primary.DEFAULT }}>
                •
              </Typography>
              <Typography variant="body" color="secondary" style={{ flex: 1, lineHeight: 20 }}>
                {tip}
              </Typography>
            </View>
          ))}

          {breed.common_training_challenges.length > 0 && (
            <View
              style={{
                marginTop: 8,
                backgroundColor: COLORS.warning.light,
                borderRadius: RADIUS.md,
                padding: 12,
              }}
            >
              <Typography
                variant="caption"
                style={{ fontWeight: '600', marginBottom: 4 }}
              >
                Common Challenges
              </Typography>
              {breed.common_training_challenges.map((c, i) => (
                <Typography
                  key={i}
                  variant="caption"
                  color="secondary"
                  style={{ marginLeft: 4 }}
                >
                  ⚠️ {c}
                </Typography>
              ))}
            </View>
          )}
        </BreedSection>

        {/* Health Overview */}
        <BreedSection
          title="Health Overview"
          actionLabel="View Health Tracker →"
          onAction={() => router.push('/(tabs)/health')}
        >
          {breed.common_conditions.map((condition, i) => (
            <ConditionCard key={i} condition={condition} />
          ))}

          {breed.medication_sensitivities.length > 0 && (
            <View
              style={{
                backgroundColor: COLORS.error.light,
                borderRadius: RADIUS.md,
                padding: 12,
                marginTop: 8,
              }}
            >
              <Typography
                variant="caption"
                style={{ fontWeight: '600', color: COLORS.error.DEFAULT, marginBottom: 4 }}
              >
                ⚠️ Medication Sensitivities
              </Typography>
              <Typography variant="caption" color="secondary">
                {breed.medication_sensitivities.join(', ')}
              </Typography>
              <Typography
                variant="caption"
                color="secondary"
                style={{ marginTop: 4, fontStyle: 'italic' }}
              >
                Always inform your vet about breed-specific sensitivities
              </Typography>
            </View>
          )}

          {/* Recommended Screenings */}
          {breed.recommended_screenings.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Typography
                variant="caption"
                style={{ fontWeight: '600', marginBottom: 8 }}
              >
                Recommended Screenings
              </Typography>
              {breed.recommended_screenings.map((s, i) => {
                const colors =
                  IMPORTANCE_COLORS[s.importance] || IMPORTANCE_COLORS.recommended;
                return (
                  <View
                    key={i}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 6,
                      borderBottomWidth:
                        i < breed.recommended_screenings.length - 1 ? 1 : 0,
                      borderBottomColor: COLORS.border,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Typography variant="caption" style={{ fontWeight: '500' }}>
                        {s.screening}
                      </Typography>
                      <Typography variant="caption" color="tertiary">
                        {s.recommended_age}
                      </Typography>
                    </View>
                    <View
                      style={{
                        backgroundColor: colors.bg,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 12,
                      }}
                    >
                      <Typography
                        variant="caption"
                        style={{
                          color: colors.text,
                          fontWeight: '600',
                          fontSize: 10,
                        }}
                      >
                        {s.importance.toUpperCase()}
                      </Typography>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <Typography
            variant="caption"
            color="secondary"
            style={{ marginTop: 8, fontStyle: 'italic' }}
          >
            {breed.spay_neuter_recommendation}
          </Typography>
        </BreedSection>

        {/* Growth & Size */}
        <BreedSection
          title="Growth & Size"
          actionLabel="View Weight Tracker →"
          onAction={() => router.push('/health/weight')}
        >
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            {[
              {
                label: 'Male Weight',
                value: `${breed.weight_range_male.min}–${breed.weight_range_male.max} lbs`,
              },
              {
                label: 'Female Weight',
                value: `${breed.weight_range_female.min}–${breed.weight_range_female.max} lbs`,
              },
              {
                label: 'Height',
                value: `${breed.height_range.min}–${breed.height_range.max} in`,
              },
              {
                label: 'Life Expectancy',
                value: `${breed.life_expectancy.min}–${breed.life_expectancy.max} yrs`,
              },
              {
                label: 'Reaches Adult Size',
                value: `~${breed.adult_weight_age_months} months`,
              },
            ].map((stat, i) => (
              <View
                key={i}
                style={{
                  width: '48%',
                  backgroundColor: COLORS.primary.extralight,
                  borderRadius: RADIUS.md,
                  padding: 12,
                }}
              >
                <Typography variant="caption" color="tertiary" style={{ marginBottom: 2 }}>
                  {stat.label}
                </Typography>
                <Typography variant="body" style={{ fontWeight: '700' }}>
                  {stat.value}
                </Typography>
              </View>
            ))}
          </View>
        </BreedSection>

        {/* Key Milestones */}
        <BreedSection title="Key Milestones">
          {[
            {
              icon: '🦷',
              label: 'Teething Peak',
              value: `${breed.teething_peak_weeks.min}–${breed.teething_peak_weeks.max} weeks`,
            },
            {
              icon: '🌀',
              label: 'Adolescence',
              value: `${Math.round(breed.adolescence_weeks.min / 4.3)}–${Math.round(breed.adolescence_weeks.max / 4.3)} months`,
            },
            {
              icon: '🎓',
              label: 'Social Maturity',
              value: `~${breed.social_maturity_months} months`,
            },
          ].map((m, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 10,
                borderBottomWidth: i < 2 ? 1 : 0,
                borderBottomColor: COLORS.border,
              }}
            >
              <Typography variant="body" style={{ fontSize: 24, marginRight: 12 }}>
                {m.icon}
              </Typography>
              <View style={{ flex: 1 }}>
                <Typography variant="body" style={{ fontWeight: '600' }}>
                  {m.label}
                </Typography>
                <Typography variant="caption" color="secondary">
                  {m.value}
                </Typography>
              </View>
            </View>
          ))}
        </BreedSection>

        {/* Care */}
        <BreedSection title="Care">
          {/* Exercise */}
          <View style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <Typography variant="body" style={{ fontSize: 20, marginRight: 8 }}>
                🏃
              </Typography>
              <Typography variant="body" style={{ fontWeight: '600' }}>
                Exercise:{' '}
                {breed.exercise_needs_daily_minutes.min}–
                {breed.exercise_needs_daily_minutes.max} min/day
              </Typography>
            </View>
            <Typography
              variant="caption"
              color="secondary"
              style={{ marginLeft: 28, lineHeight: 18 }}
            >
              {breed.exercise_notes}
            </Typography>
          </View>

          {/* Grooming */}
          <View style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <Typography variant="body" style={{ fontSize: 20, marginRight: 8 }}>
                ✂️
              </Typography>
              <Typography variant="body" style={{ fontWeight: '600' }}>
                Grooming: {breed.grooming_frequency}
              </Typography>
            </View>
            <Typography
              variant="caption"
              color="secondary"
              style={{ marginLeft: 28, lineHeight: 18 }}
            >
              {breed.grooming_notes}
            </Typography>
          </View>

          {/* Diet */}
          <View style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <Typography variant="body" style={{ fontSize: 20, marginRight: 8 }}>
                🍖
              </Typography>
              <Typography variant="body" style={{ fontWeight: '600' }}>
                Diet
              </Typography>
            </View>
            <Typography
              variant="caption"
              color="secondary"
              style={{ marginLeft: 28, lineHeight: 18 }}
            >
              {breed.diet_notes}
            </Typography>
          </View>

          {/* Additional info row */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View
              style={{
                flex: 1,
                backgroundColor:
                  breed.heat_sensitivity === 'high' || breed.heat_sensitivity === 'critical'
                    ? COLORS.warning.light
                    : COLORS.primary.extralight,
                borderRadius: RADIUS.md,
                padding: 10,
                alignItems: 'center',
              }}
            >
              <Typography variant="body" style={{ fontSize: 20 }}>
                ☀️
              </Typography>
              <Typography variant="caption" color="secondary">
                Heat: {breed.heat_sensitivity}
              </Typography>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor:
                  breed.cold_sensitivity === 'high'
                    ? COLORS.info.light
                    : COLORS.primary.extralight,
                borderRadius: RADIUS.md,
                padding: 10,
                alignItems: 'center',
              }}
            >
              <Typography variant="body" style={{ fontSize: 20 }}>
                ❄️
              </Typography>
              <Typography variant="caption" color="secondary">
                Cold: {breed.cold_sensitivity}
              </Typography>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: COLORS.primary.extralight,
                borderRadius: RADIUS.md,
                padding: 10,
                alignItems: 'center',
              }}
            >
              <Typography variant="body" style={{ fontSize: 20 }}>
                🧹
              </Typography>
              <Typography variant="caption" color="secondary">
                Shed: {breed.shedding_level}
              </Typography>
            </View>
          </View>
        </BreedSection>

        {/* Puppy Tips (only if user has this breed) */}
        {breed.puppy_tips.length > 0 && (
          <BreedSection
            title={
              isUserBreed
                ? `Puppy Tips for ${dogName}`
                : `${breed.name} Puppy Tips`
            }
          >
            {breed.puppy_tips.map((tip, i) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 8 }}>
                <Typography
                  variant="body"
                  style={{ marginRight: 8, fontSize: 16 }}
                >
                  {['🐾', '🎯', '💡', '⭐', '🔑'][i % 5]}
                </Typography>
                <Typography
                  variant="body"
                  color="secondary"
                  style={{ flex: 1, lineHeight: 20 }}
                >
                  {tip}
                </Typography>
              </View>
            ))}
          </BreedSection>
        )}

        {/* Fun Facts */}
        <BreedSection title="Fun Facts">
          {breed.fun_facts.map((fact, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 8 }}>
              <Typography variant="body" style={{ marginRight: 8 }}>
                🌟
              </Typography>
              <Typography
                variant="body"
                color="secondary"
                style={{ flex: 1, lineHeight: 20 }}
              >
                {fact}
              </Typography>
            </View>
          ))}

          {breed.celebrity_dogs.length > 0 && (
            <View
              style={{
                marginTop: 8,
                backgroundColor: COLORS.accent.light,
                borderRadius: RADIUS.md,
                padding: 12,
              }}
            >
              <Typography
                variant="caption"
                style={{ fontWeight: '600', marginBottom: 4 }}
              >
                Famous {breed.name === 'Mixed Breed' ? 'Mixed Breed Dogs' : breed.name + 's'}
              </Typography>
              <Typography variant="caption" color="secondary">
                {breed.celebrity_dogs.join(' · ')}
              </Typography>
            </View>
          )}
        </BreedSection>

        {/* Coat info */}
        <BreedSection title="Coat & Colors">
          <View style={{ marginBottom: 8 }}>
            <Typography variant="caption" color="tertiary">
              Coat Type
            </Typography>
            <Typography variant="body" style={{ fontWeight: '500' }}>
              {breed.coat_type}
            </Typography>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {breed.coat_colors.map((color) => (
              <Badge key={color} label={color} variant="neutral" size="sm" />
            ))}
          </View>
        </BreedSection>
      </ScrollView>
    </SafeAreaView>
  );
}
