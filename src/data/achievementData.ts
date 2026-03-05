/**
 * Achievement data access helpers — PRD-04 §6
 * Loads 52 achievement definitions and provides lookup functions.
 */

import type {
  Achievement,
  AchievementCategory,
  AchievementRarity,
} from "@/types/gamification";

// Import raw JSON (camelCase conversion at load time)
import rawAchievements from "./achievements.json";

// ── Convert snake_case JSON → camelCase Achievement ──
function convertAchievement(raw: (typeof rawAchievements)[0]): Achievement {
  return {
    slug: raw.slug,
    name: raw.name,
    description: raw.description,
    category: raw.category as AchievementCategory,
    iconName: raw.icon_name,
    xpBonus: raw.xp_bonus,
    triggerType: raw.trigger_type as Achievement["triggerType"],
    triggerConfig: raw.trigger_config as Record<string, unknown>,
    isBreedSpecific: raw.is_breed_specific,
    breedTemplate: raw.breed_template ?? null,
    sortOrder: raw.sort_order,
    buddyMessage: raw.buddy_message,
    shareText: raw.share_text,
    rarity: raw.rarity as AchievementRarity,
    progressLabel: raw.progress_label,
  };
}

// ── All achievements (loaded once) ──
export const ALL_ACHIEVEMENTS: Achievement[] = rawAchievements.map(convertAchievement);

// ── Lookup by slug ──
const achievementMap = new Map<string, Achievement>();
for (const a of ALL_ACHIEVEMENTS) {
  achievementMap.set(a.slug, a);
}

export function getAchievementBySlug(slug: string): Achievement | undefined {
  return achievementMap.get(slug);
}

// ── Filter by category ──
export function getAchievementsByCategory(
  category: AchievementCategory
): Achievement[] {
  return ALL_ACHIEVEMENTS.filter((a) => a.category === category);
}

// ── Get all categories (ordered) ──
export const ACHIEVEMENT_CATEGORIES: {
  key: AchievementCategory;
  label: string;
  emoji: string;
}[] = [
  { key: "training", label: "Training", emoji: "🎯" },
  { key: "streak", label: "Streaks", emoji: "🔥" },
  { key: "score", label: "Good Boy Score", emoji: "⭐" },
  { key: "engagement", label: "Engagement", emoji: "💬" },
  { key: "challenge", label: "Challenges", emoji: "🏆" },
  { key: "tricks", label: "Tricks", emoji: "🎭" },
  { key: "health", label: "Health", emoji: "💊" },
  { key: "breed", label: "Breed", emoji: "🐕" },
  { key: "secret", label: "Secret", emoji: "🔮" },
];

// ── Rarity colors ──
export const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: "#6B7280",
  uncommon: "#5CB882",
  rare: "#5B9BD5",
  epic: "#9B59B6",
  legendary: "#FFB547",
};

// ── Icon mapping (achievement icon_name → emoji fallback) ──
export const ACHIEVEMENT_ICONS: Record<string, string> = {
  "paw-print": "🐾",
  target: "🎯",
  "arrow-down-circle": "⬇️",
  navigation: "🧭",
  clock: "⏰",
  "hand-stop": "✋",
  droplet: "💧",
  "smile-teeth": "😬",
  link: "🔗",
  "home-modern": "🏠",
  "people-group": "🦋",
  globe: "🌍",
  "graduation-cap": "🎓",
  flame: "🔥",
  "flame-bold": "🔥",
  "flame-large": "🔥",
  "calendar-check": "📅",
  lightning: "⚡",
  crown: "👑",
  gem: "💎",
  infinity: "♾️",
  star: "⭐",
  "chart-line-up": "📈",
  "chart-half": "📊",
  "medal-star": "🏅",
  sparkles: "✨",
  trophy: "🏆",
  "chat-bubble": "💬",
  camera: "📸",
  "book-open": "📖",
  "thumbs-up": "👍",
  share: "🔗",
  "user-plus": "👤",
  "users-three": "👥",
  "flag-checkered": "🏁",
  "arrows-clockwise": "🔄",
  "trophy-fill": "🏆",
  "magic-wand": "🪄",
  "star-four": "🌟",
  "cards-three": "🃏",
  "confetti": "🎊",
  "dna": "🧬",
  "certificate": "📜",
  "ranking": "🥇",
  "first-aid": "🩹",
  "heartbeat": "❤️",
  syringe: "💉",
  "shield-check": "🛡️",
  "chart-bar": "📊",
  moon: "🌙",
  "sun-horizon": "🌅",
  "lightning-bolt": "⚡",
};

export function getAchievementEmoji(iconName: string): string {
  return ACHIEVEMENT_ICONS[iconName] ?? "🏅";
}
