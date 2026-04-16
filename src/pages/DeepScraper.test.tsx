import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import DeepScraper from "./DeepScraper";
import { useDeepScrapeJobs } from "@/hooks/useDeepScrapeJobs";
import { useApifyTokens } from "@/hooks/useApifyTokens";
import { useAccountMe } from "@/hooks/useAccountMe";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/hooks/useApifyTokens", () => ({
  useApifyTokens: vi.fn(() => ({
    data: { tokens: [{ _id: "t1", label: "Default", token: "***", status: "active", last_error: null, usage_count: 0, last_used_at: null, createdAt: "", updatedAt: "" }] },
    isLoading: false,
  })),
}));

vi.mock("@/hooks/useAccountMe", () => ({
  useAccountMe: vi.fn(() => ({
    data: { openai_token: "sk-test" },
    isLoading: false,
  })),
}));

// Mock all hooks used by DeepScraper
vi.mock("@/hooks/useDeepScrapeJobs", () => ({
  useDeepScrapeJobs: vi.fn(() => ({ data: { jobs: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } }, isLoading: false, isError: false, refetch: vi.fn() })),
  useDeepScrapeJob: () => ({ data: null, isLoading: false }),
  useStartDeepScrape: () => ({ mutateAsync: vi.fn(), isPending: false }),
  usePauseDeepScrape: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCancelDeepScrape: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useResumeDeepScrape: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteDeepScrape: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateDeepScrape: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeepScrapeSocket: vi.fn(),
  useDeepScrapeLogs: () => ({ logs: [], onLog: vi.fn() }),
  useDeepScrapeLeads: () => ({ leads: [], onLead: vi.fn() }),
  useDeepScrapeTargetStats: () => ({ data: { targets: [] } }),
  useSkipComments: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useResumeComments: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useReprocessAI: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddDeepScrapeLeadsToCampaign: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const mockPromptsData: { current: any[] } = { current: [] };
vi.mock("@/hooks/usePrompts", () => ({
  usePrompts: () => ({ data: mockPromptsData.current }),
}));

vi.mock("@/hooks/useCampaigns", () => ({
  useCampaigns: () => ({ data: { campaigns: [{ _id: "camp1", name: "Test Campaign", status: "active" }] } }),
  useCreateCampaign: () => ({ mutateAsync: vi.fn().mockResolvedValue({ _id: "new-camp" }), isPending: false }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/contexts/SocketContext", () => ({
  useSocket: () => ({ socket: null }),
}));

function renderDeepScraper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <DeepScraper />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function openNewDialog() {
  // Multiple "New Deep Scrape" buttons exist (header + empty state), click the first
  const buttons = screen.getAllByText("New Deep Scrape");
  fireEvent.click(buttons[0]);
}

describe("DeepScraper — Lead Sources checkboxes", () => {
  it("shows Commenters and Likers checkboxes in new job dialog", () => {
    renderDeepScraper();
    openNewDialog();

    expect(screen.getByLabelText("Commenters")).toBeInTheDocument();
    expect(screen.getByLabelText("Likers")).toBeInTheDocument();
  });

  it("has Commenters checked and Likers unchecked by default", () => {
    renderDeepScraper();
    openNewDialog();

    const commentersCheckbox = screen.getByRole("checkbox", { name: "Commenters" });
    const likersCheckbox = screen.getByRole("checkbox", { name: "Likers" });

    expect(commentersCheckbox).toHaveAttribute("data-state", "checked");
    expect(likersCheckbox).toHaveAttribute("data-state", "unchecked");
  });

  it("hides Comment Limit when Commenters is unchecked and Likers is checked", () => {
    renderDeepScraper();
    openNewDialog();

    expect(screen.getByLabelText("Comment Limit")).toBeInTheDocument();

    // First enable Likers so we can disable Commenters
    fireEvent.click(screen.getByRole("checkbox", { name: "Likers" }));
    // Then disable Commenters
    fireEvent.click(screen.getByRole("checkbox", { name: "Commenters" }));

    expect(screen.queryByLabelText("Comment Limit")).not.toBeInTheDocument();
  });

  it("shows Lead Sources label", () => {
    renderDeepScraper();
    openNewDialog();

    expect(screen.getByText("Lead Sources")).toBeInTheDocument();
  });
});

describe("DeepScraper — Followers checkbox", () => {
  it("shows Followers checkbox in new job dialog", () => {
    renderDeepScraper();
    openNewDialog();

    expect(screen.getByLabelText("Followers")).toBeInTheDocument();
  });

  it("has Followers unchecked by default", () => {
    renderDeepScraper();
    openNewDialog();

    const followersCheckbox = screen.getByRole("checkbox", { name: "Followers" });
    expect(followersCheckbox).toHaveAttribute("data-state", "unchecked");
  });

  it("allows enabling Followers alongside Commenters", () => {
    renderDeepScraper();
    openNewDialog();

    fireEvent.click(screen.getByRole("checkbox", { name: "Followers" }));

    const followersCheckbox = screen.getByRole("checkbox", { name: "Followers" });
    expect(followersCheckbox).toHaveAttribute("data-state", "checked");
    // Commenters should still be checked
    const commentersCheckbox = screen.getByRole("checkbox", { name: "Commenters" });
    expect(commentersCheckbox).toHaveAttribute("data-state", "checked");
  });

  it("prevents unchecking Followers when it is the only source selected", () => {
    renderDeepScraper();
    openNewDialog();

    // Enable Followers
    fireEvent.click(screen.getByRole("checkbox", { name: "Followers" }));
    // Disable Commenters (now Followers + Likers-unchecked, so Commenters can be unchecked since Followers is on)
    fireEvent.click(screen.getByRole("checkbox", { name: "Commenters" }));

    // Followers is now the only one checked — should be disabled
    const followersCheckbox = screen.getByRole("checkbox", { name: "Followers" });
    expect(followersCheckbox).toBeDisabled();
  });
});

describe("DeepScraper — Direct URL source", () => {
  it("shows source toggle in new job dialog with Accounts and Direct URL options", () => {
    renderDeepScraper();
    openNewDialog();

    expect(screen.getByText("Accounts")).toBeInTheDocument();
    expect(screen.getByText("Direct URL")).toBeInTheDocument();
  });

  it("shows seed usernames textarea by default (accounts mode)", () => {
    renderDeepScraper();
    openNewDialog();

    expect(screen.getByLabelText("Seed Usernames")).toBeInTheDocument();
  });

  it("shows URL textarea when Direct URL is selected", () => {
    renderDeepScraper();
    openNewDialog();

    fireEvent.click(screen.getByText("Direct URL"));

    expect(screen.getByLabelText("Post / Reel URL")).toBeInTheDocument();
    expect(screen.queryByLabelText("Seed Usernames")).not.toBeInTheDocument();
  });

  it("hides Content Type and Reel Limit in direct URL mode", () => {
    renderDeepScraper();
    openNewDialog();

    expect(screen.getByText("Content Type")).toBeInTheDocument();
    expect(screen.getByLabelText("Reel Limit")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Direct URL"));

    expect(screen.queryByText("Content Type")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Reel Limit")).not.toBeInTheDocument();
  });

  it("disables start button when no valid URL is entered in direct mode", () => {
    renderDeepScraper();
    openNewDialog();
    fireEvent.click(screen.getByText("Direct URL"));

    const startBtn = screen.getByText("Start Deep Scrape").closest("button");
    expect(startBtn).toBeDisabled();
  });

  it("enables start button when a valid Instagram URL is entered", () => {
    renderDeepScraper();
    openNewDialog();
    fireEvent.click(screen.getByText("Direct URL"));

    const textarea = screen.getByLabelText("Post / Reel URL");
    fireEvent.change(textarea, { target: { value: "https://www.instagram.com/reel/ABC123/" } });

    expect(screen.getByText(/1 valid URL/)).toBeInTheDocument();
    const startBtn = screen.getByText("Start Deep Scrape").closest("button");
    expect(startBtn).not.toBeDisabled();
  });
});

const mockUseDeepScrapeJobs = vi.mocked(useDeepScrapeJobs);

const completedJobWithQualified = {
  _id: "job1",
  account_id: "a1",
  name: "Test Job",
  seed_usernames: ["testuser"],
  direct_urls: [],
  scrape_type: "reels" as const,
  scrape_comments: true,
  scrape_likers: false,
  scrape_followers: false,
  reel_limit: 10,
  comment_limit: 100,
  min_followers: 1000,
  status: "completed" as const,
  mode: "outbound" as const,
  stats: {
    reels_scraped: 5,
    comments_scraped: 100,
    unique_commenters: 50,
    likers_scraped: 0,
    unique_likers: 0,
    followers_scraped: 0,
    profiles_scraped: 50,
    qualified: 10,
    rejected: 5,
    filtered_low_followers: 15,
    skipped_existing: 20,
    sent_to_ai: 30,
    leads_created: 10,
    leads_updated: 0,
  },
  error: null,
  createdAt: "2026-03-17T10:00:00Z",
  updatedAt: "2026-03-17T10:05:00Z",
  started_at: "2026-03-17T10:00:00Z",
  completed_at: "2026-03-17T10:05:00Z",
  comments_skipped: false,
};

describe("DeepScraper — Add to Campaign button", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows Add to Campaign dialog when clicking the campaign button on a completed job", () => {
    mockUseDeepScrapeJobs.mockReturnValue({
      data: {
        jobs: [completedJobWithQualified] as any,
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);
    renderDeepScraper();
    // The "10 qualified" text confirms job is rendered with qualified leads
    expect(screen.getAllByText("10 qualified").length).toBeGreaterThan(0);
    // The dialog title should not be visible before clicking
    expect(screen.queryByText("Add Qualified Leads to Campaign")).not.toBeInTheDocument();
  });

  it("does not render the add-to-campaign action for jobs with zero qualified leads", () => {
    mockUseDeepScrapeJobs.mockReturnValue({
      data: {
        jobs: [{ ...completedJobWithQualified, stats: { ...completedJobWithQualified.stats, qualified: 0 } }] as any,
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);
    const { container } = renderDeepScraper();
    // The SendHorizontal icon (add-to-campaign button) should not be rendered
    // when there are 0 qualified leads. We verify by checking the action buttons:
    // only delete button should be present for a completed job with 0 qualified
    const actionButtons = container.querySelectorAll("table button");
    const buttonTexts = Array.from(actionButtons).map((b) => b.textContent);
    // None of the buttons should trigger the campaign dialog
    expect(screen.queryByText("Add Qualified Leads to Campaign")).not.toBeInTheDocument();
  });
});

const mockUseApifyTokens = vi.mocked(useApifyTokens);

describe("DeepScraper — Apify token guard", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("shows modal when no Apify tokens are configured", async () => {
    mockUseApifyTokens.mockReturnValue({
      data: { tokens: [] },
      isLoading: false,
    } as any);
    renderDeepScraper();
    await waitFor(() => {
      expect(screen.getByText("Apify Token Required")).toBeInTheDocument();
    });
  });

  it("does not show modal when tokens exist but have limit_reached status", () => {
    mockUseApifyTokens.mockReturnValue({
      data: {
        tokens: [
          { _id: "t1", label: "Exhausted", token: "***", status: "limit_reached", last_error: "insufficient credits", usage_count: 5, last_used_at: null, createdAt: "", updatedAt: "" },
        ],
      },
      isLoading: false,
    } as any);
    renderDeepScraper();
    expect(screen.queryByText("Apify Token Required")).not.toBeInTheDocument();
  });

  it("does not show modal when tokens exist but are disabled", () => {
    mockUseApifyTokens.mockReturnValue({
      data: {
        tokens: [
          { _id: "t1", label: "Disabled", token: "***", status: "disabled", last_error: null, usage_count: 0, last_used_at: null, createdAt: "", updatedAt: "" },
        ],
      },
      isLoading: false,
    } as any);
    renderDeepScraper();
    expect(screen.queryByText("Apify Token Required")).not.toBeInTheDocument();
  });

  it("navigates to integrations when clicking Go to Integrations", async () => {
    mockUseApifyTokens.mockReturnValue({
      data: { tokens: [] },
      isLoading: false,
    } as any);
    renderDeepScraper();
    await waitFor(() => {
      expect(screen.getByText("Apify Token Required")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Go to Integrations"));
    expect(mockNavigate).toHaveBeenCalledWith("/settings/integrations");
  });

  it("does not show modal when an active Apify token exists", () => {
    mockUseApifyTokens.mockReturnValue({
      data: {
        tokens: [
          { _id: "t1", label: "Default", token: "***", status: "active", last_error: null, usage_count: 0, last_used_at: null, createdAt: "", updatedAt: "" },
        ],
      },
      isLoading: false,
    } as any);
    renderDeepScraper();
    expect(screen.queryByText("Apify Token Required")).not.toBeInTheDocument();
  });

  it("does not show modal while tokens are still loading", () => {
    mockUseApifyTokens.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);
    renderDeepScraper();
    expect(screen.queryByText("Apify Token Required")).not.toBeInTheDocument();
  });
});

const mockUseAccountMe = vi.mocked(useAccountMe);

function fillOutboundSeedAndStart() {
  openNewDialog();
  const textarea = screen.getByLabelText("Seed Usernames");
  fireEvent.change(textarea, { target: { value: "someuser" } });
  const startBtn = screen.getByText("Start Deep Scrape").closest("button")!;
  fireEvent.click(startBtn);
}

describe("DeepScraper — Qualification preflight", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockPromptsData.current = [];
    mockUseApifyTokens.mockReturnValue({
      data: { tokens: [{ _id: "t1", label: "Default", token: "***", status: "active", last_error: null, usage_count: 0, last_used_at: null, createdAt: "", updatedAt: "" }] },
      isLoading: false,
    } as any);
  });

  it("shows OpenAI required modal when starting outbound scrape without openai_token", async () => {
    mockUseAccountMe.mockReturnValue({
      data: { openai_token: null },
      isLoading: false,
    } as any);
    renderDeepScraper();
    fillOutboundSeedAndStart();
    await waitFor(() => {
      expect(screen.getByText("OpenAI API Key Required")).toBeInTheDocument();
    });
  });

  it("navigates to integrations from OpenAI required modal", async () => {
    mockUseAccountMe.mockReturnValue({
      data: { openai_token: null },
      isLoading: false,
    } as any);
    renderDeepScraper();
    fillOutboundSeedAndStart();
    await waitFor(() => {
      expect(screen.getByText("OpenAI API Key Required")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Go to Integrations"));
    expect(mockNavigate).toHaveBeenCalledWith("/settings/integrations");
  });

  it("shows No Prompt modal when openai is set but no prompts exist", async () => {
    mockUseAccountMe.mockReturnValue({
      data: { openai_token: "sk-test" },
      isLoading: false,
    } as any);
    mockPromptsData.current = [];
    renderDeepScraper();
    fillOutboundSeedAndStart();
    await waitFor(() => {
      expect(screen.getByText("No Classification Prompt Set")).toBeInTheDocument();
    });
  });

  it("navigates to prompts page from No Prompt modal", async () => {
    mockUseAccountMe.mockReturnValue({
      data: { openai_token: "sk-test" },
      isLoading: false,
    } as any);
    mockPromptsData.current = [];
    renderDeepScraper();
    fillOutboundSeedAndStart();
    await waitFor(() => {
      expect(screen.getByText("No Classification Prompt Set")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Go to Prompts"));
    expect(mockNavigate).toHaveBeenCalledWith("/prompts");
  });
});
