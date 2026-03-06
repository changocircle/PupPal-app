/**
 * Application-level type definitions
 * Extends and composes the database types for UI use.
 */

import type { Dog, User } from "./database";

// Onboarding flow state
export interface OnboardingData {
  puppyName: string;
  photoUri: string | null;
  breed: string | null;
  breedConfidence: number | null;
  breedDetected: boolean;
  /** When breed is "Mixed Breed", these hold the two component breeds */
  breedMix1: string | null;
  breedMix2: string | null;
  dateOfBirth: string | null;
  ageMonths: number | null;
  challenges: string[];
  ownerExperience: "first_time" | "some_experience" | "experienced" | null;
}

// Challenge options shown during onboarding
export interface ChallengeOption {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

// Experience level options
export interface ExperienceOption {
  id: "first_time" | "some_experience" | "experienced";
  label: string;
  emoji: string;
  description: string;
}

// Buddy speech bubble content
export interface BuddySpeech {
  text: string;
  type: "greeting" | "question" | "reaction" | "encouragement" | "tip";
}

// Plan preview shown at end of onboarding
export interface PlanPreview {
  weekCount: number;
  focusAreas: string[];
  exercisesPerDay: number;
  breedSpecificNote: string | null;
}

// Active dog context (used throughout the app)
export interface ActiveDogContext {
  dog: Dog;
  user: User;
}
