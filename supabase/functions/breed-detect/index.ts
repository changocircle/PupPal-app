/**
 * breed-detect — Supabase Edge Function
 *
 * Accepts 1–3 base64 images, sends to Anthropic Claude (vision),
 * and returns top 3 breed predictions with confidence.
 * Supports multi-photo for cross-referencing features across angles.
 *
 * PRD-01 Screen 3: Photo Upload + Breed Detection
 *
 * Required secret: ANTHROPIC_API_KEY
 * Set in: Supabase Dashboard → Edge Functions → Secrets
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Rate limiting (per-IP, resets on cold start) ──
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute per IP (vision + multi-photo is heavy)

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

// ─── Known dog breeds (AKC + common mixes) ───

const DOG_BREEDS: string[] = [
  "Affenpinscher","Afghan Hound","Airedale Terrier","Akita","Alaskan Malamute",
  "American Bulldog","American Cocker Spaniel","American English Coonhound",
  "American Eskimo Dog","American Foxhound","American Pit Bull Terrier",
  "American Staffordshire Terrier","American Water Spaniel","Anatolian Shepherd Dog",
  "Australian Cattle Dog","Australian Shepherd","Australian Terrier",
  "Basenji","Basset Hound","Beagle","Bearded Collie","Beauceron",
  "Bedlington Terrier","Belgian Malinois","Belgian Sheepdog","Belgian Tervuren",
  "Bernese Mountain Dog","Bichon Frise","Black and Tan Coonhound",
  "Black Russian Terrier","Bloodhound","Blue Heeler","Bluetick Coonhound",
  "Border Collie","Border Terrier","Borzoi","Boston Terrier",
  "Bouvier des Flandres","Boxer","Boykin Spaniel","Briard",
  "Brittany","Brittany Spaniel","Brussels Griffon","Bull Terrier",
  "Bulldog","Bullmastiff","Cairn Terrier","Canaan Dog",
  "Cane Corso","Cardigan Welsh Corgi","Cavalier King Charles Spaniel",
  "Chesapeake Bay Retriever","Chihuahua","Chinese Crested","Chinese Shar-Pei",
  "Chinook","Chow Chow","Clumber Spaniel","Cockapoo","Cocker Spaniel",
  "Collie","Corgi","Coton de Tulear","Dachshund","Dalmatian",
  "Dandie Dinmont Terrier","Doberman Pinscher","Dogo Argentino",
  "Dogue de Bordeaux","Dutch Shepherd","English Bulldog","English Cocker Spaniel",
  "English Foxhound","English Setter","English Springer Spaniel",
  "English Toy Spaniel","Entlebucher Mountain Dog","Field Spaniel",
  "Finnish Lapphund","Finnish Spitz","Flat-Coated Retriever",
  "French Bulldog","German Pinscher","German Shepherd","German Shorthaired Pointer",
  "German Wirehaired Pointer","Giant Schnauzer","Glen of Imaal Terrier",
  "Goldador","Golden Retriever","Goldendoodle","Gordon Setter",
  "Great Dane","Great Pyrenees","Greater Swiss Mountain Dog","Greyhound",
  "Harrier","Havanese","Ibizan Hound","Icelandic Sheepdog",
  "Irish Red and White Setter","Irish Setter","Irish Terrier",
  "Irish Water Spaniel","Irish Wolfhound","Italian Greyhound",
  "Jack Russell Terrier","Japanese Chin","Japanese Spitz","Keeshond",
  "Kerry Blue Terrier","Komondor","Kuvasz","Labradoodle",
  "Labrador Retriever","Lagotto Romagnolo","Lakeland Terrier",
  "Lancashire Heeler","Leonberger","Lhasa Apso","Lowchen",
  "Maltese","Maltipoo","Manchester Terrier","Maremma Sheepdog",
  "Mastiff","Miniature American Shepherd","Miniature Bull Terrier",
  "Miniature Pinscher","Miniature Poodle","Miniature Schnauzer",
  "Morkie","Mudi","Neapolitan Mastiff","Newfoundland",
  "Norfolk Terrier","Norwegian Buhund","Norwegian Elkhound",
  "Norwegian Lundehund","Norwich Terrier","Nova Scotia Duck Tolling Retriever",
  "Old English Sheepdog","Otterhound","Papillon","Peekapoo",
  "Pekingese","Pembroke Welsh Corgi","Petit Basset Griffon Vendeen",
  "Pharaoh Hound","Plott Hound","Pointer","Pomapoo","Pomeranian",
  "Pomsky","Poodle","Portugese Water Dog","Portuguese Water Dog","Pug",
  "Puggle","Puli","Pumi","Pyrenean Shepherd",
  "Rat Terrier","Redbone Coonhound","Rhodesian Ridgeback",
  "Rottweiler","Russell Terrier","Saint Bernard","Saluki",
  "Samoyed","Schipperke","Schnoodle","Scottish Deerhound",
  "Scottish Terrier","Sealyham Terrier","Shetland Sheepdog","Shiba Inu",
  "Shih Tzu","Shih-Poo","Siberian Husky","Silky Terrier",
  "Skye Terrier","Sloughi","Smooth Fox Terrier","Soft Coated Wheaten Terrier",
  "Spanish Water Dog","Spinone Italiano","Staffordshire Bull Terrier",
  "Standard Poodle","Standard Schnauzer","Sussex Spaniel",
  "Swedish Vallhund","Tibetan Mastiff","Tibetan Spaniel","Tibetan Terrier",
  "Toy Fox Terrier","Toy Poodle","Treeing Walker Coonhound",
  "Vizsla","Weimaraner","Welsh Springer Spaniel","Welsh Terrier",
  "West Highland White Terrier","Westie","Whippet",
  "Wire Fox Terrier","Wirehaired Pointing Griffon","Wirehaired Vizsla",
  "Xoloitzcuintli","Yorkie","Yorkshire Terrier","Yorkipoo",
];

// Pre-compute lowercase set for validation
const BREED_SET = new Set(DOG_BREEDS.map((b) => b.toLowerCase()));

// Map for canonical casing lookup
const BREED_CANONICAL = new Map<string, string>();
for (const breed of DOG_BREEDS) {
  BREED_CANONICAL.set(breed.toLowerCase(), breed);
}

interface BreedResult {
  name: string;
  confidence: number;
}

/**
 * Find the closest matching canonical breed name.
 * Returns the canonical name or the original if no match found.
 */
