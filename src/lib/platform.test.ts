import { describe, it, expect } from "vitest";
import {
  normalizePlatform,
  getPlatformLabel,
  getProfileUrl,
  getHandleDisplay,
} from "./platform";

describe("platform helpers", () => {
  it("treats missing/unknown platform as instagram", () => {
    expect(normalizePlatform(undefined)).toBe("instagram");
    expect(normalizePlatform(null)).toBe("instagram");
    expect(normalizePlatform("twitter")).toBe("instagram");
    expect(normalizePlatform("linkedin")).toBe("linkedin");
  });

  it("labels each platform", () => {
    expect(getPlatformLabel("linkedin")).toBe("LinkedIn");
    expect(getPlatformLabel("instagram")).toBe("Instagram");
    expect(getPlatformLabel(undefined)).toBe("Instagram");
  });

  it("builds an Instagram profile URL by default", () => {
    expect(getProfileUrl({ username: "jane" })).toBe("https://instagram.com/jane");
  });

  it("builds a LinkedIn profile URL from the slug", () => {
    expect(getProfileUrl({ username: "john-doe-123", platform: "linkedin" })).toBe(
      "https://www.linkedin.com/in/john-doe-123",
    );
  });

  it("prefers an explicit profileLink over the derived URL", () => {
    expect(
      getProfileUrl({ username: "jane", platform: "linkedin", profileLink: "https://x.test/p" }),
    ).toBe("https://x.test/p");
  });

  it("renders IG handles with @ and LinkedIn slugs bare", () => {
    expect(getHandleDisplay({ username: "jane" })).toBe("@jane");
    expect(getHandleDisplay({ username: "@jane" })).toBe("@jane");
    expect(getHandleDisplay({ username: "john-doe", platform: "linkedin" })).toBe("john-doe");
  });
});
