import { useState, useEffect } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useIgSessions } from "@/hooks/useIgSessions";
import {
  useScrapeJobs,
  useScrapeJob,
  useStartScrape,
  useCancelScrape,
  usePauseScrape,
  useResumeScrape,
  useDeleteScrape,
  useScrapeSocket,
} from "@/hooks/useScrapeJobs";
import type { ScrapeJob, ScrapeJobStatus } from "@/lib/types";
import {
  Plus,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Pause,
  Loader2,
  Eye,
  Users,
  UserCheck,
  UserX,
  Filter,
  SkipForward,
  ArrowUpDown,
  Square,
  Trash2,
} from "lucide-react";

const STATUS_BADGE: Record<ScrapeJobStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
  collecting_followers: { label: "Collecting Followers", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  fetching_bios: { label: "Fetching Bios", className: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  completed: { label: "Completed", className: "bg-green-500/15 text-green-400 border-green-500/30" },
  failed: { label: "Failed", className: "bg-red-500/15 text-red-400 border-red-500/30" },
  cancelled: { label: "Cancelled", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  paused: { label: "Paused", className: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isActiveJob(status: ScrapeJobStatus) {
  return status === "pending" || status === "collecting_followers" || status === "fetching_bios";
}

function JobProgress({ job }: { job: ScrapeJob }) {
  if (job.status === "pending") {
    return <span className="text-xs text-muted-foreground">Waiting...</span>;
  }

  if (job.status === "collecting_followers") {
    const pct = job.total_followers > 0
      ? Math.round((job.followers_collected / job.total_followers) * 100)
      : 0;
    return (
      <div className="flex items-center gap-2 min-w-[140px]">
        <Progress value={pct} className="h-2 flex-1" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {job.followers_collected}/{job.total_followers}
        </span>
      </div>
    );
  }

  if (job.status === "fetching_bios") {
    const pct = job.followers_collected > 0
      ? Math.round((job.bios_fetched / job.followers_collected) * 100)
      : 0;
    return (
      <div className="flex items-center gap-2 min-w-[140px]">
        <Progress value={pct} className="h-2 flex-1" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {job.bios_fetched}/{job.followers_collected} bios
        </span>
      </div>
    );
  }

  if (job.status === "completed") {
    const r = job.results;
    return (
      <span className="text-xs text-muted-foreground">
        {r ? r.leads_created + r.leads_updated : 0} leads
      </span>
    );
  }

  if (job.status === "paused") {
    const total = job.followers_collected || job.total_followers || 0;
    const done = job.bios_fetched || 0;
    if (total > 0 && done > 0) {
      const pct = Math.round((done / total) * 100);
      return (
        <div className="flex items-center gap-2 min-w-[140px]">
          <Progress value={pct} className="h-2 flex-1" />
          <span className="text-xs text-orange-400 whitespace-nowrap">
            {done}/{total} paused
          </span>
        </div>
      );
    }
    return <span className="text-xs text-orange-400">Paused</span>;
  }

  if (job.status === "failed") {
    return <span className="text-xs text-destructive truncate max-w-[160px]">{job.error || "Failed"}</span>;
  }

  return <span className="text-xs text-muted-foreground">—</span>;
}

function JobDetailDialog({
  jobId,
  open,
  onClose,
}: {
  jobId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data: job, isLoading } = useScrapeJob(open ? jobId : null);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Scrape Job Details</DialogTitle>
          <DialogDescription>
            {job ? `@${job.target_username}` : "Loading..."}
          </DialogDescription>
        </DialogHeader>
        {isLoading || !job ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Badge className={STATUS_BADGE[job.status].className}>
                {STATUS_BADGE[job.status].label}
              </Badge>
            </div>

            {job.error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{job.error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3 space-y-1">
                <p className="text-xs text-muted-foreground">Total Followers</p>
                <p className="text-lg font-semibold">{(job.total_followers || 0).toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-3 space-y-1">
                <p className="text-xs text-muted-foreground">Collected</p>
                <p className="text-lg font-semibold">{(job.followers_collected || 0).toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-3 space-y-1">
                <p className="text-xs text-muted-foreground">Bios Fetched</p>
                <p className="text-lg font-semibold">{(job.bios_fetched || 0).toLocaleString()}</p>
              </div>
            </div>

            {job.results && (job.status === "completed" || job.results.leads_created > 0) && (
              <>
                <h4 className="text-sm font-semibold pt-2">Results</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <UserCheck className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="font-semibold">{job.results.leads_created}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <ArrowUpDown className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Updated</p>
                      <p className="font-semibold">{job.results.leads_updated}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <Filter className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Filtered</p>
                      <p className="font-semibold">{job.results.leads_filtered}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <UserX className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Unqualified</p>
                      <p className="font-semibold">{job.results.leads_unqualified}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <SkipForward className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Skipped</p>
                      <p className="font-semibold">{job.results.leads_skipped}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="text-xs text-muted-foreground pt-2">
              Started {formatDate(job.createdAt)}
              {job.updatedAt !== job.createdAt && ` · Updated ${formatDate(job.updatedAt)}`}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Scraper() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = usePersistedState("scraper-status", "all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [targetUsername, setTargetUsername] = useState("");
  const [selectedIgUsername, setSelectedIgUsername] = useState("");
  const [viewingJobId, setViewingJobId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const limit = 20;

  // Real-time socket updates
  useScrapeSocket();

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const { data, isLoading, isError, error, refetch } = useScrapeJobs({
    status: statusFilter === "all" ? undefined : statusFilter,
    page: currentPage,
    limit,
  });

  const { data: igSessionsData } = useIgSessions();

  const startMutation = useStartScrape();
  const cancelMutation = useCancelScrape();
  const pauseMutation = usePauseScrape();
  const resumeMutation = useResumeScrape();
  const deleteMutation = useDeleteScrape();

  const jobs = data?.jobs || [];
  const pagination = data?.pagination;
  const igProfiles = (igSessionsData?.ig_sessions || []).filter((p) => p.has_cookies);

  const handleStart = async () => {
    const username = targetUsername.replace(/^@/, "").trim();
    if (!username || !selectedIgUsername) return;

    try {
      await startMutation.mutateAsync({
        target_username: username,
        ig_username: selectedIgUsername,
      });
      toast({ title: "Scrape Started", description: `Scraping followers of @${username}` });
      setShowNewDialog(false);
      setTargetUsername("");
      setSelectedIgUsername("");
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to start scrape",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async () => {
    if (!cancellingId) return;
    try {
      await cancelMutation.mutateAsync(cancellingId);
      toast({ title: "Cancelled", description: "Scrape job cancelled." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to cancel",
        variant: "destructive",
      });
    }
    setCancellingId(null);
  };

  const handlePause = async (id: string) => {
    try {
      await pauseMutation.mutateAsync(id);
      toast({ title: "Paused", description: "Scrape job paused. You can resume it anytime." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to pause",
        variant: "destructive",
      });
    }
  };

  const handleResume = async (id: string) => {
    try {
      await resumeMutation.mutateAsync(id);
      toast({ title: "Resumed", description: "Scrape job resumed." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to resume",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync(deletingId);
      toast({ title: "Deleted", description: "Scrape job deleted." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete",
        variant: "destructive",
      });
    }
    setDeletingId(null);
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-16 z-50 bg-background border-b border-border">
        <div className="px-6 py-4 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Follower Scraper</h2>
            <p className="text-muted-foreground">
              Scrape Instagram followers and generate leads
            </p>
          </div>

          <div className="flex gap-4 items-end">
            <div className="flex flex-col gap-2 w-44">
              <Label>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="collecting_followers">Collecting</SelectItem>
                  <SelectItem value="fetching_bios">Fetching Bios</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => setShowNewDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Scrape
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        {isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-lg font-semibold mb-2">Failed to load scrape jobs</h2>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : "An unknown error occurred"}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <>
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Target</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Results</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No scrape jobs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    jobs.map((job) => {
                      const badge = STATUS_BADGE[job.status];
                      const active = isActiveJob(job.status);
                      const r = job.results;

                      return (
                        <TableRow key={job._id}>
                          <TableCell className="font-medium">
                            @{job.target_username}
                          </TableCell>
                          <TableCell>
                            <Badge className={badge.className}>
                              {active && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                              {badge.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <JobProgress job={job} />
                          </TableCell>
                          <TableCell>
                            {r && (job.status === "completed" || r.leads_created > 0) ? (
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="text-green-500">{r.leads_created} new</span>
                                <span>{r.leads_updated} upd</span>
                                <span>{r.leads_filtered} filt</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {formatDate(job.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewingJobId(job._id)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              {active && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePause(job._id)}
                                    disabled={pauseMutation.isPending}
                                    title="Pause"
                                  >
                                    <Pause className="h-3.5 w-3.5 text-orange-400" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCancellingId(job._id)}
                                    disabled={cancelMutation.isPending}
                                    title="Stop"
                                  >
                                    <Square className="h-3.5 w-3.5 text-destructive" />
                                  </Button>
                                </>
                              )}
                              {(job.status === "paused" || job.status === "cancelled" || job.status === "failed") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResume(job._id)}
                                  disabled={resumeMutation.isPending}
                                  title="Resume"
                                >
                                  <Play className="h-3.5 w-3.5 text-green-500" />
                                </Button>
                              )}
                              {!active && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeletingId(job._id)}
                                  disabled={deleteMutation.isPending}
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-4 mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
                    }
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

      {/* New Scrape Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Scrape Job</DialogTitle>
            <DialogDescription>
              Scrape followers from an Instagram account and generate leads.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="target">Target Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input
                  id="target"
                  placeholder="username"
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cookie Profile</Label>
              <Select value={selectedIgUsername} onValueChange={setSelectedIgUsername}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an IG profile..." />
                </SelectTrigger>
                <SelectContent>
                  {igProfiles.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      No profiles — add cookies in Integrations
                    </SelectItem>
                  ) : (
                    igProfiles.map((p) => (
                      <SelectItem key={p.ig_username} value={p.ig_username}>
                        @{p.ig_username}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The Instagram cookie profile used for scraping.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleStart}
                disabled={
                  !targetUsername.replace(/^@/, "").trim() ||
                  !selectedIgUsername ||
                  startMutation.isPending
                }
              >
                {startMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Start Scrape
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Detail Dialog */}
      <JobDetailDialog
        jobId={viewingJobId}
        open={!!viewingJobId}
        onClose={() => setViewingJobId(null)}
      />

      {/* Cancel Confirmation */}
      <AlertDialog open={!!cancellingId} onOpenChange={(open) => !open && setCancellingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Scrape Job</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop the scrape job. You can resume it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Running</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Job"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scrape Job</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this scrape job. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
