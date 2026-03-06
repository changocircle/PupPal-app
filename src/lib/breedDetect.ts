/**
 * Client-side breed detection service.
 *
 * Calls the Supabase breed-detect Edge Function with a base64-encoded image.
 * Returns the top breed predictions or null on failure/timeout.
 *
 * PRD-01 Screen 3: Photo Upload + Breed Detection
 */

import * as FileSystem from "expo-file-system";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Timeout for breed detection API call (generous to handle cold starts) */
const DETECT_TIMEOUT_MS = 12000;

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

    // Read image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

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
    const breeds: BreedPrediction[] = data.breeds ?? [];

    if (breeds.length === 0) return null;

    return {
      topBreed: breeds[0]!.name,
      confidence: breeds[0]!.confidence,
      suggestions: breeds,
    };
  } catch (err: any) {
    // AbortError = timeout, anything else = network/parse error
    // All cases: silent fallback per PRD-01
    if (err?.name !== "AbortError") {
      console.warn("Breed detection failed:", err?.message ?? err);
    }
    return null;
  }
}
