import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ClientHealthBadge from "./ClientHealthBadge";

describe("ClientHealthBadge", () => {
  it("renders 'Healthy' for green health", () => {
    render(<ClientHealthBadge health="green" />);
    expect(screen.getByText("Healthy")).toBeInTheDocument();
  });

  it("renders 'At Risk' for amber health", () => {
    render(<ClientHealthBadge health="amber" />);
    expect(screen.getByText("At Risk")).toBeInTheDocument();
  });

  it("renders 'Needs Attention' for red health", () => {
    render(<ClientHealthBadge health="red" />);
    expect(screen.getByText("Needs Attention")).toBeInTheDocument();
  });

  it("applies green dot class for green health", () => {
    const { container } = render(<ClientHealthBadge health="green" />);
    const dot = container.querySelector("span.bg-green-500");
    expect(dot).toBeInTheDocument();
  });

  it("applies amber dot class for amber health", () => {
    const { container } = render(<ClientHealthBadge health="amber" />);
    const dot = container.querySelector("span.bg-amber-500");
    expect(dot).toBeInTheDocument();
  });

  it("applies red dot class for red health", () => {
    const { container } = render(<ClientHealthBadge health="red" />);
    const dot = container.querySelector("span.bg-red-500");
    expect(dot).toBeInTheDocument();
  });
});
