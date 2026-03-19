import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "./useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello", 500));
    expect(result.current).toBe("hello");
  });

  it("does not update before the delay elapses", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: "initial" } },
    );
    rerender({ value: "updated" });
    act(() => { vi.advanceTimersByTime(400); });
    expect(result.current).toBe("initial");
  });

  it("updates after the delay elapses", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: "initial" } },
    );
    rerender({ value: "updated" });
    act(() => { vi.advanceTimersByTime(500); });
    expect(result.current).toBe("updated");
  });

  it("resets the timer on rapid value changes", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: "a" } },
    );
    rerender({ value: "b" });
    act(() => { vi.advanceTimersByTime(300); });
    rerender({ value: "c" });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe("a"); // still not updated
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe("c"); // now updated with the last value
  });
});
