import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ImportBookingsDialog } from "./ImportBookingsDialog";

const mockFetchWithAuth = vi.fn();

vi.mock("@/lib/api", () => ({
  API_URL: "https://api.test",
  fetchWithAuth: (...args: unknown[]) => mockFetchWithAuth(...args),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const mockRows = [
  { "Invitee Name": "John Doe", "Invitee Email": "john@test.com", "Start Date & Time": "2026-03-15T10:00:00Z", "Status": "Active", "UTM Source": "youtube" },
  { "Invitee Name": "Jane Smith", "Invitee Email": "jane@test.com", "Start Date & Time": "2026-03-16T14:00:00Z", "Status": "Canceled", "UTM Source": "ig" },
];

// Mock xlsx — dynamic import returns the module as default
vi.mock("xlsx", () => {
  const mod = {
    read: () => ({
      SheetNames: ["Sheet1"],
      Sheets: { Sheet1: {} },
    }),
    utils: {
      sheet_to_json: () => [...mockRows],
    },
  };
  return { ...mod, default: mod };
});

function renderDialog(open = true) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onOpenChange = vi.fn();
  return {
    onOpenChange,
    ...render(
      <QueryClientProvider client={qc}>
        <ImportBookingsDialog open={open} onOpenChange={onOpenChange} />
      </QueryClientProvider>,
    ),
  };
}

describe("ImportBookingsDialog", () => {
  beforeEach(() => {
    mockFetchWithAuth.mockReset();
  });

  it("renders upload step when opened", () => {
    renderDialog();
    expect(screen.getByText("Import Bookings")).toBeInTheDocument();
    expect(screen.getByText("Drop your Calendly CSV export here")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderDialog(false);
    expect(screen.queryByText("Import Bookings")).not.toBeInTheDocument();
  });

  it("transitions to mapping step after file upload", async () => {
    renderDialog();

    const input = document.getElementById("csv-file-input") as HTMLInputElement;
    const file = new File(["test"], "bookings.csv", { type: "text/csv" });

    // Mock arrayBuffer on the file
    Object.defineProperty(file, "arrayBuffer", {
      value: () => Promise.resolve(new ArrayBuffer(0)),
    });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Map Columns")).toBeInTheDocument();
    });

    // Should show row count
    expect(screen.getByText(/2 rows found/)).toBeInTheDocument();
  });

  it("shows import result after successful import", async () => {
    mockFetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ imported: 2, skipped: 0, errors: [] }),
    });

    renderDialog();

    const input = document.getElementById("csv-file-input") as HTMLInputElement;
    const file = new File(["test"], "bookings.csv", { type: "text/csv" });
    Object.defineProperty(file, "arrayBuffer", {
      value: () => Promise.resolve(new ArrayBuffer(0)),
    });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Map Columns")).toBeInTheDocument();
    });

    const importButton = screen.getByText(/Import 2 Bookings/);
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(screen.getByText("2 bookings imported")).toBeInTheDocument();
    });
  });
});
