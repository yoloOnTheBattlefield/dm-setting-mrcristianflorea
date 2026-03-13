import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AIReportTab } from "./AIReportTab";

const mockMutateAsync = vi.fn().mockResolvedValue({ report_id: "r1", status: "generating" });

vi.mock("@/hooks/useAIReports", () => ({
  useGenerateAIReport: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useAIReports: () => ({
    data: [],
    isLoading: false,
  }),
  useAIReport: () => ({
    data: null,
  }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("AIReportTab", () => {
  it("renders empty state when no reports exist", () => {
    renderWithProviders(
      <AIReportTab filterParams={{ start_date: "2025-06-01", end_date: "2025-06-30" }} />
    );
    expect(screen.getByText("No reports yet")).toBeInTheDocument();
    expect(screen.getByText("Generate Report")).toBeInTheDocument();
  });

  it("calls generate mutation when Generate Report is clicked", async () => {
    renderWithProviders(
      <AIReportTab filterParams={{ start_date: "2025-06-01", end_date: "2025-06-30" }} />
    );

    fireEvent.click(screen.getByText("Generate Report"));
    expect(mockMutateAsync).toHaveBeenCalledWith({
      start_date: "2025-06-01",
      end_date: "2025-06-30",
    });
  });

  it("renders the AI Analytics Report heading", () => {
    renderWithProviders(
      <AIReportTab filterParams={{}} />
    );
    expect(screen.getByText("AI Analytics Report")).toBeInTheDocument();
  });
});
