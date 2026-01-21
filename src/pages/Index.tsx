import { useState, useMemo } from "react";
import { DateRangeFilter } from "@/lib/types";
import { generateMockContacts } from "@/lib/mockData";
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
import { MessageSquare } from "lucide-react";

// Generate mock data once
const mockContacts = generateMockContacts(250);

export default function Index() {
  const [dateRange, setDateRange] = useState<DateRangeFilter>(14);

  const metrics = useMemo(() => {
    return {
      funnel: calculateFunnelMetrics(mockContacts, dateRange),
      velocity: calculateVelocityMetrics(mockContacts, dateRange),
      dailyVolume: calculateDailyVolume(mockContacts, dateRange),
      ghosting: calculateGhostingBuckets(mockContacts, dateRange),
      fup: calculateFupEffectiveness(mockContacts, dateRange),
      aging: calculateStageAging(mockContacts, dateRange),
      cumulative: calculateCumulativeBookings(mockContacts, dateRange),
    };
  }, [dateRange]);

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

        {/* Footer */}
        <footer className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          <p>Data refreshes with date filter changes • All times in UTC</p>
        </footer>
      </main>
    </div>
  );
}
