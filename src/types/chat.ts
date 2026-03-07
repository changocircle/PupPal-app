/**
 * Chat Types, PRD-02
 *
 * Data models for AI Mentor Chat (Buddy).
 * Mirrors the PRD-02 §9 data model for when Supabase is wired up.
 */

// ── Chat Message ──
export type MessageRole = "user" | "assistant" | "system";
export type MessageFeedback = "positive" | "negative" | "none";

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  photoUrl?: string;
  createdAt: string; // ISO timestamp
  feedback: MessageFeedback;
  tokensUsed?: number;
  isStreaming?: boolean;
}

// ── Chat Session ──
export type SessionSentiment = "positive" | "neutral" | "frustrated" | "concerned";
export type EscalationType = "medical" | "behavioral" | "emotional" | "none";

export interface ChatSession {
  id: string;
  dogId: string;
  startedAt: string;
  endedAt?: string;
  messageCount: number;
  summary?: string;
  topics?: string[];
  sentiment: SessionSentiment;
  escalationTriggered: boolean;
  escalationType: EscalationType;
}

// ── Conversation Summary (cross-session memory) ──
export interface ConversationSummary {
  id: string;
  sessionId: string;
  summaryText: string;
  keyTopics: string[];
  adviceGiven: string[];
  followUpNeeded: string[];
  createdAt: string;
}

// ── Suggested Prompt ──
export type PromptCategory = "contextual" | "common" | "celebration" | "follow_up";

export interface SuggestedPrompt {
  id: string;
  category: PromptCategory;
  text: string;
  conditions?: {
    minAgeWeeks?: number;
    challengesInclude?: string;
    minPlanWeek?: number;
  };
}

// ── Buddy Expression ──
export type BuddyExpression =
  | "happy"
  | "thoughtful"
  | "excited"
  | "empathetic"
  | "concerned"
  | "playful"
  | "encouraging"
  | "attentive";

// ── Dog context for system prompt ──
/** Summary of a dog in the household (for multi-dog context in chat) */
export interface HouseholdDog {
  name: string;
  breed: string | null;
  ageMonths: number | null;
  challenges: string[];
  isActive: boolean;
}

export interface DogContext {
  dogName: string;
  breed?: string;
  ageWeeks: number;
  developmentalStage: string;
  challenges: string[];
  experienceLevel: string;
  currentPlanWeek: number;
  completedMilestones: string[];
  goodBoyScore: number;
  streakDays: number;
  recentSessions: {
    date: string;
    exercise: string;
    result: string;
  }[];
  /** Whether a training plan has been generated */
  hasPlan: boolean;
  /** Today's assigned exercises from the training plan */
  todayExercises?: { name: string; status: string; category?: string }[];
  /** All dogs in the household (for multi-dog awareness) */
  householdDogs?: HouseholdDog[];
}

// ── Free tier tracking ──
export interface DailyMessageCount {
  date: string; // YYYY-MM-DD
  messagesSent: number;
  messagesLimit: number;
  limitHitAt?: string;
}

// ── Constants ──
// Production: 3 messages/day for free tier (PRD-02 §6)
// Dev: 50 until RevenueCat + Superwall paywall is wired up in Phase 6
export const FREE_MESSAGE_LIMIT = __DEV__ ? 50 : 3;
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_MESSAGES_IN_CONTEXT = 20;
export const SESSION_TIMEOUT_MINUTES = 30;

// Developmental stage lookup
export function getDevelopmentalStage(ageWeeks: number): string {
  if (ageWeeks < 8) return "Early Puppy: critical socialization window opening";
  if (ageWeeks < 12) return "Prime Puppy: peak socialization, foundation skills";
  if (ageWeeks < 16) return "Late Puppy: first fear period possible";
  if (ageWeeks < 26) return "Adolescent: testing boundaries, regression normal";
  if (ageWeeks < 52) return "Young Adult: second fear period possible";
  return "Adult: mature learning, focus on refinement";
}
