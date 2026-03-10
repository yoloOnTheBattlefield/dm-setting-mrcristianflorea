import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { throttle } from "./throttle";

describe("throttle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls function immediately on first invocation", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 500);
    throttled("a");
    expect(fn).toHaveBeenCalledWith("a");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("suppresses calls within the throttle window", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 500);
    throttled("a");
    throttled("b");
    throttled("c");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("a");
  });

  it("fires trailing call with latest args after window expires", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 500);
    throttled("a");
    throttled("b");
    throttled("c");
    vi.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith("c");
  });

  it("allows a new call after the window has fully elapsed", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 500);
    throttled("a");
    vi.advanceTimersByTime(500);
    throttled("b");
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith("b");
  });

  it("does not fire trailing call if no intermediate calls", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 500);
    throttled("a");
    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("handles rapid bursts correctly", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    for (let i = 0; i < 50; i++) {
      throttled(i);
      vi.advanceTimersByTime(10);
    }
    vi.advanceTimersByTime(200);
    // First call immediate, then trailing calls as windows expire
    expect(fn.mock.calls.length).toBeGreaterThanOrEqual(5);
    expect(fn.mock.calls.length).toBeLessThanOrEqual(10);
  });
});
