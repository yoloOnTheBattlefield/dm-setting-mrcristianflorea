import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LeadsBySource } from "./LeadsBySource";

const ROWS = [
  { source_type: "story", source_label: "Bonnie story", leads: 23, booked: 2, won: 1 },
  { source_type: "reel", source_label: "System", leads: 9, booked: 1, won: 0 },
  { source_type: "comment", source_label: "FDA", leads: 4, booked: 0, won: 0 },
  { source_type: "organic", source_label: null, leads: 3, booked: 0, won: 0 },
  { source_type: "unknown", source_label: null, leads: 2, booked: 0, won: 0 },
  { source_type: "post", source_label: "Carousel", leads: 1, booked: 0, won: 0 },
  { source_type: "other", source_label: null, leads: 0, booked: 0, won: 0 },
];

function renderCard(props: Partial<Parameters<typeof LeadsBySource>[0]> = {}) {
  return render(
    <MemoryRouter>
      <LeadsBySource rows={ROWS} {...props} />
    </MemoryRouter>,
  );
}

describe("LeadsBySource", () => {
  it("shows every source with leads, using display names", () => {
    renderCard();
    expect(screen.getByText("Story")).toBeInTheDocument();
    expect(screen.getByText("Bonnie story")).toBeInTheDocument();
    expect(screen.getByText("Unknown")).toBeInTheDocument();
    expect(screen.getByText("Carousel")).toBeInTheDocument();
    expect(screen.queryByText("Other")).not.toBeInTheDocument(); // 0 leads hidden
    expect(screen.getAllByRole("row")).toHaveLength(1 + 6);
  });

  it("limits to the top rows on the dashboard and links to Content", () => {
    renderCard({ limit: 5, showLink: true });
    expect(screen.getAllByRole("row")).toHaveLength(1 + 5);
    expect(screen.queryByText("Carousel")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Content" })).toHaveAttribute("href", "/analytics/content");
  });

  it("shows an empty state when there are no leads", () => {
    renderCard({ rows: [] });
    expect(screen.getByText("No leads yet")).toBeInTheDocument();
  });

  it("tolerates a missing by_source from an older backend", () => {
    renderCard({ rows: undefined });
    expect(screen.getByText("No leads yet")).toBeInTheDocument();
  });
});
