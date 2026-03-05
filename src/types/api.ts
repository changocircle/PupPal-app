/**
 * API request/response types for Edge Functions and external services.
 */

// Breed detection
export interface BreedDetectionRequest {
  imageBase64: string;
}

export interface BreedDetectionResponse {
  breed: string;
  confidence: number;
  alternativeBreeds: Array<{
    breed: string;
    confidence: number;
  }>;
}

// Chat
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ChatRequest {
  message: string;
  dogId: string;
  sessionId: string;
}

// Plan generation
export interface PlanGenerationRequest {
  dogId: string;
}

export interface PlanGenerationResponse {
  planId: string;
  weekCount: number;
  status: "generating" | "complete" | "error";
}

// Gamification events
export interface XpEvent {
  dogId: string;
  source: "exercise" | "chat" | "streak" | "achievement" | "challenge" | "journal";
  amount: number;
  description: string;
}

// Score calculation
export interface ScoreResponse {
  goodBoyScore: number;
  previousScore: number;
  change: number;
  level: number;
  xpToNextLevel: number;
}
