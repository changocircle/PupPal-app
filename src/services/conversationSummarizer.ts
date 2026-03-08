/**
 * Conversation Summarizer — PRD-02 §4
 *
 * Generates structured ConversationSummary objects from completed chat sessions.
 * Calls the buddy-chat edge function with action: "summarize" (lightweight Sonnet call).
 *
 * Non-blocking by design — all errors are silently logged, never thrown to caller.
 * Only runs if the session has 3+ messages (to avoid summaries of trivial exchanges).
 */

import type { ChatMessage, ConversationSummary } from "@/types/chat";
import { nanoid } from "nanoid/non-secure";

// ── Provider config (mirrors aiProvider.ts) ──

function getEdgeFunctionConfig(): { endpoint: string; anonKey: string } | null {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!supabaseUrl || !supabaseAnonKey) return null;

  return {
    endpoint: `${supabaseUrl}/functions/v1/buddy-chat`,
    anonKey: supabaseAnonKey,
  };
}

/**
 * Generate a structured summary for a completed chat session.
 *
 * @param sessionId  - The session being summarised
 * @param messages   - All messages from the session (user + assistant)
 * @param dogName    - Active dog's name (for context)
 * @param _dogId     - Active dog's id (stored on the summary for per-dog lookup — not sent to AI)
 * @returns ConversationSummary or null if skipped / an error occurred
 */
export async function generateSessionSummary(
  sessionId: string,
  messages: ChatMessage[],
  dogName: string,
  _dogId: string,
): Promise<ConversationSummary | null> {
  try {
    // Only summarise sessions with meaningful content (3+ non-system messages)
    const chatMessages = messages.filter(
      (m) => m.role !== "system" && m.content.trim() !== "",
    );
    if (chatMessages.length < 3) {
      console.log(
        `[Summarizer] Skipping session ${sessionId} — only ${chatMessages.length} messages`,
      );
      return null;
    }

    const config = getEdgeFunctionConfig();
    if (!config) {
      console.log("[Summarizer] Edge function not configured — skipping summary");
      return null;
    }

    console.log(
      `[Summarizer] Generating summary for session ${sessionId} (${chatMessages.length} messages)`,
    );

    // Format messages for the summarise prompt
    const messagesPayload = chatMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.anonKey}`,
        apikey: config.anonKey,
      },
      body: JSON.stringify({
        action: "summarize",
        messages: messagesPayload,
        dogName,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.warn(
        `[Summarizer] Edge function returned ${response.status}: ${errText.slice(0, 200)}`,
      );
      return null;
    }

    const data = await response.json();

    if (!data.summary) {
      console.warn("[Summarizer] Edge function returned no summary");
      return null;
    }

    // Merge server response with local metadata
    const summary: ConversationSummary = {
      id: nanoid(),
      sessionId,
      summaryText: data.summary.summaryText ?? "",
      keyTopics: Array.isArray(data.summary.keyTopics) ? data.summary.keyTopics : [],
      adviceGiven: Array.isArray(data.summary.adviceGiven) ? data.summary.adviceGiven : [],
      followUpNeeded: Array.isArray(data.summary.followUpNeeded)
        ? data.summary.followUpNeeded
        : [],
      createdAt: new Date().toISOString(),
    };

    console.log(
      `[Summarizer] Summary generated for session ${sessionId}: "${summary.summaryText.slice(0, 80)}..."`,
    );

    return summary;
  } catch (error) {
    // Non-blocking: silently log and return null
    const errMsg = error instanceof Error ? error.message : String(error);
    console.warn("[Summarizer] Failed to generate session summary:", errMsg);
    return null;
  }
}
