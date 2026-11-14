import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PipelineCard } from "./PipelineCard";
import { useAgentStats } from "@/hooks/useAgent";

vi.mock("@/hooks/useAgent", () => ({ useAgentStats: vi.fn() }));
const mockStats = vi.mocked(useAgentStats);

function setData(data: unknown, extra: Record<string, unknown> = {}) {
  mockStats.mockReturnValue({
    data,
    isLoading: false,
    isError: false,
    ...extra,
  } as unknown as ReturnType<typeof useAgentStats>);
}

describe("PipelineCard", () => {
  it("renders every stage in order with counts, missing stages as 0", () => {
    setData({ stages: { new: 7, pitched: 2, won: 1 }, lead_magnets: {} });
    render(<PipelineCard />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(9);
    expect(items[0]).toHaveTextContent("New");
    expect(items[0]).toHaveTextContent("7");
    expect(screen.getByTestId("stage-pitched")).toHaveTextContent("2");
    expect(screen.getByTestId("stage-qualifying")).toHaveTextContent("0");
    expect(items[7]).toHaveTextContent("Won");
    expect(items[8]).toHaveTextContent("Lost");
  });

  it("shows an error line when the stats fail", () => {
    setData(undefined, { isError: true });
    render(<PipelineCard />);
    expect(screen.getByText("Couldn't load pipeline")).toBeInTheDocument();
  });
});
