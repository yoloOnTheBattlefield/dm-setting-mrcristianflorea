import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import Campaigns from "./Campaigns";

const mockCampaigns = [
  {
    _id: "c1",
    name: "Test Campaign",
    status: "active",
    mode: "auto",
    messages: ["Hey {{firstName}}!"],
    outbound_account_ids: ["oa1"],
    stats: { total: 100, pending: 50, queued: 0, sent: 45, delivered: 0, replied: 5, link_sent: 0, booked: 0, failed: 0, skipped: 0, without_message: 0 },
    schedule: { active_hours_start: 9, active_hours_end: 21, timezone: "UTC", burst_enabled: false, min_delay_seconds: 60, max_delay_seconds: 180, messages_per_group: 10, min_group_break_seconds: 600, max_group_break_seconds: 1200, skip_wait_time: false },
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    _id: "c2",
    name: "Paused Campaign",
    status: "paused",
    mode: "manual",
    messages: ["Hi there"],
    outbound_account_ids: [],
    stats: { total: 20, pending: 20, queued: 0, sent: 0, delivered: 0, replied: 0, link_sent: 0, booked: 0, failed: 0, skipped: 0, without_message: 0 },
    schedule: { active_hours_start: 9, active_hours_end: 21, timezone: "UTC", burst_enabled: false, min_delay_seconds: 60, max_delay_seconds: 180, messages_per_group: 10, min_group_break_seconds: 600, max_group_break_seconds: 1200, skip_wait_time: false },
    createdAt: "2026-01-02T00:00:00Z",
  },
];

const dummyMutation = { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false };

vi.mock("@/hooks/useCampaigns", () => ({
  useCampaigns: () => ({
    data: {
      campaigns: mockCampaigns,
      pagination: { page: 1, limit: 1000, total: 2, totalPages: 1 },
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useCampaign: () => ({ data: null, isLoading: false }),
  useCampaignStats: () => ({ data: null }),
  useCampaignNextSend: () => ({ data: null }),
  useCampaignLeads: () => ({ data: null, isLoading: false }),
  useCampaignSenders: () => ({ data: null }),
  useCreateCampaign: () => dummyMutation,
  useUpdateCampaign: () => dummyMutation,
  useDeleteCampaign: () => dummyMutation,
  useRecalcCampaignStats: () => dummyMutation,
  useStartCampaign: () => dummyMutation,
  usePauseCampaign: () => dummyMutation,
  useRetryCampaignLeads: () => dummyMutation,
  useUpdateCampaignLeadStatus: () => dummyMutation,
  useAddCampaignLeads: () => dummyMutation,
  useDuplicateCampaign: () => dummyMutation,
  useRemoveSelectedCampaignLeads: () => dummyMutation,
  useRemoveCampaignLeads: () => dummyMutation,
  useSaveAIPrompt: () => dummyMutation,
  useGenerateMessages: () => dummyMutation,
  usePreviewMessage: () => dummyMutation,
  useRegenerateLeadMessage: () => dummyMutation,
  useEditLeadMessage: () => dummyMutation,
  useClearMessages: () => dummyMutation,
}));

vi.mock("@/hooks/useOutboundAccounts", () => ({
  useOutboundAccounts: () => ({
    data: {
      accounts: [{ _id: "oa1", username: "sender1", status: "ready" }],
      pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
    },
    isLoading: false,
  }),
}));

vi.mock("@/contexts/SocketContext", () => ({
  useSocket: () => ({ socket: null }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", account_id: "a1", role: 1, has_outbound: true },
  }),
}));

vi.mock("@/lib/api", () => ({
  API_URL: "https://api.test",
  fetchWithAuth: vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
  ),
}));

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <TooltipProvider>
          <Campaigns />
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Campaigns page", () => {
  it("renders page header", () => {
    renderPage();
    expect(screen.getByText("Campaigns")).toBeInTheDocument();
  });

  it("renders stat line with campaign count", () => {
    renderPage();
    expect(screen.getByText(/2 campaigns/)).toBeInTheDocument();
    expect(screen.getByText(/1 active/)).toBeInTheDocument();
  });

  it("renders campaign names", () => {
    renderPage();
    expect(screen.getByText("Test Campaign")).toBeInTheDocument();
    expect(screen.getByText("Paused Campaign")).toBeInTheDocument();
  });
});
