import { describe, it, expect } from "vitest";
import { buildBulkDeletePayload, isSelectAllPayload } from "./bulkDelete";

const filters = { status: ["booked"], search: "ana", exclude_linked: true };

describe("buildBulkDeletePayload", () => {
  it("sends the checked ids in manual mode", () => {
    const payload = buildBulkDeletePayload(
      "manual",
      new Set(["a", "b"]),
      new Set(),
      filters
    );
    expect(payload).toEqual({ ids: ["a", "b"] });
  });

  it("sends filters instead of ids in select-all mode", () => {
    const payload = buildBulkDeletePayload(
      "select-all",
      new Set(),
      new Set(),
      filters
    );
    expect(payload).toEqual({ all: true, filters, exclude_ids: [] });
  });

  it("does not leak the loaded page ids in select-all mode", () => {
    // Regression: select-all used to delete only the ~20 leads on the current
    // page because the client sent its loaded ids.
    const loadedPage = new Set(Array.from({ length: 20 }, (_, i) => `id${i}`));
    const payload = buildBulkDeletePayload("select-all", loadedPage, new Set(), filters);
    expect(payload).not.toHaveProperty("ids");
    expect(isSelectAllPayload(payload)).toBe(true);
  });

  it("passes unchecked rows as exclude_ids in select-all mode", () => {
    const payload = buildBulkDeletePayload(
      "select-all",
      new Set(),
      new Set(["x", "y"]),
      filters
    );
    expect(isSelectAllPayload(payload) && payload.exclude_ids).toEqual(["x", "y"]);
  });

  it("ignores exclusions in manual mode", () => {
    const payload = buildBulkDeletePayload(
      "manual",
      new Set(["a"]),
      new Set(["b"]),
      filters
    );
    expect(payload).toEqual({ ids: ["a"] });
  });
});
