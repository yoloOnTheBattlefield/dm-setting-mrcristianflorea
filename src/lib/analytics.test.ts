import { describe, it, expect } from "vitest";
import {
  calculateFunnelMetrics,
  calculateVelocityMetrics,
  calculateGhostingBuckets,
  calculateFupEffectiveness,
  calculateCumulativeBookings,
} from "./analytics";
import { Contact } from "./types";

function makeContact(overrides: Partial<Contact> = {}): Contact {
  return {
    contactId: "c" + Math.random().toString(36).slice(2, 8),
    name: "Test User",
    dateCreated: new Date().toISOString(),
    bookedDate: null,
    ghostedDate: null,
    fupDate: null,
    ...overrides,
  };
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

describe("calculateFunnelMetrics", () => {
  it("returns zeros for empty contacts", () => {
    const result = calculateFunnelMetrics([], 30);
    expect(result.totalContacts).toBe(0);
    expect(result.bookedCount).toBe(0);
    expect(result.bookingRate).toBe(0);
    expect(result.ghostedCount).toBe(0);
    expect(result.ghostRate).toBe(0);
  });

  it("calculates booking rate correctly", () => {
    const contacts = [
      makeContact({ dateCreated: daysAgo(5), bookedDate: daysAgo(3) }),
      makeContact({ dateCreated: daysAgo(5) }),
      makeContact({ dateCreated: daysAgo(5) }),
      makeContact({ dateCreated: daysAgo(5) }),
    ];
    const result = calculateFunnelMetrics(contacts, 30);
    expect(result.totalContacts).toBe(4);
    expect(result.bookedCount).toBe(1);
    expect(result.bookingRate).toBe(25);
  });

  it("calculates ghost rate correctly", () => {
    const contacts = [
      makeContact({ dateCreated: daysAgo(5), ghostedDate: daysAgo(2) }),
      makeContact({ dateCreated: daysAgo(5), ghostedDate: daysAgo(1) }),
      makeContact({ dateCreated: daysAgo(5) }),
    ];
    const result = calculateFunnelMetrics(contacts, 30);
    expect(result.ghostedCount).toBe(2);
    expect(result.ghostRate).toBeCloseTo(66.67, 1);
  });

  it("does not count booked contacts as ghosted", () => {
    const contacts = [
      makeContact({
        dateCreated: daysAgo(5),
        ghostedDate: daysAgo(3),
        bookedDate: daysAgo(1), // recovered
      }),
    ];
    const result = calculateFunnelMetrics(contacts, 30);
    expect(result.ghostedCount).toBe(0);
    expect(result.bookedCount).toBe(1);
  });

  it("calculates follow-up recovery rate", () => {
    const contacts = [
      makeContact({ dateCreated: daysAgo(5), fupDate: daysAgo(3), bookedDate: daysAgo(1) }),
      makeContact({ dateCreated: daysAgo(5), fupDate: daysAgo(3) }),
    ];
    const result = calculateFunnelMetrics(contacts, 30);
    expect(result.fupCount).toBe(2);
    expect(result.fupToBookedCount).toBe(1);
    expect(result.recoveryRate).toBe(50);
  });

  it("filters by date range", () => {
    const contacts = [
      makeContact({ dateCreated: daysAgo(5) }), // within 7 days
      makeContact({ dateCreated: daysAgo(10) }), // outside 7 days
    ];
    const result = calculateFunnelMetrics(contacts, 7);
    expect(result.totalContacts).toBe(1);
  });
});

describe("calculateVelocityMetrics", () => {
  it("returns zeros for empty contacts", () => {
    const result = calculateVelocityMetrics([], 30);
    expect(result.linkSentToBooked.median).toBe(0);
    expect(result.linkSentToBooked.average).toBe(0);
    expect(result.createdToGhosted.median).toBe(0);
  });

  it("calculates created-to-booked hours", () => {
    const contacts = [
      makeContact({
        dateCreated: daysAgo(2),
        bookedDate: daysAgo(1), // ~24 hours later
      }),
    ];
    const result = calculateVelocityMetrics(contacts, 30);
    expect(result.linkSentToBooked.median).toBeGreaterThan(20); // ~24h
    expect(result.linkSentToBooked.median).toBeLessThan(28);
  });
});

describe("calculateGhostingBuckets", () => {
  it("returns all buckets with zero for empty contacts", () => {
    const result = calculateGhostingBuckets([], 30);
    expect(result).toHaveLength(4);
    result.forEach((b) => expect(b.count).toBe(0));
  });

  it("categorizes ghosts by time to ghost", () => {
    const now = new Date();
    const contacts = [
      makeContact({
        dateCreated: now.toISOString(),
        ghostedDate: new Date(now.getTime() + 2 * 3600 * 1000).toISOString(), // same day
      }),
      makeContact({
        dateCreated: daysAgo(5),
        ghostedDate: daysAgo(2), // 3 days later
      }),
    ];
    const result = calculateGhostingBuckets(contacts, 30);
    const sameDay = result.find((b) => b.bucket === "Same day");
    const twoDays = result.find((b) => b.bucket === "2-3 days");
    expect(sameDay!.count).toBe(1);
    expect(twoDays!.count).toBe(1);
  });
});

describe("calculateFupEffectiveness", () => {
  it("returns zeros for no follow-ups", () => {
    const result = calculateFupEffectiveness([], 30);
    expect(result.totalFup).toBe(0);
    expect(result.conversionRate).toBe(0);
  });

  it("calculates conversion rate", () => {
    const contacts = [
      makeContact({ dateCreated: daysAgo(5), fupDate: daysAgo(3), bookedDate: daysAgo(1) }),
      makeContact({ dateCreated: daysAgo(5), fupDate: daysAgo(3) }),
      makeContact({ dateCreated: daysAgo(5), fupDate: daysAgo(3) }),
    ];
    const result = calculateFupEffectiveness(contacts, 30);
    expect(result.totalFup).toBe(3);
    expect(result.convertedToBooked).toBe(1);
    expect(result.conversionRate).toBeCloseTo(33.33, 1);
    expect(result.remainingInactive).toBe(2);
  });
});

describe("calculateCumulativeBookings", () => {
  it("returns entries for each day in range", () => {
    const result = calculateCumulativeBookings([], 7);
    expect(result).toHaveLength(7);
    expect(result[0].cumulative).toBe(0);
  });

  it("accumulates bookings over time", () => {
    const contacts = [
      makeContact({ dateCreated: daysAgo(3), bookedDate: daysAgo(2) }),
      makeContact({ dateCreated: daysAgo(3), bookedDate: daysAgo(1) }),
    ];
    const result = calculateCumulativeBookings(contacts, 7);
    const lastEntry = result[result.length - 1];
    expect(lastEntry.cumulative).toBe(2);
  });
});
