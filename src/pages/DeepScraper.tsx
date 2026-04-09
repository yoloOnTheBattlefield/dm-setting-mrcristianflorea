import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { formatDateTime } from "@/lib/formatters";
import { useApifyTokens } from "@/hooks/useApifyTokens";
import { useAccountMe } from "@/hooks/useAccountMe";
import { usePersistedState } from "@/hooks/usePersistedState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
  useAddDeepScrapeLeadsToCampaign,
} from "@/hooks/useDeepScrapeJobs";
import type { DeepScrapeJob, DeepScrapeJobStatus, DeepScrapeLeadEntry } from "@/lib/types";
import { useCampaigns } from "@/hooks/useCampaigns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { NewDeepScrapeDialog } from "@/components/deep-scraper/NewDeepScrapeDialog";
import { TargetPickerDialog } from "@/components/deep-scraper/TargetPickerDialog";
import { EditJobDialog } from "@/components/deep-scraper/EditJobDialog";
import { TargetAnalyticsPanel } from "@/components/deep-scraper/TargetAnalyticsPanel";
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
  UserCheck,
  UserX,
  Filter,
  SkipForward,
  Brain,
  Copy,
  ClipboardCopy,
  Pencil,
  Clock,
  ChevronUp,
  FastForward,
  MessageSquare,
  CalendarClock,
  Inbox,
  SendHorizontal,
} from "lucide-react";

