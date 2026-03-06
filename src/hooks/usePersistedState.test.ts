import { describe, it, expect, beforeEach, vi } from "vitest";
import { readPersisted, writePersisted } from "./usePersistedState";

// We test the pure helper functions (readPersisted, writePersisted)
// since usePersistedState is a React hook that requires renderHook

beforeEach(() => {
  localStorage.clear();
});

describe("readPersisted", () => {
  it("returns fallback when key does not exist", () => {
    expect(readPersisted("missing", "default")).toBe("default");
  });

  it("returns stored value when key exists", () => {
    localStorage.setItem("myKey", JSON.stringify("stored"));
    expect(readPersisted("myKey", "default")).toBe("stored");
  });

  it("handles stored objects", () => {
    localStorage.setItem("obj", JSON.stringify({ a: 1 }));
    expect(readPersisted("obj", {})).toEqual({ a: 1 });
  });

  it("handles stored arrays", () => {
    localStorage.setItem("arr", JSON.stringify([1, 2, 3]));
    expect(readPersisted("arr", [])).toEqual([1, 2, 3]);
  });

  it("returns fallback for invalid JSON", () => {
    localStorage.setItem("bad", "not valid json{{{");
    expect(readPersisted("bad", "fallback")).toBe("fallback");
  });

  it("handles stored null", () => {
    localStorage.setItem("nullval", JSON.stringify(null));
    expect(readPersisted("nullval", "default")).toBeNull();
  });

  it("handles stored booleans", () => {
    localStorage.setItem("bool", JSON.stringify(false));
    expect(readPersisted("bool", true)).toBe(false);
  });

  it("handles stored numbers", () => {
    localStorage.setItem("num", JSON.stringify(42));
    expect(readPersisted("num", 0)).toBe(42);
  });
});

describe("writePersisted", () => {
  it("writes a string value", () => {
    writePersisted("key1", "hello");
    expect(localStorage.getItem("key1")).toBe('"hello"');
  });

  it("writes an object value", () => {
    writePersisted("key2", { x: 1 });
    expect(JSON.parse(localStorage.getItem("key2")!)).toEqual({ x: 1 });
  });

  it("writes null", () => {
    writePersisted("key3", null);
    expect(localStorage.getItem("key3")).toBe("null");
  });

  it("overwrites existing values", () => {
    writePersisted("key4", "first");
    writePersisted("key4", "second");
    expect(readPersisted("key4", "")).toBe("second");
  });
});
