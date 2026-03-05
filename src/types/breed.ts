/**
 * Breed Encyclopedia Types
 * Per PRD-12: Breed data model for encyclopedia and system backbone
 */

export interface BreedWeightRange {
  min: number;
  max: number;
}

export interface BreedRange {
  min: number;
  max: number;
}

export interface BreedCondition {
  condition: string;
  prevalence: 'low' | 'moderate' | 'high' | 'very_high';
  description: string;
  symptoms: string[];
}

export interface BreedScreening {
  screening: string;
  recommended_age: string;
  importance: 'essential' | 'recommended' | 'optional';
}

export type SizeCategory = 'toy' | 'small' | 'medium' | 'large' | 'giant';
export type RatingLevel = 'low' | 'moderate' | 'high' | 'very_high';
export type LearningSpeed = 'slow' | 'average' | 'fast' | 'very_fast';

export interface BreedProfile {
  id: string;
  name: string;
  slug: string;
  akc_group: string;
  size_category: SizeCategory;

  // Physical
  weight_range_male: BreedWeightRange;
  weight_range_female: BreedWeightRange;
  height_range: BreedRange;
  life_expectancy: BreedRange;
  coat_type: string;
  coat_colors: string[];
  shedding_level: RatingLevel;
  grooming_frequency: string;
  hypoallergenic: boolean;

  // Temperament
  temperament_tags: string[];
  energy_level: RatingLevel;
  trainability: RatingLevel;
  friendliness_people: RatingLevel;
  friendliness_dogs: RatingLevel;
  friendliness_children: RatingLevel;
  barking_tendency: RatingLevel;
  prey_drive: RatingLevel;
  separation_anxiety_risk: 'low' | 'moderate' | 'high';

  // Training
  learning_speed: LearningSpeed;
  stubbornness: RatingLevel;
  trick_aptitude: RatingLevel;
  common_training_challenges: string[];
  training_tips: string[];
  recommended_training_style: string;

  // Health
  brachycephalic: boolean;
  common_conditions: BreedCondition[];
  recommended_screenings: BreedScreening[];
  medication_sensitivities: string[];
  spay_neuter_recommendation: string;
  exercise_needs_daily_minutes: BreedRange;
  heat_sensitivity: RatingLevel | 'critical';
  cold_sensitivity: RatingLevel;

  // Growth
  adult_weight_age_months: number;
  teething_peak_weeks: BreedRange;
  adolescence_weeks: BreedRange;
  social_maturity_months: number;

  // Content
  breed_description: string;
  history: string;
  fun_facts: string[];
  celebrity_dogs: string[];
  puppy_tips: string[];
  diet_notes: string;
  exercise_notes: string;
  grooming_notes: string;

  // Media
  hero_image_url: string | null;
  gallery_urls: string[];

  // Metadata
  popularity_rank: number | null;
  active: boolean;
}

/** Rating level to numeric value (for visual bars) */
export const RATING_VALUES: Record<string, number> = {
  low: 1,
  moderate: 2,
  high: 3,
  very_high: 4,
  critical: 5,
  slow: 1,
  average: 2,
  fast: 3,
  very_fast: 4,
};

/** Size category labels */
export const SIZE_LABELS: Record<SizeCategory, string> = {
  toy: 'Toy',
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  giant: 'Giant',
};

/** Quick stat definitions for the breed detail page */
export interface QuickStat {
  key: keyof BreedProfile;
  label: string;
  icon: string;
}

export const QUICK_STATS: QuickStat[] = [
  { key: 'energy_level', label: 'Energy', icon: '⚡' },
  { key: 'trainability', label: 'Trainability', icon: '🧠' },
  { key: 'friendliness_children', label: 'Kid-Friendly', icon: '👶' },
  { key: 'friendliness_dogs', label: 'Dog-Friendly', icon: '🐕' },
  { key: 'barking_tendency', label: 'Barking', icon: '🔊' },
  { key: 'shedding_level', label: 'Shedding', icon: '🧹' },
];

/** Prevalence colors */
export const PREVALENCE_COLORS = {
  low: { bg: '#E8F5EE', text: '#5CB882' },
  moderate: { bg: '#FFF6E5', text: '#F5A623' },
  high: { bg: '#FDEDED', text: '#EF6461' },
  very_high: { bg: '#FDEDED', text: '#D32F2F' },
};

/** Importance colors */
export const IMPORTANCE_COLORS = {
  essential: { bg: '#FDEDED', text: '#EF6461' },
  recommended: { bg: '#FFF6E5', text: '#F5A623' },
  optional: { bg: '#EBF3FA', text: '#5B9BD5' },
};
