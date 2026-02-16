import { useState, useMemo } from "react";
import { DateRangeFilter, SourceFilter } from "@/lib/types";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAccounts } from "@/hooks/useAccounts";
import { useAuth } from "@/contexts/AuthContext";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { FunnelOverview } from "@/components/dashboard/FunnelOverview";
import { VelocityChart } from "@/components/dashboard/VelocityChart";
import { DailyVolumeChart } from "@/components/dashboard/DailyVolumeChart";
import { StageAgingTable } from "@/components/dashboard/StageAgingTable";
import { CumulativeBookingsChart } from "@/components/dashboard/CumulativeBookingsChart";
import { LeadsRadarChart } from "@/components/dashboard/LeadsRadarChart";
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
import { cn } from "@/lib/utils";

export default function Index() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRangeFilter>(1);
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const hasOutbound = !!user?.has_outbound;
  const [source, setSource] = useState<SourceFilter>(hasOutbound ? "all" : "inbound");
  const effectiveSource = hasOutbound ? source : "inbound";

  const endDate = useMemo(() => {
    if (dateRange === "all") return undefined;
    return new Date().toISOString().split("T")[0];
  }, [dateRange]);

  const startDate = useMemo(() => {
    if (dateRange === "all") return undefined;
    const date = new Date();
    if (dateRange !== 1) date.setDate(date.getDate() - dateRange);
    return date.toISOString().split("T")[0];
  }, [dateRange]);

  const { data: accounts = [] } = useAccounts();

  const {
    data: metrics,
    isLoading,
    isError,
    error,
    refetch,
  } = useAnalytics({
    startDate,
    endDate,
    source: effectiveSource,
    accountId: selectedAccount !== "all" ? selectedAccount : undefined,
  });

  const isOutbound = effectiveSource === "outbound";

  return (
    <div className="flex flex-1 flex-col gap-4 p-3 sm:p-4 overflow-x-hidden">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Track and analyze your DM pipeline performance
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          {/* Source filter — only shown when user has outbound access */}
          {hasOutbound && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Source</Label>
              <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
                {(["all", "inbound", "outbound"] as SourceFilter[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSource(s)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm font-medium transition-colors capitalize",
                      source === s
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {user?.role === 0 && (
            <div className="flex flex-col gap-1.5 min-w-0 w-full sm:w-48 lg:w-64">
              <Label htmlFor="account-filter" className="text-xs">Filter by Account</Label>
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
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Date Range</Label>
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
            <FunnelOverview metrics={metrics.funnel} source={effectiveSource} />

            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-stretch">
              {isOutbound ? (
                <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm h-full flex flex-col items-center justify-center text-muted-foreground">
                  <p className="text-sm font-medium">Inbound-only metric</p>
                  <p className="text-xs mt-1">Stage Velocity is not available for outbound</p>
                </div>
              ) : (
                <VelocityChart metrics={metrics.velocity} />
              )}
              <CumulativeBookingsChart data={metrics.cumulative} source={effectiveSource} />
              <LeadsRadarChart data={metrics.radar || []} source={effectiveSource} />
            </div>

            <DailyVolumeChart data={metrics.dailyVolume} source={effectiveSource} />

            {!isOutbound && <StageAgingTable data={metrics.aging} />}
          </div>
        ) : null}

        <footer className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          <p>Data refreshes with date filter changes • All times in UTC</p>
        </footer>
      </div>
    </div>
  );
}
