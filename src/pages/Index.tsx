import { useMemo } from "react";
import { Link } from "react-router-dom";
import { DateRangeFilter } from "@/lib/types";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAccounts } from "@/hooks/useAccounts";
import { useContentAnalytics } from "@/hooks/useContentAnalytics";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminView } from "@/contexts/AdminViewContext";
import { usePersistedState } from "@/hooks/usePersistedState";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { FunnelOverview } from "@/components/dashboard/FunnelOverview";
import { VelocityChart } from "@/components/dashboard/VelocityChart";
import { DailyVolumeChart } from "@/components/dashboard/DailyVolumeChart";
import { StageAgingTable } from "@/components/dashboard/StageAgingTable";
import { CumulativeBookingsChart } from "@/components/dashboard/CumulativeBookingsChart";
import { LeadsRadarChart } from "@/components/dashboard/LeadsRadarChart";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { SalesOverview } from "@/components/dashboard/SalesOverview";
import { ContentTotalsTiles } from "@/components/dashboard/ContentTotalsTiles";
import { TopLeadMagnets } from "@/components/dashboard/TopLeadMagnets";
import { PipelineCard } from "@/components/dashboard/PipelineCard";
import { LeadMagnetQueue } from "@/components/dashboard/LeadMagnetQueue";
import { UpcomingCalls } from "@/components/dashboard/UpcomingCalls";
import { LeadsBySource } from "@/components/dashboard/LeadsBySource";
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
  const { viewAll } = useAdminView();
  const [dateRange, setDateRange] = usePersistedState<DateRangeFilter>("dash-dateRange", 1);
  const [selectedAccount, setSelectedAccount] = usePersistedState<string>("dash-account", "all");
  // Dashboard range in days for the content and lead-magnet endpoints.
  const days = dateRange === "all" ? 365 : Math.min(365, Math.max(1, Math.ceil(dateRange)));

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

  // Admin "My Data" mode: force own account. "All Clients" mode: use dropdown.
  const effectiveAccountId = user?.role === 0
    ? (viewAll
        ? (selectedAccount !== "all" ? selectedAccount : undefined)
        : user?.account_id || undefined)
    : undefined;

  // Which platform's funnel to show: an admin drilling into a specific client
  // uses that client's default_platform; everyone else uses their own account's.
  const dashPlatform: "instagram" | "linkedin" =
    user?.role === 0 && viewAll && selectedAccount !== "all"
      ? (accounts.find((a) => a._id === selectedAccount)?.default_platform ?? "instagram")
      : (user?.default_platform ?? "instagram");

  const {
    data: metrics,
    isLoading,
    isError,
    error,
    refetch,
  } = useAnalytics({
    startDate,
    endDate,
    accountId: effectiveAccountId,
  });

  const { data: content, isLoading: contentLoading } = useContentAnalytics(days);

  return (
    <div className="flex flex-1 flex-col gap-4 p-3 sm:p-4 overflow-x-hidden">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-wrap gap-3 items-end">
          {user?.role === 0 && viewAll && (
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
                    <SelectItem key={account._id} value={account._id}>
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
            <FunnelOverview metrics={metrics.funnel} platform={dashPlatform} />

            {content?.totals && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-semibold">Content</h2>
                  <Link to="/analytics/content" className="text-xs text-muted-foreground hover:text-foreground">
                    All posts
                  </Link>
                </div>
                <ContentTotalsTiles totals={content.totals} />
              </div>
            )}

            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 items-start">
              <TopLeadMagnets days={days} />
              <LeadsBySource rows={content?.by_source} isLoading={contentLoading} limit={5} showLink />
            </div>

            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 items-start">
              <PipelineCard />
              <LeadMagnetQueue />
              <UpcomingCalls />
            </div>

            {metrics.sales && metrics.sales.total_bookings > 0 && (
              <SalesOverview metrics={metrics.sales} />
            )}

            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-stretch">
              <VelocityChart metrics={metrics.velocity} />
              <CumulativeBookingsChart data={metrics.cumulative} />
              <LeadsRadarChart data={metrics.radar || []} />
            </div>

            <DailyVolumeChart data={metrics.dailyVolume} />

            <StageAgingTable data={metrics.aging} />
          </div>
        ) : null}

        <footer className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          <p>Data refreshes with date filter changes • All times in UTC</p>
        </footer>
      </div>
    </div>
  );
}
