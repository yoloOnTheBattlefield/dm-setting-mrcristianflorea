import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLeadSelection } from "./useLeadSelection";

describe("useLeadSelection", () => {
  it("starts in manual mode with empty selection", () => {
    const { result } = renderHook(() => useLeadSelection());
    expect(result.current.mode).toBe("manual");
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.excludedIds.size).toBe(0);
  });

  describe("manual mode", () => {
    it("toggle adds and removes ids", () => {
      const { result } = renderHook(() => useLeadSelection());

      act(() => result.current.toggle("a"));
      expect(result.current.isSelected("a")).toBe(true);

      act(() => result.current.toggle("a"));
      expect(result.current.isSelected("a")).toBe(false);
    });

    it("getCount returns selectedIds size", () => {
      const { result } = renderHook(() => useLeadSelection());

      act(() => {
        result.current.toggle("a");
        result.current.toggle("b");
      });

      expect(result.current.getCount(100)).toBe(2);
    });

    it("toggleAll selects all page ids when not all selected", () => {
      const { result } = renderHook(() => useLeadSelection());
      const pageIds = ["a", "b", "c"];

      act(() => result.current.toggleAll(pageIds));
      expect(result.current.isSelected("a")).toBe(true);
      expect(result.current.isSelected("b")).toBe(true);
      expect(result.current.isSelected("c")).toBe(true);
    });

    it("toggleAll deselects all page ids when all are selected", () => {
      const { result } = renderHook(() => useLeadSelection());
      const pageIds = ["a", "b"];

      act(() => result.current.toggleAll(pageIds)); // select all
      act(() => result.current.toggleAll(pageIds)); // deselect all

      expect(result.current.isSelected("a")).toBe(false);
      expect(result.current.isSelected("b")).toBe(false);
    });
  });

  describe("select-all mode", () => {
    it("selectAllMatching switches to select-all mode", () => {
      const { result } = renderHook(() => useLeadSelection());

      act(() => result.current.selectAllMatching());
      expect(result.current.mode).toBe("select-all");
    });

    it("isSelected returns true for non-excluded ids", () => {
      const { result } = renderHook(() => useLeadSelection());

      act(() => result.current.selectAllMatching());
      expect(result.current.isSelected("any")).toBe(true);
    });

    it("toggle excludes an id", () => {
      const { result } = renderHook(() => useLeadSelection());

      act(() => result.current.selectAllMatching());
      act(() => result.current.toggle("excluded"));

      expect(result.current.isSelected("excluded")).toBe(false);
      expect(result.current.isSelected("other")).toBe(true);
    });

    it("getCount returns total minus excluded", () => {
      const { result } = renderHook(() => useLeadSelection());

      act(() => result.current.selectAllMatching());
      act(() => result.current.toggle("x"));

      expect(result.current.getCount(100)).toBe(99);
    });
  });

  describe("clearSelection", () => {
    it("resets to manual mode with empty sets", () => {
      const { result } = renderHook(() => useLeadSelection());

      act(() => {
        result.current.selectAllMatching();
        result.current.toggle("a");
      });

      act(() => result.current.clearSelection());

      expect(result.current.mode).toBe("manual");
      expect(result.current.selectedIds.size).toBe(0);
      expect(result.current.excludedIds.size).toBe(0);
    });
  });
});
