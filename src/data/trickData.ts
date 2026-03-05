/**
 * Trick Library Data Access — PRD-03 §6
 *
 * Loads trick and pack data from JSON, provides lookup helpers,
 * and handles personalisation (dog name / breed substitution).
 */

import type { Trick, TrickPack, BreedModifiers } from '@/types/tricks';

// Static imports (resolveJsonModule: true in tsconfig)
import tricksRaw from './tricks.json';
import packsRaw from './trickPacks.json';

const ALL_TRICKS: Trick[] = tricksRaw as unknown as Trick[];
const ALL_PACKS: TrickPack[] = packsRaw as unknown as TrickPack[];

/* ── Lookup ── */

export function getAllTricks(): Trick[] {
  return ALL_TRICKS;
}

export function getAllPacks(): TrickPack[] {
  return ALL_PACKS.filter((p) => p.active).sort((a, b) => a.sort_order - b.sort_order);
}

export function getTrickById(id: string): Trick | undefined {
  return ALL_TRICKS.find((t) => t.id === id);
}

export function getPackById(id: string): TrickPack | undefined {
  return ALL_PACKS.find((p) => p.id === id);
}

export function getTricksForPack(packId: string): Trick[] {
  return ALL_TRICKS.filter((t) => t.trick_pack_id === packId);
}

/* ── Personalisation ── */

/** Replace {dog_name} and {breed_tip} placeholders with actual values */
export function personaliseTrick(
  trick: Trick,
  dogName: string,
  breed?: string | null,
): {
  title: string;
  overview: string;
  steps: string[];
  success_criteria: string;
  pro_tips: string[];
  common_mistakes: string[];
  troubleshooting: string;
  share_moment: string;
  breedTip: string | null;
} {
  const breedTip = getBreedTip(trick.breed_modifiers, breed);

  const sub = (text: string): string =>
    text
      .replace(/\{dog_name\}/g, dogName)
      .replace(/\{breed_tip\}/g, breedTip ?? '');

  return {
    title: sub(trick.title),
    overview: sub(trick.overview),
    steps: trick.steps.map(sub),
    success_criteria: sub(trick.success_criteria),
    pro_tips: trick.pro_tips.map(sub),
    common_mistakes: trick.common_mistakes.map(sub),
    troubleshooting: sub(trick.troubleshooting),
    share_moment: sub(trick.share_moment),
    breedTip,
  };
}

function getBreedTip(modifiers: BreedModifiers, breed?: string | null): string | null {
  if (!breed) return null;
  const lower = breed.toLowerCase();

  // Check brachycephalic breeds
  if (['french bulldog', 'pug', 'bulldog', 'boston terrier', 'shih tzu', 'pekingese'].some(b => lower.includes(b))) {
    return modifiers.brachycephalic;
  }
  // Check large breeds
  if (['german shepherd', 'labrador', 'golden retriever', 'rottweiler', 'great dane', 'bernese', 'husky', 'malamute', 'newfoundland', 'saint bernard'].some(b => lower.includes(b))) {
    return modifiers.large_breeds;
  }
  // Check small breeds
  if (['chihuahua', 'pomeranian', 'yorkshire', 'maltese', 'toy poodle', 'miniature', 'dachshund', 'papillon'].some(b => lower.includes(b))) {
    return modifiers.small_breeds;
  }
  // Check high energy breeds
  if (['border collie', 'australian shepherd', 'jack russell', 'vizsla', 'weimaraner', 'dalmatian', 'belgian', 'springer spaniel'].some(b => lower.includes(b))) {
    return modifiers.high_energy;
  }

  return null;
}
