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

const BREED_PROMPT_SINGLE = `You are an expert veterinary breed identification specialist with 20+ years of experience.

STEP 1 — OBSERVE: Describe the dog's physical features in detail:
- Coat: type (short/medium/long/wire/curly/double), texture (silky/coarse/dense), feathering
- Coat color and pattern (solid, bicolor, tricolor, merle, brindle, saddle markings, mask)
- Ears: shape (erect/floppy/semi-erect/rose), size, position
- Head and muzzle: skull width, muzzle length, stop prominence, lip shape
- Body: build (stocky/athletic/lean), chest depth, back line (level/sloping)
- Tail: length, shape (straight/curved/sickle/plumed), carriage

STEP 2 — IDENTIFY: Based ONLY on the features you described above, identify the most likely breed. Compare against all 200+ AKC recognized breeds plus common designer mixes.

STEP 3 — VERIFY: List 2 features that CONFIRM your top breed choice. Then note any features that are atypical for this breed. If atypical features are significant, lower your confidence accordingly.

Return your answer as JSON:
{
  "reasoning": "Description of features observed and breed reasoning...",
  "breeds": [
    { "name": "Breed Name", "confidence": 85 },
    { "name": "Second Breed", "confidence": 10 },
    { "name": "Third Breed", "confidence": 5 }
  ]
}

Rules:
- Return exactly 3 breed guesses, ranked by confidence (highest first).
- Confidence values must be integers 0-100 and should sum to roughly 100.
- Use standard AKC or common breed names (e.g. "Golden Retriever", not "Golden").
- If you are not at least 60% confident in your top pick, keep the confidence value LOW.
- Do NOT be overconfident. A 90%+ confidence means you are absolutely certain.
- If the image is not a dog or you cannot identify the breed, return confidences below 30 for all.
- If it looks like a mixed breed, list the most likely component breeds.
- Return ONLY the JSON object, no other text.`;

const BREED_PROMPT_MULTI = `You are an expert veterinary breed identification specialist with 20+ years of experience. You have been given multiple photos of the SAME dog from different angles.

STEP 1 — OBSERVE EACH PHOTO: For each photo, describe what angle it shows and what features are visible:
- Coat: type (short/medium/long/wire/curly/double), texture (silky/coarse/dense), feathering
- Coat color and pattern (solid, bicolor, tricolor, merle, brindle, saddle markings, mask)
- Ears: shape (erect/floppy/semi-erect/rose), size, position
- Head and muzzle: skull width, muzzle length, stop prominence, lip shape
- Body: build (stocky/athletic/lean), chest depth, back line (level/sloping)
- Tail: length, shape (straight/curved/sickle/plumed), carriage

STEP 2 — CROSS-REFERENCE: Combine features from ALL photos to build a complete picture. Note any details visible in one angle but not another.

STEP 3 — IDENTIFY: Based on the combined features, identify the most likely breed. Compare against all 200+ AKC recognized breeds plus common designer mixes.

STEP 4 — VERIFY: List 2 features that CONFIRM your top breed choice. Then note any features that are atypical for this breed. If atypical features are significant, lower your confidence accordingly.

Return your answer as JSON:
{
  "reasoning": "Description of features observed across photos and breed reasoning...",
  "breeds": [
    { "name": "Breed Name", "confidence": 85 },
    { "name": "Second Breed", "confidence": 10 },
    { "name": "Third Breed", "confidence": 5 }
  ]
}

Rules:
- Return exactly 3 breed guesses, ranked by confidence (highest first).
- Confidence values must be integers 0-100 and should sum to roughly 100.
- Use standard AKC or common breed names (e.g. "Golden Retriever", not "Golden").
- If you are not at least 60% confident in your top pick, keep the confidence value LOW.
- Do NOT be overconfident. A 90%+ confidence means you are absolutely certain.
- If the images are not of a dog or you cannot identify the breed, return confidences below 30 for all.
- If it looks like a mixed breed, list the most likely component breeds.
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

    // Build image content blocks for Claude (1–3 images)
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

    // Choose prompt based on single vs multi-photo
    const prompt = imageList.length > 1 ? BREED_PROMPT_MULTI : BREED_PROMPT_SINGLE;

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
          model: "claude-sonnet-4-20250514",
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
