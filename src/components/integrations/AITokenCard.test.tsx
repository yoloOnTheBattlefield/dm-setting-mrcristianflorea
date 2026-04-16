import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AITokenCard from "./AITokenCard";
import type { AIProviderUsage } from "@/hooks/useAIUsage";

const baseProps = {
  title: "OpenAI",
  description: "Custom key for lead qualification",
  inputId: "openai-token",
  placeholder: "sk-...",
  token: "",
  savedToken: "",
  isSaving: false,
  onTokenChange: vi.fn(),
  onSave: vi.fn(),
};

describe("AITokenCard", () => {
  it("renders title and description", () => {
    render(<AITokenCard {...baseProps} />);
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByText("Custom key for lead qualification")).toBeInTheDocument();
  });

  it("shows 'Server Default' badge when no saved token", () => {
    render(<AITokenCard {...baseProps} />);
    expect(screen.getByText("Server Default")).toBeInTheDocument();
  });

  it("shows 'Connected' badge when token is saved", () => {
    render(<AITokenCard {...baseProps} savedToken="sk-test-123" />);
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  it("disables save button when token hasn't changed", () => {
    render(<AITokenCard {...baseProps} token="sk-123" savedToken="sk-123" />);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("enables save button when token has changed", () => {
    render(<AITokenCard {...baseProps} token="sk-new" savedToken="sk-old" />);
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("calls onSave when save button is clicked", () => {
    const onSave = vi.fn();
    render(<AITokenCard {...baseProps} token="sk-new" savedToken="sk-old" onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("shows 'Saving...' when isSaving is true", () => {
    render(<AITokenCard {...baseProps} token="sk-new" savedToken="sk-old" isSaving />);
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
  });

  it("does not show usage section when no saved token", () => {
    const usage: AIProviderUsage = { totalUsageUsd: 5.0, source: "organization", period: "current month" };
    render(<AITokenCard {...baseProps} usage={usage} />);
    expect(screen.queryByText(/used this month/)).not.toBeInTheDocument();
  });

  it("shows loading spinner when usage is loading", () => {
    render(<AITokenCard {...baseProps} savedToken="sk-123" usageLoading />);
    expect(screen.getByText("Fetching usage...")).toBeInTheDocument();
  });

  it("shows error message when usage has error", () => {
    const usage: AIProviderUsage = { error: "Unable to fetch usage" };
    render(<AITokenCard {...baseProps} savedToken="sk-123" usage={usage} />);
    expect(screen.getByText("Unable to fetch usage")).toBeInTheDocument();
  });

  it("shows OpenAI org costs usage", () => {
    const usage: AIProviderUsage = {
      totalUsageUsd: 12.34,
      source: "organization",
      period: "current month",
    };
    render(<AITokenCard {...baseProps} savedToken="sk-123" usage={usage} />);
    expect(screen.getByText("$12.34 used this month")).toBeInTheDocument();
  });

  it("shows OpenAI credit grants with progress bar", () => {
    const usage: AIProviderUsage = {
      totalGranted: 100,
      totalUsed: 75,
      totalAvailable: 25,
      source: "credits",
      period: "lifetime",
    };
    render(<AITokenCard {...baseProps} savedToken="sk-123" usage={usage} />);
    expect(screen.getByText("$75.00 used / $100.00 granted")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("$25.00 remaining")).toBeInTheDocument();
  });

  it("shows Anthropic usage with token counts", () => {
    const usage: AIProviderUsage = {
      totalUsageUsd: 8.42,
      inputTokens: 1500000,
      outputTokens: 250000,
      source: "usage",
      period: "current month",
    };
    render(<AITokenCard {...baseProps} savedToken="sk-ant-123" usage={usage} />);
    expect(screen.getByText("$8.42 used this month")).toBeInTheDocument();
    expect(screen.getByText("1.5M input tokens")).toBeInTheDocument();
    expect(screen.getByText("250.0K output tokens")).toBeInTheDocument();
  });

  it("shows red progress bar at 90%+ usage", () => {
    const usage: AIProviderUsage = {
      totalGranted: 100,
      totalUsed: 95,
      totalAvailable: 5,
      source: "credits",
    };
    const { container } = render(
      <AITokenCard {...baseProps} savedToken="sk-123" usage={usage} />,
    );
    const bar = container.querySelector(".bg-red-500");
    expect(bar).toBeInTheDocument();
  });

  it("shows green progress bar at low usage", () => {
    const usage: AIProviderUsage = {
      totalGranted: 100,
      totalUsed: 20,
      totalAvailable: 80,
      source: "credits",
    };
    const { container } = render(
      <AITokenCard {...baseProps} savedToken="sk-123" usage={usage} />,
    );
    const bar = container.querySelector(".bg-green-500");
    expect(bar).toBeInTheDocument();
  });

  it("shows orange progress bar at 70-90% usage", () => {
    const usage: AIProviderUsage = {
      totalGranted: 100,
      totalUsed: 80,
      totalAvailable: 20,
      source: "credits",
    };
    const { container } = render(
      <AITokenCard {...baseProps} savedToken="sk-123" usage={usage} />,
    );
    const bar = container.querySelector(".bg-orange-500");
    expect(bar).toBeInTheDocument();
  });
});
