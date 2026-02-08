import { useState, useMemo } from "react";
import { DateRangeFilter } from "@/lib/types";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAccounts } from "@/hooks/useAccounts";
import { useAuth } from "@/contexts/AuthContext";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { FunnelOverview } from "@/components/dashboard/FunnelOverview";
import { VelocityChart } from "@/components/dashboard/VelocityChart";
import { DailyVolumeChart } from "@/components/dashboard/DailyVolumeChart";
import { GhostingAnalysis } from "@/components/dashboard/GhostingAnalysis";
import { FupEffectivenessChart } from "@/components/dashboard/FupEffectivenessChart";
import { StageAgingTable } from "@/components/dashboard/StageAgingTable";
import { CumulativeBookingsChart } from "@/components/dashboard/CumulativeBookingsChart";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function Index() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRangeFilter>(14);
  const [selectedAccount, setSelectedAccount] = useState<string>("all");

  // Determine which ghl to use for filtering
  const ghlId = useMemo(() => {
    // If user is not admin, use their ghl
    if (user?.role !== 0) {
      return user?.ghl;
    }
    // If admin and has selected an account, use that account's ghl
    if (selectedAccount !== "all") {
      return selectedAccount;
    }
    // If admin and "all" is selected, don't filter by ghl
    return undefined;
  }, [user?.role, user?.ghl, selectedAccount]);

  // Calculate start and end dates based on dateRange
  const endDate = useMemo(() => {
    if (dateRange === "all") return undefined;
    return new Date().toISOString().split("T")[0]; // Today in YYYY-MM-DD format
  }, [dateRange]);

  const startDate = useMemo(() => {
    if (dateRange === "all") return undefined;
    const date = new Date();
    date.setDate(date.getDate() - dateRange);
    return date.toISOString().split("T")[0]; // dateRange days ago in YYYY-MM-DD format
  }, [dateRange]);

  // Get accounts from /accounts endpoint
  const { data: accounts = [] } = useAccounts();

  const {
    data: metrics,
    isLoading,
    isError,
    error,
    refetch,
  } = useAnalytics({
    ghlId,
    startDate,
    endDate,
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Track and analyze your DM pipeline performance
          </p>
        </div>
        <div className="flex gap-4 items-end">
          {user?.role === 0 && (
            <div className="flex flex-col gap-2 w-64">
              <Label htmlFor="account-filter">Filter by Account</Label>
              <Select
                value={selectedAccount}
                onValueChange={setSelectedAccount}
              >
                <SelectTrigger id="account-filter">
                  <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.ghl} value={account.ghl}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label>Date Range</Label>
            <DateFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </div>

      <div className="flex-1">
        {isLoading ? (
          <DashboardSkeleton />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-lg font-semibold mb-2">Failed to load data</h2>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error
                ? error.message
                : "An unknown error occurred"}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : metrics ? (
          <div className="space-y-6">
            {/* Funnel Overview with Area Chart */}
            <FunnelOverview metrics={metrics.funnel} />

            {/* Row 2: Velocity + Cumulative */}
            <div className="grid gap-6 lg:grid-cols-2">
              <VelocityChart metrics={metrics.velocity} />
              <CumulativeBookingsChart data={metrics.cumulative} />
            </div>

            {/* Row 3: Daily Volume (full width) */}
            <DailyVolumeChart data={metrics.dailyVolume} />

            {/* Row 4: Ghosting + FUP */}
            {/* <div className="grid gap-6 lg:grid-cols-2">
              <GhostingAnalysis data={metrics.ghosting} />
              <FupEffectivenessChart data={metrics.fup} />
            </div> */}

            {/* Row 5: Stage Aging */}
            <StageAgingTable data={metrics.aging} />
          </div>
        ) : null}

        {/* Footer */}
        <footer className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          <p>Data refreshes with date filter changes • All times in UTC</p>
        </footer>
      </div>
    </div>
  );
}
