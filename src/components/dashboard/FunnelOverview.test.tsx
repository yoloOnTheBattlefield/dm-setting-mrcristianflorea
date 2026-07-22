import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FunnelOverview } from "./FunnelOverview";
import { FunnelMetrics } from "@/lib/types";

// Stub the area chart so only the StatCards render the stage labels.
vi.mock("./FunnelAreaChart", () => ({
  FunnelAreaChart: () => <div data-testid="funnel-area-chart" />,
}));

const metrics = {
  totalContacts: 100,
  messagedCount: 80,
  messagedRate: 80,
  repliedCount: 40,
  repliedRate: 50,
  linkSentCount: 30,
  linkSentRate: 30,
  linkClickedCount: 20,
  linkClickedRate: 66.7,
  bookedCount: 10,
  bookingRate: 33.3,
  ghostedCount: 5,
  ghostRate: 5,
  fupCount: 8,
  fupToBookedCount: 3,
  recoveryRate: 37.5,
} as FunnelMetrics;

describe("FunnelOverview platform gating", () => {
  it("Instagram inbound shows Total Contacts, not Messaged/Replied", () => {
    render(<FunnelOverview metrics={metrics} source="inbound" platform="instagram" />);
    expect(screen.getByText("Total Contacts")).toBeInTheDocument();
    expect(screen.queryByText("Messaged")).not.toBeInTheDocument();
    expect(screen.queryByText("Replied")).not.toBeInTheDocument();
  });

  it("defaults to the Instagram funnel when no platform is passed", () => {
    render(<FunnelOverview metrics={metrics} source="inbound" />);
    expect(screen.getByText("Total Contacts")).toBeInTheDocument();
    expect(screen.queryByText("Messaged")).not.toBeInTheDocument();
  });

  it("LinkedIn inbound shows Messaged/Replied, not Total Contacts", () => {
    render(<FunnelOverview metrics={metrics} source="inbound" platform="linkedin" />);
    expect(screen.getByText("Messaged")).toBeInTheDocument();
    expect(screen.getByText("Replied")).toBeInTheDocument();
    expect(screen.queryByText("Total Contacts")).not.toBeInTheDocument();
    // rates rendered from messaged/replied metrics
    expect(screen.getByText("80.0% of total")).toBeInTheDocument();
    expect(screen.getByText("50.0% of messaged")).toBeInTheDocument();
  });
});
