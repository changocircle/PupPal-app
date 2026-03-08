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
const DEFAULT_MAX_TOKENS = 2048;
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
  /** Dog name for personalising suggested follow-ups */
  dogName?: string;
}

interface SummarizeRequest {
  action: "summarize";
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  dogName?: string;
}

/** Schema the summarise action must return as JSON */
interface SummarySchema {
  summaryText: string;
  keyTopics: string[];
  adviceGiven: string[];
  followUpNeeded: string[];
  emotionalTone: string;
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
    const body: ChatRequest & Partial<SummarizeRequest> = await req.json();

    // ── Summarize action (lightweight, non-streaming) ──
    if (body.action === "summarize") {
      return await handleSummarize(body as SummarizeRequest);
    }

    const { systemPrompt, messages, maxTokens = DEFAULT_MAX_TOKENS, dogName } = body as ChatRequest;

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

    console.log(
      `[buddy-chat] Request: ${sanitizedMessages.length} messages, ` +
        `system prompt ~${Math.ceil(systemPrompt.length / 4)} tokens, ` +
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
          system: systemPrompt,
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

    // Log truncation warning if model hit token limit
    if (data.stop_reason === "max_tokens") {
      console.warn(
        `[buddy-chat] Response truncated by max_tokens (${maxTokens}). ` +
          `Output: ${data.usage?.output_tokens ?? "?"} tokens. Consider increasing limit.`,
      );
    }

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

    // ── Generate dynamic suggested prompts based on Buddy's response ──
    let suggestedPrompts: string[] = [];
    try {
      const nameStr = dogName || "the dog";
      const suggestionsRes = await fetch(
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
            max_tokens: 200,
            system: `Generate 3-4 short follow-up prompts (max 8 words each) that a user would naturally tap after this AI dog trainer response. The dog's name is "${nameStr}".

Rules:
- Each prompt should be a DIRECT response or natural follow-up to what the AI just said
- If the AI asked a question, prompts should be possible answers to that question
- If the AI gave training advice, prompts should be reactions or next steps
- Use the dog's name naturally
- Keep them conversational and specific, NOT generic
- Return ONLY a JSON array of strings, nothing else

Example: If AI asks "Does ${nameStr} pull on the leash, get distracted, or something else?"
Return: ["${nameStr} pulls hard", "Gets distracted by other dogs", "Lunges at things", "A bit of everything"]`,
            messages: [
              {
                role: "user",
                content: `AI trainer's last response:\n"${content.slice(0, 500)}"`,
              },
            ],
          }),
        },
      );

      if (suggestionsRes.ok) {
        const sugData = await suggestionsRes.json();
        const sugText =
          sugData.content?.find((b: { type: string }) => b.type === "text")
            ?.text ?? "";
        const parsed = JSON.parse(
          sugText.match(/\[[\s\S]*\]/)?.[0] ?? "[]",
        );
        if (Array.isArray(parsed) && parsed.length > 0) {
          suggestedPrompts = parsed
            .filter((s: unknown) => typeof s === "string")
            .slice(0, 4);
        }
      }
    } catch (sugErr) {
      console.warn("[buddy-chat] Suggestion generation failed:", sugErr);
      // Non-fatal: return response without suggestions
    }

    // ── Return structured response ──
    return new Response(
      JSON.stringify({
        content,
        model: data.model,
        usage: data.usage,
        stop_reason: data.stop_reason,
        suggestedPrompts,
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

// ──────────────────────────────────────────────
// Summarize action handler
// ──────────────────────────────────────────────

async function handleSummarize(req: SummarizeRequest): Promise<Response> {
  const { messages, dogName = "the dog" } = req;

  // Fail-safe wrapper: always return 200 with { summary: null } on any error
  try {
    if (!messages || !Array.isArray(messages) || messages.length < 3) {
      console.log("[buddy-chat/summarize] Skipping — insufficient messages");
      return new Response(JSON.stringify({ summary: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUMMARIZE_SYSTEM = `You are summarizing a dog training chat session for ${dogName}. Output ONLY valid JSON matching this exact schema, no markdown, no explanation:
{ "summaryText": string, "keyTopics": string[], "adviceGiven": string[], "followUpNeeded": string[], "emotionalTone": string }

Rules:
- summaryText: 1-2 sentence plain-English summary of what was discussed
- keyTopics: array of 1-4 short topic strings (e.g. "leash pulling", "crate training")
- adviceGiven: array of 1-4 short strings describing advice or techniques recommended
- followUpNeeded: array of 0-3 short strings for things to check on next time (can be empty [])
- emotionalTone: one of "positive", "neutral", "frustrated", "concerned", "celebratory"`;

    const sanitized = sanitizeMessages(messages);
    if (sanitized.length === 0) {
      return new Response(JSON.stringify({ summary: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(
      `[buddy-chat/summarize] Summarizing ${sanitized.length} messages for "${dogName}"`,
    );

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        system: SUMMARIZE_SYSTEM,
        messages: sanitized,
      }),
    });

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text().catch(() => "");
      console.warn(
        `[buddy-chat/summarize] Anthropic error ${anthropicResponse.status}: ${errText.slice(0, 300)}`,
      );
      return new Response(JSON.stringify({ summary: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await anthropicResponse.json();
    const rawText: string =
      data.content?.filter((b: { type: string }) => b.type === "text")
        .map((b: { text: string }) => b.text)
        .join("") ?? "";

    // Parse JSON from response (be tolerant of stray whitespace)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("[buddy-chat/summarize] Could not extract JSON from response:", rawText.slice(0, 200));
      return new Response(JSON.stringify({ summary: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed: SummarySchema = JSON.parse(jsonMatch[0]);

    // Validate and normalise fields
    const summary: SummarySchema = {
      summaryText: typeof parsed.summaryText === "string" ? parsed.summaryText : "",
      keyTopics: Array.isArray(parsed.keyTopics) ? parsed.keyTopics : [],
      adviceGiven: Array.isArray(parsed.adviceGiven) ? parsed.adviceGiven : [],
      followUpNeeded: Array.isArray(parsed.followUpNeeded) ? parsed.followUpNeeded : [],
      emotionalTone: typeof parsed.emotionalTone === "string" ? parsed.emotionalTone : "neutral",
    };

    console.log(
      `[buddy-chat/summarize] Done. tone=${summary.emotionalTone}, topics=${summary.keyTopics.join(", ")}`,
    );

    return new Response(JSON.stringify({ summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn("[buddy-chat/summarize] Unhandled error:", errMsg);
    // Never let summarization crash the function
    return new Response(JSON.stringify({ summary: null }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

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