function matchToCanonicalBreed(name: string): string {
  const lower = name.toLowerCase().trim();

  // Direct match
  if (BREED_CANONICAL.has(lower)) return BREED_CANONICAL.get(lower)!;

  // Check if any known breed is contained within or contains the name
  for (const [key, canonical] of BREED_CANONICAL) {
    if (lower.includes(key) || key.includes(lower)) {
      return canonical;
    }
  }

  // No match — return as-is (Claude's answer is still useful)
  return name.trim();
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Timeout for the Anthropic API call (generous for multi-image + reasoning) */
const ANTHROPIC_TIMEOUT_MS = 30_000;

// ── Hybrid classifier support ──

interface ClassifierPrediction {
  breed: string;
  confidence: number;
}

function buildHybridPromptSingle(predictions: ClassifierPrediction[]): string {
  const predList = predictions.map((p, i) => `${i + 1}. ${p.breed} - ${p.confidence}%`).join("\n");
  return `You are an expert veterinary breed identification specialist with 20+ years of experience.

A fast image classifier analyzed this photo and identified these top possibilities:
${predList}

Validate, refine, and reason about these predictions using your own visual analysis.

STEP 1 - SIZE ESTIMATION: Estimate size from environmental clues (furniture, hands, doorways). Small toy breeds should NEVER be top result if the dog appears medium or large.

STEP 2 - PHYSICAL FEATURES: size, leg length, snout, ears, coat, tail, body proportions.

STEP 3 - VALIDATE CLASSIFIER: Do predictions match what you see? Confirm or override based on size, coat, face shape, proportions. If inconsistent traits suggest a mix, determine the breeds.

STEP 4 - FINAL DETERMINATION:

SINGLE-PHOTO CONFIDENCE CAP: Maximum confidence is 65. Do not exceed.

Return JSON only:
{
  "reasoning": "Classifier suggested X. Visual analysis confirms/overrides because...",
  "breeds": [
    { "name": "Breed Name", "confidence": 60 },
    { "name": "Second Breed", "confidence": 30 },
    { "name": "Third Breed", "confidence": 10 }
  ]
}

Mixed breed: { "name": "Mixed Breed (Lab / Shepherd mix)", "confidence": 65 }

Rules: exactly 3 breeds, confidence integers 0-100 summing to ~100, max 65, standard AKC names, JSON only.`;
}

function buildHybridPromptMulti(predictions: ClassifierPrediction[]): string {
  const predList = predictions.map((p, i) => `${i + 1}. ${p.breed} - ${p.confidence}%`).join("\n");
  return `You are an expert veterinary breed identification specialist with 20+ years of experience. Multiple photos of the SAME dog from different angles.

A fast image classifier identified these top possibilities:
${predList}

Validate and refine using visual analysis across all photos.

STEP 0 - VERIFY SAME DOG: If images show different dogs, return ONLY:
{ "error": "different_dogs", "message": "These look like different dogs. Please upload photos of the same pup!" }

STEP 1 - SIZE ESTIMATION across all photos.
STEP 2 - OBSERVE EACH PHOTO: size, snout, ears, coat, tail, proportions.
STEP 3 - CROSS-REFERENCE features from all angles.
STEP 4 - VALIDATE CLASSIFIER: Confirm or override predictions. Multiple angles allow higher confidence.

MULTI-PHOTO CONFIDENCE: Up to 85 when features are consistent across all angles.

Return JSON only:
{
  "reasoning": "...",
  "breeds": [
    { "name": "Breed Name", "confidence": 80 },
    { "name": "Second Breed", "confidence": 15 },
    { "name": "Third Breed", "confidence": 5 }
  ]
}

Rules: if different dogs, return error JSON only. Max confidence 85. Exactly 3 breeds. JSON only.`;
}

const BREED_PROMPT_SINGLE = `You are an expert veterinary breed identification specialist with 20+ years of experience.

STEP 1 — SIZE ESTIMATION (most critical discriminating factor):
Before examining any other feature, estimate the dog's size using environmental context clues:
- Furniture scale (sofa cushion height, chair leg thickness)
- Human hands, arms, or body parts visible near the dog
- Leash thickness and length proportion
- Floor tiles, door frames, or doorways in the background
- Any other objects with known approximate dimensions

Size reference points:
- A Pomeranian weighs 3-7 lbs and stands 6-7 inches at the shoulder.
- A Chihuahua weighs 2-6 lbs.
- A Yorkshire Terrier weighs 4-7 lbs.
- A Labrador Retriever weighs 55-80 lbs.
- If the dog appears medium or large sized, small toy breeds (Pomeranian, Chihuahua, Yorkshire Terrier, Toy Poodle, Maltese, Papillon, etc.) should NEVER appear as the top result, even if coat color or texture looks similar.

STEP 2 — OBSERVE PHYSICAL FEATURES in this exact order:
1. SIZE relative to surroundings (confirmed from Step 1)
2. Leg length relative to body height (long-legged vs short/low-slung)
3. Snout length and shape (long/medium/short, broad/narrow, flat/tapered)
4. Ear size and position (erect/floppy/semi-erect/rose, large/small, set high/low)
5. Coat type and length (short/medium/long/wire/curly/double, texture, feathering, color/pattern)
6. Tail position and type (length, straight/curved/sickle/plumed/docked, high-set/low-set)
7. Overall body proportions and build (stocky/athletic/lean, chest depth, back line)

STEP 3 — IDENTIFY: Based ONLY on the features above, identify the most likely breed. Compare against all 200+ AKC recognized breeds plus common designer mixes. If the dog does not clearly match any single breed (multiple atypical features, mixed proportions, inconsistent traits), do NOT force a purebred match -- return a mixed breed result instead.

STEP 4 — VERIFY: List 2 features that CONFIRM your top breed choice. Note any features that are atypical. If atypical features are significant, lower your confidence accordingly.

SINGLE-PHOTO CONFIDENCE CAP: With only one photo, your maximum confidence for ANY breed should be 65. Single photos cannot provide enough angles for certainty. Cap all confidence values at 65 for single-photo detection.

Return your answer as JSON:
{
  "reasoning": "Size estimation from context clues, then features observed in order, then breed reasoning...",
  "breeds": [
    { "name": "Breed Name", "confidence": 60 },
    { "name": "Second Breed", "confidence": 30 },
    { "name": "Third Breed", "confidence": 10 }
  ]
}

Mixed breed format (use when dog does not clearly match a single breed):
{
  "reasoning": "...",
  "breeds": [
    { "name": "Mixed Breed (Labrador / Shepherd mix)", "confidence": 65 },
    { "name": "Second possibility", "confidence": 25 },
    { "name": "Third possibility", "confidence": 10 }
  ]
}

Rules:
- SINGLE-PHOTO MAXIMUM CONFIDENCE IS 65. Do not exceed this under any circumstances.
- Return exactly 3 breed guesses, ranked by confidence (highest first).
- Confidence values must be integers 0-100 and should sum to roughly 100.
- Use standard AKC or common breed names (e.g. "Golden Retriever", not "Golden").
- If a mixed breed, use format: "Mixed Breed (Breed1 / Breed2 mix)" with top 2-3 components.
- If the image is not a dog or you cannot identify the breed, return confidences below 30 for all.
- Return ONLY the JSON object, no other text.`;

const BREED_PROMPT_MULTI = `You are an expert veterinary breed identification specialist with 20+ years of experience. You have been given multiple photos that should all be of the SAME dog from different angles.

STEP 0 — VERIFY SAME DOG: Before anything else, check if all images appear to show the same dog. Compare size, coloring, coat type, and distinctive markings across all photos. If the images appear to show DIFFERENT dogs, stop immediately and return:
{ "error": "different_dogs", "message": "These look like different dogs. Please upload photos of the same pup!" }

STEP 1 — SIZE ESTIMATION (most critical discriminating factor):
Across all photos, estimate the dog's size using environmental context clues:
- Furniture scale (sofa cushion height, chair leg thickness)
- Human hands, arms, or body parts visible near the dog
- Leash thickness and length proportion
- Floor tiles, door frames, or doorways in the background
- Any other objects with known approximate dimensions

Size reference points:
- A Pomeranian weighs 3-7 lbs and stands 6-7 inches at the shoulder.
- A Chihuahua weighs 2-6 lbs.
- A Yorkshire Terrier weighs 4-7 lbs.
- A Labrador Retriever weighs 55-80 lbs.
- If the dog appears medium or large sized, small toy breeds (Pomeranian, Chihuahua, Yorkshire Terrier, Toy Poodle, Maltese, Papillon, etc.) should NEVER appear as the top result, even if coat color or texture looks similar.

STEP 2 — OBSERVE EACH PHOTO in this exact feature order:
For each photo, describe what angle it shows and what is visible, examining features in this order:
1. SIZE relative to surroundings (confirmed from Step 1)
2. Leg length relative to body height (long-legged vs short/low-slung)
3. Snout length and shape (long/medium/short, broad/narrow, flat/tapered)
4. Ear size and position (erect/floppy/semi-erect/rose, large/small, set high/low)
5. Coat type and length (short/medium/long/wire/curly/double, texture, feathering, color/pattern)
6. Tail position and type (length, straight/curved/sickle/plumed/docked, high-set/low-set)
7. Overall body proportions and build (stocky/athletic/lean, chest depth, back line)

STEP 3 — CROSS-REFERENCE: Combine features from ALL photos to build a complete picture. Note any details visible in one angle but not another. Multiple photos allow confirmation of features that are ambiguous in a single shot.

STEP 4 — IDENTIFY: Based on the combined features, identify the most likely breed. Compare against all 200+ AKC recognized breeds plus common designer mixes. If the dog does not clearly match any single breed (multiple atypical features, mixed proportions, inconsistent traits), do NOT force a purebred match -- return a mixed breed result instead.

STEP 5 — VERIFY: List 2 features that CONFIRM your top breed choice. Note any features that are atypical. If atypical features are significant, lower your confidence accordingly.

MULTI-PHOTO CONFIDENCE: Multiple photos allow higher confidence. You may return up to 85 confidence when features are consistent across all angles. Do not exceed 85 unless you are absolutely certain across every angle provided.

Return your answer as JSON:
{
  "reasoning": "Size estimation from context clues across photos, features observed per photo, cross-reference findings, breed reasoning...",
  "breeds": [
    { "name": "Breed Name", "confidence": 80 },
    { "name": "Second Breed", "confidence": 15 },
    { "name": "Third Breed", "confidence": 5 }
  ]
}

Mixed breed format (use when dog does not clearly match a single breed):
{
  "reasoning": "...",
  "breeds": [
    { "name": "Mixed Breed (Labrador / Shepherd mix)", "confidence": 75 },
    { "name": "Second possibility", "confidence": 20 },
    { "name": "Third possibility", "confidence": 5 }
  ]
}

Rules:
- If images show DIFFERENT dogs, return ONLY the error JSON above and nothing else.
- MAXIMUM CONFIDENCE IS 85. Do not exceed this under any circumstances.
- Return exactly 3 breed guesses, ranked by confidence (highest first).
- Confidence values must be integers 0-100 and should sum to roughly 100.
- Use standard AKC or common breed names (e.g. "Golden Retriever", not "Golden").
- If a mixed breed, use format: "Mixed Breed (Breed1 / Breed2 mix)" with top 2-3 components.
- If the images are not of a dog or you cannot identify the breed, return confidences below 30 for all.
- Return ONLY the JSON object, no other text.`;

interface ParsedResponse {
  breeds: BreedResult[];
  reasoning: string | null;
}

/**
 * Parse Claude's text response into breed results + reasoning.
 * Tries JSON.parse first, then regex fallback.
 */
function parseBreedResponse(text: string): ParsedResponse {
  // Try direct JSON parse (Claude usually returns clean JSON)
  try {
    // Extract JSON object from response (skip any preamble)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed.breeds) && parsed.breeds.length > 0) {
        const breeds = parsed.breeds
          .slice(0, 3)
          .map((b: { name?: string; confidence?: number }) => ({
            name: matchToCanonicalBreed(b.name ?? "Unknown"),
            confidence: Math.round(Number(b.confidence) || 0),
          }))
          .filter((b: BreedResult) => b.name && b.confidence >= 0);
        return {
          breeds,
          reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : null,
        };
      }
    }
  } catch {
    // JSON parse failed, try regex
  }

  // Regex fallback: look for patterns like "name": "Breed", "confidence": 85
  const results: BreedResult[] = [];
  const breedPattern =
    /"name"\s*:\s*"([^"]+)"\s*,\s*"confidence"\s*:\s*(\d+)/gi;
  let match;
  while ((match = breedPattern.exec(text)) !== null && results.length < 3) {
    results.push({
      name: matchToCanonicalBreed(match[1]),
      confidence: Math.round(Number(match[2])),
    });
  }

  return { breeds: results, reasoning: null };
}

