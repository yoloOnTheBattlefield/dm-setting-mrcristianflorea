import { Instagram, Linkedin, type LucideIcon } from "lucide-react";

export type Platform = "instagram" | "linkedin";

interface PlatformLead {
  username?: string | null;
  platform?: Platform | string | null;
  profileLink?: string | null;
}

/** Missing/unknown platform is treated as Instagram (matches the backend default). */
export function normalizePlatform(platform?: string | null): Platform {
  return platform === "linkedin" ? "linkedin" : "instagram";
}

export function getPlatformLabel(platform?: string | null): string {
  return normalizePlatform(platform) === "linkedin" ? "LinkedIn" : "Instagram";
}

export function getPlatformIcon(platform?: string | null): LucideIcon {
  return normalizePlatform(platform) === "linkedin" ? Linkedin : Instagram;
}

/** Prefers an explicit profileLink, otherwise builds the canonical profile URL. */
export function getProfileUrl(lead: PlatformLead): string {
  if (lead.profileLink) return lead.profileLink;
  const username = (lead.username || "").replace(/^@+/, "");
  if (!username) return "";
  return normalizePlatform(lead.platform) === "linkedin"
    ? `https://www.linkedin.com/in/${username}`
    : `https://instagram.com/${username}`;
}

/** IG shows `@handle`; LinkedIn slugs render bare. */
export function getHandleDisplay(lead: PlatformLead): string {
  const username = (lead.username || "").replace(/^@+/, "");
  if (!username) return "";
  return normalizePlatform(lead.platform) === "linkedin" ? username : `@${username}`;
}
