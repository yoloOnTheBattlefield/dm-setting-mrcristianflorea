import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CampaignEdit from "./CampaignEdit";

const baseCampaign = {
  _id: "c1",
  account_id: "a1",
  name: "Test Campaign",
  mode: "auto" as const,
  status: "draft" as const,
  messages: ["Hello {{username}}"],
  outbound_account_ids: [],
  schedule: {
    active_hours_start: 9,
    active_hours_end: 21,
    min_delay_seconds: 60,
    max_delay_seconds: 180,
    timezone: "America/New_York",
    burst_enabled: false,
    messages_per_group: 10,
    min_group_break_seconds: 600,
    max_group_break_seconds: 1200,
    skip_wait_time: false,
    skip_active_hours: false,
  },
  daily_limit_per_sender: 50,
  warmup_days: 0,
  warmup_start_date: null,
  stats: { total: 0, pending: 0, queued: 0, sent: 0, delivered: 0, replied: 0, failed: 0, skipped: 0 },
  last_sent_at: null,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

vi.mock("@/hooks/useCampaigns", () => ({
  useCampaign: vi.fn(),
  useUpdateCampaign: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/useOutboundAccounts", () => ({
  useOutboundAccounts: vi.fn(() => ({ data: { accounts: [] } })),
}));

import { useCampaign } from "@/hooks/useCampaigns";
import { useOutboundAccounts } from "@/hooks/useOutboundAccounts";
const mockUseCampaign = vi.mocked(useCampaign);
const mockUseOutboundAccounts = vi.mocked(useOutboundAccounts);

function renderWithProviders(campaign: typeof baseCampaign) {
  mockUseCampaign.mockReturnValue({ data: campaign, isLoading: false } as any);
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/campaigns/c1/edit"]}>
        <Routes>
          <Route path="/campaigns/:id/edit" element={<CampaignEdit />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("CampaignEdit – AI badge on outbound accounts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows AI sparkle icon when account is connected to AI", () => {
    mockUseOutboundAccounts.mockReturnValue({
      data: {
        accounts: [
          { _id: "oa1", username: "aiuser", status: "ready", isConnectedToAISetter: true, linked_sender_status: null },
        ],
      },
    } as any);
    renderWithProviders(baseCampaign);
    expect(screen.getByTitle("Connected to AI")).toBeInTheDocument();
  });

  it("does not show AI sparkle icon when account is not connected to AI", () => {
    mockUseOutboundAccounts.mockReturnValue({
      data: {
        accounts: [
          { _id: "oa2", username: "normaluser", status: "ready", isConnectedToAISetter: false, linked_sender_status: null },
        ],
      },
    } as any);
    renderWithProviders(baseCampaign);
    expect(screen.queryByTitle("Connected to AI")).not.toBeInTheDocument();
  });
});

describe("CampaignEdit – Skip Wait Time toggle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not show the skip wait time toggle when mode is auto", () => {
    renderWithProviders({ ...baseCampaign, mode: "auto" });
    expect(screen.queryByText("Skip Wait Time")).not.toBeInTheDocument();
  });

  it("shows the skip wait time toggle when mode is manual", () => {
    renderWithProviders({ ...baseCampaign, mode: "manual" });
    expect(screen.getByText("Skip Wait Time")).toBeInTheDocument();
  });
});

describe("CampaignEdit – Send 24/7 toggle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the Send 24/7 toggle", () => {
    renderWithProviders(baseCampaign);
    expect(screen.getByText("Send 24/7")).toBeInTheDocument();
  });
});
