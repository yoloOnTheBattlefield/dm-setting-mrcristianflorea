import { useState } from "react";
import { FunnelMetrics } from "@/lib/types";
import { StatCard } from "./StatCard";
import { FunnelAreaChart } from "./FunnelAreaChart";

interface FunnelOverviewProps {
  metrics: FunnelMetrics;
}

type StageKey = "totalContacts" | "linkSent" | "booked";

export function FunnelOverview({ metrics }: FunnelOverviewProps) {
  const [enabledStages, setEnabledStages] = useState<Record<StageKey, boolean>>({
    totalContacts: true,
    linkSent: true,
    booked: true,
  });

  const toggleStage = (stage: StageKey) => {
    setEnabledStages((prev) => {
      // Count how many stages are currently enabled
      const enabledCount = Object.values(prev).filter(Boolean).length;

      // If this is the last enabled stage and we're trying to disable it, do nothing
      if (enabledCount === 1 && prev[stage]) {
        return prev;
      }

      return {
        ...prev,
        [stage]: !prev[stage],
      };
    });
  };

  const allStages = [
    {
      key: "totalContacts" as StageKey,
      label: "Total Contacts",
      value: metrics.totalContacts,
      color: "hsl(var(--stage-created))",
    },
    {
      key: "linkSent" as StageKey,
      label: "Link Sent",
      value: metrics.linkSentCount,
      color: "hsl(var(--stage-link-sent))",
    },
    {
      key: "booked" as StageKey,
      label: "Booked",
      value: metrics.bookedCount,
      color: "hsl(var(--stage-booked))",
    },
  ];

  const visibleStages = allStages.filter((stage) => enabledStages[stage.key]);

  return (
    <div className="space-y-6">
      {/* Funnel Area Chart */}

      {/* Stats Cards */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Metrics Overview</h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            label="Total Contacts"
            value={metrics.totalContacts}
            variant="created"
            onClick={() => toggleStage("totalContacts")}
            disabled={!enabledStages.totalContacts}
          />
          <StatCard
            label="Link Sent"
            value={metrics.linkSentCount}
            subValue={`${metrics.linkSentRate.toFixed(1)}% of total`}
            variant="link-sent"
            trend={metrics.linkSentRate > 70 ? "up" : "neutral"}
            onClick={() => toggleStage("linkSent")}
            disabled={!enabledStages.linkSent}
          />
          <StatCard
            label="Booked"
            value={metrics.bookedCount}
            subValue={`${metrics.bookingRate.toFixed(1)}% of total`}
            variant="booked"
            trend={metrics.bookingRate > 40 ? "up" : "neutral"}
            onClick={() => toggleStage("booked")}
            disabled={!enabledStages.booked}
          />
          <StatCard
            label="Ghosted"
            value={metrics.ghostedCount}
            subValue={`${metrics.ghostRate.toFixed(1)}% rate`}
            variant="ghosted"
            trend={metrics.ghostRate < 20 ? "up" : "down"}
          />
          <StatCard
            label="FUP Recovery"
            value={metrics.fupToBookedCount}
            subValue={`${metrics.recoveryRate.toFixed(1)}% of ${metrics.fupCount} FUPs`}
            variant="fup"
            trend={metrics.recoveryRate > 25 ? "up" : "neutral"}
          />
        </div>
        <FunnelAreaChart stages={visibleStages} />
      </div>
    </div>
  );
}
