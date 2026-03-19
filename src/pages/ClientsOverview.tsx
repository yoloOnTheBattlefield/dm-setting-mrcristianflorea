import { useMemo, useState } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useNavigate } from "react-router-dom";
import { useAccountsAnalytics, useDeleteAccount, useRestoreAccount } from "@/hooks/useAccountsAnalytics";
import { DateRangeFilter } from "@/lib/types";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { Shimmer, TableSkeleton } from "@/components/skeletons";
import { AlertCircle, RefreshCw, Trash2, RotateCcw } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function ClientsOverview() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dateRange, setDateRange] = usePersistedState<DateRangeFilter>("clients-dateRange", 14);
  const [showDeleted, setShowDeleted] = usePersistedState("clients-showDeleted", false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteAccount = useDeleteAccount();
  const restoreAccount = useRestoreAccount();

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
    showDeleted,
  });

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteAccount.mutateAsync(deletingId);
      toast({ title: "Success", description: "Client deleted successfully." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete client",
        variant: "destructive",
      });
    }
    setDeletingId(null);
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreAccount.mutateAsync(id);
      toast({ title: "Success", description: "Client restored successfully." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to restore client",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 animate-in fade-in duration-300">
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <Shimmer className="h-7 w-40" />
            <Shimmer className="h-4 w-64" />
          </div>
          <div className="flex gap-6 items-end">
            <Shimmer className="h-6 w-28 rounded-md" delay="60ms" />
            <div className="space-y-1.5">
              <Shimmer className="h-3 w-16" delay="80ms" />
              <Shimmer className="h-9 w-40 rounded-md" delay="100ms" />
            </div>
          </div>
        </div>
        <Card>
          <CardHeader className="pb-3">
            <Shimmer className="h-5 w-32" delay="120ms" />
          </CardHeader>
          <CardContent>
            <TableSkeleton rows={6} cols={8} colWidths={["w-32", "w-20", "w-16", "w-16", "w-16", "w-16", "w-16", "w-16"]} />
          </CardContent>
        </Card>
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
        <div className="flex gap-6 items-end">
          <div className="flex items-center gap-2">
            <Switch
              id="show-deleted"
              checked={showDeleted}
              onCheckedChange={setShowDeleted}
            />
            <Label htmlFor="show-deleted" className="text-sm whitespace-nowrap">Show Deleted</Label>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Date Range</Label>
            <DateFilter value={dateRange} onChange={setDateRange} />
          </div>
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
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow
                      key={account.account_id}
                      className={`cursor-pointer hover:bg-muted/50 ${account.deleted ? "opacity-50" : ""}`}
                      onClick={() => navigate(`/clients/${account.account_id}`)}
                    >
                      <TableCell className="font-medium text-foreground hover:underline">
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
                      <TableCell>
                        {account.deleted ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestore(account.account_id);
                            }}
                            disabled={restoreAccount.isPending}
                            title="Restore"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingId(account.account_id);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the client account. Data will be preserved but the account will no longer be accessible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteAccount.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAccount.isPending ? "Deleting..." : "Confirm Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
