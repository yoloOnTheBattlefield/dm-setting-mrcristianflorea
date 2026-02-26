import React, { useState, useEffect, useRef } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { usePrompts } from "@/hooks/usePrompts";
import {
  useDeepScrapeJobs,
  useDeepScrapeJob,
  useStartDeepScrape,
  usePauseDeepScrape,
  useCancelDeepScrape,
  useResumeDeepScrape,
  useDeleteDeepScrape,
  useUpdateDeepScrape,
  useDeepScrapeSocket,
  useDeepScrapeLogs,
  useDeepScrapeLeads,
  useDeepScrapeTargetStats,
  useSkipComments,
  useResumeComments,
} from "@/hooks/useDeepScrapeJobs";
import type { DeepScrapeJob, DeepScrapeJobStatus, DeepScrapeLeadEntry, DeepScrapeTargetStat } from "@/lib/types";
import {
  Plus,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Loader2,
  Eye,
  Square,
  Trash2,
  Search,
  UserCheck,
  UserX,
  Filter,
  SkipForward,
  Brain,
  Copy,
  ClipboardCopy,
  Pencil,
  X,
  BarChart3,
  ChevronDown,
  Clock,
  ChevronUp,
  FastForward,
  MessageSquare,
} from "lucide-react";

const STATUS_BADGE: Record<DeepScrapeJobStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
  scraping_reels: { label: "Scraping Reels", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  scraping_comments: { label: "Scraping Comments", className: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  scraping_profiles: { label: "Scraping Profiles", className: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" },
  qualifying: { label: "Qualifying", className: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
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

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return [
    d.getHours().toString().padStart(2, "0"),
    d.getMinutes().toString().padStart(2, "0"),
    d.getSeconds().toString().padStart(2, "0"),
  ].join(":");
}

function isActiveJob(status: DeepScrapeJobStatus) {
  return (
    status === "pending" ||
    status === "scraping_reels" ||
    status === "scraping_comments" ||
    status === "scraping_profiles" ||
    status === "qualifying"
  );
}

function formatSeeds(seeds: string[]) {
  if (seeds.length === 0) return "\u2014";
  const shown = seeds.slice(0, 2).map((s) => `@${s}`).join(", ");
  if (seeds.length > 2) return `${shown} +${seeds.length - 2} more`;
  return shown;
}

function truncateBio(bio: string | null, maxLen = 50): string {
  if (!bio) return "\u2014";
  if (bio.length <= maxLen) return bio;
  return bio.slice(0, maxLen) + "\u2026";
}

function LeadStatusBadge({ lead }: { lead: DeepScrapeLeadEntry }) {
  if (lead.qualified === true) {
    return (
      <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-[10px] px-1.5 py-0">
        Qualified
      </Badge>
    );
  }
  if (lead.unqualified_reason === "low_followers") {
    return (
      <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/30 text-[10px] px-1.5 py-0">
        Low Followers
      </Badge>
    );
  }
  if (lead.unqualified_reason === "ai_rejected") {
    return (
      <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px] px-1.5 py-0">
        Rejected
      </Badge>
    );
  }
  return (
    <Badge className="bg-zinc-500/15 text-zinc-400 border-zinc-500/30 text-[10px] px-1.5 py-0">
      Pending
    </Badge>
  );
}

function JobProgress({ job }: { job: DeepScrapeJob }) {
  const s = job.stats;

  if (job.status === "pending") {
    return <span className="text-xs text-muted-foreground">Waiting...</span>;
  }

  if (job.status === "scraping_reels") {
    return (
      <span className="text-xs text-muted-foreground">
        Reels: {s.reels_scraped}
      </span>
    );
  }

  if (job.status === "scraping_comments") {
    return (
      <span className="text-xs text-muted-foreground">
        Comments: {s.comments_scraped} &middot; {s.unique_commenters} unique
      </span>
    );
  }

  if (job.status === "scraping_profiles") {
    return (
      <span className="text-xs text-muted-foreground">
        {s.profiles_scraped} profiles
      </span>
    );
  }

  if (job.status === "qualifying") {
    return (
      <span className="text-xs text-muted-foreground">
        AI: {s.sent_to_ai}
      </span>
    );
  }

  if (job.status === "completed") {
    return (
      <span className="text-xs text-muted-foreground">
        {s.qualified} qualified
      </span>
    );
  }

  if (job.status === "paused") {
    if (s.profiles_scraped > 0) {
      return (
        <span className="text-xs text-orange-400">
          {s.profiles_scraped} profiles (paused)
        </span>
      );
    }
    if (s.comments_scraped > 0) {
      return (
        <span className="text-xs text-orange-400">
          {s.comments_scraped} comments (paused)
        </span>
      );
    }
    if (s.reels_scraped > 0) {
      return (
        <span className="text-xs text-orange-400">
          {s.reels_scraped} reels (paused)
        </span>
      );
    }
    return <span className="text-xs text-orange-400">Paused</span>;
  }

  if (job.status === "failed") {
    const errorMsg = job.error || "Failed";
    if (errorMsg.length <= 40) {
      return <span className="text-xs text-destructive">{errorMsg}</span>;
    }
    return (
      <TooltipProvider>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <span className="text-xs text-destructive block max-w-[200px] truncate cursor-help">
              {errorMsg}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[400px] max-h-[200px] overflow-auto">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs whitespace-pre-wrap break-all">{errorMsg}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(errorMsg);
                }}
                className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
                title="Copy error"
              >
                <ClipboardCopy className="h-3 w-3" />
              </button>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <span className="text-xs text-muted-foreground">&mdash;</span>;
}

function JobStats({ job }: { job: DeepScrapeJob }) {
  const s = job.stats;
  if (s.qualified > 0 || s.filtered_low_followers > 0 || s.rejected > 0) {
    return (
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="text-green-500">Q:{s.qualified}</span>
        <span>F:{s.filtered_low_followers}</span>
        <span>R:{s.rejected}</span>
      </div>
    );
  }
  return <span className="text-xs text-muted-foreground">&mdash;</span>;
}

function formatDuration(startStr: string | null, endStr: string | null): string {
  if (!startStr) return "\u2014";
  const start = new Date(startStr).getTime();
  const end = endStr ? new Date(endStr).getTime() : Date.now();
  const diffMs = end - start;
  if (diffMs < 0) return "\u2014";
  const totalMins = Math.floor(diffMs / 60000);
  if (totalMins < 1) return "<1m";
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

function computeProgress(job: DeepScrapeJob): number {
  const s = job.stats;
  switch (job.status) {
    case "pending":
      return 0;
    case "scraping_reels": {
      const expected = job.seed_usernames.length * job.reel_limit;
      const pct = expected > 0 ? (s.reels_scraped / expected) : 0;
      return Math.min(5 + pct * 20, 25);
    }
    case "scraping_comments": {
      const pct = s.reels_scraped > 0 ? (s.comments_scraped / (s.reels_scraped * job.comment_limit)) : 0;
      return Math.min(25 + pct * 25, 50);
    }
    case "scraping_profiles":
    case "qualifying": {
      const total = s.unique_commenters || 1;
      const processed = s.profiles_scraped + s.skipped_existing;
      const pct = processed / total;
      return Math.min(50 + pct * 45, 95);
    }
    case "completed":
      return 100;
    case "failed":
    case "cancelled":
    case "paused": {
      if (s.profiles_scraped > 0 && s.unique_commenters > 0)
        return Math.min(50 + ((s.profiles_scraped + s.skipped_existing) / s.unique_commenters) * 45, 95);
      if (s.comments_scraped > 0) return 35;
      if (s.reels_scraped > 0) return 15;
      return 0;
    }
    default:
      return 0;
  }
}

function JobInlineDetail({ jobId }: { jobId: string }) {
  const { data: job, isLoading } = useDeepScrapeJob(jobId);
  const { logs, onLog } = useDeepScrapeLogs(jobId);
  const { leads, onLead } = useDeepScrapeLeads(jobId);
  const logEndRef = useRef<HTMLDivElement>(null);

  useDeepScrapeSocket(onLog, onLead);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const LOG_COLORS: Record<string, string> = {
    info: "text-zinc-400",
    success: "text-green-400",
    warn: "text-yellow-400",
    error: "text-red-400",
  };

  if (isLoading || !job) {
    return (
      <div className="bg-muted/30 p-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  const active = isActiveJob(job.status);
  const progress = computeProgress(job);

  return (
    <div className="bg-muted/30 border-t border-b p-4 space-y-4">
      {/* Header: Status + Duration + Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge className={STATUS_BADGE[job.status].className}>
            {active && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            {STATUS_BADGE[job.status].label}
          </Badge>
          {job.comments_skipped && (
            <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-[10px]">
              Comments Skipped
            </Badge>
          )}
          {job.is_recurring && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3 text-indigo-400" />
              <span>Every {job.repeat_interval_days}d</span>
              {job.next_run_at && <span>&middot; Next: {formatShortDate(job.next_run_at)}</span>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {active ? (
            <span>Running for {formatDuration(job.started_at, null)}</span>
          ) : job.started_at ? (
            <span>Duration: {formatDuration(job.started_at, job.completed_at)}</span>
          ) : (
            <span>Not started</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {(active || job.status === "paused") && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{STATUS_BADGE[job.status].label}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {job.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-destructive break-all">{job.error}</p>
            <button
              onClick={() => navigator.clipboard.writeText(job.error!)}
              className="shrink-0 p-1 rounded hover:bg-destructive/20 transition-colors"
              title="Copy error"
            >
              <ClipboardCopy className="h-3.5 w-3.5 text-destructive" />
            </button>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
        <div className="rounded-lg border p-2 space-y-0.5">
          <p className="text-[10px] text-muted-foreground">Reels</p>
          <p className="text-sm font-semibold">{(job.stats.reels_scraped || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-lg border p-2 space-y-0.5">
          <p className="text-[10px] text-muted-foreground">Comments</p>
          <p className="text-sm font-semibold">{(job.stats.comments_scraped || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-lg border p-2 space-y-0.5">
          <p className="text-[10px] text-muted-foreground">Commenters</p>
          <p className="text-sm font-semibold">{(job.stats.unique_commenters || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-lg border p-2 space-y-0.5">
          <p className="text-[10px] text-muted-foreground">Profiles</p>
          <p className="text-sm font-semibold">{(job.stats.profiles_scraped || 0).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border p-2">
          <UserCheck className="h-3.5 w-3.5 text-green-500 shrink-0" />
          <div>
            <p className="text-[10px] text-muted-foreground">Qualified</p>
            <p className="text-sm font-semibold">{(job.stats.qualified || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border p-2">
          <UserX className="h-3.5 w-3.5 text-orange-500 shrink-0" />
          <div>
            <p className="text-[10px] text-muted-foreground">Rejected</p>
            <p className="text-sm font-semibold">{(job.stats.rejected || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Secondary stats row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span><Filter className="h-3 w-3 inline mr-1 text-yellow-500" />Low Followers: {(job.stats.filtered_low_followers || 0).toLocaleString()}</span>
        <span><Brain className="h-3 w-3 inline mr-1 text-cyan-500" />Sent to AI: {(job.stats.sent_to_ai || 0).toLocaleString()}</span>
        <span><SkipForward className="h-3 w-3 inline mr-1" />Skipped: {(job.stats.skipped_existing || 0).toLocaleString()}</span>
        <span>Created: {(job.stats.leads_created || 0).toLocaleString()}</span>
        <span>Updated: {(job.stats.leads_updated || 0).toLocaleString()}</span>
      </div>

      {/* Leads Found Table */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Leads Found ({leads.length})</h4>
        <div className="max-h-[250px] overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Username</TableHead>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Followers</TableHead>
                <TableHead className="text-xs">Bio</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-12 text-center text-xs text-muted-foreground">
                    No leads yet. Leads will appear here in real-time.
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead, i) => (
                  <TableRow key={`${lead.username}-${i}`} className="h-8">
                    <TableCell className="text-xs font-medium py-1.5">@{lead.username}</TableCell>
                    <TableCell className="text-xs text-muted-foreground py-1.5">{lead.fullName || "\u2014"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground py-1.5">{lead.followersCount.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-muted-foreground py-1.5 max-w-[150px] truncate" title={lead.bio || undefined}>
                      {truncateBio(lead.bio)}
                    </TableCell>
                    <TableCell className="py-1.5">
                      <LeadStatusBadge lead={lead} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Live Console */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Live Console</h4>
        <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-3 max-h-[300px] overflow-y-auto font-mono text-xs leading-relaxed">
          {logs.length === 0 ? (
            <p className="text-zinc-600">No logs yet. Logs will appear here in real-time.</p>
          ) : (
            logs.map((entry, i) => (
              <div key={i} className={LOG_COLORS[entry.level] || "text-zinc-400"}>
                [{formatTime(entry.timestamp)}] {entry.message}
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Seeds: {job.seed_usernames.map((u) => `@${u}`).join(", ")}
        {" \u00b7 "}Started {formatDate(job.createdAt)}
        {job.updatedAt !== job.createdAt && ` \u00b7 Updated ${formatDate(job.updatedAt)}`}
      </div>
    </div>
  );
}

export default function DeepScraper() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = usePersistedState("deep-scraper-status", "all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<DeepScrapeJob | null>(null);
  const [editSeeds, setEditSeeds] = useState<string[]>([]);
  const [editNewSeedText, setEditNewSeedText] = useState("");
  const [editName, setEditName] = useState("");
  const [editReelLimit, setEditReelLimit] = useState(10);
  const [editCommentLimit, setEditCommentLimit] = useState(100);
  const [editMinFollowers, setEditMinFollowers] = useState(1000);
  const [editIsRecurring, setEditIsRecurring] = useState(false);
  const [editRepeatInterval, setEditRepeatInterval] = useState(3);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const limit = 20;

  // New job form state
  const [jobName, setJobName] = useState("");
  const [seedText, setSeedText] = useState("");
  const [reelLimit, setReelLimit] = useState(10);
  const [commentLimit, setCommentLimit] = useState(100);
  const [minFollowers, setMinFollowers] = useState(1000);
  const [forceReprocess, setForceReprocess] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState("none");
  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatIntervalDays, setRepeatIntervalDays] = useState(3);

  // Target picker state
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const [targetSearch, setTargetSearch] = useState("");
  const [targetSort, setTargetSort] = useState<"best_qual" | "most_scraped" | "alpha">("best_qual");
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());

  // Real-time socket updates
  useDeepScrapeSocket();

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const { data, isLoading, isError, error, refetch } = useDeepScrapeJobs({
    status: statusFilter === "all" ? undefined : statusFilter,
    page: currentPage,
    limit,
  });

  const { data: prompts } = usePrompts();

  const startMutation = useStartDeepScrape();
  const cancelMutation = useCancelDeepScrape();
  const pauseMutation = usePauseDeepScrape();
  const resumeMutation = useResumeDeepScrape();
  const deleteMutation = useDeleteDeepScrape();
  const skipCommentsMutation = useSkipComments();
  const resumeCommentsMutation = useResumeComments();
  const updateMutation = useUpdateDeepScrape();

  const { data: targetStatsData } = useDeepScrapeTargetStats();

  const jobs = data?.jobs || [];
  const pagination = data?.pagination;
  const promptsList = Array.isArray(prompts) ? prompts : [];
  const targets = targetStatsData?.targets || [];
  const [showTargetStats, setShowTargetStats] = usePersistedState("deep-scraper-show-targets", true);

  // Precomputed qual rate lookup for edit dialog chips
  const targetQualMap = React.useMemo(() => {
    const map: Record<string, { qualRate: number | null; qualified: number; rejected: number }> = {};
    for (const t of targets) {
      const total = t.qualified + t.rejected;
      map[t.seed] = {
        qualRate: total > 0 ? +((t.qualified / total) * 100).toFixed(0) : null,
        qualified: t.qualified,
        rejected: t.rejected,
      };
    }
    return map;
  }, [targets]);

  const parsedSeeds = seedText
    .split("\n")
    .map((s) => s.replace(/^@/, "").trim())
    .filter(Boolean);

  const handleStart = async () => {
    if (parsedSeeds.length === 0) return;

    try {
      await startMutation.mutateAsync({
        name: jobName.trim() || undefined,
        seed_usernames: parsedSeeds,
        reel_limit: reelLimit,
        comment_limit: commentLimit,
        min_followers: minFollowers,
        force_reprocess: forceReprocess,
        prompt_id: selectedPromptId !== "none" ? selectedPromptId : undefined,
        is_recurring: isRecurring,
        repeat_interval_days: isRecurring ? repeatIntervalDays : undefined,
      });
      toast({
        title: "Deep Scrape Started",
        description: `Scraping reels from ${parsedSeeds.length} seed account${parsedSeeds.length > 1 ? "s" : ""}`,
      });
      setShowNewDialog(false);
      setJobName("");
      setSeedText("");
      setReelLimit(10);
      setCommentLimit(100);
      setMinFollowers(1000);
      setForceReprocess(false);
      setSelectedPromptId("none");
      setIsRecurring(false);
      setRepeatIntervalDays(3);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to start deep scrape",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async () => {
    if (!cancellingId) return;
    try {
      await cancelMutation.mutateAsync(cancellingId);
      toast({ title: "Cancelled", description: "Deep scrape job cancelled." });
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
      toast({ title: "Paused", description: "Deep scrape job paused. You can resume it anytime." });
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
      toast({ title: "Resumed", description: "Deep scrape job resumed." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to resume",
        variant: "destructive",
      });
    }
  };

  const handleReplicate = (job: DeepScrapeJob) => {
    setJobName(job.name || "");
    setSeedText(job.seed_usernames.join("\n"));
    setReelLimit(job.reel_limit);
    setCommentLimit(job.comment_limit);
    setMinFollowers(job.min_followers);
    setForceReprocess(false);
    setSelectedPromptId(job.promptId || "none");
    setIsRecurring(job.is_recurring);
    setRepeatIntervalDays(job.repeat_interval_days || 3);
    setShowNewDialog(true);
  };

  const handleRerun = async (job: DeepScrapeJob) => {
    try {
      await startMutation.mutateAsync({
        name: job.name || undefined,
        seed_usernames: job.seed_usernames,
        reel_limit: job.reel_limit,
        comment_limit: job.comment_limit,
        min_followers: job.min_followers,
        force_reprocess: false,
        prompt_id: job.promptId || undefined,
        is_recurring: job.is_recurring,
        repeat_interval_days: job.is_recurring ? (job.repeat_interval_days || undefined) : undefined,
      });
      toast({
        title: "Deep Scrape Restarted",
        description: `Rerunning scrape for ${job.seed_usernames.length} seed account${job.seed_usernames.length > 1 ? "s" : ""}`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to rerun scrape",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync(deletingId);
      toast({ title: "Deleted", description: "Deep scrape job deleted." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete",
        variant: "destructive",
      });
    }
    setDeletingId(null);
  };

  const handleSkipComments = async (id: string) => {
    try {
      await skipCommentsMutation.mutateAsync(id);
      toast({ title: "Skipping Comments", description: "Skipping remaining comments and proceeding to qualifying." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to skip comments",
        variant: "destructive",
      });
    }
  };

  const handleResumeComments = async (id: string) => {
    try {
      await resumeCommentsMutation.mutateAsync(id);
      toast({ title: "Resuming Comments", description: "Resuming comment scraping from where it left off." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to resume comments",
        variant: "destructive",
      });
    }
  };

  const handleOpenEdit = (job: DeepScrapeJob) => {
    setEditingJob(job);
    setEditSeeds([...job.seed_usernames]);
    setEditNewSeedText("");
    setEditName(job.name || "");
    setEditReelLimit(job.reel_limit);
    setEditCommentLimit(job.comment_limit);
    setEditMinFollowers(job.min_followers);
    setEditIsRecurring(job.is_recurring);
    setEditRepeatInterval(job.repeat_interval_days || 3);
  };

  const handleRemoveEditSeed = (seed: string) => {
    setEditSeeds((prev) => prev.filter((s) => s !== seed));
  };

  const handleAddEditSeeds = () => {
    const newSeeds = editNewSeedText
      .split("\n")
      .map((s) => s.replace(/^@/, "").trim())
      .filter(Boolean)
      .filter((s) => !editSeeds.includes(s));
    if (newSeeds.length > 0) {
      setEditSeeds((prev) => [...prev, ...newSeeds]);
      setEditNewSeedText("");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingJob || editSeeds.length === 0) return;

    // For recurring jobs, require confirmation first
    if (editIsRecurring && !showEditConfirm) {
      setShowEditConfirm(true);
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: editingJob._id,
        body: {
          seed_usernames: editSeeds,
          name: editName.trim() || null,
          reel_limit: editReelLimit,
          comment_limit: editCommentLimit,
          min_followers: editMinFollowers,
          is_recurring: editIsRecurring,
          repeat_interval_days: editIsRecurring ? editRepeatInterval : null,
        },
      });
      toast({ title: "Job Updated", description: "Deep scrape job has been updated." });
      setEditingJob(null);
      setShowEditConfirm(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update job",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-16 z-50 bg-background border-b border-border">
        <div className="px-6 py-4 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Deep Scraper</h2>
            <p className="text-muted-foreground">
              Scrape reels, comments, and commenter profiles via Apify
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
                  <SelectItem value="scraping_reels">Scraping Reels</SelectItem>
                  <SelectItem value="scraping_comments">Scraping Comments</SelectItem>
                  <SelectItem value="scraping_profiles">Scraping Profiles</SelectItem>
                  <SelectItem value="qualifying">Qualifying</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => setShowNewDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Deep Scrape
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Target Analytics */}
        {targets.length > 0 && (
          <div className="rounded-lg border bg-card">
            <button
              onClick={() => setShowTargetStats(!showTargetStats)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-400" />
                <span className="text-sm font-semibold">Target Analytics</span>
                <span className="text-xs text-muted-foreground">({targets.length} targets)</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showTargetStats ? "rotate-180" : ""}`} />
            </button>
            {showTargetStats && (
              <div className="border-t">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Target</TableHead>
                      <TableHead className="text-xs text-right">Scraped</TableHead>
                      <TableHead className="text-xs text-right">Avg Followers</TableHead>
                      <TableHead className="text-xs text-right">Qualified</TableHead>
                      <TableHead className="text-xs text-right">Qual %</TableHead>
                      <TableHead className="text-xs text-right">Messaged</TableHead>
                      <TableHead className="text-xs text-right">Replied</TableHead>
                      <TableHead className="text-xs text-right">Reply %</TableHead>
                      <TableHead className="text-xs text-right">Booked</TableHead>
                      <TableHead className="text-xs text-right">Book %</TableHead>
                      <TableHead className="text-xs text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {targets.map((t) => {
                      const qualRate = (t.qualified + t.rejected) > 0
                        ? +((t.qualified / (t.qualified + t.rejected)) * 100).toFixed(1)
                        : null;
                      const isLowQuality = (t.qualified + t.rejected) >= 10 && qualRate !== null && qualRate < 20;
                      return (
                      <TableRow key={t.seed} className={isLowQuality ? "border-l-2 border-l-orange-500" : ""}>
                        <TableCell className="text-xs font-medium">
                          <div className="flex items-center gap-1.5">
                            @{t.seed}
                            {isLowQuality && (
                              <Badge className="bg-orange-500/15 text-orange-400 border-orange-500/30 text-[9px] px-1 py-0">
                                Low Fit
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-right">{t.total_scraped.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">{t.avg_followers.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right text-green-500">{t.qualified}</TableCell>
                        <TableCell className="text-xs text-right">
                          {qualRate !== null ? (
                            <span className={qualRate >= 50 ? "text-green-500" : qualRate >= 20 ? "text-yellow-500" : "text-red-500"}>
                              {qualRate}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">{"\u2014"}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-right">{t.messaged}</TableCell>
                        <TableCell className="text-xs text-right">{t.replied}</TableCell>
                        <TableCell className="text-xs text-right">
                          {t.reply_rate > 0 ? (
                            <span className={t.reply_rate >= 10 ? "text-green-500" : t.reply_rate >= 5 ? "text-yellow-500" : "text-muted-foreground"}>
                              {t.reply_rate}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-right">{t.booked}</TableCell>
                        <TableCell className="text-xs text-right">
                          {t.book_rate > 0 ? (
                            <span className={t.book_rate >= 5 ? "text-green-500" : "text-muted-foreground"}>
                              {t.book_rate}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {t.total_contract_value > 0 ? (
                            <span className="text-green-500">${t.total_contract_value.toLocaleString()}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-lg font-semibold mb-2">Failed to load deep scrape jobs</h2>
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
                  <TableHead>Seeds</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Stats</TableHead>
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
                    <TableHead>Seeds</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No deep scrape jobs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    jobs.map((job) => {
                      const badge = STATUS_BADGE[job.status];
                      const active = isActiveJob(job.status);
                      const isExpanded = expandedJobId === job._id;

                      return (
                        <React.Fragment key={job._id}>
                          <TableRow className={isExpanded ? "border-b-0" : ""}>
                            <TableCell className="max-w-[200px]">
                              {job.name ? (
                                <div>
                                  <div className="font-medium truncate">{job.name}</div>
                                  <div className="text-[10px] text-muted-foreground truncate">{formatSeeds(job.seed_usernames)}</div>
                                </div>
                              ) : (
                                <div className="font-medium truncate">{formatSeeds(job.seed_usernames)}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5">
                                  <Badge className={badge.className}>
                                    {active && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                    {badge.label}
                                  </Badge>
                                  {job.is_recurring && (
                                    <RefreshCw className="h-3 w-3 text-indigo-400" />
                                  )}
                                </div>
                                {job.next_run_at && (
                                  <span className="text-[10px] text-muted-foreground">
                                    Next: {formatShortDate(job.next_run_at)}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <JobProgress job={job} />
                            </TableCell>
                            <TableCell>
                              <JobStats job={job} />
                            </TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              {formatDate(job.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedJobId(isExpanded ? null : job._id)}
                                  title={isExpanded ? "Collapse" : "Expand"}
                                >
                                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReplicate(job)}
                                  title="Replicate"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                                {job.status === "completed" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRerun(job)}
                                    disabled={startMutation.isPending}
                                    title="Rerun"
                                  >
                                    <RefreshCw className="h-3.5 w-3.5 text-blue-400" />
                                  </Button>
                                )}
                                {!active && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenEdit(job)}
                                    title="Edit"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                {active && (
                                  <>
                                    {job.status === "scraping_comments" && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSkipComments(job._id)}
                                        disabled={skipCommentsMutation.isPending}
                                        title="Skip to Qualifying"
                                      >
                                        <FastForward className="h-3.5 w-3.5 text-cyan-400" />
                                      </Button>
                                    )}
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
                                {!active && job.comments_skipped && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleResumeComments(job._id)}
                                    disabled={resumeCommentsMutation.isPending}
                                    title="Resume Comments"
                                  >
                                    <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
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
                          {isExpanded && (
                            <TableRow>
                              <TableCell colSpan={6} className="p-0">
                                <JobInlineDetail jobId={job._id} />
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
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

      {/* New Deep Scrape Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Deep Scrape Job</DialogTitle>
            <DialogDescription>
              Scrape reels, comments, and commenter profiles from seed accounts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="jobName">Job Name</Label>
              <Input
                id="jobName"
                placeholder="e.g. Fitness niche round 1"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seeds">Seed Usernames</Label>
              <Textarea
                id="seeds"
                placeholder={"username1\nusername2\nusername3"}
                value={seedText}
                onChange={(e) => setSeedText(e.target.value)}
                rows={4}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  One username per line (without @). {parsedSeeds.length > 0 && `${parsedSeeds.length} account${parsedSeeds.length > 1 ? "s" : ""} detected.`}
                </p>
                {targets.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setShowTargetPicker(true);
                      setTargetSearch("");
                      setTargetSort("best_qual");
                      setSelectedTargets(new Set());
                    }}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Add from history
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reelLimit">Reel Limit</Label>
                <Input
                  id="reelLimit"
                  type="number"
                  min={1}
                  value={reelLimit}
                  onChange={(e) => setReelLimit(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commentLimit">Comment Limit</Label>
                <Input
                  id="commentLimit"
                  type="number"
                  min={1}
                  value={commentLimit}
                  onChange={(e) => setCommentLimit(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minFollowers">Min Followers</Label>
                <Input
                  id="minFollowers"
                  type="number"
                  min={0}
                  value={minFollowers}
                  onChange={(e) => setMinFollowers(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="forceReprocess">Force Reprocess</Label>
                <p className="text-xs text-muted-foreground">
                  Re-process profiles that have already been scraped.
                </p>
              </div>
              <Switch
                id="forceReprocess"
                checked={forceReprocess}
                onCheckedChange={setForceReprocess}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="recurring">Recurring</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically re-run this job on a schedule.
                </p>
              </div>
              <Switch
                id="recurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
            </div>
            {isRecurring && (
              <div className="flex items-center gap-3 pl-1">
                <Label htmlFor="repeatInterval" className="whitespace-nowrap text-sm">Repeat Every</Label>
                <Input
                  id="repeatInterval"
                  type="number"
                  min={1}
                  className="w-20"
                  value={repeatIntervalDays}
                  onChange={(e) => setRepeatIntervalDays(Number(e.target.value))}
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            )}
            <div className="space-y-2">
              <Label>Prompt</Label>
              <Select value={selectedPromptId} onValueChange={setSelectedPromptId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a prompt..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {promptsList.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Optional AI prompt for qualifying leads.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleStart}
                disabled={parsedSeeds.length === 0 || startMutation.isPending}
              >
                {startMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Start Deep Scrape
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Target History Picker */}
      <Dialog open={showTargetPicker} onOpenChange={setShowTargetPicker}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Pick from previous targets</DialogTitle>
            <DialogDescription>
              Performance based on previous Deep Scrape jobs.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 items-end">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search targets..."
                value={targetSearch}
                onChange={(e) => setTargetSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={targetSort} onValueChange={(v) => setTargetSort(v as "best_qual" | "most_scraped" | "alpha")}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="best_qual">Best Qual %</SelectItem>
                <SelectItem value="most_scraped">Most Scraped</SelectItem>
                <SelectItem value="alpha">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead className="text-xs">Target</TableHead>
                  <TableHead className="text-xs text-right">Scraped</TableHead>
                  <TableHead className="text-xs text-right">Qualified</TableHead>
                  <TableHead className="text-xs text-right">Qual %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  const filtered = targets
                    .filter((t) => t.seed.toLowerCase().includes(targetSearch.toLowerCase()))
                    .map((t) => {
                      const total = t.qualified + t.rejected;
                      const qualRate = total > 0 ? +((t.qualified / total) * 100).toFixed(1) : null;
                      return { ...t, qualRate };
                    })
                    .sort((a, b) => {
                      if (targetSort === "best_qual") return (b.qualRate ?? -1) - (a.qualRate ?? -1);
                      if (targetSort === "most_scraped") return b.total_scraped - a.total_scraped;
                      return a.seed.localeCompare(b.seed);
                    });

                  if (filtered.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                          No targets found.
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return filtered.map((t) => {
                    const isLowFit = (t.qualified + t.rejected) >= 10 && t.qualRate !== null && t.qualRate < 20;
                    return (
                      <TableRow
                        key={t.seed}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedTargets((prev) => {
                            const next = new Set(prev);
                            if (next.has(t.seed)) next.delete(t.seed);
                            else next.add(t.seed);
                            return next;
                          });
                        }}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedTargets.has(t.seed)}
                            onCheckedChange={() => {
                              setSelectedTargets((prev) => {
                                const next = new Set(prev);
                                if (next.has(t.seed)) next.delete(t.seed);
                                else next.add(t.seed);
                                return next;
                              });
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          <div className="flex items-center gap-1.5">
                            @{t.seed}
                            {isLowFit && (
                              <Badge className="bg-orange-500/15 text-orange-400 border-orange-500/30 text-[9px] px-1 py-0">
                                Low Fit
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-right text-muted-foreground">
                          {t.total_scraped.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-right text-green-500">
                          {t.qualified}
                        </TableCell>
                        <TableCell className="text-sm text-right">
                          {t.qualRate !== null ? (
                            <span className={t.qualRate >= 50 ? "text-green-500" : t.qualRate >= 20 ? "text-yellow-500" : "text-red-500"}>
                              {t.qualRate}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  });
                })()}
              </TableBody>
            </Table>
          </div>
          {selectedTargets.size > 0 && (
            <p className="text-xs text-muted-foreground">
              {selectedTargets.size} target{selectedTargets.size !== 1 ? "s" : ""} selected
              {(() => {
                const selected = targets.filter((t) => selectedTargets.has(t.seed));
                const totalEvaluated = selected.reduce((s, t) => s + t.qualified + t.rejected, 0);
                const totalQualified = selected.reduce((s, t) => s + t.qualified, 0);
                const avgQual = totalEvaluated > 0 ? +((totalQualified / totalEvaluated) * 100).toFixed(0) : null;
                return avgQual !== null ? ` · Avg Qual %: ${avgQual}%` : "";
              })()}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTargetPicker(false)}>
              Cancel
            </Button>
            <Button
              disabled={selectedTargets.size === 0}
              onClick={() => {
                const existing = new Set(parsedSeeds);
                const toAdd = Array.from(selectedTargets).filter((s) => !existing.has(s));
                if (toAdd.length > 0) {
                  const current = seedText.trim();
                  setSeedText(current ? `${current}\n${toAdd.join("\n")}` : toAdd.join("\n"));
                }
                setShowTargetPicker(false);
              }}
            >
              Add selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={!!cancellingId} onOpenChange={(open) => !open && setCancellingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Deep Scrape Job</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop the deep scrape job. You can resume it later.
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
            <AlertDialogTitle>Delete Deep Scrape Job</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this deep scrape job. This action cannot be undone.
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

      {/* Edit Job Dialog */}
      <Dialog open={!!editingJob} onOpenChange={(open) => { if (!open) { setEditingJob(null); setShowEditConfirm(false); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Deep Scrape Job</DialogTitle>
            <DialogDescription>
              Update targets and settings. Changes apply to future runs only.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Job Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Fitness niche round 1"
              />
            </div>

            <div className="space-y-2">
              <Label>Targets ({editSeeds.length})</Label>
              <div className="flex flex-wrap gap-1.5 min-h-[36px] rounded-md border p-2">
                {editSeeds.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No targets. Add at least one below.</span>
                ) : (
                  editSeeds.map((seed) => {
                    const stats = targetQualMap[seed];
                    const qualRate = stats?.qualRate;
                    const qualColor = qualRate === null || qualRate === undefined
                      ? "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
                      : qualRate <= 20
                        ? "bg-red-500/15 text-red-400 border-red-500/30"
                        : qualRate <= 40
                          ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
                          : "bg-green-500/15 text-green-400 border-green-500/30";
                    return (
                      <Badge
                        key={seed}
                        variant="secondary"
                        className="gap-1.5 pl-2 pr-1 py-0.5 text-xs"
                      >
                        @{seed}
                        <span className={`inline-flex items-center rounded px-1 py-px text-[9px] font-medium leading-none border ${qualColor}`}>
                          {qualRate !== null && qualRate !== undefined ? `${qualRate}%` : "N/A"}
                        </span>
                        <button
                          onClick={() => handleRemoveEditSeed(seed)}
                          className="rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Add Targets</Label>
              <div className="flex gap-2">
                <Textarea
                  placeholder={"newuser1\nnewuser2"}
                  value={editNewSeedText}
                  onChange={(e) => setEditNewSeedText(e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddEditSeeds}
                  disabled={!editNewSeedText.trim()}
                  className="self-end"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">One username per line, without @</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Reel Limit</Label>
                <Input type="number" min={1} value={editReelLimit} onChange={(e) => setEditReelLimit(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Comment Limit</Label>
                <Input type="number" min={1} value={editCommentLimit} onChange={(e) => setEditCommentLimit(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Min Followers</Label>
                <Input type="number" min={0} value={editMinFollowers} onChange={(e) => setEditMinFollowers(Number(e.target.value))} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Recurring</Label>
                <p className="text-xs text-muted-foreground">Automatically re-run on a schedule.</p>
              </div>
              <Switch checked={editIsRecurring} onCheckedChange={setEditIsRecurring} />
            </div>
            {editIsRecurring && (
              <div className="flex items-center gap-3 pl-1">
                <Label className="whitespace-nowrap text-sm">Repeat Every</Label>
                <Input type="number" min={1} className="w-20" value={editRepeatInterval} onChange={(e) => setEditRepeatInterval(Number(e.target.value))} />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            )}
          </div>
          {showEditConfirm && (
            <div className="rounded-md border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-200">
              This is a recurring job. Changes will apply to future runs only. Previously scraped data will not be affected.
            </div>
          )}
          <DialogFooter className="pt-2">
            {showEditConfirm ? (
              <>
                <Button variant="outline" onClick={() => setShowEditConfirm(false)}>
                  Go Back
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                  ) : (
                    "Confirm & Save"
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => { setEditingJob(null); setShowEditConfirm(false); }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={editSeeds.length === 0 || updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
