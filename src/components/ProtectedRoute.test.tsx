import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";

const mockUseAuth = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

function renderWithRouter(ui: React.ReactElement, initialRoute = "/") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>{ui}</MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("renders nothing while loading", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: true });
    const { container } = renderWithRouter(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders children when authenticated", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    renderWithRouter(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    );
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("redirects to /login when not authenticated", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });
    const { container } = renderWithRouter(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    );
    expect(container.innerHTML).not.toContain("Protected content");
  });
});
