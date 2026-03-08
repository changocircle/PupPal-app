/**
 * AI Provider — PRD-02 §10
 *
 * Routes chat requests through the buddy-chat Supabase Edge Function,
 * which proxies to Claude Sonnet 4.6 server-side. API keys never
 * leave the server.
 *
 * Architecture:
 *   Client → Supabase Edge Function (buddy-chat) → Anthropic Claude
 *
 * When EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY are set,
 * calls the Edge Function. Otherwise falls back to mock responses.
 */

// ── Types ──

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIStreamCallbacks {
  onToken: (fullText: string) => void;
  onDone: (fullText: string, meta?: { suggestedPrompts?: string[] }) => void;
  onError: (error: Error) => void;
}

// ── Provider config ──

interface ProviderConfig {
  endpoint: string;
  anonKey: string;
}

function getProviderConfig(): ProviderConfig | null {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!supabaseUrl || !supabaseAnonKey) return null;

  return {
    endpoint: `${supabaseUrl}/functions/v1/buddy-chat`,
    anonKey: supabaseAnonKey,
  };
}

/**
 * Check if the AI provider (Edge Function) is configured.
 */
export function isAIProviderAvailable(): boolean {
  return getProviderConfig() !== null;
}

/**
 * Send a chat completion request through the Edge Function.
 *
 * The Edge Function calls Claude server-side and returns the full response.
 * We simulate word-by-word streaming client-side for a natural typing feel.
 */
export async function streamChatCompletion(
  systemPrompt: string,
  messages: AIMessage[],
  callbacks: AIStreamCallbacks,
  options?: { dogName?: string },
): Promise<void> {
  const config = getProviderConfig();
  if (!config) {
    callbacks.onError(new Error("AI provider not configured"));
    return;
  }

  // Strip system messages from the messages array (system prompt is sent separately)
  const chatMessages = messages.filter(
    (m) => m.role === "user" || m.role === "assistant",
  );

  console.log("[AI] Calling buddy-chat Edge Function");
  console.log("[AI] Messages:", chatMessages.length);
  console.log(
    "[AI] System prompt length:",
    systemPrompt.length,
    "chars (~" + Math.ceil(systemPrompt.length / 4) + " tokens)",
  );

  // Log message roles for debugging
  console.log(
    "[AI] Message roles:",
    chatMessages.map((m) => m.role).join(", "),
  );

  try {
    // 30-second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.anonKey}`,
        apikey: config.anonKey,
      },
      body: JSON.stringify({
        systemPrompt,
        messages: chatMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        maxTokens: 120,
        dogName: options?.dogName,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    console.log("[AI] Response status:", response.status);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error("[AI] Edge Function error:", response.status, errorBody);

      // Parse structured error if available
      try {
        const errorJson = JSON.parse(errorBody);
        if (errorJson.error) {
          throw new Error(errorJson.error);
        }
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message !== errorBody) {
          throw parseErr;
        }
      }

      throw new Error(
        `Chat request failed (${response.status}): ${errorBody.slice(0, 200)}`,
      );
    }

    const data = await response.json();

    console.log("[AI] Response content length:", data.content?.length ?? 0);
    console.log(
      "[AI] Token usage:",
      data.usage?.input_tokens,
      "in /",
      data.usage?.output_tokens,
      "out",
    );
    console.log("[AI] Stop reason:", data.stop_reason);

    const content: string = data.content ?? "";

    if (!content) {
      console.error("[AI] Empty response from Edge Function:", JSON.stringify(data).slice(0, 300));
      throw new Error("Empty response from AI");
    }

    // Simulate word-by-word streaming for natural typing feel
    const words = content.split(" ");
    let streamed = "";

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!word && word !== "") continue;
      streamed += (i > 0 ? " " : "") + word;
      callbacks.onToken(streamed);
      // Natural typing cadence: slower after punctuation
      const delay =
        word.endsWith(".") || word.endsWith("!") || word.endsWith("?")
          ? 60 + Math.random() * 40
          : 15 + Math.random() * 20;
      await new Promise((r) => setTimeout(r, delay));
    }

    // Pass suggested prompts from edge function response
    const suggestedPrompts: string[] = Array.isArray(data.suggestedPrompts)
      ? data.suggestedPrompts.filter((s: unknown) => typeof s === "string").slice(0, 4)
      : [];

    callbacks.onDone(content, { suggestedPrompts });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[AI] Request timed out after 30s");
      callbacks.onError(new Error("Request timed out. Please try again."));
      return;
    }

    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[AI] Request failed:", errMsg);
    callbacks.onError(
      error instanceof Error ? error : new Error("AI request failed"),
    );
  }
}