const STATUS_BADGE: Record<DeepScrapeJobStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
  scraping_reels: { label: "Scraping Reels", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  scraping_comments: { label: "Scraping Comments", className: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  scraping_likers: { label: "Scraping Likers", className: "bg-pink-500/15 text-pink-400 border-pink-500/30" },
  scraping_followers: { label: "Scraping Followers", className: "bg-teal-500/15 text-teal-400 border-teal-500/30" },
  scraping_profiles: { label: "Scraping Profiles", className: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" },
  qualifying: { label: "Qualifying", className: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  completed: { label: "Completed", className: "bg-green-500/15 text-green-400 border-green-500/30" },
  failed: { label: "Failed", className: "bg-red-500/15 text-red-400 border-red-500/30" },
  cancelled: { label: "Cancelled", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  paused: { label: "Paused", className: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
};

function getStatusLabel(status: DeepScrapeJobStatus, scrapeType?: string): string {
  if (status === "scraping_reels" && scrapeType === "posts") return "Scraping Posts";
  return STATUS_BADGE[status].label;
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
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
    status === "scraping_likers" ||
    status === "scraping_followers" ||
    status === "scraping_profiles" ||
    status === "qualifying"
  );
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
        {job.scrape_type === "posts" ? "Posts" : "Reels"}: {s.reels_scraped}
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

  if (job.status === "scraping_likers") {
    return (
      <span className="text-xs text-muted-foreground">
        Likers: {s.likers_scraped} &middot; {s.unique_likers} unique
      </span>
    );
  }

  if (job.status === "scraping_followers") {
    return (
      <span className="text-xs text-muted-foreground">
        Followers: {s.followers_scraped}
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
    if (s.followers_scraped > 0) {
      return (
        <span className="text-xs text-orange-400">
          {s.followers_scraped} followers (paused)
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
          {s.reels_scraped} {job.scrape_type === "posts" ? "posts" : "reels"} (paused)
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
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium bg-green-500/15 text-green-400 border border-green-500/30">
          {s.qualified} qualified
        </span>
        <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
          {s.filtered_low_followers} filtered
        </span>
        <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">
          {s.rejected} rejected
        </span>
      </div>
    );
  }
  return <span className="text-xs text-muted-foreground">&mdash;</span>;
}

function ActionBtn({ tooltip, children, ...props }: { tooltip: string } & React.ComponentProps<typeof Button>) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button {...props}>{children}</Button>
        </TooltipTrigger>
        <TooltipContent side="bottom"><p className="text-xs">{tooltip}</p></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function getSortVal(t: { total_scraped: number; avg_followers: number; qualified: number; qualRate: number | null; messaged: number; replied: number; reply_rate: number; booked: number; book_rate: number; total_contract_value: number; seed: string }, col: string): number | string | null {
  switch (col) {
    case "seed": return t.seed;
    case "scraped": return t.total_scraped;
    case "avg_followers": return t.avg_followers;
    case "qualified": return t.qualified;
    case "qual_pct": return t.qualRate;
    case "messaged": return t.messaged;
    case "replied": return t.replied;
    case "reply_pct": return t.reply_rate;
    case "booked": return t.booked;
    case "book_pct": return t.book_rate;
    case "revenue": return t.total_contract_value;
    default: return null;
  }
}

function SeedsDisplay({ seeds, name, directUrls }: { seeds: string[]; name: string | null; directUrls?: string[] }) {
  const isDirectUrl = seeds.length === 0 && directUrls && directUrls.length > 0;

  if (isDirectUrl) {
    const label = directUrls.length === 1
      ? directUrls[0].replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "")
      : `${directUrls.length} URLs`;

    const content = (
      <span className="text-xs text-muted-foreground truncate">{label}</span>
    );

    if (name) {
      return (
        <div>
          <div className="font-medium truncate">{name}</div>
          <div className="text-[10px] text-muted-foreground truncate">{content}</div>
        </div>
      );
    }
    return <div className="font-medium truncate">{content}</div>;
  }

  const shown = seeds.slice(0, 2).map((s) => `@${s}`).join(", ");
  const rest = seeds.slice(2);

  const seedsContent = (
    <>
      <span>{shown}</span>
      {rest.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="ml-1 text-muted-foreground hover:text-foreground underline decoration-dotted underline-offset-2 transition-colors">
              +{rest.length} more
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" className="w-64 max-h-60 overflow-auto p-3">
            <p className="text-xs font-medium mb-2">All seeds ({seeds.length})</p>
            <div className="flex flex-wrap gap-1">
              {seeds.map((s) => (
                <Badge key={s} variant="secondary" className="text-[11px] px-1.5 py-0">
                  @{s}
                </Badge>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </>
  );

  if (name) {
    return (
      <div>
        <div className="font-medium truncate">{name}</div>
        <div className="text-[10px] text-muted-foreground truncate">{seedsContent}</div>
      </div>
    );
  }
  return <div className="font-medium truncate">{seedsContent}</div>;
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
  const isResearch = job.mode === "research";
  switch (job.status) {
    case "pending":
      return 0;
    case "scraping_reels": {
      const expected = job.seed_usernames.length * job.reel_limit;
      const pct = expected > 0 ? (s.reels_scraped / expected) : 0;
      if (isResearch) return Math.min(5 + pct * 45, 50);
      return Math.min(5 + pct * 20, 25);
    }
    case "scraping_comments": {
      const pct = s.reels_scraped > 0 ? (s.comments_scraped / (s.reels_scraped * job.comment_limit)) : 0;
      if (isResearch) return Math.min(50 + pct * 45, 95);
      return Math.min(25 + pct * 25, 50);
    }
    case "scraping_likers":
      return Math.min(35 + (s.likers_scraped > 0 ? 10 : 0), 48);
    case "scraping_followers":
      return Math.min(35 + (s.followers_scraped > 0 ? 10 : 0), 48);
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
      if (s.followers_scraped > 0 || s.likers_scraped > 0 || s.comments_scraped > 0) return 35;
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
            {getStatusLabel(job.status, job.scrape_type)}
          </Badge>
          {job.mode === "research" && (
            <Badge className="bg-teal-500/15 text-teal-400 border-teal-500/30 text-[10px]">
              Research
            </Badge>
          )}
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
            <span>{getStatusLabel(job.status, job.scrape_type)}</span>
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
          <p className="text-[10px] text-muted-foreground">{job.scrape_type === "posts" ? "Posts" : "Reels"}</p>
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
        {job.direct_urls && job.direct_urls.length > 0
          ? `URLs: ${job.direct_urls.join(", ")}`
          : `Seeds: ${job.seed_usernames.map((u) => `@${u}`).join(", ")}`}
        {" \u00b7 "}Started {formatDateTime(job.createdAt)}
        {job.updatedAt !== job.createdAt && ` \u00b7 Updated ${formatDateTime(job.updatedAt)}`}
      </div>
    </div>
  );
}

export default function DeepScraper() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: apifyTokensData, isLoading: isLoadingApifyTokens } = useApifyTokens();
  const hasActiveApifyToken = (apifyTokensData?.tokens || []).some(
    (t) => t.status === "active"
  );
  const [showNoApifyTokenDialog, setShowNoApifyTokenDialog] = useState(false);
  const [showNoOpenAIDialog, setShowNoOpenAIDialog] = useState(false);
  const [showNoPromptDialog, setShowNoPromptDialog] = useState(false);

  const { data: accountMe } = useAccountMe();
  const hasOpenAIKey = !!accountMe?.openai_token;

  useEffect(() => {
    if (!isLoadingApifyTokens && !hasActiveApifyToken) {
      setShowNoApifyTokenDialog(true);
    }
  }, [isLoadingApifyTokens, hasActiveApifyToken]);

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
  const [jobMode, setJobMode] = useState<"outbound" | "research">("outbound");
  const [jobSource, setJobSource] = useState<"accounts" | "direct_urls">("accounts");
  const [jobName, setJobName] = useState("");
  const [scrapeType, setScrapeType] = useState<"reels" | "posts">("reels");
  const [seedText, setSeedText] = useState("");
  const [directUrlText, setDirectUrlText] = useState("");
  const [reelLimit, setReelLimit] = useState(10);
  const [commentLimit, setCommentLimit] = useState(100);
  const [minFollowers, setMinFollowers] = useState(1000);
  const [forceReprocess, setForceReprocess] = useState(false);
  const [scrapeComments, setScrapeComments] = useState(true);
  const [scrapeLikers, setScrapeLikers] = useState(false);
  const [scrapeFollowers, setScrapeFollowers] = useState(false);
  const [scrapeEmails, setScrapeEmails] = useState(true);
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
  const addToCampaignMutation = useAddDeepScrapeLeadsToCampaign();

  // Add to Campaign dialog state
  const [addToCampaignJobId, setAddToCampaignJobId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const { data: campaignsData } = useCampaigns({ limit: 100 });
  const campaigns = campaignsData?.campaigns || [];

  const handleAddToCampaign = async () => {
    if (!addToCampaignJobId || !selectedCampaignId) return;
    try {
      const result = await addToCampaignMutation.mutateAsync({
        jobId: addToCampaignJobId,
        campaign_id: selectedCampaignId,
      });
      toast({
        title: "Leads added to campaign",
        description: `${result.added} added, ${result.duplicates_skipped} duplicates skipped`,
      });
      setAddToCampaignJobId(null);
      setSelectedCampaignId("");
    } catch (err) {
      toast({ title: "Failed to add leads", description: err instanceof Error ? err.message : "Failed to add leads", variant: "destructive" });
    }
  };

  const { data: targetStatsData } = useDeepScrapeTargetStats();

  const jobs = data?.jobs || [];
  const pagination = data?.pagination;
  const promptsList = Array.isArray(prompts) ? prompts : [];
  const targets = targetStatsData?.targets || [];
  const [showTargetStats, setShowTargetStats] = usePersistedState("deep-scraper-show-targets", true);

  // Target Analytics state
  const [taSearch, setTaSearch] = useState("");
  const [taSortCol, setTaSortCol] = useState<string>("qual_pct");
  const [taSortAsc, setTaSortAsc] = useState(false);
  const [taLowFitFilter, setTaLowFitFilter] = useState<"all" | "hide_low" | "only_low">("all");
  const [taVisibleCols, setTaVisibleCols] = useState<Set<string>>(
    () => new Set(["scraped", "avg_followers", "qualified", "qual_pct", "messaged", "replied", "reply_pct"])
  );

  const toggleTaCol = (col: string) => {
    setTaVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  };

  const handleTaSort = (col: string) => {
    if (taSortCol === col) setTaSortAsc((prev) => !prev);
    else { setTaSortCol(col); setTaSortAsc(false); }
  };

  const filteredTargets = React.useMemo(() => {
    return targets
      .map((t) => {
        const total = t.qualified + t.rejected;
        const qualRate = total > 0 ? +((t.qualified / total) * 100).toFixed(1) : null;
        const isLowFit = total >= 10 && qualRate !== null && qualRate < 20;
        return { ...t, qualRate, isLowFit };
      })
      .filter((t) => {
        if (taSearch && !t.seed.toLowerCase().includes(taSearch.trim().toLowerCase())) return false;
        if (taLowFitFilter === "hide_low" && t.isLowFit) return false;
        if (taLowFitFilter === "only_low" && !t.isLowFit) return false;
        return true;
      })
      .sort((a, b) => {
        const dir = taSortAsc ? 1 : -1;
        const valA = getSortVal(a, taSortCol);
        const valB = getSortVal(b, taSortCol);
        if (valA === valB) return 0;
        if (valA === null) return 1;
        if (valB === null) return -1;
        return valA < valB ? -dir : dir;
      });
  }, [targets, taSearch, taSortCol, taSortAsc, taLowFitFilter]);

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

  const parsedDirectUrls = directUrlText
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => /instagram\.com\/(?:.*\/)?(reel|p)\/[^/?#&]+/.test(s));

  const canStart = jobSource === "accounts" ? parsedSeeds.length > 0 : parsedDirectUrls.length > 0;

  const handleStart = async () => {
    if (!canStart) return;

    // Qualification preflight: outbound mode qualifies leads with AI using a prompt
    if (jobMode === "outbound") {
      if (!hasOpenAIKey) {
        setShowNoOpenAIDialog(true);
        return;
      }
      if (promptsList.length === 0) {
        setShowNoPromptDialog(true);
        return;
      }
    }

    try {
      const isDirectMode = jobSource === "direct_urls";
      await startMutation.mutateAsync({
        name: jobName.trim() || undefined,
        mode: jobMode,
        ...(isDirectMode
          ? { direct_urls: parsedDirectUrls }
          : { seed_usernames: parsedSeeds }),
        scrape_type: scrapeType,
        scrape_comments: scrapeComments,
        scrape_likers: scrapeLikers,
        scrape_followers: scrapeFollowers,
        ...(!isDirectMode && { reel_limit: reelLimit }),
        ...(scrapeComments && { comment_limit: commentLimit }),
        ...(jobMode === "outbound" && {
          min_followers: minFollowers,
          force_reprocess: forceReprocess,
          scrape_emails: scrapeEmails,
          prompt_id: selectedPromptId !== "none" ? selectedPromptId : undefined,
        }),
        is_recurring: isRecurring,
        repeat_interval_days: isRecurring ? repeatIntervalDays : undefined,
      });
      toast({
        title: "Deep Scrape Started",
        description: isDirectMode
          ? `Scraping comments from ${parsedDirectUrls.length} URL${parsedDirectUrls.length > 1 ? "s" : ""}`
          : jobMode === "research"
            ? `Research scrape of ${scrapeType} from ${parsedSeeds.length} seed account${parsedSeeds.length > 1 ? "s" : ""}`
            : `Scraping ${scrapeType} from ${parsedSeeds.length} seed account${parsedSeeds.length > 1 ? "s" : ""}`,
      });
      setShowNewDialog(false);
      setJobMode("outbound");
      setJobSource("accounts");
      setJobName("");
      setScrapeType("reels");
      setSeedText("");
      setDirectUrlText("");
      setReelLimit(10);
      setCommentLimit(100);
      setMinFollowers(1000);
      setForceReprocess(false);
      setScrapeComments(true);
      setScrapeLikers(false);
      setScrapeFollowers(false);
      setScrapeEmails(true);
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
    setJobMode(job.mode || "outbound");
    setJobName(job.name || "");
    setScrapeType(job.scrape_type || "reels");
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
      const rerunMode = job.mode || "outbound";
      await startMutation.mutateAsync({
        name: job.name || undefined,
        mode: rerunMode,
        seed_usernames: job.seed_usernames,
        scrape_type: job.scrape_type || "reels",
        reel_limit: job.reel_limit,
        comment_limit: job.comment_limit,
        ...(rerunMode === "outbound" && {
          min_followers: job.min_followers,
          force_reprocess: false,
          prompt_id: job.promptId || undefined,
        }),
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
        <TargetAnalyticsPanel
          targets={targets}
          showTargetStats={showTargetStats}
          setShowTargetStats={setShowTargetStats}
          taSearch={taSearch}
          setTaSearch={setTaSearch}
          taSortCol={taSortCol}
          taSortAsc={taSortAsc}
          handleTaSort={handleTaSort}
          taLowFitFilter={taLowFitFilter}
          setTaLowFitFilter={setTaLowFitFilter}
          taVisibleCols={taVisibleCols}
          toggleTaCol={toggleTaCol}
          filteredTargets={filteredTargets}
        />

        <Separator />

        {/* Scrape Jobs */}
        <div className="flex items-center gap-2.5 -mb-2">
          <h3 className="text-lg font-semibold">Scrape Jobs</h3>
          {pagination && <Badge variant="secondary" className="text-xs font-normal">{pagination.total} jobs</Badge>}
        </div>

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
                      <TableCell colSpan={6} className="h-40">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Inbox className="h-8 w-8 text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">
                            {statusFilter !== "all" ? `No ${statusFilter.replace("_", " ")} jobs found.` : "No deep scrape jobs yet."}
                          </p>
                          <Button size="sm" onClick={() => setShowNewDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Deep Scrape
                          </Button>
                        </div>
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
                              <SeedsDisplay seeds={job.seed_usernames} name={job.name} directUrls={job.direct_urls} />
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                  <Badge className={badge.className}>
                                    {active && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                    {getStatusLabel(job.status, job.scrape_type)}
                                  </Badge>
                                  {job.mode === "research" && (
                                    <Badge className="bg-teal-500/15 text-teal-400 border-teal-500/30 text-[10px] px-1.5 py-0">
                                      Research
                                    </Badge>
                                  )}
                                </div>
                                {job.is_recurring && job.next_run_at && (
                                  <Badge variant="outline" className="w-fit gap-1 text-[10px] px-1.5 py-0 text-indigo-400 border-indigo-500/30">
                                    <CalendarClock className="h-3 w-3" />
                                    {formatShortDate(job.next_run_at)}
                                  </Badge>
                                )}
                                {job.is_recurring && !job.next_run_at && (
                                  <Badge variant="outline" className="w-fit gap-1 text-[10px] px-1.5 py-0 text-indigo-400 border-indigo-500/30">
                                    <RefreshCw className="h-3 w-3" />
                                    Every {job.repeat_interval_days}d
                                  </Badge>
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
                              {formatDateTime(job.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <ActionBtn
                                  tooltip={isExpanded ? "Collapse" : "View"}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedJobId(isExpanded ? null : job._id)}
                                >
                                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </ActionBtn>
                                <ActionBtn
                                  tooltip="Replicate"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReplicate(job)}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </ActionBtn>
                                {job.status === "completed" && (
                                  <ActionBtn
                                    tooltip="Rerun"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRerun(job)}
                                    disabled={startMutation.isPending}
                                  >
                                    <RefreshCw className="h-3.5 w-3.5 text-blue-400" />
                                  </ActionBtn>
                                )}
                                {!active && (
                                  <ActionBtn
                                    tooltip="Edit"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenEdit(job)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </ActionBtn>
                                )}
                                {active && (
                                  <>
                                    {job.status === "scraping_comments" && (
                                      <ActionBtn
                                        tooltip="Skip to Qualifying"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSkipComments(job._id)}
                                        disabled={skipCommentsMutation.isPending}
                                      >
                                        <FastForward className="h-3.5 w-3.5 text-cyan-400" />
                                      </ActionBtn>
                                    )}
                                    <ActionBtn
                                      tooltip="Pause"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handlePause(job._id)}
                                      disabled={pauseMutation.isPending}
                                    >
                                      <Pause className="h-3.5 w-3.5 text-orange-400" />
                                    </ActionBtn>
                                    <ActionBtn
                                      tooltip="Stop"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setCancellingId(job._id)}
                                      disabled={cancelMutation.isPending}
                                    >
                                      <Square className="h-3.5 w-3.5 text-destructive" />
                                    </ActionBtn>
                                  </>
                                )}
                                {(job.status === "paused" || job.status === "cancelled" || job.status === "failed") && (
                                  <ActionBtn
                                    tooltip="Resume"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleResume(job._id)}
                                    disabled={resumeMutation.isPending}
                                  >
                                    <Play className="h-3.5 w-3.5 text-green-500" />
                                  </ActionBtn>
                                )}
                                {!active && job.comments_skipped && (
                                  <ActionBtn
                                    tooltip="Resume Comments"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleResumeComments(job._id)}
                                    disabled={resumeCommentsMutation.isPending}
                                  >
                                    <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
                                  </ActionBtn>
                                )}
                                {!active && job.stats.qualified > 0 && (
                                  <ActionBtn
                                    tooltip="Add to Campaign"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setAddToCampaignJobId(job._id); setSelectedCampaignId(""); }}
                                  >
                                    <SendHorizontal className="h-3.5 w-3.5 text-blue-400" />
                                  </ActionBtn>
                                )}
                                {!active && (
                                  <ActionBtn
                                    tooltip="Delete"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeletingId(job._id)}
                                    disabled={deleteMutation.isPending}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                  </ActionBtn>
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
      <NewDeepScrapeDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        jobMode={jobMode}
        setJobMode={setJobMode}
        jobSource={jobSource}
        setJobSource={setJobSource}
        jobName={jobName}
        setJobName={setJobName}
        scrapeType={scrapeType}
        setScrapeType={setScrapeType}
        scrapeComments={scrapeComments}
        setScrapeComments={setScrapeComments}
        scrapeLikers={scrapeLikers}
        setScrapeLikers={setScrapeLikers}
        scrapeFollowers={scrapeFollowers}
        setScrapeFollowers={setScrapeFollowers}
        seedText={seedText}
        setSeedText={setSeedText}
        directUrlText={directUrlText}
        setDirectUrlText={setDirectUrlText}
        reelLimit={reelLimit}
        setReelLimit={setReelLimit}
        commentLimit={commentLimit}
        setCommentLimit={setCommentLimit}
        minFollowers={minFollowers}
        setMinFollowers={setMinFollowers}
        forceReprocess={forceReprocess}
        setForceReprocess={setForceReprocess}
        scrapeEmails={scrapeEmails}
        setScrapeEmails={setScrapeEmails}
        selectedPromptId={selectedPromptId}
        setSelectedPromptId={setSelectedPromptId}
        isRecurring={isRecurring}
        setIsRecurring={setIsRecurring}
        repeatIntervalDays={repeatIntervalDays}
        setRepeatIntervalDays={setRepeatIntervalDays}
        parsedSeeds={parsedSeeds}
        parsedDirectUrls={parsedDirectUrls}
        canStart={canStart}
        isStarting={startMutation.isPending}
        onStart={handleStart}
        promptsList={promptsList}
        targets={targets}
        onOpenTargetPicker={() => {
          setShowTargetPicker(true);
          setTargetSearch("");
          setTargetSort("best_qual");
          setSelectedTargets(new Set());
        }}
      />

      {/* Target History Picker */}
      <TargetPickerDialog
        open={showTargetPicker}
        onOpenChange={setShowTargetPicker}
        targets={targets}
        targetSearch={targetSearch}
        setTargetSearch={setTargetSearch}
        targetSort={targetSort}
        setTargetSort={setTargetSort}
        selectedTargets={selectedTargets}
        setSelectedTargets={setSelectedTargets}
        parsedSeeds={parsedSeeds}
        seedText={seedText}
        setSeedText={setSeedText}
      />

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

      {/* No Apify Token Dialog */}
      <AlertDialog
        open={showNoApifyTokenDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowNoApifyTokenDialog(false);
            navigate("/settings/integrations");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apify Token Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to configure an Apify token before you can run deep scrape jobs. You'll be redirected to the Integrations page to set one up.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowNoApifyTokenDialog(false);
                navigate("/settings/integrations");
              }}
            >
              Go to Integrations
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* No OpenAI Key Dialog */}
      <AlertDialog
        open={showNoOpenAIDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowNoOpenAIDialog(false);
            navigate("/settings/integrations");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>OpenAI API Key Required</AlertDialogTitle>
            <AlertDialogDescription>
              Qualifying leads requires an OpenAI API key. You'll be redirected to the Integrations page to add one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowNoOpenAIDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowNoOpenAIDialog(false);
                navigate("/settings/integrations");
              }}
            >
              Go to Integrations
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* No Prompt Dialog */}
      <AlertDialog
        open={showNoPromptDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowNoPromptDialog(false);
            navigate("/prompts");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>No Classification Prompt Set</AlertDialogTitle>
            <AlertDialogDescription>
              You need at least one classification prompt before you can qualify leads. You'll be redirected to the Prompts page to create one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowNoPromptDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowNoPromptDialog(false);
                navigate("/prompts");
              }}
            >
              Go to Prompts
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add to Campaign Dialog */}
      <Dialog open={!!addToCampaignJobId} onOpenChange={(open) => { if (!open) { setAddToCampaignJobId(null); setSelectedCampaignId(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Qualified Leads to Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              All qualified leads from this job will be added to the selected campaign. Duplicates will be skipped.
            </p>
            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a campaign" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name} ({c.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddToCampaignJobId(null); setSelectedCampaignId(""); }}>
              Cancel
            </Button>
            <Button
              onClick={handleAddToCampaign}
              disabled={!selectedCampaignId || addToCampaignMutation.isPending}
            >
              {addToCampaignMutation.isPending ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Adding...</>
              ) : (
                "Add Leads"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Job Dialog */}
      <EditJobDialog
        editingJob={editingJob}
        onClose={() => { setEditingJob(null); setShowEditConfirm(false); }}
        editSeeds={editSeeds}
        editNewSeedText={editNewSeedText}
        setEditNewSeedText={setEditNewSeedText}
        editName={editName}
        setEditName={setEditName}
        editReelLimit={editReelLimit}
        setEditReelLimit={setEditReelLimit}
        editCommentLimit={editCommentLimit}
        setEditCommentLimit={setEditCommentLimit}
        editMinFollowers={editMinFollowers}
        setEditMinFollowers={setEditMinFollowers}
        editIsRecurring={editIsRecurring}
        setEditIsRecurring={setEditIsRecurring}
        editRepeatInterval={editRepeatInterval}
        setEditRepeatInterval={setEditRepeatInterval}
        showEditConfirm={showEditConfirm}
        setShowEditConfirm={setShowEditConfirm}
        onRemoveEditSeed={handleRemoveEditSeed}
        onAddEditSeeds={handleAddEditSeeds}
        onSaveEdit={handleSaveEdit}
        isSaving={updateMutation.isPending}
        targetQualMap={targetQualMap}
      />
    </div>
  );
}
