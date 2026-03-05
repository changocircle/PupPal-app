/**
 * Gate Frequency Limiting — PRD-07 §4
 *
 * Rules:
 * - Maximum 1 paywall per session (app open → close)
 * - 4-hour cooldown before same gate shows again after dismiss
 * - Celebration gates bypass frequency limits
 * - Settings "Upgrade" always works
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const GATE_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours
const STORAGE_KEY = 'puppal-gate-throttle';

// Session-level tracking (resets on app restart)
let paywallShownThisSession = false;

interface GateTimestamps {
  [feature: string]: number; // timestamp of last shown
}

async function getTimestamps(): Promise<GateTimestamps> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GateTimestamps) : {};
  } catch {
    return {};
  }
}

async function setTimestamp(feature: string): Promise<void> {
  const timestamps = await getTimestamps();
  timestamps[feature] = Date.now();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(timestamps));
}

/**
 * Check if a gate can be shown right now.
 *
 * @param feature - The gate trigger name (e.g., 'feature_gate_week2')
 * @param options.isCelebration - Celebration gates bypass limits
 * @param options.isManual - Settings "Upgrade" button always works
 */
export async function canShowGate(
  feature: string,
  options?: { isCelebration?: boolean; isManual?: boolean }
): Promise<boolean> {
  // Manual upgrade (Settings) always works
  if (options?.isManual) return true;

  // Celebration gates bypass limits
  if (options?.isCelebration) return true;

  // Only 1 paywall per session
  if (paywallShownThisSession) return false;

  // 4-hour cooldown per feature
  const timestamps = await getTimestamps();
  const lastShown = timestamps[feature];
  if (lastShown && Date.now() - lastShown < GATE_COOLDOWN_MS) {
    return false;
  }

  return true;
}

/**
 * Record that a gate was shown. Call after paywall is presented.
 */
export async function recordGateShown(feature: string): Promise<void> {
  paywallShownThisSession = true;
  await setTimestamp(feature);
}

/**
 * Reset session tracking (call on app foreground if needed).
 */
export function resetSessionGate(): void {
  paywallShownThisSession = false;
}

/**
 * Check if paywall was already shown this session.
 */
export function wasPaywallShownThisSession(): boolean {
  return paywallShownThisSession;
}
