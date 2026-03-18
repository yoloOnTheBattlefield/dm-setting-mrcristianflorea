import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/StatCard";
import ClientCard from "@/components/advisory/ClientCard";
import CreateClientDialog from "@/components/advisory/CreateClientDialog";
import { useAdvisoryClients } from "@/hooks/useAdvisoryClients";
import { useAdvisorySummary } from "@/hooks/useAdvisoryMetrics";
import { keepPreviousData } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { ClientStatus, ClientHealth } from "@/lib/advisory-types";

const statusFilters: { label: string; value: ClientStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Churned", value: "churned" },
];

const healthFilters: { label: string; value: ClientHealth | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Green", value: "green" },
  { label: "Amber", value: "amber" },
  { label: "Red", value: "red" },
];

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export default function AdvisoryDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [status, setStatus] = useState<ClientStatus | "all">(
    (searchParams.get("status") as ClientStatus | "all") || "all"
  );
  const [health, setHealth] = useState<ClientHealth | "all">(
    (searchParams.get("health") as ClientHealth | "all") || "all"
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );
  const limit = 20;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, status, health]);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (status !== "all") params.set("status", status);
    if (health !== "all") params.set("health", health);
    if (currentPage !== 1) params.set("page", String(currentPage));
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, status, health, currentPage, setSearchParams]);

  const { data: summary, isLoading: summaryLoading } = useAdvisorySummary();
  const { data, isLoading } = useAdvisoryClients({
    page: currentPage,
    limit,
    search: debouncedSearch || undefined,
    status: status === "all" ? undefined : status,
    health: health === "all" ? undefined : health,
  });

  const clients = data?.items || [];
  const pagination = data?.pagination;

  return (
    <div className="flex flex-1 flex-col min-w-0">
      <div className="p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-3 sm:p-4 shadow-sm">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-7 w-28" />
              </div>
            ))
          ) : (
            <>
              <StatCard label="Total MRR" value={formatCurrency(summary?.total_mrr ?? 0)} />
              <StatCard label="Cash Collected" value={formatCurrency(summary?.total_cash_collected ?? 0)} />
              <StatCard label="Avg Show Rate" value={formatPercent(summary?.avg_show_rate ?? 0)} />
              <StatCard label="Avg Close Rate" value={formatPercent(summary?.avg_close_rate ?? 0)} />
            </>
          )}
        </div>

        {/* Header + New Client button */}
        <div className="flex items-center justify-between gap-4">
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Client
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-1">
            {statusFilters.map((f) => (
              <Button
                key={f.value}
                variant={status === f.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {healthFilters.map((f) => (
              <Button
                key={f.value}
                variant={health === f.value ? "default" : "outline"}
                size="sm"
                onClick={() => setHealth(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Client grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
            No clients yet. Add your first client.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clients.map((client) => (
              <ClientCard key={client._id} client={client} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-4 mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} clients
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
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
                  }
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))
                }
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <CreateClientDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
