/**
 * Vaccine Extract Edge Function — Vaccination Setup
 *
 * Accepts up to 5 base64 images of vet vaccination records.
 * Uses Claude Sonnet 4.6 vision to extract vaccine names, dates,
 * and dose numbers. Returns structured JSON for the client to
 * match against known vaccine templates.
 *
 * Deploy:
 *   supabase functions deploy vaccine-extract --project-ref klttrrdyplsemqiudfvf
 *
 * Required secrets (set via Supabase Dashboard → Edge Functions → Secrets):
 *   ANTHROPIC_API_KEY
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1500;
const ANTHROPIC_VERSION = "2023-06-01";
const MAX_IMAGES = 5;

// ── CORS headers ──
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Rate limiting (per-IP, resets on cold start) ──
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10; // Lower than chat — extraction is heavier

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

// ── Extraction prompt ──
const EXTRACTION_PROMPT = `You are a veterinary record reader. Analyze the uploaded image(s) of vaccination records and extract all vaccine information you can find.

Return ONLY valid JSON in this exact format:
{
  "vaccines": [
    {
      "name": "DHPP",
      "date": "2025-08-15",
      "doseNumber": 1,
      "vetClinic": "Happy Paws Vet"
    }
  ],
  "confidence": "high",
  "notes": "Any relevant observations about the record"
}

Rules:
- Normalize vaccine names to standard abbreviations: DHPP, Rabies, Bordetella, Leptospirosis, Lyme, Canine Influenza
- DHPP also known as: DA2PP, DAPP, DHLPP, Distemper combo, 5-in-1, 4-in-1
- Dates in ISO format (YYYY-MM-DD). If only month/year visible, use the 1st of the month.
- If a dose number isn't explicit, infer from dates and typical schedules (e.g., first DHPP at 6-8 weeks = dose 1)
- confidence: "high" if text is clear, "medium" if some parts unclear, "low" if mostly guessing
- If the image is NOT a vaccination record, return: {"vaccines": [], "confidence": "low", "notes": "This doesn't appear to be a vaccination record."}
- Combine information from all images into one unified list. Deduplicate if the same vaccine appears on multiple pages.`;

// ── Types ──
interface ExtractRequest {
  images: string[]; // base64 strings
}

interface ExtractedVaccine {
  name: string;
  date: string;
  doseNumber: number;
  vetClinic?: string;
}

serve(async (req: Request) => {
  // ── CORS preflight ──
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Check API key ──
  if (!ANTHROPIC_API_KEY) {
    console.error("[vaccine-extract] ANTHROPIC_API_KEY not set in secrets");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // ── Rate limit ──
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait a moment." }),
      {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const body: ExtractRequest = await req.json();

    // ── Validate ──
    if (!body.images || !Array.isArray(body.images) || body.images.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one image is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (body.images.length > MAX_IMAGES) {
      return new Response(
        JSON.stringify({ error: `Maximum ${MAX_IMAGES} images allowed` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ── Build multi-image content array ──
    const contentBlocks: Array<
      | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
      | { type: "text"; text: string }
    > = [];

    for (const imageBase64 of body.images) {
      // Detect media type from base64 header or default to jpeg
      let mediaType = "image/jpeg";
      if (imageBase64.startsWith("/9j/")) mediaType = "image/jpeg";
      else if (imageBase64.startsWith("iVBOR")) mediaType = "image/png";
      else if (imageBase64.startsWith("JVBER")) mediaType = "application/pdf";

      contentBlocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType,
          data: imageBase64,
        },
      });
    }

    contentBlocks.push({
      type: "text",
      text: EXTRACTION_PROMPT,
    });

    // ── Call Anthropic ──
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages: [{ role: "user", content: contentBlocks }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text().catch(() => "");
      console.error(
        `[vaccine-extract] Anthropic ${anthropicRes.status}: ${errText.substring(0, 300)}`,
      );
      return new Response(
        JSON.stringify({ error: "AI extraction failed. Please try again." }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const aiResponse = await anthropicRes.json();
    const rawText = aiResponse.content?.[0]?.text ?? "";

    // ── Parse JSON from response ──
    let extracted: { vaccines: ExtractedVaccine[]; confidence: string; notes: string };
    try {
      // Claude sometimes wraps JSON in markdown code blocks
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      extracted = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("[vaccine-extract] Failed to parse AI response:", rawText.substring(0, 500));
      return new Response(
        JSON.stringify({
          vaccines: [],
          confidence: "low",
          notes: "Could not read the document. Please try a clearer photo.",
          usage: aiResponse.usage,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        ...extracted,
        usage: aiResponse.usage,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return new Response(
        JSON.stringify({ error: "Request timed out. Please try again." }),
        {
          status: 504,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    console.error("[vaccine-extract] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
