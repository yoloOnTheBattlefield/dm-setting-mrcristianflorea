import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RelaunchCampaignDialog } from "./RelaunchCampaignDialog";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

const mockMutateAsync = vi.fn();
const mockCampaigns = [
  {
    _id: "c1",
    name: "Summer Outreach",
    status: "active",
    mode: "auto",
    stats: { total: 1000, pending: 700, sent: 300, failed: 0, skipped: 0, queued: 0 },
    ai_personalization: { enabled: true, prompt: "Write a friendly opener based on their bio", status: "completed", progress: 0, total: 0, error: null },
    messages: [],
    outbound_account_ids: [],
    schedule: {},
    daily_limit_per_sender: 50,
    last_sent_at: null,
    createdAt: "2025-06-01",
  },
  {
    _id: "c2",
    name: "Winter Campaign",
    status: "completed",
    mode: "auto",
    stats: { total: 500, pending: 0, sent: 500, failed: 0, skipped: 0, queued: 0 },
    ai_personalization: { enabled: false, prompt: null, status: "idle", progress: 0, total: 0, error: null },
    messages: [],
    outbound_account_ids: [],
    schedule: {},
    daily_limit_per_sender: 50,
    last_sent_at: null,
    createdAt: "2025-01-01",
  },
];

vi.mock("@/hooks/useCampaigns", () => ({
  useCampaigns: () => ({
    data: { campaigns: mockCampaigns, total: 2, page: 1, pages: 1 },
  }),
  useRelaunchCampaign: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

function renderDialog(open = true) {
  const onOpenChange = vi.fn();
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const result = render(
    <QueryClientProvider client={qc}>
      <RelaunchCampaignDialog open={open} onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  );
  return { ...result, onOpenChange };
}

describe("RelaunchCampaignDialog", () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockNavigate.mockReset();
  });

  it("renders the dialog with title and campaign selector", () => {
    renderDialog();
    expect(screen.getByText("Relaunch Campaign")).toBeInTheDocument();
    expect(screen.getByText("Select a campaign")).toBeInTheDocument();
  });

  it("disables relaunch button when no campaign is selected", () => {
    renderDialog();
    const btn = screen.getByRole("button", { name: /relaunch/i });
    expect(btn).toBeDisabled();
  });

  it("does not render when open is false", () => {
    renderDialog(false);
    expect(screen.queryByText("Relaunch Campaign")).not.toBeInTheDocument();
  });
});
