/**
 * AI Provider Abstraction — PRD-02 §10
 *
 * Provider-agnostic interface for AI chat.
 * Kimi K2.5 is primary (OpenAI-compatible API).
 * Architecture allows swapping providers by changing config.
 *
 * For development: calls Kimi API directly from client.
 * For production: swap to Supabase Edge Function endpoint.
 */

// ── Provider Interface ──
export interface AIProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIStreamCallbacks {
  onToken: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: Error) => void;
}

// ── Default provider config (Kimi K2.5 / Moonshot) ──
function getProviderConfig(): AIProviderConfig | null {
  const apiKey = process.env.EXPO_PUBLIC_KIMI_API_KEY ?? "";
  const baseUrl =
    process.env.EXPO_PUBLIC_KIMI_BASE_URL ??
    "https://api.moonshot.cn/v1";
  const model = process.env.EXPO_PUBLIC_KIMI_MODEL ?? "moonshot-v1-8k";

  if (!apiKey) return null;

  return {
    apiKey,
    baseUrl,
    model,
    maxTokens: 1024,
    temperature: 0.7,
  };
}

/**
 * Check if a real AI provider is configured.
 */
export function isAIProviderAvailable(): boolean {
  return getProviderConfig() !== null;
}

/**
 * Stream a chat completion from the AI provider.
 *
 * Uses OpenAI-compatible API (works with Kimi, OpenAI, Anthropic-via-proxy, etc.)
 * Streams response token-by-token via SSE.
 * Falls back to non-streaming if SSE parsing fails.
 */
export async function streamChatCompletion(
  systemPrompt: string,
  messages: AIMessage[],
  callbacks: AIStreamCallbacks
): Promise<void> {
  const config = getProviderConfig();
  if (!config) {
    callbacks.onError(new Error("AI provider not configured"));
    return;
  }

  const allMessages: AIMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  try {
    // Try streaming first
    await streamWithSSE(config, allMessages, callbacks);
  } catch (streamError) {
    // Fall back to non-streaming
    console.warn(
      "Streaming not supported, falling back to non-streaming:",
      streamError
    );
    try {
      await nonStreamingFallback(config, allMessages, callbacks);
    } catch (fallbackError) {
      callbacks.onError(
        fallbackError instanceof Error
          ? fallbackError
          : new Error("AI request failed")
      );
    }
  }
}

// ── SSE Streaming Implementation ──
async function streamWithSSE(
  config: AIProviderConfig,
  messages: AIMessage[],
  callbacks: AIStreamCallbacks
): Promise<void> {
  const url = `${config.baseUrl}/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `AI API error ${response.status}: ${errorBody.slice(0, 200)}`
    );
  }

  // Check if we can stream the response body
  const reader = response.body?.getReader();
  if (!reader) {
    // No ReadableStream support — fall back
    throw new Error("ReadableStream not available");
  }

  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events from buffer
      const lines = buffer.split("\n");
      // Keep the last incomplete line in buffer
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (!trimmed.startsWith("data: ")) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            callbacks.onToken(fullText);
          }
        } catch {
          // Skip malformed JSON chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  callbacks.onDone(fullText);
}

// ── Non-Streaming Fallback ──
async function nonStreamingFallback(
  config: AIProviderConfig,
  messages: AIMessage[],
  callbacks: AIStreamCallbacks
): Promise<void> {
  const url = `${config.baseUrl}/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `AI API error ${response.status}: ${errorBody.slice(0, 200)}`
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  if (!content) {
    throw new Error("Empty response from AI provider");
  }

  // Simulate word-by-word streaming for natural feel
  const words = content.split(" ");
  let streamed = "";

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (!word && word !== "") continue;
    streamed += (i > 0 ? " " : "") + word;
    callbacks.onToken(streamed);
    // Small delay for natural rendering
    await new Promise((r) => setTimeout(r, 20 + Math.random() * 25));
  }

  callbacks.onDone(content);
}
