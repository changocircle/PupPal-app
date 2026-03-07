/**
 * Client-side vaccine record extraction service.
 *
 * Sends photos of vet records to the vaccine-extract Edge Function.
 * Returns structured vaccine data for the setup confirmation screen.
 */

import { File as ExpoFile } from "expo-file-system";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Generous timeout: multiple images + Claude vision inference */
const EXTRACT_TIMEOUT_MS = 45_000;

export interface ExtractedVaccine {
  name: string;
  date: string;
  doseNumber: number;
  vetClinic?: string;
}

export interface VaccineExtractResult {
  vaccines: ExtractedVaccine[];
  confidence: "high" | "medium" | "low";
  notes: string;
}

/**
 * Convert an array of image URIs to base64 and send to the extraction endpoint.
 */
export async function extractVaccinesFromPhotos(
  imageUris: string[],
): Promise<VaccineExtractResult | null> {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn("[VaccineExtract] Missing Supabase credentials");
      return null;
    }

    if (imageUris.length === 0) {
      console.warn("[VaccineExtract] No images provided");
      return null;
    }

    console.log(`[VaccineExtract] Processing ${imageUris.length} image(s)`);

    // Read all images as base64 (SDK 54+ File API)
    const base64Images: string[] = [];
    for (const uri of imageUris) {
      try {
        const file = new ExpoFile(uri);
        const b64 = await file.base64();
        if (b64 && b64.length > 100) {
          base64Images.push(b64);
        } else {
          console.warn("[VaccineExtract] Skipping empty/tiny image:", uri.substring(0, 50));
        }
      } catch (readErr: any) {
        console.error("[VaccineExtract] Failed to read image:", readErr?.message);
      }
    }

    if (base64Images.length === 0) {
      console.warn("[VaccineExtract] No valid images after base64 conversion");
      return null;
    }

    console.log(`[VaccineExtract] Sending ${base64Images.length} image(s) to extraction endpoint`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), EXTRACT_TIMEOUT_MS);

    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/vaccine-extract`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ images: base64Images }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeout);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.warn(`[VaccineExtract] HTTP ${res.status}: ${errBody.substring(0, 200)}`);
      return null;
    }

    const data = await res.json();

    if (data.error) {
      console.warn("[VaccineExtract] Server error:", data.error);
      return null;
    }

    return {
      vaccines: data.vaccines ?? [],
      confidence: data.confidence ?? "low",
      notes: data.notes ?? "",
    };
  } catch (err: any) {
    if (err?.name === "AbortError") {
      console.warn("[VaccineExtract] Timed out after", EXTRACT_TIMEOUT_MS, "ms");
    } else {
      console.error("[VaccineExtract] Error:", err?.message ?? err);
    }
    return null;
  }
}
