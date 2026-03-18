import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import React from "react";

vi.mock("@/lib/api", () => ({
  API_URL: "http://localhost:3000",
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

import AcceptInvite from "./AcceptInvite";

function renderWithRouter(token = "test-token-abc") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/invite/${token}`]}>
        <Routes>
          <Route path="/invite/:token" element={<AcceptInvite />} />
          <Route path="/" element={<div>Dashboard</div>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("AcceptInvite", () => {
  it("renders loading state initially", () => {
    global.fetch = vi.fn(() => new Promise(() => {})) as any;
    renderWithRouter();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders error state when invitation is invalid", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Invitation not found or expired" }),
    }) as any;

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("Invalid Invitation")).toBeInTheDocument();
    });
    expect(screen.getByText("Go to Login")).toBeInTheDocument();
  });

  it("renders form with pre-filled names when invitation is valid", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          email: "test@example.com",
          first_name: "John",
          last_name: "Doe",
          type: "client",
        }),
    }) as any;

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("Create Your Account")).toBeInTheDocument();
    });

    const firstNameInput = screen.getByLabelText("First Name") as HTMLInputElement;
    const lastNameInput = screen.getByLabelText("Last Name") as HTMLInputElement;
    expect(firstNameInput.value).toBe("John");
    expect(lastNameInput.value).toBe("Doe");
  });

  it("renders password and confirm password fields", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          email: "test@example.com",
          first_name: "",
          last_name: "",
          type: "client",
        }),
    }) as any;

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Account" })).toBeInTheDocument();
  });
});
