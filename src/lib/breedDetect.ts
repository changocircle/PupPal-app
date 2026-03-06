/**
 * Client-side breed detection service.
 *
 * Calls the Supabase breed-detect Edge Function with a base64-encoded image.
 * The Edge Function uses Claude (Anthropic) vision for breed identification.
 * Returns the top breed predictions or null on failure/timeout.
 *
 * PRD-01 Screen 3: Photo Upload + Breed Detection
 */

import { File as ExpoFile } from "expo-file-system";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Timeout for breed detection API call (generous to handle cold starts + Claude inference) */
const DETECT_TIMEOUT_MS = 20_000;

export interface BreedPrediction {
  name: string;
  confidence: number;
}

export interface BreedDetectResult {
  /** Highest-confidence breed */
  topBreed: string;
  /** Confidence 0-100 */
  confidence: number;
  /** Top 3 predictions */
  suggestions: BreedPrediction[];
  /** True when the top breed confidence is below 60% — UI should ask user to confirm */
  lowConfidence: boolean;
}

/**
 * Detect breed from a photo URI.
 *
 * @returns BreedDetectResult or null (timeout / error / no breeds found)
 */
export async function detectBreed(
  imageUri: string,
): Promise<BreedDetectResult | null> {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn(
        "[BreedDetect] Missing credentials. SUPABASE_URL:",
        SUPABASE_URL ? "set" : "EMPTY",
        "ANON_KEY:",
        SUPABASE_ANON_KEY ? `set (${SUPABASE_ANON_KEY.substring(0, 10)}...)` : "EMPTY",
      );
      return null;
    }

    console.log("[BreedDetect] Starting detection for URI:", imageUri.substring(0, 80));
    console.log("[BreedDetect] Endpoint:", `${SUPABASE_URL}/functions/v1/breed-detect`);

    // Read image as base64 (SDK 54+ File API, legacy readAsStringAsync removed)
    let base64: string;
    try {
      const file = new ExpoFile(imageUri);
      base64 = await file.base64();
      console.log("[BreedDetect] Base64 length:", base64.length);
    } catch (readErr: any) {
      console.error("[BreedDetect] Failed to read image file:", readErr?.message);
      return null;
    }

    if (!base64 || base64.length < 100) {
      console.warn("[BreedDetect] Base64 too short or empty:", base64?.length);
      return null;
    }

    // Race the fetch against a timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DETECT_TIMEOUT_MS);

    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/breed-detect`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ image: base64 }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeout);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.warn(
        `[BreedDetect] HTTP ${res.status}: ${errBody.substring(0, 200)}`,
      );
      return null;
    }

    const data = await res.json();
    console.log("[BreedDetect] Response data:", JSON.stringify(data).substring(0, 300));

    if (data.error) {
      console.warn("[BreedDetect] Server error:", data.error);
    }

    const breeds: BreedPrediction[] = data.breeds ?? [];

    if (breeds.length === 0) {
      console.log("[BreedDetect] No breeds returned");
      return null;
    }

    return {
      topBreed: breeds[0]!.name,
      confidence: breeds[0]!.confidence,
      suggestions: breeds,
      lowConfidence: data.lowConfidence === true,
    };
  } catch (err: any) {
    // AbortError = timeout, anything else = network/parse error
    if (err?.name === "AbortError") {
      console.warn("[BreedDetect] Timed out after", DETECT_TIMEOUT_MS, "ms");
    } else {
      console.error("[BreedDetect] Error:", err?.message ?? err);
    }
    return null;
  }
}
