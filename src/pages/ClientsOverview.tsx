import { useMemo } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useNavigate } from "react-router-dom";
import { useAccountsAnalytics } from "@/hooks/useAccountsAnalytics";
import { DateRangeFilter } from "@/lib/types";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";

export default function ClientsOverview() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = usePersistedState<DateRangeFilter>("clients-dateRange", 14);

  // Calculate start and end dates based on dateRange
  const endDate = useMemo(() => {
    if (dateRange === "all") return undefined;
    return new Date().toISOString().split("T")[0];
  }, [dateRange]);

  const startDate = useMemo(() => {
    if (dateRange === "all") return undefined;
    const date = new Date();
    date.setDate(date.getDate() - dateRange);
    return date.toISOString().split("T")[0];
  }, [dateRange]);

  const {
    data: accounts,
    isLoading,
    isError,
    error,
    refetch,
  } = useAccountsAnalytics({
    startDate,
    endDate,
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">Failed to load clients</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "An unknown error occurred"}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clients Overview</h2>
          <p className="text-muted-foreground">
            View and manage all your clients with detailed analytics
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Date Range</Label>
          <DateFilter value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          {accounts && accounts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Total Leads</TableHead>
                    <TableHead className="text-right">Link Sent</TableHead>
                    <TableHead className="text-right">Converted</TableHead>
                    <TableHead className="text-right">Ghosted</TableHead>
                    <TableHead className="text-right">Follow-up</TableHead>
                    <TableHead className="text-right">Low Ticket</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow
                      key={account.account_id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/clients/${account.account_id}`)}
                    >
                      <TableCell className="font-medium text-primary hover:underline">
                        {account.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {account.totalLeads.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {account.link_sent.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {account.booked.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {account.ghosted.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {account.follow_up.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {account.low_ticket.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No clients found for the selected date range</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
