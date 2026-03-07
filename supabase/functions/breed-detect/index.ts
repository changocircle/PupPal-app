/**
 * breed-detect — Supabase Edge Function
 *
 * Accepts a base64 image, sends to Anthropic Claude (vision),
 * and returns top 3 breed predictions with confidence.
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

/** Timeout for the Anthropic API call */
const ANTHROPIC_TIMEOUT_MS = 15_000;

const BREED_PROMPT = `You are an expert veterinary breed identification specialist with 20+ years of experience. Your task is to identify the dog breed from this photo with high accuracy.

CRITICAL: Examine each physical feature methodically before deciding:

1. COAT — What is the length? (short / medium / long / wire / curly / double)
   What is the texture? (silky, flowing, coarse, dense undercoat?)
   Is it smooth or feathered on the legs/tail/ears?
   Example: Golden Retrievers have LONG, flowing, silky coats with heavy feathering on legs and tail. German Shepherds have MEDIUM-length dense double coats that lie flat. These are very different.

2. EARS — Are they floppy/pendant, erect/pricked, semi-erect, or rose-shaped?
   Size relative to head? Position (high-set or low-set)?
   Example: Golden Retrievers have medium floppy ears set just above eye level. German Shepherds have large, triangular, fully erect ears. This is a KEY differentiator.

3. HEAD & MUZZLE — Is the skull broad or narrow? Muzzle length and shape?
   Stop (forehead-to-muzzle transition) — pronounced or gradual?
   Lip shape — tight or loose? Any jowls?

4. BODY — Overall build: stocky, athletic, lean, heavy-boned?
   Chest depth and width? Back line — level, sloping, or roached?
   Example: German Shepherds have a distinctive sloping topline. Golden Retrievers have a level back.

5. SIZE & PROPORTIONS — Estimate weight range. Height at shoulder.
   Length-to-height ratio. Leg length relative to body.

6. COLORING & MARKINGS — Base color, patterns, saddle markings, masks, points.
   Example: Golden Retrievers are solid gold/cream/dark golden. German Shepherds typically have black saddle with tan points.

7. TAIL — Length, shape (straight, curved, sickle, plumed), carriage.

Return your answer as a JSON object with exactly this format:
{
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
- Compare against all 200+ AKC recognized breeds before deciding.
- If you are not at least 60% confident in your top pick, keep the confidence value LOW.
- Do NOT be overconfident. A 90%+ confidence means you are absolutely certain.
- If the image is not a dog or you cannot identify the breed, return confidences below 30 for all.
- If it looks like a mixed breed, list the most likely component breeds.
- Return ONLY the JSON object, no other text.`;

/**
 * Parse Claude's text response into breed results.
 * Tries JSON.parse first, then regex fallback.
 */
function parseBreedResponse(text: string): BreedResult[] {
  // Try direct JSON parse (Claude usually returns clean JSON)
  try {
    // Extract JSON object from response (skip any preamble)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed.breeds) && parsed.breeds.length > 0) {
        return parsed.breeds
          .slice(0, 3)
          .map((b: { name?: string; confidence?: number }) => ({
            name: matchToCanonicalBreed(b.name ?? "Unknown"),
            confidence: Math.round(Number(b.confidence) || 0),
          }))
          .filter((b: BreedResult) => b.name && b.confidence >= 0);
      }
    }
  } catch {
    // JSON parse failed, try regex
  }

  // Regex fallback: look for patterns like "Breed Name": 85 or "name": "Breed", "confidence": 85
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

  return results;
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

    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return new Response(
        JSON.stringify({ breeds: [], error: "Missing image field" }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    // Strip data URI prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const mediaType = detectMediaType(base64Data);

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
          max_tokens: 300,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mediaType,
                    data: base64Data,
                  },
                },
                {
                  type: "text",
                  text: BREED_PROMPT,
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

    // Parse the breed predictions from Claude's response
    const breeds = parseBreedResponse(responseText);

    if (breeds.length === 0) {
      console.warn("Could not parse breeds from response:", responseText.substring(0, 200));
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
    const topConfidence = breeds[0]?.confidence ?? 0;
    const result: {
      breeds: BreedResult[];
      lowConfidence?: boolean;
      rawLabels?: string[];
    } = { breeds };

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
