import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from "react";

/**
 * Like useState, but persists the value to localStorage under the given key.
 * Falls back to `defaultValue` when nothing is stored or parsing fails.
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setStateRaw] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) return JSON.parse(stored) as T;
    } catch {
      // ignore parse errors
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [key, state]);

  return [state, setStateRaw];
}

/**
 * Read a persisted value (or return `fallback`) without subscribing to changes.
 * Useful when URL params take priority but localStorage is the fallback.
 */
export function readPersisted<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored !== null) return JSON.parse(stored) as T;
  } catch {
    // ignore
  }
  return fallback;
}

/**
 * Write a value to localStorage (fire-and-forget).
 */
export function writePersisted<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}
