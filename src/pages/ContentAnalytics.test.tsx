import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import ContentAnalytics from "./ContentAnalytics";
import { useContentAnalytics, useSyncContentAnalytics } from "@/hooks/useContentAnalytics";

vi.mock("@/hooks/useContentAnalytics", () => ({
  useContentAnalytics: vi.fn(),
  useSyncContentAnalytics: vi.fn(),
}));

const toast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));

const mockData = vi.mocked(useContentAnalytics);
const mockSync = vi.mocked(useSyncContentAnalytics);

const POST = {
  media_id: "m1",
  permalink: "https://instagram.com/reel/abc",
  thumbnail_url: null,
  caption: "How I book calls from comments",
  media_product_type: "REELS",
  posted_at: "2026-09-01T00:00:00.000Z",
  views: 1939,
  reach: 1623,
  likes: 14,
  comments: 5,
  shares: 11,
  saved: 11,
  total_interactions: 41,
  insights_error: null,
  fetched_at: "2026-09-10T00:00:00.000Z",
  comments_matched: 4,
  dms_sent: 3,
  leads_generated: 2,
  leads_per_1k_views: 1.03,
};

const TOTALS = {
  posts: 1,
  views: 1939,
  likes: 14,
  comments: 5,
  shares: 11,
  saved: 11,
  leads_generated: 2,
};

let syncMutate: ReturnType<typeof vi.fn>;

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ContentAnalytics />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  syncMutate = vi.fn().mockResolvedValue({ synced: 11, with_insights: 11 });
  mockData.mockReturnValue({
    data: { posts: [POST], totals: TOTALS, days: 90 },
    isLoading: false,
  } as never);
  mockSync.mockReturnValue({ mutateAsync: syncMutate, isPending: false } as never);
});

describe("ContentAnalytics", () => {
  it("shows each post's metrics and the leads it produced", () => {
    renderPage();

    expect(screen.getByText("How I book calls from comments")).toBeInTheDocument();
    expect(screen.getByText("1,623")).toBeInTheDocument(); // reach
    expect(screen.getByText("1.03")).toBeInTheDocument(); // leads per 1k views
    // "2" is the lead count, shown both in the summary tile and the row badge
    expect(screen.getAllByText("2")).toHaveLength(2);
  });

  it("renders an em dash where a metric was withheld, not a zero", () => {
    mockData.mockReturnValue({
      data: {
        posts: [{ ...POST, views: null, shares: null, leads_per_1k_views: null }],
        totals: TOTALS,
        days: 90,
      },
      isLoading: false,
    } as never);

    renderPage();

    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(3);
  });

  it("flags posts whose insights could not be fetched", () => {
    mockData.mockReturnValue({
      data: {
        posts: [{ ...POST, insights_error: "no permission" }],
        totals: TOTALS,
        days: 90,
      },
      isLoading: false,
    } as never);

    renderPage();

    expect(screen.getByText(/metrics unavailable/i)).toBeInTheDocument();
  });

  it("refreshes for the selected window", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /refresh/i }));

    await waitFor(() => expect(syncMutate).toHaveBeenCalledWith(90));
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Refreshed" }),
    );
  });

  it("explains the Meta requirement when nothing is cached", () => {
    mockData.mockReturnValue({
      data: { posts: [], totals: { ...TOTALS, posts: 0 }, days: 90 },
      isLoading: false,
    } as never);

    renderPage();

    expect(screen.getByText(/Zernio doesn't expose post metrics/i)).toBeInTheDocument();
  });

  it("surfaces a refresh failure", async () => {
    syncMutate.mockRejectedValue(new Error("Instagram not connected"));
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /refresh/i }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Could not refresh",
          description: "Instagram not connected",
        }),
      ),
    );
  });
});
