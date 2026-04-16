import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BulkImportAccountsDialog from "./BulkImportAccountsDialog";

const mockMutateAsync = vi.fn();

vi.mock("@/hooks/useOutboundAccounts", () => ({
  useBulkImportOutboundAccounts: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const MOCK_ROWS = [
  { Username: "@account1", Password: "pass1", Email: "a@b.com", Proxy: "1.2.3.4:8080" },
  { Username: "account2", Password: "pass2", Email: "c@d.com", Proxy: "5.6.7.8:9090" },
  { Username: "account3", Password: "pass3", Email: "e@f.com", Proxy: "" },
];

vi.mock("xlsx", () => {
  const mod = {
    read: () => ({
      SheetNames: ["Sheet1"],
      Sheets: { Sheet1: {} },
    }),
    utils: {
      sheet_to_json: () => [...MOCK_ROWS],
    },
  };
  return { ...mod, default: mod };
});

function renderDialog(open = true) {
  const onOpenChange = vi.fn();
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const result = render(
    <QueryClientProvider client={qc}>
      <BulkImportAccountsDialog open={open} onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  );
  return { ...result, onOpenChange };
}

function createMockFile(name = "accounts.csv") {
  const file = new File(["test"], name, { type: "text/csv" });
  Object.defineProperty(file, "arrayBuffer", {
    value: () => Promise.resolve(new ArrayBuffer(0)),
  });
  return file;
}

async function uploadFileAndGoToMapping() {
  const result = renderDialog();
  const input = document.getElementById("bulk-import-file-input") as HTMLInputElement;
  const file = createMockFile();

  fireEvent.change(input, { target: { files: [file] } });

  await waitFor(() => {
    expect(screen.getByText("Map Columns")).toBeInTheDocument();
  });
  return result;
}

describe("BulkImportAccountsDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders upload step when open", () => {
    renderDialog();
    expect(screen.getByText("Bulk Import Accounts")).toBeInTheDocument();
    expect(screen.getByText(/Drop your CSV or Excel file here/)).toBeInTheDocument();
    expect(screen.getByText(/or click to browse/)).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderDialog(false);
    expect(screen.queryByText("Bulk Import Accounts")).not.toBeInTheDocument();
  });

  it("shows file input that accepts csv and xlsx", () => {
    renderDialog();
    const input = document.getElementById("bulk-import-file-input") as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.accept).toBe(".csv,.xlsx,.xls");
    expect(input.type).toBe("file");
  });

  it("advances to mapping step after file upload", async () => {
    await uploadFileAndGoToMapping();
    expect(screen.getByText(/3 rows found/)).toBeInTheDocument();
  });

  it("auto-maps known column headers to fields", async () => {
    await uploadFileAndGoToMapping();
    // File columns appear in both the mapping table and potentially the preview
    expect(screen.getAllByText("Username").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Password").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Email").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Proxy").length).toBeGreaterThanOrEqual(1);
    // Verify mapped column count reflects auto-mapping
    expect(screen.getByText(/4 columns mapped/)).toBeInTheDocument();
  });

  it("shows sample values from first row", async () => {
    await uploadFileAndGoToMapping();
    // Sample values appear in the mapping table sample column
    expect(screen.getAllByText("@account1").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("pass1").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("a@b.com").length).toBeGreaterThanOrEqual(1);
  });

  it("shows import button with row count", async () => {
    await uploadFileAndGoToMapping();
    expect(screen.getByText(/Import 3 Accounts/)).toBeInTheDocument();
  });

  it("has a back button that returns to upload step", async () => {
    await uploadFileAndGoToMapping();

    fireEvent.click(screen.getByText("Back"));

    expect(screen.getByText("Bulk Import Accounts")).toBeInTheDocument();
    expect(screen.getByText(/Drop your CSV or Excel file here/)).toBeInTheDocument();
  });

  it("calls mutateAsync and shows result step on import", async () => {
    mockMutateAsync.mockResolvedValueOnce({
      created: 3,
      duplicates: 0,
      errors: [],
    });

    await uploadFileAndGoToMapping();

    fireEvent.click(screen.getByText(/Import 3 Accounts/));

    await waitFor(() => {
      expect(screen.getByText("Import Complete")).toBeInTheDocument();
    });

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    const args = mockMutateAsync.mock.calls[0][0];
    expect(args).toHaveLength(3);
    expect(screen.getByText("3 accounts created")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
  });

  it("shows duplicates count in result step", async () => {
    mockMutateAsync.mockResolvedValueOnce({
      created: 1,
      duplicates: 2,
      errors: [],
    });

    await uploadFileAndGoToMapping();

    fireEvent.click(screen.getByText(/Import 3 Accounts/));

    await waitFor(() => {
      expect(screen.getByText("1 account created")).toBeInTheDocument();
    });
    expect(screen.getByText("2 duplicates skipped")).toBeInTheDocument();
  });

  it("shows errors in result step", async () => {
    mockMutateAsync.mockResolvedValueOnce({
      created: 2,
      duplicates: 0,
      errors: [{ row: 3, username: "bad", reason: "Missing username" }],
    });

    await uploadFileAndGoToMapping();

    fireEvent.click(screen.getByText(/Import 3 Accounts/));

    await waitFor(() => {
      expect(screen.getByText("Errors (1)")).toBeInTheDocument();
    });
    expect(screen.getByText(/Row 3.*Missing username/)).toBeInTheDocument();
  });

  it("closes dialog when Done is clicked", async () => {
    mockMutateAsync.mockResolvedValueOnce({
      created: 3,
      duplicates: 0,
      errors: [],
    });

    const { onOpenChange } = await uploadFileAndGoToMapping();

    fireEvent.click(screen.getByText(/Import 3 Accounts/));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("has a collapsible preview section", async () => {
    await uploadFileAndGoToMapping();
    expect(screen.getByText(/Preview first 3 rows/)).toBeInTheDocument();
  });
});
