import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AIReportTab } from "./AIReportTab";
import type { AIReportContent } from "@/hooks/useAIReports";

const mockMutateAsync = vi.fn().mockResolvedValue({ report_id: "r1", status: "generating" });

const fullReport: AIReportContent = {
  executive_summary: "Test summary",
  overall_health: "green",
  sender_analysis: { summary: "", rankings: [], recommendations: [] },
  message_strategy: { summary: "", top_performers: [], worst_performers: [], recommendations: [] },
  industry_analysis: { summary: "", best_niches: [], worst_niches: [], recommendations: [] },
  campaign_analysis: { summary: "", highlights: [], recommendations: [] },
  timing_analysis: { best_times: "9am", worst_times: "midnight", recommendations: [] },
  conversation_analysis: {
    summary: "Leads frequently push back on pricing",
    common_objections: [
      { objection: "too expensive", frequency: "very common", best_response: "Reframe value" },
    ],
    positive_patterns: [
      { pattern: "Ask about their goals first", example: "What are you working toward?", why_it_works: "Builds rapport" },
    ],
    negative_patterns: [
      { pattern: "Pitching too early", example: "We can help you grow", why_it_fails: "No trust built" },
    ],
    recommendations: ["Delay the pitch until the lead shares a pain point"],
  },
  action_items: [],
};

let mockSelectedReport: any = null;

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
    data: mockSelectedReport,
  }),
}));

vi.mock("./RelaunchCampaignDialog", () => ({
  RelaunchCampaignDialog: () => null,
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
  beforeEach(() => {
    mockSelectedReport = null;
    mockMutateAsync.mockClear();
  });

  it("renders empty state when no reports exist", () => {
    renderWithProviders(
      <AIReportTab filterParams={{ start_date: "2025-06-01", end_date: "2025-06-30" }} />
    );
    expect(screen.getByText("No reports yet")).toBeInTheDocument();
    expect(screen.getByText("Generate Report")).toBeInTheDocument();
  });

  it("renders the Relaunch button", () => {
    renderWithProviders(
      <AIReportTab filterParams={{}} />
    );
    expect(screen.getByText("Relaunch")).toBeInTheDocument();
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

  it("renders conversation analysis section when report has conversation data", () => {
    mockSelectedReport = { _id: "r1", status: "completed", report: fullReport };
    renderWithProviders(
      <AIReportTab filterParams={{}} />
    );

    expect(screen.getByText("Conversation Analysis")).toBeInTheDocument();
    expect(screen.getByText("Leads frequently push back on pricing")).toBeInTheDocument();
    expect(screen.getByText("Common Objections")).toBeInTheDocument();
    expect(screen.getByText(/too expensive/)).toBeInTheDocument();
    expect(screen.getByText("Patterns That Convert")).toBeInTheDocument();
    expect(screen.getByText("Ask about their goals first")).toBeInTheDocument();
    expect(screen.getByText("Patterns That Lose Leads")).toBeInTheDocument();
    expect(screen.getByText("Pitching too early")).toBeInTheDocument();
    expect(screen.getByText("Delay the pitch until the lead shares a pain point")).toBeInTheDocument();
  });
});
