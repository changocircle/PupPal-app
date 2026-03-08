/**
 * PupPal Deep Link Handler
 *
 * Handles Universal Links (iOS) and Android App Links from puppal.dog.
 * Also handles custom scheme deep links (puppal://).
 *
 * Supported paths:
 *   /referral/:code    — Referral program link
 *   /share/:type/:id   — Shared content (dog profile, achievement, etc.)
 *   /reset-password    — Password reset from email
 *   /invite/:code      — Invite a friend
 *   /open              — Generic app open (marketing links)
 *
 * Usage in _layout.tsx:
 *   import { handleDeepLink } from "@/lib/deepLinks";
 *   Linking.addEventListener("url", ({ url }) => handleDeepLink(url, router));
 */

import { Linking } from "react-native";
import type { Router } from "expo-router";

export const DEEP_LINK_PATHS = {
  REFERRAL: "/referral/:code",
  SHARE: "/share/:type/:id",
  RESET_PASSWORD: "/reset-password",
  INVITE: "/invite/:code",
  OPEN: "/open",
} as const;

export type DeepLinkPath = (typeof DEEP_LINK_PATHS)[keyof typeof DEEP_LINK_PATHS];

export interface ParsedDeepLink {
  type: "referral" | "share" | "reset-password" | "invite" | "open" | "unknown";
  params: Record<string, string>;
  raw: string;
}

/**
 * Parse a deep link URL into a structured object.
 */
export function parseDeepLink(url: string): ParsedDeepLink {
  let path: string;

  try {
    const parsed = new URL(url);
    // Handle both https://puppal.dog/path and puppal://path
    path = parsed.pathname;
  } catch {
    // Fallback for URLs without a valid origin
    path = url.replace(/^[a-z]+:\/\/[^/]*/, "");
  }

  // Normalize trailing slash
  path = path.replace(/\/$/, "") || "/";

  // /referral/:code
  const referralMatch = path.match(/^\/referral\/([^/?#]+)/);
  if (referralMatch) {
    return { type: "referral", params: { code: referralMatch[1] }, raw: url };
  }

  // /share/:type/:id
  const shareMatch = path.match(/^\/share\/([^/?#]+)\/([^/?#]+)/);
  if (shareMatch) {
    return { type: "share", params: { type: shareMatch[1], id: shareMatch[2] }, raw: url };
  }

  // /invite/:code
  const inviteMatch = path.match(/^\/invite\/([^/?#]+)/);
  if (inviteMatch) {
    return { type: "invite", params: { code: inviteMatch[1] }, raw: url };
  }

  // /reset-password (with optional query params like ?token=...)
  if (path === "/reset-password" || path.startsWith("/reset-password?")) {
    let token = "";
    try {
      const parsed = new URL(url);
      token = parsed.searchParams.get("token") ?? "";
    } catch {
      // ignore
    }
    return { type: "reset-password", params: { token }, raw: url };
  }

  // /open
  if (path === "/open") {
    return { type: "open", params: {}, raw: url };
  }

  return { type: "unknown", params: {}, raw: url };
}

/**
 * Handle a deep link URL and navigate accordingly.
 * Pass in the Expo Router router instance.
 */
export function handleDeepLink(url: string, router: Router): boolean {
  const link = parseDeepLink(url);

  switch (link.type) {
    case "referral":
      // Navigate to referral screen with the code
      router.push({
        pathname: "/referral",
        params: { code: link.params.code },
      } as any);
      return true;

    case "share":
      // Navigate based on share type
      if (link.params.type === "dog") {
        router.push({
          pathname: "/(tabs)/profile",
          params: { sharedDogId: link.params.id },
        } as any);
      } else {
        // Fallback: open the app at home
        router.push("/(tabs)/" as any);
      }
      return true;

    case "invite":
      // Apply invite code and navigate to signup or referral screen
      router.push({
        pathname: "/referral",
        params: { inviteCode: link.params.code },
      } as any);
      return true;

    case "reset-password":
      // Navigate to password reset screen with token
      router.push({
        pathname: "/(auth)/reset-password",
        params: { token: link.params.token },
      } as any);
      return true;

    case "open":
      // Generic open — navigate to home tab
      router.push("/(tabs)/" as any);
      return true;

    default:
      console.log("[DeepLink] Unrecognized deep link:", url);
      return false;
  }
}

/**
 * Get the initial URL that opened the app (if any).
 * Call this during app startup to handle cold-start deep links.
 */
export async function getInitialDeepLink(): Promise<string | null> {
  try {
    return await Linking.getInitialURL();
  } catch {
    return null;
  }
}
