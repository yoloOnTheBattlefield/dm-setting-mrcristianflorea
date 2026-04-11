import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import UploadXlsx from "./UploadXlsx";

const mockToast = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { _id: "u1" } }),
}));

vi.mock("@/lib/api", () => ({
  API_URL: "https://api.test",
  fetchWithAuth: vi.fn(),
}));

vi.mock("@/hooks/usePrompts", () => ({
  usePrompts: () => ({ data: [] }),
}));

vi.mock("@/hooks/useJobs", () => ({
  useJobs: () => ({ data: { jobs: [] } }),
  useCancelJob: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/useJobProgress", () => ({
  useJobProgress: () => ({
    status: null,
    fileProgresses: new Map(),
    fileStatuses: new Map(),
    totalQualified: 0,
    totalFailed: 0,
    error: null,
  }),
}));

vi.mock("xlsx", () => {
  const mod = {
    read: () => ({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {} } }),
    utils: { sheet_to_json: () => [{ Username: "test" }] },
  };
  return { ...mod, default: mod };
});

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <UploadXlsx />
    </QueryClientProvider>,
  );
}

describe("UploadXlsx — file acceptance", () => {
  beforeEach(() => {
    mockToast.mockClear();
  });

  it("accepts .xlsx files with any filename", () => {
    renderPage();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.accept).toBe(".xlsx,.csv");

    const file = new File(["data"], "my-leads.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("my-leads.xlsx")).toBeInTheDocument();
    expect(mockToast).not.toHaveBeenCalled();
  });

  it("accepts .csv files with any filename", () => {
    renderPage();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(["data"], "ALL_IG_LEADS.csv", { type: "text/csv" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("ALL_IG_LEADS.csv")).toBeInTheDocument();
    expect(mockToast).not.toHaveBeenCalled();
  });

  it("rejects non-xlsx/csv files", () => {
    renderPage();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(["data"], "leads.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Invalid file",
        variant: "destructive",
      }),
    );
  });

  it("shows metadata badges for follower-of pattern filenames", () => {
    renderPage();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(["data"], "follower-of-testaccount-20260401.xlsx");
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("follower")).toBeInTheDocument();
    expect(screen.getByText("@testaccount")).toBeInTheDocument();
    expect(screen.getByText("2026-04-01")).toBeInTheDocument();
  });

  it("shows no metadata badges for arbitrary filenames", () => {
    renderPage();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(["data"], "random-leads.csv", { type: "text/csv" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("random-leads.csv")).toBeInTheDocument();
    // No badges rendered for non-matching filenames
    expect(screen.queryByText("follower")).not.toBeInTheDocument();
    expect(screen.queryByText("following")).not.toBeInTheDocument();
  });

  it("shows drop zone text mentioning both xlsx and csv", () => {
    renderPage();
    expect(screen.getByText(/\.xlsx or \.csv/)).toBeInTheDocument();
  });
});
