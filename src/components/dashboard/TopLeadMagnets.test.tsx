import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TopLeadMagnets } from "./TopLeadMagnets";
import { useLeadMagnetStats } from "@/hooks/useCommentRules";

vi.mock("@/hooks/useCommentRules", () => ({ useLeadMagnetStats: vi.fn() }));
const mockStats = vi.mocked(useLeadMagnetStats);

function setData(rules: unknown[]) {
  mockStats.mockReturnValue({
    data: { days: 30, rules },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useLeadMagnetStats>);
}

function renderCard() {
  return render(
    <MemoryRouter>
      <TopLeadMagnets days={30} />
    </MemoryRouter>,
  );
}

describe("TopLeadMagnets", () => {
  it("lists rules with requests in API order and passes days through", () => {
    setData([
      { rule_id: "r1", name: "FDA guide", keywords: ["FDA"], link_url: null, requests: 12, sent: 11, leads: 9, booked: 2 },
      { rule_id: "r2", name: null, keywords: ["jeremy"], link_url: null, requests: 3, sent: 3, leads: 3, booked: 0 },
      { rule_id: "r3", name: "Unused", keywords: ["x"], link_url: null, requests: 0, sent: 0, leads: 0, booked: 0 },
    ]);
    renderCard();
    expect(mockStats).toHaveBeenCalledWith(30);
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("FDA guide");
    expect(rows[0]).toHaveTextContent("12");
    expect(rows[1]).toHaveTextContent("jeremy");
    expect(screen.queryByText("Unused")).not.toBeInTheDocument();
  });

  it("shows the empty state when nothing was requested", () => {
    setData([]);
    renderCard();
    expect(screen.getByText("No requests yet")).toBeInTheDocument();
  });
});
