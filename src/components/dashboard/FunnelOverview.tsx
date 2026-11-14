import { useEffect, useState } from "react";
import { FunnelMetrics } from "@/lib/types";
import { StatCard } from "./StatCard";
import { FunnelAreaChart } from "./FunnelAreaChart";

interface FunnelOverviewProps {
  metrics: FunnelMetrics;
  platform?: "instagram" | "linkedin";
}

type StageKey = string;

function safe(v: number | undefined | null): number {
  return v ?? 0;
}

export function FunnelOverview({ metrics, platform = "instagram" }: FunnelOverviewProps) {
  // LinkedIn inbound flow leads with the setter's outreach (Messaged → Replied);
  // Instagram inbound starts from Total Contacts. Gated by account.default_platform.
  const isLinkedIn = platform === "linkedin";

  const allStages = isLinkedIn
    ? [
        { key: "messaged", label: "Messaged", value: safe(metrics.messagedCount), color: "hsl(262 83% 58%)" },
        { key: "replied", label: "Replied", value: safe(metrics.repliedCount), color: "hsl(292 84% 61%)" },
        { key: "linkSent", label: "Link Sent", value: metrics.linkSentCount, color: "hsl(var(--stage-link-sent))" },
        { key: "linkClicked", label: "Link Clicked", value: safe(metrics.linkClickedCount), color: "hsl(var(--stage-link-clicked))" },
        { key: "booked", label: "Converted", value: metrics.bookedCount, color: "hsl(var(--stage-booked))" },
      ]
    : [
        { key: "totalContacts", label: "Total Contacts", value: metrics.totalContacts, color: "hsl(var(--stage-created))" },
        { key: "linkSent", label: "Link Sent", value: metrics.linkSentCount, color: "hsl(var(--stage-link-sent))" },
        { key: "linkClicked", label: "Link Clicked", value: safe(metrics.linkClickedCount), color: "hsl(var(--stage-link-clicked))" },
        { key: "booked", label: "Converted", value: metrics.bookedCount, color: "hsl(var(--stage-booked))" },
      ];

  const [enabledStages, setEnabledStages] = useState<Record<StageKey, boolean>>(() => {
    const initial: Record<StageKey, boolean> = {};
    allStages.forEach((s) => { initial[s.key] = true; });
    return initial;
  });

  // When the stage set changes (e.g. platform or source switch), enable any
  // newly-introduced stages by default so they aren't stuck hidden/disabled.
  useEffect(() => {
    setEnabledStages((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const s of allStages) {
        if (!(s.key in next)) {
          next[s.key] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [allStages]);

  const toggleStage = (stage: StageKey) => {
    setEnabledStages((prev) => {
      const enabledCount = Object.values(prev).filter(Boolean).length;
      if (enabledCount === 1 && prev[stage]) return prev;
      return { ...prev, [stage]: !prev[stage] };
    });
  };

  const visibleStages = allStages.filter((stage) => enabledStages[stage.key]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
        <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold">Metrics Overview</h2>

        <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${isLinkedIn ? "sm:grid-cols-3 lg:grid-cols-5" : "sm:grid-cols-4"}`}>
            {isLinkedIn ? (
              <>
                <StatCard
                  label="Messaged"
                  value={safe(metrics.messagedCount)}
                  subValue={`${safe(metrics.messagedRate).toFixed(1)}% of total`}
                  variant="created"
                  onClick={() => toggleStage("messaged")}
                  disabled={!enabledStages.messaged}
                />
                <StatCard
                  label="Replied"
                  value={safe(metrics.repliedCount)}
                  subValue={`${safe(metrics.repliedRate).toFixed(1)}% of messaged`}
                  variant="default"
                  onClick={() => toggleStage("replied")}
                  disabled={!enabledStages.replied}
                />
              </>
            ) : (
              <StatCard
                label="Total Contacts"
                value={metrics.totalContacts}
                variant="created"
                onClick={() => toggleStage("totalContacts")}
                disabled={!enabledStages.totalContacts}
              />
            )}
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
              label="Link Clicked"
              value={safe(metrics.linkClickedCount)}
              subValue={`${safe(metrics.linkClickedRate).toFixed(1)}% of sent`}
              variant="link-clicked"
              onClick={() => toggleStage("linkClicked")}
              disabled={!enabledStages.linkClicked}
            />
            <StatCard
              label="Converted"
              value={metrics.bookedCount}
              subValue={`${metrics.bookingRate.toFixed(1)}% of total`}
              variant="booked"
              trend={metrics.bookingRate > 40 ? "up" : "neutral"}
              onClick={() => toggleStage("booked")}
              disabled={!enabledStages.booked}
            />
          </div>
        <FunnelAreaChart stages={visibleStages} />
      </div>
    </div>
  );
}
