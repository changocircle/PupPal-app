/**
 * Dog photo storage utilities.
 *
 * Stores all uploaded dog photos (up to 3) in AsyncStorage,
 * keyed by dog ID. The profile photo (front face, index 0)
 * lives in the Dog record's `photo_url` field.
 *
 * When Supabase Storage is wired, these will upload to the cloud.
 * For now, local URIs are persisted in AsyncStorage.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const PHOTOS_KEY_PREFIX = "puppal-dog-photos::";

export interface DogPhotos {
  /** Profile photo URI (front face, also stored as dog.photo_url) */
  profileUri: string | null;
  /** All photo URIs (up to 3: front, side, full body) */
  allUris: string[];
}

/**
 * Save all photos for a dog.
 */
export async function saveDogPhotos(
  dogId: string,
  photos: DogPhotos,
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      `${PHOTOS_KEY_PREFIX}${dogId}`,
      JSON.stringify(photos),
    );
  } catch (err) {
    console.error("[DogPhotos] Failed to save:", err);
  }
}

/**
 * Load all photos for a dog.
 */
export async function loadDogPhotos(dogId: string): Promise<DogPhotos> {
  try {
    const raw = await AsyncStorage.getItem(`${PHOTOS_KEY_PREFIX}${dogId}`);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error("[DogPhotos] Failed to load:", err);
  }
  return { profileUri: null, allUris: [] };
}

/**
 * Delete all stored photos for a dog (used on dog deletion).
 */
export async function deleteDogPhotos(dogId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${PHOTOS_KEY_PREFIX}${dogId}`);
  } catch (err) {
    console.error("[DogPhotos] Failed to delete:", err);
  }
}
