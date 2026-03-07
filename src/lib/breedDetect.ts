/**
 * Client-side breed detection service.
 *
 * Calls the Supabase breed-detect Edge Function with 1–3 base64-encoded images.
 * Supports multi-photo for cross-referencing features across angles.
 * The Edge Function uses Claude (Anthropic) vision for breed identification.
 * Returns the top breed predictions or null on failure/timeout.
 *
 * PRD-01 Screen 3: Photo Upload + Breed Detection
 */

import { File as ExpoFile } from "expo-file-system";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Timeout for breed detection API call (generous for multi-image + reasoning) */
const DETECT_TIMEOUT_MS = 35_000;

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
  /** True when the top breed confidence is below 50% — UI should ask user to confirm */
  lowConfidence: boolean;
  /** Number of photos that were analysed */
  photoCount: number;
}

/**
 * Read a local image URI to base64.
 */
async function readImageBase64(uri: string): Promise<string | null> {
  try {
    const file = new ExpoFile(uri);
    const base64 = await file.base64();
    if (!base64 || base64.length < 100) return null;
    return base64;
  } catch (err: any) {
    console.error("[BreedDetect] Failed to read image:", uri.substring(0, 40), err?.message);
    return null;
  }
}

/**
 * Detect breed from one or more photo URIs.
 * For best results, provide front view, side view, and full body shot.
 *
 * @param imageUris - 1 to 3 local image URIs
 * @returns BreedDetectResult or null (timeout / error / no breeds found)
 */
export async function detectBreed(
  imageUris: string | string[],
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

    // Normalise to array
    const uris = Array.isArray(imageUris) ? imageUris.slice(0, 3) : [imageUris];

    console.log(`[BreedDetect] Starting detection for ${uris.length} photo(s)`);
    console.log("[BreedDetect] Endpoint:", `${SUPABASE_URL}/functions/v1/breed-detect`);

    // Read all images to base64 in parallel
    const base64Results = await Promise.all(uris.map(readImageBase64));
    const images = base64Results.filter((b): b is string => b !== null);

    if (images.length === 0) {
      console.warn("[BreedDetect] No valid images to send");
      return null;
    }

    console.log(`[BreedDetect] Sending ${images.length} image(s), total base64 length: ${images.reduce((s, b) => s + b.length, 0)}`);

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
        body: JSON.stringify({ images }),
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
      photoCount: data.photoCount ?? images.length,
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
