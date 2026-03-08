/**
 * Client-side breed detection service — Hybrid Mode
 *
 * Two-step flow:
 *   1. breed-classify (HuggingFace ViT, fast ~2s) — top 3 breed candidates
 *   2. breed-detect (Sonnet reasoning) — validates classifier output visually
 *
 * Falls back to standard Sonnet-only analysis if classifier fails.
 * Supports multi-photo (1-3 images) for cross-referencing features.
 *
 * PRD-01 Screen 3: Photo Upload + Breed Detection
 */

import * as ImageManipulator from "expo-image-manipulator";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

const CLASSIFY_TIMEOUT_MS = 15_000;
const DETECT_TIMEOUT_MS = 35_000;

export interface BreedPrediction {
  name: string;
  confidence: number;
}

export interface ClassifierPrediction {
  breed: string;
  confidence: number;
}

export interface BreedDetectResult {
  topBreed: string;
  confidence: number;
  suggestions: BreedPrediction[];
  /** True when confidence is below 50% — UI should prompt user to confirm */
  lowConfidence: boolean;
  photoCount: number;
  /** Set when multi-photo validation detects different dogs */
  differentDogs?: boolean;
  errorMessage?: string;
  /** True when HuggingFace classifier was used in step 1 */
  hybridMode?: boolean;
}

async function readImageBase64(uri: string): Promise<string | null> {
  try {
    const compressed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    );
    const base64 = compressed.base64;
    if (!base64 || base64.length < 100) return null;
    console.log(`[BreedDetect] Compressed: ${Math.round(base64.length / 1024)}KB`);
    return base64;
  } catch (err: any) {
    console.error("[BreedDetect] Compression failed:", err?.message);
    return null;
  }
}

async function runClassifier(
  imageBase64: string,
  authToken: string,
): Promise<ClassifierPrediction[] | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CLASSIFY_TIMEOUT_MS);
    const res = await fetch(`${SUPABASE_URL}/functions/v1/breed-classify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ imageBase64 }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) { console.warn(`[BreedDetect] Classifier HTTP ${res.status}`); return null; }
    const data = await res.json();
    if (!data.classifierAvailable || !Array.isArray(data.predictions) || data.predictions.length === 0) {
      console.log("[BreedDetect] Classifier unavailable, using standard mode");
      return null;
    }
    console.log("[BreedDetect] Classifier:", data.predictions.map((p: ClassifierPrediction) => `${p.breed} (${p.confidence}%)`).join(", "));
    return data.predictions as ClassifierPrediction[];
  } catch (err: any) {
    console.warn("[BreedDetect] Classifier error (non-fatal):", err?.name === "AbortError" ? "timeout" : err?.message);
    return null;
  }
}

async function runSonnetDetect(
  images: string[],
  classifierPredictions: ClassifierPrediction[] | null,
  authToken: string,
): Promise<BreedDetectResult | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DETECT_TIMEOUT_MS);
    const requestBody: Record<string, unknown> = { images };
    if (classifierPredictions && classifierPredictions.length > 0) {
      requestBody.classifierPredictions = classifierPredictions;
    }
    const res = await fetch(`${SUPABASE_URL}/functions/v1/breed-detect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.warn(`[BreedDetect] Sonnet HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    if (data.error === "different_dogs") {
      return {
        topBreed: "", confidence: 0, suggestions: [], lowConfidence: true,
        photoCount: images.length, differentDogs: true,
        errorMessage: data.message ?? "These look like different dogs. Please upload photos of the same pup!",
        hybridMode: classifierPredictions !== null,
      };
    }
    const breeds: BreedPrediction[] = data.breeds ?? [];
    if (breeds.length === 0) { console.log("[BreedDetect] No breeds from Sonnet"); return null; }
    return {
      topBreed: breeds[0]!.name,
      confidence: breeds[0]!.confidence,
      suggestions: breeds,
      lowConfidence: data.lowConfidence === true,
      photoCount: data.photoCount ?? images.length,
      hybridMode: classifierPredictions !== null,
    };
  } catch (err: any) {
    console.warn("[BreedDetect] Sonnet error:", err?.name === "AbortError" ? "timeout" : err?.message);
    return null;
  }
}

/**
 * Detect breed using hybrid pipeline: classifier first, then Sonnet reasoning.
 *
 * @param imageUris - 1 to 3 local image URIs
 * @param onProgress - optional callback: "classifying" -> "confirming"
 */
export async function detectBreed(
  imageUris: string | string[],
  onProgress?: (stage: "classifying" | "confirming") => void,
): Promise<BreedDetectResult | null> {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn("[BreedDetect] Missing Supabase credentials");
      return null;
    }
    const uris = Array.isArray(imageUris) ? imageUris.slice(0, 3) : [imageUris];
    const base64Results = await Promise.all(uris.map(readImageBase64));
    const images = base64Results.filter((b): b is string => b !== null);
    if (images.length === 0) { console.warn("[BreedDetect] No valid images"); return null; }

    const authToken = SUPABASE_ANON_KEY;

    // Step 1: Fast HuggingFace classifier
    onProgress?.("classifying");
    const classifierPredictions = await runClassifier(images[0]!, authToken);

    // Step 2: Sonnet validation + reasoning
    onProgress?.("confirming");
    return await runSonnetDetect(images, classifierPredictions, authToken);
  } catch (err: any) {
    console.error("[BreedDetect] Unexpected error:", err?.message ?? err);
    return null;
  }
}
