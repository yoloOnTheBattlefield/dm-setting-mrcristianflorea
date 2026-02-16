// Internal fields users can map spreadsheet columns to
export const MAPPABLE_FIELDS = [
  { key: "username", label: "Username", type: "string", isIdentifier: true },
  { key: "email", label: "Email", type: "string", isIdentifier: true },
  { key: "profileLink", label: "Profile Link", type: "string", isIdentifier: true },
  { key: "fullName", label: "Full Name", type: "string" },
  { key: "followersCount", label: "Followers Count", type: "number" },
  { key: "postsCount", label: "Posts Count", type: "number" },
  { key: "bio", label: "Bio / Biography", type: "string" },
  { key: "isVerified", label: "Is Verified", type: "boolean" },
  { key: "externalUrl", label: "External URL", type: "string" },
  { key: "source", label: "Source", type: "string" },
  { key: "ig", label: "IG", type: "string" },
  { key: "isMessaged", label: "Is Messaged", type: "boolean" },
  { key: "dmDate", label: "DM Date", type: "date" },
  { key: "message", label: "Message", type: "string" },
  { key: "scrapeDate", label: "Scrape Date", type: "date" },
] as const;

export type MappableFieldKey = (typeof MAPPABLE_FIELDS)[number]["key"];
export const IDENTIFIER_FIELDS: MappableFieldKey[] = ["username", "email", "profileLink"];

// columnMapping: spreadsheet header -> internal field key (or null for "Ignore")
export type ColumnMapping = Record<string, MappableFieldKey | null>;

// Synonym dictionary: each internal field has known header synonyms
// Matching is case-insensitive; we pick the longest matching synonym to avoid false positives
const SYNONYMS: Record<MappableFieldKey, string[]> = {
  username: ["username", "user name", "ig handle", "handle", "instagram handle", "ig username"],
  email: ["email", "e-mail", "public email", "email address"],
  profileLink: ["profile link", "profile url", "instagram url", "ig link", "ig url"],
  fullName: ["full name", "fullname", "name", "display name"],
  followersCount: ["followers count", "followers", "follower count", "# followers", "num followers"],
  postsCount: ["posts count", "posts", "post count", "# posts", "num posts", "media count"],
  bio: ["biography", "bio", "about"],
  isVerified: ["is verified", "verified"],
  externalUrl: ["external url", "external link", "website"],
  source: ["source", "scraped from", "origin"],
  ig: ["ig", "instagram"],
  isMessaged: ["messaged?", "messaged", "is messaged", "dm sent", "contacted"],
  dmDate: ["dm date", "message date", "sent date", "date messaged"],
  message: ["message", "dm message", "message text", "dm text"],
  scrapeDate: ["scrape date", "scraped date", "date scraped", "export date"],
};

export function autoSuggestMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const usedFields = new Set<MappableFieldKey>();

  for (const header of headers) {
    const headerLower = header.toLowerCase().trim();
    let bestMatch: MappableFieldKey | null = null;
    let bestLength = 0;

    for (const [field, synonyms] of Object.entries(SYNONYMS) as [MappableFieldKey, string[]][]) {
      if (usedFields.has(field)) continue;
      for (const synonym of synonyms) {
        if (headerLower === synonym || headerLower.includes(synonym)) {
          if (synonym.length > bestLength) {
            bestMatch = field;
            bestLength = synonym.length;
          }
        }
      }
    }

    if (bestMatch) {
      mapping[header] = bestMatch;
      usedFields.add(bestMatch);
    } else {
      mapping[header] = null;
    }
  }

  return mapping;
}

export function validateMapping(mapping: ColumnMapping): { valid: boolean; error?: string } {
  const mappedFields = new Set(Object.values(mapping).filter(Boolean));
  const hasIdentifier = IDENTIFIER_FIELDS.some((f) => mappedFields.has(f));
  if (!hasIdentifier) {
    return {
      valid: false,
      error: "At least one identifier must be mapped: Username, Email, or Profile Link",
    };
  }
  return { valid: true };
}

export async function parseXlsxPreview(
  file: File,
): Promise<{ headers: string[]; previewRows: Record<string, unknown>[] }> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets[sheetName],
  );

  // Remove last row (scraper "upgrade to premium" notice)
  if (rows.length > 1) rows.pop();

  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  const previewRows = rows.slice(0, 5);

  return { headers, previewRows };
}
