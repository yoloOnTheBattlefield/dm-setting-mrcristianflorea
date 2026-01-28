import { useState, useMemo } from "react";
import { DateRangeFilter } from "@/lib/types";
import { useLeads } from "@/hooks/useLeads";
import {
  calculateFunnelMetrics,
  calculateVelocityMetrics,
  calculateDailyVolume,
  calculateGhostingBuckets,
  calculateFupEffectiveness,
  calculateStageAging,
  calculateCumulativeBookings,
} from "@/lib/analytics";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { FunnelOverview } from "@/components/dashboard/FunnelOverview";
import { VelocityChart } from "@/components/dashboard/VelocityChart";
import { DailyVolumeChart } from "@/components/dashboard/DailyVolumeChart";
import { GhostingAnalysis } from "@/components/dashboard/GhostingAnalysis";
import { FupEffectivenessChart } from "@/components/dashboard/FupEffectivenessChart";
import { StageAgingTable } from "@/components/dashboard/StageAgingTable";
import { CumulativeBookingsChart } from "@/components/dashboard/CumulativeBookingsChart";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { MessageSquare, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Index() {
  const [dateRange, setDateRange] = useState<DateRangeFilter>(14);
  const { data: contacts = [], isLoading, isError, error, refetch } = useLeads();

  const metrics = useMemo(() => {
    if (contacts.length === 0) return null;
    return {
      funnel: calculateFunnelMetrics(contacts, dateRange),
      velocity: calculateVelocityMetrics(contacts, dateRange),
      dailyVolume: calculateDailyVolume(contacts, dateRange),
      ghosting: calculateGhostingBuckets(contacts, dateRange),
      fup: calculateFupEffectiveness(contacts, dateRange),
      aging: calculateStageAging(contacts, dateRange),
      cumulative: calculateCumulativeBookings(contacts, dateRange),
    };
  }, [contacts, dateRange]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <MessageSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">DM Pipeline</h1>
              <p className="text-xs text-muted-foreground">Performance Dashboard</p>
            </div>
          </div>
          <DateFilter value={dateRange} onChange={setDateRange} />
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="container py-6">
        {isLoading ? (
          <DashboardSkeleton />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-lg font-semibold mb-2">Failed to load data</h2>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : "An unknown error occurred"}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : metrics ? (
          <div className="space-y-6">
            {/* Row 1: Funnel Overview */}
            <FunnelOverview metrics={metrics.funnel} />

            {/* Row 2: Velocity + Cumulative */}
            <div className="grid gap-6 lg:grid-cols-2">
              <VelocityChart metrics={metrics.velocity} />
              <CumulativeBookingsChart data={metrics.cumulative} />
            </div>

            {/* Row 3: Daily Volume (full width) */}
            <DailyVolumeChart data={metrics.dailyVolume} />

            {/* Row 4: Ghosting + FUP */}
            <div className="grid gap-6 lg:grid-cols-2">
              <GhostingAnalysis data={metrics.ghosting} />
              <FupEffectivenessChart data={metrics.fup} />
            </div>

            {/* Row 5: Stage Aging */}
            <StageAgingTable data={metrics.aging} />
          </div>
        ) : null}

        {/* Footer */}
        <footer className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          <p>Data refreshes with date filter changes • All times in UTC</p>
        </footer>
      </main>
    </div>
  );
}
