import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import CampaignDetail from "./CampaignDetail";

const mockCampaign = {
  _id: "c1",
  account_id: "a1",
  name: "Test Campaign",
  status: "paused" as const,
  mode: "auto" as const,
  messages: ["Hey {{firstName}}!"],
  outbound_account_ids: ["oa1"],
  stats: { total: 10, pending: 5, queued: 0, sent: 3, delivered: 0, replied: 2, link_sent: 0, booked: 0, failed: 0, skipped: 0, without_message: 0 },
  schedule: { active_hours_start: 9, active_hours_end: 21, timezone: "UTC", burst_enabled: false, min_delay_seconds: 60, max_delay_seconds: 180, messages_per_group: 10, min_group_break_seconds: 600, max_group_break_seconds: 1200, skip_wait_time: false, skip_active_hours: false },
  daily_limit_per_sender: 50,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const mockSendersData = {
  senders: [
    {
      _id: "s1",
      ig_username: "sender1",
      display_name: null,
      status: "online" as const,
      last_seen: "2026-01-01T12:00:00Z",
      daily_limit: 50,
      sent_today: 10,
      failed_total: 0,
      reply_rate_7d: 15,
      is_connected_to_ai: false,
      health: "good" as const,
      issue: null,
      outbound_account: { _id: "oa1", username: "sender1", status: "ready", streak_rest_until: null },
    },
  ],
  summary: { total: 1, online: 1, offline: 0, issues: 0 },
};

const mockOutboundAccounts = [
  { _id: "oa1", username: "sender1", status: "ready", linked_sender_status: "online" },
  { _id: "oa2", username: "sender2", status: "ready", linked_sender_status: "offline" },
  { _id: "oa3", username: "sender3", status: "warming", linked_sender_status: null },
];

const mockMutateAsync = vi.fn(() => Promise.resolve({}));
const dummyMutation = { mutate: vi.fn(), mutateAsync: vi.fn(() => Promise.resolve({})), isPending: false };

vi.mock("@/hooks/useCampaigns", () => ({
  useCampaign: () => ({ data: mockCampaign, isLoading: false }),
  useCampaignStats: () => ({ data: mockCampaign.stats }),
  useCampaignNextSend: () => ({ data: null }),
  useCampaignLeads: () => ({ data: { leads: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } }, isLoading: false }),
  useCampaignSenders: () => ({ data: mockSendersData }),
  useCampaigns: () => ({ data: { campaigns: [mockCampaign], pagination: { page: 1, limit: 100, total: 1, totalPages: 1 } } }),
  useStartCampaign: () => dummyMutation,
  usePauseCampaign: () => dummyMutation,
  useRemoveCampaignLeads: () => dummyMutation,
  useRemoveSelectedCampaignLeads: () => dummyMutation,
  useRetryCampaignLeads: () => dummyMutation,
  useDuplicateCampaign: () => dummyMutation,
  useRecalcCampaignStats: () => dummyMutation,
  useUpdateCampaignLeadStatus: () => dummyMutation,
  useGenerateMessages: () => dummyMutation,
  usePreviewMessage: () => dummyMutation,
  useRegenerateLeadMessage: () => dummyMutation,
  useEditLeadMessage: () => dummyMutation,
  useClearMessages: () => dummyMutation,
  useMoveLeads: () => dummyMutation,
  useUpdateCampaign: () => ({ ...dummyMutation, mutateAsync: mockMutateAsync }),
}));

vi.mock("@/hooks/useOutboundAccounts", () => ({
  useOutboundAccounts: () => ({
    data: {
      accounts: mockOutboundAccounts,
      pagination: { page: 1, limit: 200, total: 3, totalPages: 1 },
    },
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useAIPrompts", () => ({
  useAIPrompts: () => ({ data: [] }),
  useCreateAIPrompt: () => dummyMutation,
  useUpdateAIPrompt: () => dummyMutation,
  useDeleteAIPrompt: () => dummyMutation,
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
  apiPost: vi.fn(() => Promise.resolve({})),
  apiPatch: vi.fn(() => Promise.resolve({})),
  apiDelete: vi.fn(() => Promise.resolve({})),
}));

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/campaigns/c1"]}>
        <Routes>
          <Route
            path="/campaigns/:id"
            element={
              <TooltipProvider>
                <CampaignDetail />
              </TooltipProvider>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("CampaignDetail Senders Modal", () => {
  it("opens senders modal and shows current senders", async () => {
    renderPage();
    const viewBtn = await screen.findByText("View Senders");
    await userEvent.click(viewBtn);
    expect(await screen.findByText("Campaign Senders")).toBeInTheDocument();
    expect(screen.getByText("@sender1")).toBeInTheDocument();
  });

  it("shows Edit Senders button for paused campaigns", async () => {
    renderPage();
    const viewBtn = await screen.findByText("View Senders");
    await userEvent.click(viewBtn);
    expect(await screen.findByText("Edit Senders")).toBeInTheDocument();
  });

  it("switches to edit mode and shows outbound account checkboxes", async () => {
    renderPage();
    const viewBtn = await screen.findByText("View Senders");
    await userEvent.click(viewBtn);
    const editBtn = await screen.findByText("Edit Senders");
    await userEvent.click(editBtn);

    expect(screen.getByText("@sender1")).toBeInTheDocument();
    expect(screen.getByText("@sender2")).toBeInTheDocument();
    expect(screen.getByText("@sender3")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("saves updated senders when clicking Save", async () => {
    renderPage();
    const viewBtn = await screen.findByText("View Senders");
    await userEvent.click(viewBtn);
    const editBtn = await screen.findByText("Edit Senders");
    await userEvent.click(editBtn);

    // Toggle sender2 on (click the checkbox label for @sender2)
    const sender2Label = screen.getByText("@sender2").closest("label")!;
    await userEvent.click(sender2Label);

    const saveBtn = screen.getByText("Save");
    await userEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        id: "c1",
        body: { outbound_account_ids: ["oa1", "oa2"] },
      });
    });
  });

  it("cancels editing and returns to sender list view", async () => {
    renderPage();
    const viewBtn = await screen.findByText("View Senders");
    await userEvent.click(viewBtn);
    const editBtn = await screen.findByText("Edit Senders");
    await userEvent.click(editBtn);

    expect(screen.getByText("Save")).toBeInTheDocument();

    const cancelBtn = screen.getByText("Cancel");
    await userEvent.click(cancelBtn);

    // Should be back in view mode with the senders table
    await waitFor(() => {
      expect(screen.queryByText("Save")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Edit Senders")).toBeInTheDocument();
  });
});
