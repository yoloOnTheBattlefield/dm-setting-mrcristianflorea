import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { UpcomingCalls } from "./UpcomingCalls";
import { useUpcomingCalls } from "@/hooks/useBookings";

vi.mock("@/hooks/useBookings", async (orig) => {
  const actual = await orig<typeof import("@/hooks/useBookings")>();
  return { ...actual, useUpcomingCalls: vi.fn() };
});
const mockCalls = vi.mocked(useUpcomingCalls);

function setData(data: unknown, extra: Record<string, unknown> = {}) {
  mockCalls.mockReturnValue({ data, isLoading: false, isError: false, ...extra } as unknown as ReturnType<
    typeof useUpcomingCalls
  >);
}

const renderCard = () =>
  render(
    <MemoryRouter>
      <UpcomingCalls />
    </MemoryRouter>,
  );

describe("UpcomingCalls", () => {
  it("lists calls with a lead link and a join button when there is a meeting url", () => {
    setData([
      { _id: "b1", lead_id: "L1", contact_name: "Miguel", booking_date: "2026-11-19T15:00:00.000Z", status: "scheduled", meeting_url: "https://meet.google.com/abc" },
      { _id: "b2", lead_id: null, ig_username: "amine", booking_date: "2026-11-20T15:00:00.000Z", status: "scheduled" },
    ]);
    renderCard();
    const rows = screen.getAllByTestId("upcoming-call");
    expect(rows).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Miguel" })).toHaveAttribute("href", "/lead/L1");
    expect(screen.getByRole("link", { name: "Join" })).toHaveAttribute("href", "https://meet.google.com/abc");
    expect(rows[1]).toHaveTextContent("@amine");
    expect(rows[1].querySelectorAll("a")).toHaveLength(0);
  });

  it("shows the empty line when nothing is scheduled", () => {
    setData([]);
    renderCard();
    expect(screen.getByText("No upcoming calls")).toBeInTheDocument();
  });
});
