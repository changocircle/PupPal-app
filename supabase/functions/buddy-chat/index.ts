/**
 * Buddy Chat Edge Function — PRD-02
 *
 * Server-side proxy to Anthropic Claude Sonnet 4.6 for Buddy AI chat.
 * Keeps ANTHROPIC_API_KEY server-side (never exposed to client).
 *
 * Client sends: { systemPrompt, messages, maxTokens? }
 * Function returns: { content, model, usage, stop_reason }
 *
 * Deploy:
 *   supabase functions deploy buddy-chat --project-ref klttrrdyplsemqiudfvf
 *
 * Required secrets (set via Supabase Dashboard → Edge Functions → Secrets):
 *   ANTHROPIC_API_KEY
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 500;

// Server-side word limit prepended to every system prompt.
// This enforces brevity even if the client prompt is verbose.
const WORD_LIMIT_PREFIX =
  "HARD LIMIT: Maximum 80 words per response. Count them. " +
  "If you need to say more, ask a follow-up question instead. " +
  "This is a mobile chat, not an email.\n\n";
const ANTHROPIC_VERSION = "2023-06-01";

// ── CORS headers (allow Expo/React Native clients) ──
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Rate limiting (simple per-IP, resets each function cold start) ──
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 20; // 20 requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// ── Content moderation (basic keyword check) ──
const BLOCKED_PATTERNS = [
  /ignore.*(?:previous|above|system).*(?:instructions|prompt)/i,
  /you are now/i,
  /new persona/i,
  /jailbreak/i,
];

function isContentBlocked(text: string): boolean {
  return BLOCKED_PATTERNS.some((p) => p.test(text));
}

// ── Request/response types ──
interface ChatRequest {
  systemPrompt: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens?: number;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{ type: string; text: string }>;
  model: string;
  stop_reason: string;
  usage: { input_tokens: number; output_tokens: number };
}

serve(async (req: Request) => {
  // ── CORS preflight ──
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ── Only POST ──
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Check API key is configured ──
  if (!ANTHROPIC_API_KEY) {
    console.error("[buddy-chat] ANTHROPIC_API_KEY not set in secrets");
    return new Response(
      JSON.stringify({ error: "AI provider not configured on server" }),
      {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // ── Rate limiting ──
  const clientIP =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(clientIP)) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Try again in a minute." }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": "60",
        },
      },
    );
  }

  try {
    // ── Parse request ──
    const body: ChatRequest = await req.json();
    const { systemPrompt, messages, maxTokens = DEFAULT_MAX_TOKENS } = body;

    if (!systemPrompt || !messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid request. Required: { systemPrompt: string, messages: Array }",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ── Content moderation ──
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg && isContentBlocked(lastUserMsg.content)) {
      return new Response(
        JSON.stringify({
          content:
            "I'm here to help with dog training and care! What can I help you with today? 🐾",
          model: MODEL,
          usage: { input_tokens: 0, output_tokens: 0 },
          stop_reason: "content_filter",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ── Sanitize messages (Anthropic requires alternating user/assistant) ──
    const sanitizedMessages = sanitizeMessages(messages);

    // Prepend server-side word limit to system prompt
    const finalSystemPrompt = WORD_LIMIT_PREFIX + systemPrompt;

    console.log(
      `[buddy-chat] Request: ${sanitizedMessages.length} messages, ` +
        `system prompt ~${Math.ceil(finalSystemPrompt.length / 4)} tokens, ` +
        `max_tokens=${maxTokens}`,
    );

    // ── Call Anthropic Messages API ──
    const anthropicResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: maxTokens,
          system: finalSystemPrompt,
          messages: sanitizedMessages,
        }),
      },
    );

    // ── Handle Anthropic errors ──
    if (!anthropicResponse.ok) {
      const errorBody = await anthropicResponse.text();
      console.error(
        `[buddy-chat] Anthropic error ${anthropicResponse.status}:`,
        errorBody.slice(0, 500),
      );

      // Map Anthropic errors to user-friendly messages
      const status = anthropicResponse.status;
      if (status === 401) {
        return new Response(
          JSON.stringify({ error: "AI provider authentication failed" }),
          {
            status: 503,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (status === 429) {
        return new Response(
          JSON.stringify({
            error: "AI provider rate limited. Try again in a moment.",
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "Retry-After": "10",
            },
          },
        );
      }
      if (status === 529) {
        return new Response(
          JSON.stringify({
            error: "AI provider is temporarily overloaded. Try again shortly.",
          }),
          {
            status: 503,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          error: `AI provider error (${status})`,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ── Parse response ──
    const data: AnthropicResponse = await anthropicResponse.json();
    const content =
      data.content
        ?.filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n") ?? "";

    console.log(
      `[buddy-chat] Response: ${content.length} chars, ` +
        `${data.usage?.input_tokens ?? "?"}+${data.usage?.output_tokens ?? "?"} tokens, ` +
        `stop=${data.stop_reason}`,
    );

    if (!content) {
      console.error(
        "[buddy-chat] Empty content from Anthropic. Full response:",
        JSON.stringify(data).slice(0, 500),
      );
      return new Response(
        JSON.stringify({
          error: "AI returned empty response",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ── Return structured response ──
    return new Response(
      JSON.stringify({
        content,
        model: data.model,
        usage: data.usage,
        stop_reason: data.stop_reason,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[buddy-chat] Unhandled error:", errMsg);

    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

/**
 * Sanitize messages for Anthropic API:
 * - Remove empty-content messages
 * - Ensure conversation starts with a user message
 * - Merge consecutive same-role messages (Anthropic requires alternating)
 */
function sanitizeMessages(
  messages: Array<{ role: string; content: string }>,
): Array<{ role: "user" | "assistant"; content: string }> {
  // Filter out empty messages and system messages
  const filtered = messages.filter(
    (m) =>
      m.content.trim() !== "" &&
      (m.role === "user" || m.role === "assistant"),
  ) as Array<{ role: "user" | "assistant"; content: string }>;

  if (filtered.length === 0) return [];

  // Ensure first message is from user
  const startIdx = filtered.findIndex((m) => m.role === "user");
  if (startIdx === -1) return [];
  const trimmed = filtered.slice(startIdx);

  // Merge consecutive same-role messages
  const merged: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const msg of trimmed) {
    const last = merged[merged.length - 1];
    if (last && last.role === msg.role) {
      last.content += "\n\n" + msg.content;
    } else {
      merged.push({ ...msg });
    }
  }

  return merged;
}
