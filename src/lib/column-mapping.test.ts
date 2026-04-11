import { describe, it, expect, vi } from "vitest";
import { autoSuggestMapping, validateMapping, MAPPABLE_FIELDS, IDENTIFIER_FIELDS, parseXlsxPreview } from "./column-mapping";

const mockRows = [
  { Username: "alice", Email: "alice@test.com", Bio: "Coach" },
  { Username: "bob", Email: "bob@test.com", Bio: "Consultant" },
  { Username: "carol", Email: "carol@test.com", Bio: "Trainer" },
];

vi.mock("xlsx", () => {
  const mod = {
    read: () => ({
      SheetNames: ["Sheet1"],
      Sheets: { Sheet1: {} },
    }),
    utils: {
      sheet_to_json: () => [...mockRows],
    },
  };
  return { ...mod, default: mod };
});

describe("autoSuggestMapping", () => {
  it("maps exact header matches", () => {
    const mapping = autoSuggestMapping(["Username", "Email", "Biography"]);
    expect(mapping.Username).toBe("username");
    expect(mapping.Email).toBe("email");
    expect(mapping.Biography).toBe("bio");
  });

  it("matches case-insensitively", () => {
    const mapping = autoSuggestMapping(["USERNAME", "email", "BIOGRAPHY"]);
    expect(mapping.USERNAME).toBe("username");
    expect(mapping.email).toBe("email");
    expect(mapping.BIOGRAPHY).toBe("bio");
  });

  it("maps synonym headers", () => {
    const mapping = autoSuggestMapping(["IG Handle", "Follower Count", "DM Sent"]);
    expect(mapping["IG Handle"]).toBe("username");
    expect(mapping["Follower Count"]).toBe("followersCount");
    expect(mapping["DM Sent"]).toBe("isMessaged");
  });

  it("returns null for unrecognized headers", () => {
    const mapping = autoSuggestMapping(["Random Column", "Unknown Field"]);
    expect(mapping["Random Column"]).toBeNull();
    expect(mapping["Unknown Field"]).toBeNull();
  });

  it("does not assign the same field twice", () => {
    const mapping = autoSuggestMapping(["Email", "Public Email"]);
    const fields = Object.values(mapping).filter(Boolean);
    const unique = new Set(fields);
    expect(fields.length).toBe(unique.size);
  });

  it("prefers longer synonym matches", () => {
    // "instagram handle" is longer than "handle", both map to username
    const mapping = autoSuggestMapping(["Instagram Handle"]);
    expect(mapping["Instagram Handle"]).toBe("username");
  });

  it("handles empty headers array", () => {
    const mapping = autoSuggestMapping([]);
    expect(Object.keys(mapping)).toHaveLength(0);
  });
});

describe("validateMapping", () => {
  it("is valid when username is mapped", () => {
    const result = validateMapping({ Col1: "username", Col2: "fullName" });
    expect(result.valid).toBe(true);
  });

  it("is valid when email is mapped", () => {
    const result = validateMapping({ Col1: "email" });
    expect(result.valid).toBe(true);
  });

  it("is valid when profileLink is mapped", () => {
    const result = validateMapping({ Col1: "profileLink" });
    expect(result.valid).toBe(true);
  });

  it("is invalid when no identifier is mapped", () => {
    const result = validateMapping({ Col1: "fullName", Col2: "bio" });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/identifier/i);
  });

  it("is invalid when all columns are ignored", () => {
    const result = validateMapping({ Col1: null, Col2: null });
    expect(result.valid).toBe(false);
  });
});

describe("MAPPABLE_FIELDS", () => {
  it("has username, email, profileLink as identifiers", () => {
    const identifiers = MAPPABLE_FIELDS.filter((f) => f.isIdentifier).map((f) => f.key);
    expect(identifiers).toContain("username");
    expect(identifiers).toContain("email");
    expect(identifiers).toContain("profileLink");
  });
});

describe("IDENTIFIER_FIELDS", () => {
  it("contains the three identifier field keys", () => {
    expect(IDENTIFIER_FIELDS).toEqual(["username", "email", "profileLink"]);
  });
});

describe("parseXlsxPreview", () => {
  function makeFile(name: string) {
    const file = new File(["data"], name);
    Object.defineProperty(file, "arrayBuffer", {
      value: () => Promise.resolve(new ArrayBuffer(0)),
    });
    return file;
  }

  it("parses a .xlsx file and returns headers and preview rows", async () => {
    const result = await parseXlsxPreview(makeFile("leads.xlsx"));
    expect(result.headers).toEqual(["Username", "Email", "Bio"]);
    // mockRows has 3 rows, last row removed by scraper notice logic → 2 rows
    expect(result.previewRows).toHaveLength(2);
  });

  it("parses a .csv file the same way as .xlsx", async () => {
    const result = await parseXlsxPreview(makeFile("leads.csv"));
    expect(result.headers).toEqual(["Username", "Email", "Bio"]);
    expect(result.previewRows).toHaveLength(2);
  });

  it("returns the same headers for both file types", async () => {
    const xlsx = await parseXlsxPreview(makeFile("data.xlsx"));
    const csv = await parseXlsxPreview(makeFile("data.csv"));
    expect(xlsx.headers).toEqual(csv.headers);
    expect(xlsx.previewRows).toEqual(csv.previewRows);
  });
});
