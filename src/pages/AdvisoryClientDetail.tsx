import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ClientHealthBadge from "@/components/advisory/ClientHealthBadge";
import ConstraintBadge from "@/components/advisory/ConstraintBadge";
import SessionCard from "@/components/advisory/SessionCard";
import CreateClientDialog from "@/components/advisory/CreateClientDialog";
import CreateSessionDialog from "@/components/advisory/CreateSessionDialog";
import UpsertMetricDialog from "@/components/advisory/UpsertMetricDialog";
import { useAdvisoryClient } from "@/hooks/useAdvisoryClients";
import { useAdvisorySessions } from "@/hooks/useAdvisorySessions";
import { useAdvisoryMetrics } from "@/hooks/useAdvisoryMetrics";

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdvisoryClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [metricOpen, setMetricOpen] = useState(false);
  const [sessionPage, setSessionPage] = useState(1);

  const { data: client, isLoading } = useAdvisoryClient(id!);
  const { data: sessionsData, isLoading: sessionsLoading } = useAdvisorySessions({
    client_id: id,
    page: sessionPage,
    limit: 10,
  });
  const { data: metrics } = useAdvisoryMetrics(id);

  const sessions = sessionsData?.items || [];
  const sessionsPagination = sessionsData?.pagination;
  const latestMetric = client?.latest_metric;
  const sortedMetrics = [...(metrics || [])].sort(
    (a, b) => b.month.localeCompare(a.month)
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Client not found.
      </div>
    );
  }

  const showRate = latestMetric && latestMetric.calls_booked > 0
    ? ((latestMetric.calls_showed / latestMetric.calls_booked) * 100).toFixed(1)
    : "—";
  const closeRate = latestMetric && latestMetric.calls_showed > 0
    ? ((latestMetric.calls_closed / latestMetric.calls_showed) * 100).toFixed(1)
    : "—";

  return (
    <div className="flex flex-1 flex-col min-w-0">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/advisory")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{client.name}</h1>
              <span className="text-muted-foreground">{client.niche}</span>
              <ClientHealthBadge health={client.health} />
              <ConstraintBadge constraint={client.constraint_type} />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSessionOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Log Session
            </Button>
            <Button variant="outline" size="sm" onClick={() => setMetricOpen(true)}>
              <BarChart3 className="h-4 w-4 mr-1" />
              Log Metrics
            </Button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT — Client Info */}
          <div className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
            <h2 className="font-semibold text-foreground">Client Info</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Monthly Revenue</span>
                <p className="font-medium">{formatCurrency(client.monthly_revenue)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Runway</span>
                <p className="font-medium">{formatCurrency(client.runway)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Next Call</span>
                <p className="font-medium">
                  {client.next_call_date ? formatDate(client.next_call_date) : "No call scheduled"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Constraint</span>
                <p className="font-medium capitalize">{client.constraint_type}</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Created</span>
                <p className="font-medium">{formatDate(client.createdAt)}</p>
              </div>
            </div>
            {client.notes && (
              <div>
                <span className="text-sm text-muted-foreground">Notes</span>
                <p className="text-sm mt-1">{client.notes}</p>
              </div>
            )}
          </div>

          {/* RIGHT — Latest Metrics */}
          <div className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
            <h2 className="font-semibold text-foreground">Latest Metrics</h2>
            {latestMetric ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Month</span>
                  <p className="font-medium">{latestMetric.month}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cash Collected</span>
                  <p className="font-medium">{formatCurrency(latestMetric.cash_collected)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">MRR</span>
                  <p className="font-medium">{formatCurrency(latestMetric.mrr)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Calls</span>
                  <p className="font-medium">
                    {latestMetric.calls_booked} booked / {latestMetric.calls_showed} showed / {latestMetric.calls_closed} closed
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Show Rate</span>
                  <p className="font-medium">{showRate}%</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Close Rate</span>
                  <p className="font-medium">{closeRate}%</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Expenses</span>
                  <p className="font-medium">{formatCurrency(latestMetric.expenses)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No metrics recorded yet.</p>
            )}
          </div>
        </div>

        {/* Sessions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Sessions</h2>
          {sessionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              No sessions recorded yet.
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {sessions.map((session) => (
                  <SessionCard key={session._id} session={session} />
                ))}
              </div>
              {sessionsPagination && sessionsPagination.totalPages > sessionsPagination.page && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setSessionPage((prev) => prev + 1)}
                >
                  Load more
                </Button>
              )}
            </>
          )}
        </div>

        {/* Metrics History */}
        {sortedMetrics.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Metrics History</h2>
            <div className="rounded-lg border bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Cash Collected</TableHead>
                    <TableHead className="text-right">MRR</TableHead>
                    <TableHead className="text-right">Booked</TableHead>
                    <TableHead className="text-right">Showed</TableHead>
                    <TableHead className="text-right">Closed</TableHead>
                    <TableHead className="text-right">Show%</TableHead>
                    <TableHead className="text-right">Close%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMetrics.map((m) => {
                    const sr = m.calls_booked > 0
                      ? ((m.calls_showed / m.calls_booked) * 100).toFixed(1)
                      : "—";
                    const cr = m.calls_showed > 0
                      ? ((m.calls_closed / m.calls_showed) * 100).toFixed(1)
                      : "—";
                    return (
                      <TableRow key={m._id}>
                        <TableCell className="font-medium">{m.month}</TableCell>
                        <TableCell className="text-right">{formatCurrency(m.cash_collected)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(m.mrr)}</TableCell>
                        <TableCell className="text-right">{m.calls_booked}</TableCell>
                        <TableCell className="text-right">{m.calls_showed}</TableCell>
                        <TableCell className="text-right">{m.calls_closed}</TableCell>
                        <TableCell className="text-right">{sr}%</TableCell>
                        <TableCell className="text-right">{cr}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      <CreateClientDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editingClient={client}
      />
      <CreateSessionDialog
        open={sessionOpen}
        onOpenChange={setSessionOpen}
        clientId={id!}
      />
      <UpsertMetricDialog
        open={metricOpen}
        onOpenChange={setMetricOpen}
        clientId={id!}
      />
    </div>
  );
}
