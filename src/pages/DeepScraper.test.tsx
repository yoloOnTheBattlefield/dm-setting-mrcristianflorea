import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import DeepScraper from "./DeepScraper";

// Mock all hooks used by DeepScraper
vi.mock("@/hooks/useDeepScrapeJobs", () => ({
  useDeepScrapeJobs: () => ({ data: { jobs: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } }, isLoading: false, isError: false, refetch: vi.fn() }),
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
}));

vi.mock("@/hooks/usePrompts", () => ({
  usePrompts: () => ({ data: [] }),
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
