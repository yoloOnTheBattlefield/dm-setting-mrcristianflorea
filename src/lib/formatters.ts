/**
 * Shared date/time/currency formatting utilities.
 */

/** "Jan 5, 2025" */
export function formatShortDate(dateString: string | null): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "Mon, Jan 5, 2025, 3:45 PM" */
export function formatAbsoluteDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "Jan 5, 3:45 PM" — date with time, no year */
export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "3:45 PM" */
export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "3m ago", "2h ago", "5d ago", "1mo ago" */
export function timeAgo(dateString: string | null | undefined): string {
  if (!dateString) return "";
  const now = Date.now();
  const then = new Date(dateString).getTime();
  if (isNaN(then)) return "";
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/** Compact variant: "3m", "2h", "5d", "1mo" (no "ago") */
export function timeAgoCompact(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

/** Number of whole days between two dates (or between a date and now) */
export function daysBetween(dateA: string, dateB: string | null = null): number {
  const a = new Date(dateA).getTime();
  const b = dateB ? new Date(dateB).getTime() : Date.now();
  return Math.floor(Math.abs(b - a) / (1000 * 60 * 60 * 24));
}

/** Number of whole days since a date (returns null if no date) */
export function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/** "$1,234" or "—" for null */
export function formatCurrency(val: number | null): string {
  if (val == null) return "—";
  return `$${val.toLocaleString()}`;
}

/** Duration in minutes → "45m", "1.5h", "2.0d" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
  return `${(minutes / 1440).toFixed(1)}d`;
}
