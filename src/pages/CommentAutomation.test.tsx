import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import CommentAutomation from "./CommentAutomation";
import {
  useCommentRules,
  useCommentIgAccounts,
  useCommentEvents,
  useCreateCommentRule,
  useUpdateCommentRule,
  useDeleteCommentRule,
} from "@/hooks/useCommentRules";

vi.mock("@/hooks/useCommentRules", () => ({
  useCommentRules: vi.fn(),
  useCommentIgAccounts: vi.fn(),
  useCommentEvents: vi.fn(),
  useCreateCommentRule: vi.fn(),
  useUpdateCommentRule: vi.fn(),
  useDeleteCommentRule: vi.fn(),
}));

const toast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast }),
}));

const mockRules = vi.mocked(useCommentRules);
const mockIgAccounts = vi.mocked(useCommentIgAccounts);
const mockEvents = vi.mocked(useCommentEvents);
const mockCreate = vi.mocked(useCreateCommentRule);
const mockUpdate = vi.mocked(useUpdateCommentRule);
const mockDelete = vi.mocked(useDeleteCommentRule);

const RULE = {
  _id: "rule1",
  account_id: "acct1",
  ig_user_id: "ig1",
  name: "Free guide",
  media_ids: [],
  keywords: ["guide", "send"],
  match_mode: "partial" as const,
  dm_text: "Here you go: {{link}}",
  link_url: "https://example.com",
  reply_publicly: false,
  public_replies: [],
  active: true,
  matched_count: 12,
  sent_count: 10,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

const EVENT = {
  _id: "event1",
  rule_id: "rule1",
  comment_id: "c1",
  media_id: "m1",
  comment_text: "send me the guide",
  matched_keyword: "guide",
  commenter_username: "someone",
  lead_id: "lead1",
  status: "sent" as const,
  skip_reason: null,
  attempts: 1,
  error: null,
  sent_at: "2026-09-01T00:00:00.000Z",
  createdAt: "2026-09-01T00:00:00.000Z",
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <CommentAutomation />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

let createMutate: ReturnType<typeof vi.fn>;
let updateMutate: ReturnType<typeof vi.fn>;
let deleteMutate: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  createMutate = vi.fn().mockResolvedValue({ rule: RULE });
  updateMutate = vi.fn().mockResolvedValue({ rule: RULE });
  deleteMutate = vi.fn().mockResolvedValue({ deleted: true });

  mockRules.mockReturnValue({ data: { rules: [RULE] }, isLoading: false } as never);
  mockIgAccounts.mockReturnValue({
    data: { accounts: [{ ig_user_id: "ig1", ig_username: "ourbrand", kind: "account" }] },
    isLoading: false,
  } as never);
  mockEvents.mockReturnValue({ data: { events: [EVENT] } } as never);
  mockCreate.mockReturnValue({ mutateAsync: createMutate, isPending: false } as never);
  mockUpdate.mockReturnValue({ mutateAsync: updateMutate, isPending: false } as never);
  mockDelete.mockReturnValue({ mutateAsync: deleteMutate, isPending: false } as never);
});

describe("CommentAutomation", () => {
  it("lists rules with their keywords and counters", () => {
    renderPage();

    expect(screen.getByText("Free guide")).toBeInTheDocument();
    // "guide" also appears in the activity table's keyword column
    expect(screen.getAllByText("guide").length).toBeGreaterThan(0);
    expect(screen.getByText("send")).toBeInTheDocument();
    expect(screen.getByText("All posts")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("shows recent activity", () => {
    renderPage();

    expect(screen.getByText("@someone")).toBeInTheDocument();
    expect(screen.getByText("send me the guide")).toBeInTheDocument();
    expect(screen.getByText("sent")).toBeInTheDocument();
  });

  it("warns and disables the new-rule button when no IG account is connected", () => {
    mockIgAccounts.mockReturnValue({ data: { accounts: [] }, isLoading: false } as never);
    renderPage();

    expect(screen.getByText("No Instagram account connected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /new rule/i })).toBeDisabled();
  });

  it("creates a rule, splitting comma-separated keywords", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /new rule/i }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Guide" } });
    fireEvent.change(screen.getByLabelText("Keywords"), {
      target: { value: "guide, send , info" },
    });
    fireEvent.change(screen.getByLabelText("DM"), {
      target: { value: "Here: {{link}}" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create rule/i }));

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        ig_user_id: "ig1",
        name: "Guide",
        keywords: ["guide", "send", "info"],
        dm_text: "Here: {{link}}",
        media_ids: [],
      }),
    );
  });

  it("refuses to submit without keywords or DM text", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /new rule/i }));
    fireEvent.click(screen.getByRole("button", { name: /create rule/i }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Missing fields" }),
      ),
    );
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("prefills the form when editing", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /edit free guide/i }));

    expect(screen.getByLabelText("Name")).toHaveValue("Free guide");
    expect(screen.getByLabelText("Keywords")).toHaveValue("guide, send");
    expect(screen.getByLabelText("DM")).toHaveValue("Here you go: {{link}}");
  });

  it("toggles a rule active state", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("switch", { name: /toggle free guide/i }));

    await waitFor(() =>
      expect(updateMutate).toHaveBeenCalledWith({ id: "rule1", active: false }),
    );
  });

  it("deletes a rule after confirmation", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /delete free guide/i }));
    fireEvent.click(await screen.findByRole("button", { name: "Delete" }));

    await waitFor(() => expect(deleteMutate).toHaveBeenCalledWith("rule1"));
  });

  it("surfaces a server error as a toast", async () => {
    createMutate.mockRejectedValue(new Error("Instagram account not connected"));
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /new rule/i }));
    fireEvent.change(screen.getByLabelText("Keywords"), { target: { value: "guide" } });
    fireEvent.change(screen.getByLabelText("DM"), { target: { value: "Hi" } });
    fireEvent.click(screen.getByRole("button", { name: /create rule/i }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Could not create rule",
          description: "Instagram account not connected",
        }),
      ),
    );
  });
});
