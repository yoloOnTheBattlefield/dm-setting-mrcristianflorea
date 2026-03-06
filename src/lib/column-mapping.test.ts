import { describe, it, expect } from "vitest";
import { autoSuggestMapping, validateMapping, MAPPABLE_FIELDS, IDENTIFIER_FIELDS } from "./column-mapping";

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
