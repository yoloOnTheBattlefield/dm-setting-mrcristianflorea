import { describe, it, expect } from "vitest";
import { leadDisplayName, leadInitials } from "./formatters";

describe("leadDisplayName", () => {
  it("prefers a real name", () => {
    expect(leadDisplayName("Ada", "Lovelace", "adal")).toBe("Ada Lovelace");
  });

  it("falls back to the handle when there is no name", () => {
    expect(leadDisplayName(null, null, "hayksimonyandev")).toBe("@hayksimonyandev");
  });

  it("does not double up the @ prefix", () => {
    expect(leadDisplayName(null, null, "@hayksimonyandev")).toBe("@hayksimonyandev");
  });

  it("treats the literal string 'null' as empty", () => {
    expect(leadDisplayName("null", "null", "someone")).toBe("@someone");
  });

  it("uses a first name alone", () => {
    expect(leadDisplayName("Ada", null, "adal")).toBe("Ada");
  });

  it("only says Unknown when there is no name and no handle", () => {
    expect(leadDisplayName(null, null, null)).toBe("Unknown");
    expect(leadDisplayName(null, null, "")).toBe("Unknown");
  });
});

describe("leadInitials", () => {
  it("uses both initials when a name exists", () => {
    expect(leadInitials("Ada", "Lovelace", "adal")).toBe("AL");
  });

  it("falls back to the handle's first letter", () => {
    expect(leadInitials(null, null, "hayksimonyandev")).toBe("H");
  });

  it("ignores a leading @ on the handle", () => {
    expect(leadInitials(null, null, "@zed")).toBe("Z");
  });

  it("returns ? with nothing to work from", () => {
    expect(leadInitials(null, null, null)).toBe("?");
  });
});
