/**
 * Breed data loader and helpers
 * Loads the 51 breed profiles from breeds.json and provides lookup utilities
 */

import type { BreedProfile, SizeCategory } from '../types/breed';
import breedsJson from './breeds.json';

const breeds = breedsJson as unknown as BreedProfile[];

/** All active breed profiles sorted by popularity */
export const ALL_BREEDS: BreedProfile[] = breeds
  .filter((b) => b.active)
  .sort((a, b) => {
    // Mixed breed goes last
    if (a.slug === 'mixed-breed') return 1;
    if (b.slug === 'mixed-breed') return -1;
    // Sort by popularity rank (lower = more popular)
    const rankA = a.popularity_rank ?? 999;
    const rankB = b.popularity_rank ?? 999;
    return rankA - rankB;
  });

/** Get breed by slug */
export function getBreedBySlug(slug: string): BreedProfile | undefined {
  return breeds.find((b) => b.slug === slug && b.active);
}

/** Get breed by id */
export function getBreedById(id: string): BreedProfile | undefined {
  return breeds.find((b) => b.id === id && b.active);
}

/** Get breed by name (case-insensitive) */
export function getBreedByName(name: string): BreedProfile | undefined {
  const lower = name.toLowerCase();
  return breeds.find((b) => b.name.toLowerCase() === lower && b.active);
}

/** Search breeds by name (fuzzy match) */
export function searchBreeds(query: string): BreedProfile[] {
  if (!query.trim()) return ALL_BREEDS;
  const lower = query.toLowerCase();
  return ALL_BREEDS.filter(
    (b) =>
      b.name.toLowerCase().includes(lower) ||
      b.akc_group.toLowerCase().includes(lower) ||
      b.temperament_tags.some((t) => t.toLowerCase().includes(lower))
  );
}

/** Filter breeds by size category */
export function filterBreedsBySize(size: SizeCategory): BreedProfile[] {
  return ALL_BREEDS.filter((b) => b.size_category === size);
}

/** Get unique AKC groups from all breeds */
export function getAkcGroups(): string[] {
  const groups = new Set(ALL_BREEDS.map((b) => b.akc_group));
  return Array.from(groups).sort();
}

/** Filter breeds by AKC group */
export function filterBreedsByGroup(group: string): BreedProfile[] {
  return ALL_BREEDS.filter((b) => b.akc_group === group);
}

/** Get top N popular breeds */
export function getPopularBreeds(count: number = 10): BreedProfile[] {
  return ALL_BREEDS.filter((b) => b.slug !== 'mixed-breed').slice(0, count);
}

/** Get a size label with icon */
export function getSizeIcon(size: SizeCategory): string {
  switch (size) {
    case 'toy':
      return '🐾';
    case 'small':
      return '🐕';
    case 'medium':
      return '🦮';
    case 'large':
      return '🐕‍🦺';
    case 'giant':
      return '🦴';
    default:
      return '🐶';
  }
}
