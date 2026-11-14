import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeadCalls } from "./LeadCalls";
import { useLeadBookings } from "@/hooks/useBookings";
import type { ApiLead } from "@/lib/types";

vi.mock("@/hooks/useBookings", async (orig) => {
  const actual = await orig<typeof import("@/hooks/useBookings")>();
  return { ...actual, useLeadBookings: vi.fn() };
});
const mockBookings = vi.mocked(useLeadBookings);

function setBookings(data: unknown) {
  mockBookings.mockReturnValue({ data, isLoading: false } as unknown as ReturnType<typeof useLeadBookings>);
}

const lead = (extra: Partial<ApiLead> = {}) => ({ _id: "L1", first_name: "A", last_name: "B", ...extra }) as ApiLead;

describe("LeadCalls", () => {
  it("shows the next call from next_booking with a join link, and the history", () => {
    setBookings([
      { _id: "b1", booking_date: "2026-11-01T10:00:00.000Z", status: "cancelled" },
      { _id: "b2", booking_date: "2030-11-19T15:00:00.000Z", status: "scheduled", meeting_url: "https://meet.google.com/x" },
    ]);
    render(
      <LeadCalls
        lead={lead({ next_booking: { start: "2030-11-19T15:00:00.000Z", status: "scheduled", meeting_url: "https://meet.google.com/x" } })}
      />,
    );
    expect(screen.getByRole("link", { name: "Join" })).toHaveAttribute("href", "https://meet.google.com/x");
    const rows = screen.getAllByTestId("call-history-row");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Scheduled");
    expect(rows[1]).toHaveTextContent("Cancelled");
  });

  it("falls back to a future scheduled booking when next_booking is missing", () => {
    setBookings([{ _id: "b2", booking_date: "2030-01-02T15:00:00.000Z", status: "scheduled", meeting_url: "https://meet.google.com/y" }]);
    render(<LeadCalls lead={lead()} />);
    expect(screen.getByRole("link", { name: "Join" })).toHaveAttribute("href", "https://meet.google.com/y");
  });

  it("shows a dash when there is no call", () => {
    setBookings([]);
    render(<LeadCalls lead={lead()} />);
    expect(screen.getByTestId("next-call")).toHaveTextContent("—");
    expect(screen.queryAllByTestId("call-history-row")).toHaveLength(0);
  });
});
