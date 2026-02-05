import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useRawLeads } from "@/hooks/useRawLeads";
import { useAccounts } from "@/hooks/useAccounts";
import { ContactsTable } from "@/components/contacts-table";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { AlertCircle, RefreshCw, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { DateRangeFilter } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_OPTIONS = [
  { value: "booked", label: "Booked" },
  { value: "qualified", label: "Qualified" },
  { value: "ghosted", label: "Ghosted" },
  { value: "follow_up", label: "Follow Up" },
];

export default function AllContacts() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params
  const [selectedAccount, setSelectedAccount] = useState<string>(
    searchParams.get("account") || "all"
  );
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    searchParams.get("status")?.split(",").filter(Boolean) || []
  );
  const [dateRange, setDateRange] = useState<DateRangeFilter>(
    (searchParams.get("dateRange") as DateRangeFilter) || 14
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get("search") || ""
  );
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>(
    searchParams.get("search") || ""
  );
  const [currentPage, setCurrentPage] = useState<number>(
    parseInt(searchParams.get("page") || "1", 10)
  );
  const [itemsPerPage] = useState<number>(
    parseInt(searchParams.get("limit") || "20", 10)
  );

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

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [ghlId, selectedStatuses, startDate, endDate, debouncedSearchQuery]);

  // Update URL params when state changes
  useEffect(() => {
    const params = new URLSearchParams();

    if (selectedAccount !== "all") {
      params.set("account", selectedAccount);
    }

    if (selectedStatuses.length > 0) {
      params.set("status", selectedStatuses.join(","));
    }

    if (dateRange !== 14) {
      params.set("dateRange", dateRange.toString());
    }

    if (debouncedSearchQuery) {
      params.set("search", debouncedSearchQuery);
    }

    if (currentPage !== 1) {
      params.set("page", currentPage.toString());
    }

    if (itemsPerPage !== 20) {
      params.set("limit", itemsPerPage.toString());
    }

    setSearchParams(params, { replace: true });
  }, [selectedAccount, selectedStatuses, dateRange, debouncedSearchQuery, currentPage, itemsPerPage, setSearchParams]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useRawLeads({
    ghlId,
    statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
    startDate,
    endDate,
    search: debouncedSearchQuery || undefined,
    page: currentPage,
    limit: itemsPerPage,
  });

  const contacts = data?.leads || [];
  const pagination = data?.pagination;

  // Get accounts from /accounts endpoint
  const { data: accounts = [] } = useAccounts();

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="sticky top-20 z-10 bg-background pb-4 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Contacts</h2>
          <p className="text-muted-foreground">
            View and manage all your contacts
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
                      {account.first_name} {account.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-2 w-64">
            <Label>Filter by Status</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedStatuses.length && "text-muted-foreground",
                  )}
                >
                  {selectedStatuses.length > 0
                    ? `${selectedStatuses.length} selected`
                    : "All Statuses"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <div className="space-y-2">
                  {STATUS_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={option.value}
                        checked={selectedStatuses.includes(option.value)}
                        onCheckedChange={() => toggleStatus(option.value)}
                      />
                      <label
                        htmlFor={option.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                  {selectedStatuses.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => setSelectedStatuses([])}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-2 w-64">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Date Range</Label>
            <DateFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </div>

      {isError ? (
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
      ) : (
        <>
          <ContactsTable contacts={contacts} />

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} contacts
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