/**
 * Detect the media type from base64 data or default to jpeg.
 */
function detectMediaType(
  base64: string,
): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  // Check for common base64 magic bytes
  if (base64.startsWith("iVBOR")) return "image/png";
  if (base64.startsWith("R0lGOD")) return "image/gif";
  if (base64.startsWith("UklGR")) return "image/webp";
  return "image/jpeg"; // Default
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  // ── JWT verification (optional) ──
  // breed-detect runs during onboarding, before the user has signed in.
  // JWT is verified if present, but absence is allowed — rate limiting (10/min/IP)
  // is the abuse protection. buddy-chat enforces mandatory JWT (post-auth only).
  const authHeader = req.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
  }

  // ── Rate limiting ──
  const clientIP =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(clientIP)) {
    return new Response(
      JSON.stringify({ breeds: [], error: "Rate limit exceeded. Try again in a minute." }),
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
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY not set");
      return new Response(
        JSON.stringify({ breeds: [], error: "Service not configured" }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json();

    // Accept either `images` (array of base64 strings) or legacy `image` (single string)
    let imageList: string[] = [];
    if (Array.isArray(body.images) && body.images.length > 0) {
      imageList = body.images.filter((img: unknown) => typeof img === "string").slice(0, 3);
    } else if (typeof body.image === "string" && body.image) {
      imageList = [body.image];
    }

    if (imageList.length === 0) {
      return new Response(
        JSON.stringify({ breeds: [], error: "Missing image(s)" }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    // Optional: classifier predictions from breed-classify (hybrid mode)
    const classifierPredictions: ClassifierPrediction[] | null =
      Array.isArray(body.classifierPredictions) && body.classifierPredictions.length > 0
        ? (body.classifierPredictions as ClassifierPrediction[]).slice(0, 3)
        : null;

    const hasClassifierData = classifierPredictions !== null && classifierPredictions.length > 0;
    if (hasClassifierData) {
      console.log("[breed-detect] Hybrid mode:", classifierPredictions!.map((p) => `${p.breed} (${p.confidence}%)`).join(", "));
    } else {
      console.log("[breed-detect] Standard mode: full Sonnet analysis");
    }

    // Build image content blocks for Claude (1 to 3 images)
    const imageBlocks = imageList.map((img) => {
      const base64Data = img.replace(/^data:image\/\w+;base64,/, "");
      return {
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: detectMediaType(base64Data),
          data: base64Data,
        },
      };
    });

    // Choose prompt: hybrid (with classifier output) or standard (Sonnet-only)
    let prompt: string;
    if (hasClassifierData && imageList.length > 1) {
      prompt = buildHybridPromptMulti(classifierPredictions!);
    } else if (hasClassifierData) {
      prompt = buildHybridPromptSingle(classifierPredictions!);
    } else if (imageList.length > 1) {
      prompt = BREED_PROMPT_MULTI;
    } else {
      prompt = BREED_PROMPT_SINGLE;
    }

    // Call Anthropic Claude API with vision
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      ANTHROPIC_TIMEOUT_MS,
    );

    let anthropicRes: Response;
    try {
      anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 800,
          messages: [
            {
              role: "user",
              content: [
                ...imageBlocks,
                {
                  type: "text",
                  text: prompt,
                },
              ],
            },
          ],
        }),
        signal: controller.signal,
      });
    } catch (fetchErr: unknown) {
      clearTimeout(timeout);
      const errMsg =
        fetchErr instanceof Error && fetchErr.name === "AbortError"
          ? "Request timed out"
          : "Failed to reach AI service";
      console.error("Anthropic fetch error:", fetchErr);
      return new Response(
        JSON.stringify({ breeds: [], error: errMsg }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    clearTimeout(timeout);

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error(
        "Anthropic API error:",
        anthropicRes.status,
        errText.substring(0, 500),
      );
      return new Response(
        JSON.stringify({ breeds: [], error: "AI service error" }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    const anthropicData = await anthropicRes.json();

    // Extract text from Claude's response
    const textContent = anthropicData.content?.find(
      (block: { type: string }) => block.type === "text",
    );
    const responseText: string = textContent?.text ?? "";

    if (!responseText) {
      console.error("Empty response from Claude");
      return new Response(
        JSON.stringify({ breeds: [], error: "Empty AI response" }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    // Check for different_dogs error before breed parsing
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const preCheck = JSON.parse(jsonMatch[0]);
        if (preCheck.error === "different_dogs") {
          console.log("[breed-detect] Different dogs detected across photos");
          return new Response(
            JSON.stringify({
              breeds: [],
              error: "different_dogs",
              message: preCheck.message ?? "These look like different dogs. Please upload photos of the same pup!",
            }),
            {
              status: 200,
              headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            },
          );
        }
      }
    } catch {
      // Not a different_dogs error, continue with breed parsing
    }

    // Parse the breed predictions + reasoning from Claude's response
    const parsed = parseBreedResponse(responseText);

    // Log reasoning server-side for debugging (not sent to client)
    if (parsed.reasoning) {
      console.log(
        `[breed-detect] Reasoning (${imageList.length} photo${imageList.length > 1 ? "s" : ""}):`,
        parsed.reasoning.substring(0, 500),
      );
    }

    if (parsed.breeds.length === 0) {
      console.warn("Could not parse breeds from response:", responseText.substring(0, 300));
      return new Response(
        JSON.stringify({
          breeds: [],
          rawLabels: [responseText.substring(0, 200)],
          error: "Could not parse breed data",
        }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    // Build response with optional lowConfidence flag
    const topConfidence = parsed.breeds[0]?.confidence ?? 0;
    const result: {
      breeds: BreedResult[];
      lowConfidence?: boolean;
      rawLabels?: string[];
      photoCount?: number;
    } = {
      breeds: parsed.breeds,
      photoCount: imageList.length,
    };

    if (topConfidence < 50) {
      result.lowConfidence = true;
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("breed-detect error:", err);
    return new Response(
      JSON.stringify({ breeds: [], error: "Internal error" }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }
});
