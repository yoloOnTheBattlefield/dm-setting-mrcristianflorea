import { FunnelMetrics } from "@/lib/types";
import { StatCard } from "./StatCard";
import { FunnelAreaChart } from "./FunnelAreaChart";

interface FunnelOverviewProps {
  metrics: FunnelMetrics;
}

export function FunnelOverview({ metrics }: FunnelOverviewProps) {
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
          />
          <StatCard
            label="Qualified"
            value={metrics.qualifiedCount}
            subValue={`${metrics.qualificationRate.toFixed(1)}% rate`}
            variant="qualified"
            trend={metrics.qualificationRate > 50 ? "up" : "neutral"}
          />
          <StatCard
            label="Booked"
            value={metrics.bookedCount}
            subValue={`${metrics.bookingRate.toFixed(1)}% of qualified`}
            variant="booked"
            trend={metrics.bookingRate > 40 ? "up" : "neutral"}
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
        <FunnelAreaChart
          stages={[
            {
              label: "Total Contacts",
              value: metrics.totalContacts,
              color: "#3b82f6",
            },
            {
              label: "Qualified",
              value: metrics.qualifiedCount,
              color: "#8b5cf6",
            },
            {
              label: "Booked",
              value: metrics.bookedCount,
              color: "#10b981",
            },
            {
              label: "Follow-ups",
              value: metrics.fupCount,
              color: "#f59e0b",
            },
          ]}
        />
      </div>
    </div>
  );
}
