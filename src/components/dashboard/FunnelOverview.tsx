import { useState } from "react";
import { FunnelMetrics, SourceFilter } from "@/lib/types";
import { StatCard } from "./StatCard";
import { FunnelAreaChart } from "./FunnelAreaChart";

interface FunnelOverviewProps {
  metrics: FunnelMetrics;
  source: SourceFilter;
}

type StageKey = string;

function safe(v: number | undefined | null): number {
  return v ?? 0;
}

function pct(v: number | undefined | null): string {
  return `${safe(v).toFixed(1)}%`;
}

export function FunnelOverview({ metrics, source }: FunnelOverviewProps) {
  const isInbound = source === "inbound";
  const isOutbound = source === "outbound";

  const allStages = isOutbound
    ? [
        { key: "obMessaged", label: "Messaged", value: safe(metrics.obMessaged), color: "hsl(var(--stage-created))" },
        { key: "obReplied", label: "Replied", value: safe(metrics.obReplied), color: "hsl(var(--stage-link-sent))" },
        { key: "obBooked", label: "Booked", value: safe(metrics.obBooked), color: "hsl(var(--stage-booked))" },
      ]
    : isInbound
    ? [
        { key: "totalContacts", label: "Total Contacts", value: metrics.totalContacts, color: "hsl(var(--stage-created))" },
        { key: "linkSent", label: "Link Sent", value: metrics.linkSentCount, color: "hsl(var(--stage-link-sent))" },
        { key: "booked", label: "Booked", value: metrics.bookedCount, color: "hsl(var(--stage-booked))" },
      ]
    : [
        { key: "combinedContacts", label: "Combined Contacts", value: safe(metrics.combinedContacts), color: "hsl(var(--stage-created))" },
        { key: "linkSent", label: "Link Sent", value: metrics.linkSentCount, color: "hsl(var(--stage-link-sent))" },
        { key: "combinedBooked", label: "Combined Booked", value: safe(metrics.combinedBooked), color: "hsl(var(--stage-booked))" },
      ];

  const [enabledStages, setEnabledStages] = useState<Record<StageKey, boolean>>(() => {
    const initial: Record<StageKey, boolean> = {};
    allStages.forEach((s) => { initial[s.key] = true; });
    return initial;
  });

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

        {isOutbound ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard
              label="Messaged"
              value={safe(metrics.obMessaged)}
              variant="created"
              onClick={() => toggleStage("obMessaged")}
              disabled={!enabledStages.obMessaged}
            />
            <StatCard
              label="Replied"
              value={safe(metrics.obReplied)}
              subValue={`${pct(metrics.obReplyRate)} reply rate`}
              variant="link-sent"
              onClick={() => toggleStage("obReplied")}
              disabled={!enabledStages.obReplied}
            />
            <StatCard
              label="Booked"
              value={safe(metrics.obBooked)}
              subValue={`${pct(metrics.obBookRate)} book rate`}
              variant="booked"
              onClick={() => toggleStage("obBooked")}
              disabled={!enabledStages.obBooked}
            />
            <StatCard
              label="Reply Rate"
              value={pct(metrics.obReplyRate)}
              variant="default"
            />
            <StatCard
              label="Close Rate"
              value={pct(metrics.obCloseRate)}
              variant="default"
            />
            <StatCard
              label="Revenue"
              value={`$${safe(metrics.obContractValue).toLocaleString()}`}
              subValue={`${safe(metrics.obContracts)} deals`}
              variant="default"
            />
          </div>
        ) : isInbound ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
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
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard
              label="Combined Contacts"
              value={safe(metrics.combinedContacts)}
              subValue={`${metrics.totalContacts} in + ${safe(metrics.obMessaged)} out`}
              variant="created"
              onClick={() => toggleStage("combinedContacts")}
              disabled={!enabledStages.combinedContacts}
            />
            <StatCard
              label="Link Sent"
              value={metrics.linkSentCount}
              subValue={`${metrics.linkSentRate.toFixed(1)}% of inbound`}
              variant="link-sent"
              onClick={() => toggleStage("linkSent")}
              disabled={!enabledStages.linkSent}
            />
            <StatCard
              label="Combined Booked"
              value={safe(metrics.combinedBooked)}
              subValue={`${metrics.bookedCount} in + ${safe(metrics.obBooked)} out`}
              variant="booked"
              onClick={() => toggleStage("combinedBooked")}
              disabled={!enabledStages.combinedBooked}
            />
            <StatCard
              label="OB Reply Rate"
              value={pct(metrics.obReplyRate)}
              variant="default"
            />
            <StatCard
              label="Ghosted"
              value={metrics.ghostedCount}
              subValue={`${metrics.ghostRate.toFixed(1)}% rate`}
              variant="ghosted"
            />
            <StatCard
              label="OB Revenue"
              value={`$${safe(metrics.obContractValue).toLocaleString()}`}
              subValue={`${safe(metrics.obContracts)} deals`}
              variant="default"
            />
          </div>
        )}
        <FunnelAreaChart stages={visibleStages} />
      </div>
    </div>
  );
}
