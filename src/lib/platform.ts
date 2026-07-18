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

/**
 * Normalize whatever the user pasted (full profile URL, @handle, or bare slug)
 * into the stored handle: an IG username or a LinkedIn vanity slug.
 */
export function extractHandle(input: string, platform?: string | null): string {
  let s = (input || "").trim();
  if (!s) return "";
  if (normalizePlatform(platform) === "linkedin") {
    // https://www.linkedin.com/in/john-doe-123/ -> john-doe-123
    const m = s.match(/linkedin\.com\/(?:in|pub)\/([^/?#]+)/i);
    if (m) return m[1];
    return s.replace(/^https?:\/\/[^/]+\//i, "").replace(/\/+$/, "");
  }
  // instagram: strip protocol/host and leading @
  const m = s.match(/instagram\.com\/([^/?#]+)/i);
  if (m) s = m[1];
  return s.replace(/^@+/, "").replace(/\/+$/, "");
}

/** IG shows `@handle`; LinkedIn slugs render bare. */
export function getHandleDisplay(lead: PlatformLead): string {
  const username = (lead.username || "").replace(/^@+/, "");
  if (!username) return "";
  return normalizePlatform(lead.platform) === "linkedin" ? username : `@${username}`;
}
