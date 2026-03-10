/**
 * Creates a throttled version of a callback that batches rapid invocations.
 * Only the latest args within each interval window are used.
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number,
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastCallTime = 0;

  const throttled = (...args: Parameters<T>) => {
    lastArgs = args;
    const now = Date.now();
    const remaining = ms - (now - lastCallTime);

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCallTime = now;
      lastArgs = null;
      fn(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        timeoutId = null;
        if (lastArgs) {
          fn(...lastArgs);
          lastArgs = null;
        }
      }, remaining);
    }
  };

  return throttled as T;
}
