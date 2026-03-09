/**
 * breed-classify — Supabase Edge Function
 *
 * Fast primary classifier using HuggingFace Inference API.
 * Uses nickmuchi/vit-finetuned-dog-classifier (ViT fine-tuned on 120 Stanford Dogs breeds).
 *
 * Flow: client -> breed-classify (HuggingFace, fast) -> breed-detect (Sonnet, reasoning)
 *
 * Accepts: { imageBase64: string, mimeType?: string }
 * Returns: { predictions: [{ breed: string, confidence: number }] }
 *
 * Rate limit: 10/min/IP
 * Auth: none — rate limiting only (10/min/IP). Runs pre-auth during onboarding.
 *
 * Required secrets:
 *   HUGGINGFACE_API_KEY  (optional — falls back to unauthenticated free tier)
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Rate limiting (per-IP, resets on cold start) ──
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

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

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── HuggingFace model config ──
// nickmuchi/vit-finetuned-dog-classifier: ViT fine-tuned on Stanford Dogs 120 breeds
// Fallback: Falconsai/dog-breed-identification (broader but less accurate)
const HF_MODEL_PRIMARY = "nickmuchi/vit-finetuned-dog-classifier";
const HF_MODEL_FALLBACK = "Falconsai/dog-breed-identification";
const HF_TIMEOUT_MS = 15_000;

/** Top-N predictions to return to the client */
const TOP_N = 3;

export interface ClassifierPrediction {
  breed: string;
  confidence: number; // 0-100 integer
  rawLabel: string;   // original HF label (for debugging)
}

/**
 * Normalize HuggingFace label to a human-readable breed name.
 * HF labels are often in format "n02085620-Chihuahua" or "golden_retriever".
 */
function normalizeBreedLabel(label: string): string {
  // Strip leading synset/number prefix e.g. "n02085620-"
  let name = label.replace(/^n\d+-/, "");

  // Replace underscores and hyphens with spaces
  name = name.replace(/[_-]/g, " ");

  // Title case each word
  name = name
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  // Common rename corrections for ViT labels
  const corrections: Record<string, string> = {
    "Golden Retriever": "Golden Retriever",
    "Labrador Retriever": "Labrador Retriever",
    "German Shepherd Dog": "German Shepherd",
    "Yorkshire Terrier": "Yorkshire Terrier",
    "French Bulldog": "French Bulldog",
    "Pembroke Welsh Corgi": "Pembroke Welsh Corgi",
    "Siberian Husky": "Siberian Husky",
    "Border Collie": "Border Collie",
    "Australian Shepherd": "Australian Shepherd",
    "Shih Tzu": "Shih Tzu",
    "Miniature Poodle": "Miniature Poodle",
    "Standard Poodle": "Standard Poodle",
    "Toy Poodle": "Toy Poodle",
  };

  return corrections[name] ?? name;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  // ── No JWT verification ──
  // breed-classify runs during onboarding before the user signs in.
  // The Supabase client always sends Authorization: Bearer <anon_key> which
  // is not a user token and would always fail verification.
  // Rate limiting (10/min/IP) is the abuse protection layer.
  // buddy-chat enforces mandatory JWT (post-auth only).
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  // ── Rate limiting ──
  const clientIP =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(clientIP)) {
    return new Response(
      JSON.stringify({ predictions: [], error: "Rate limit exceeded. Try again in a minute." }),
      {
        status: 429,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
          "Retry-After": "60",
        },
      },
    );
  }

  try {
    const body = await req.json();

    const imageBase64: string = body.imageBase64 ?? "";
    if (!imageBase64 || imageBase64.length < 100) {
      return new Response(
        JSON.stringify({ predictions: [], error: "Missing imageBase64" }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    // Strip data URI prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    // Convert base64 to binary for HuggingFace (it expects binary image data)
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Determine content type
    const mimeType: string = body.mimeType ?? detectMimeType(base64Data);

    const hfApiKey = Deno.env.get("HUGGINGFACE_API_KEY") ?? "";
    const hfHeaders: Record<string, string> = {
      "Content-Type": mimeType,
    };
    if (hfApiKey) {
      hfHeaders["Authorization"] = `Bearer ${hfApiKey}`;
    }

    // Try primary model, fall back to secondary on error
    let hfResult = await callHuggingFace(HF_MODEL_PRIMARY, bytes, hfHeaders);
    if (!hfResult.ok) {
      console.warn(`[breed-classify] Primary model failed (${hfResult.status}), trying fallback`);
      hfResult = await callHuggingFace(HF_MODEL_FALLBACK, bytes, hfHeaders);
    }

    if (!hfResult.ok) {
      const errText = await hfResult.text().catch(() => "");
      console.error("[breed-classify] Both HF models failed:", hfResult.status, errText.substring(0, 300));
      // Return empty predictions, not an error — Sonnet will do full analysis
      return new Response(
        JSON.stringify({ predictions: [], classifierAvailable: false }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    const hfData = await hfResult.json();

    // HF image classification returns array of { label, score }
    if (!Array.isArray(hfData) || hfData.length === 0) {
      console.warn("[breed-classify] Unexpected HF response:", JSON.stringify(hfData).substring(0, 200));
      return new Response(
        JSON.stringify({ predictions: [], classifierAvailable: false }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    // Parse and normalize top-N predictions
    const predictions: ClassifierPrediction[] = hfData
      .slice(0, TOP_N)
      .map((item: { label: string; score: number }) => ({
        breed: normalizeBreedLabel(item.label),
        confidence: Math.round(item.score * 100),
        rawLabel: item.label,
      }));

    console.log(
      "[breed-classify] Top predictions:",
      predictions.map((p) => `${p.breed} (${p.confidence}%)`).join(", "),
    );

    return new Response(
      JSON.stringify({ predictions, classifierAvailable: true }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("[breed-classify] Error:", err);
    // Return empty predictions on error — breed-detect will handle full analysis
    return new Response(
      JSON.stringify({ predictions: [], classifierAvailable: false }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }
});

/** Call HuggingFace Inference API with timeout */
async function callHuggingFace(
  model: string,
  imageBytes: Uint8Array,
  headers: Record<string, string>,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HF_TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: "POST",
        headers,
        body: imageBytes,
        signal: controller.signal,
      },
    );
    clearTimeout(timeout);
    return res;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

/** Detect MIME type from base64 magic bytes */
function detectMimeType(base64: string): string {
  if (base64.startsWith("iVBOR")) return "image/png";
  if (base64.startsWith("R0lGOD")) return "image/gif";
  if (base64.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}
