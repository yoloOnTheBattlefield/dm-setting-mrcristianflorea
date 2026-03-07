import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import {
  useFollowUps,
  useFollowUpStats,
  useSyncFollowUps,
  useUpdateFollowUp,
  type FollowUp,
  type FollowUpStatus,
} from "@/hooks/useFollowUps";
import { useOutboundAccounts } from "@/hooks/useOutboundAccounts";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Flame,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  CalendarCheck,
  Ghost,
  Clock,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  CalendarIcon,
  StickyNote,
  AlertTriangle,
  Snowflake,
  ExternalLink,
} from "lucide-react";

// ─── Status config ───

const STATUS_CONFIG: Record<
  FollowUpStatus,
  { label: string; color: string; bg: string; border: string; borderAccent: string; dotColor: string }
> = {
  new: {
    label: "Need Follow-Up",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    borderAccent: "border-l-amber-500",
    dotColor: "bg-amber-500",
  },
  hot_lead: {
    label: "Hot Lead",
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    borderAccent: "border-l-orange-500",
    dotColor: "bg-orange-500",
  },
  contacted: {
    label: "Followed Up",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    borderAccent: "border-l-blue-500",
    dotColor: "bg-blue-500",
  },
  interested: {
    label: "Interested",
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    borderAccent: "border-l-green-500",
    dotColor: "bg-green-500",
  },
  booked: {
    label: "Booked",
    color: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    borderAccent: "border-l-purple-500",
    dotColor: "bg-purple-500",
  },
  not_interested: {
    label: "Not Interested",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    borderAccent: "border-l-red-500",
    dotColor: "bg-red-500",
  },
  no_response: {
    label: "No Response",
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-500/10",
    border: "border-gray-500/20",
    borderAccent: "border-l-gray-400",
    dotColor: "bg-gray-400",
  },
  ghosted: {
    label: "Ghosted",
    color: "text-gray-500 dark:text-gray-500",
    bg: "bg-gray-500/10",
    border: "border-gray-500/20",
    borderAccent: "border-l-gray-500",
    dotColor: "bg-gray-500",
  },
};

// Pipeline tabs
const PIPELINE_TABS: { key: FollowUpStatus | "all"; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All", icon: null },
  { key: "new", label: "Need Follow-Up", icon: <Clock className="h-3.5 w-3.5" /> },
  { key: "hot_lead", label: "Hot Lead", icon: <Flame className="h-3.5 w-3.5" /> },
  { key: "contacted", label: "Followed Up", icon: <MessageCircle className="h-3.5 w-3.5" /> },
  { key: "interested", label: "Interested", icon: <ThumbsUp className="h-3.5 w-3.5" /> },
  { key: "booked", label: "Booked", icon: <CalendarCheck className="h-3.5 w-3.5" /> },
  { key: "not_interested", label: "Not Interested", icon: <ThumbsDown className="h-3.5 w-3.5" /> },
  { key: "ghosted", label: "Ghosted", icon: <Ghost className="h-3.5 w-3.5" /> },
];

// Quick status actions for cards
const QUICK_ACTIONS: { key: FollowUpStatus; label: string; shortLabel: string }[] = [
  { key: "contacted", label: "Followed Up", shortLabel: "Followed Up" },
  { key: "interested", label: "Interested", shortLabel: "Interested" },
  { key: "hot_lead", label: "Hot Lead", shortLabel: "Hot Lead" },
  { key: "booked", label: "Booked", shortLabel: "Booked" },
  { key: "not_interested", label: "Not Interested", shortLabel: "Not Int." },
  { key: "ghosted", label: "Ghosted", shortLabel: "Ghosted" },
];

// ─── Helpers ───

function timeAgo(dateStr: string | null | undefined): { text: string; urgency: "green" | "yellow" | "red" } {
  if (!dateStr) return { text: "unknown", urgency: "red" };
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffH = diffMs / (1000 * 60 * 60);
  const diffD = diffH / 24;

  let text: string;
  if (diffH < 1) text = `${Math.max(1, Math.round(diffMs / 60000))}m ago`;
  else if (diffH < 24) text = `${Math.round(diffH)}h ago`;
  else if (diffD < 2) text = "yesterday";
  else text = `${Math.round(diffD)}d ago`;

  const urgency = diffH < 24 ? "green" : diffD <= 3 ? "yellow" : "red";
  return { text, urgency };
}

function formatFollowers(count: number | null | undefined): string {
  if (count == null) return "";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

function isOverdue(dateStr: string | null, status: FollowUpStatus): boolean {
  if (!dateStr) return false;
  if (status === "booked" || status === "not_interested" || status === "ghosted") return false;
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

function isDueToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function getHeatIcon(repliedAt: string | null | undefined): React.ReactNode {
  if (!repliedAt) return <Snowflake className="h-3 w-3 text-blue-400" />;
  const hours = (Date.now() - new Date(repliedAt).getTime()) / (1000 * 60 * 60);
  if (hours < 24) return <Flame className="h-3 w-3 text-orange-500" />;
  if (hours < 72) return <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />;
  return <Snowflake className="h-3 w-3 text-blue-400" />;
}

// ─── Component ───

export default function FollowUps() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = usePersistedState<FollowUpStatus | "all">("fu-tab", "new");
  const [sort, setSort] = usePersistedState("fu-sort", "newest");
  const [accountFilter, setAccountFilter] = usePersistedState("fu-account", "all");
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const limit = 30;

  const { data, isLoading } = useFollowUps({
    page,
    limit,
    status: activeTab === "all" ? undefined : activeTab,
    search,
    sort,
    outbound_account_id: accountFilter,
  });
  const { data: stats } = useFollowUpStats();
  const { data: accountsData } = useOutboundAccounts({ page: 1, limit: 100 });
  const syncMutation = useSyncFollowUps();
  const updateMutation = useUpdateFollowUp();
  const [syncResult, setSyncResult] = useState<number | null>(null);

  const handleSync = useCallback(async () => {
    try {
      const result = await syncMutation.mutateAsync();
      setSyncResult(result.synced);
      setTimeout(() => setSyncResult(null), 3000);
    } catch {
      // handled by mutation
    }
  }, [syncMutation]);

  const followUps = data?.followUps ?? [];
  const pagination = data?.pagination;
  const accounts = accountsData?.accounts ?? [];

  // Client-side quick filters
  const filteredFollowUps = useMemo(() => {
    if (!quickFilter) return followUps;
    const now = new Date();
    return followUps.filter((fu) => {
      if (quickFilter === "overdue") return isOverdue(fu.follow_up_date, fu.status);
      if (quickFilter === "today") return isDueToday(fu.follow_up_date);
      if (quickFilter === "replied_24h") {
        if (!fu.lead?.replied_at) return false;
        return (now.getTime() - new Date(fu.lead.replied_at).getTime()) < 24 * 60 * 60 * 1000;
      }
      return true;
    });
  }, [followUps, quickFilter]);

  // Bulk actions
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredFollowUps.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFollowUps.map((f) => f._id)));
    }
  }, [selectedIds.size, filteredFollowUps]);

  const handleBulkStatus = useCallback(
    (status: FollowUpStatus) => {
      for (const id of selectedIds) {
        updateMutation.mutate({ id, updates: { status } });
      }
      setSelectedIds(new Set());
    },
    [selectedIds, updateMutation],
  );

  const handleBulkFollowUp = useCallback(
    (days: number) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      for (const id of selectedIds) {
        updateMutation.mutate({ id, updates: { follow_up_date: date.toISOString() } });
      }
      setSelectedIds(new Set());
    },
    [selectedIds, updateMutation],
  );

  // Clear selection on tab/filter change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab, quickFilter, search, page]);

  // Operational summary numbers
  const totalReplied = stats?.total ?? 0;
  const needFollowUp = (stats?.new ?? 0) + (stats?.hot_lead ?? 0);
  const interestedCount = stats?.interested ?? 0;
  const bookedCount = stats?.booked ?? 0;

  return (
    <div className="space-y-4">
      {/* Header with operational summary */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Follow-Ups</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
            <span>{totalReplied} conversations replied</span>
            <span className="text-border">|</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">{needFollowUp} need follow up</span>
            <span className="text-border">|</span>
            <span className="text-green-600 dark:text-green-400 font-medium">{interestedCount} interested</span>
            <span className="text-border">|</span>
            <span className="text-purple-600 dark:text-purple-400 font-medium">{bookedCount} booked</span>
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncMutation.isPending}
          className={cn(
            "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            syncResult !== null
              ? "bg-green-500/10 text-green-600 border border-green-500/20"
              : "bg-amber-500 text-white hover:bg-amber-600",
            syncMutation.isPending && "opacity-60 cursor-not-allowed",
          )}
        >
          {syncMutation.isPending ? (
            <><RefreshCw className="h-4 w-4 animate-spin" />Syncing...</>
          ) : syncResult !== null ? (
            <><Check className="h-4 w-4" />Synced! +{syncResult} new</>
          ) : (
            <><RefreshCw className="h-4 w-4" />Sync Replies</>
          )}
        </button>
      </div>

      {/* Pipeline tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border/50 pb-px">
        {PIPELINE_TABS.map((tab) => {
          const count = tab.key === "all"
            ? stats?.total
            : stats?.[tab.key];
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1); setQuickFilter(null); }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md transition-colors whitespace-nowrap border-b-2",
                activeTab === tab.key
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground/70",
              )}
            >
              {tab.icon}
              {tab.label}
              {count != null && count > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-semibold">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter bar: search + activity filters | account + sort */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 h-8 text-xs"
          />
        </div>

        {/* Activity filters */}
        <div className="flex items-center gap-1">
          {[
            { key: "overdue", label: "Overdue", icon: <AlertTriangle className="h-3 w-3" /> },
            { key: "today", label: "Due Today", icon: <CalendarIcon className="h-3 w-3" /> },
            { key: "replied_24h", label: "Replied <24h", icon: <Clock className="h-3 w-3" /> },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setQuickFilter(quickFilter === f.key ? null : f.key)}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors",
                quickFilter === f.key
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/30",
              )}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Select value={accountFilter} onValueChange={(v) => { setAccountFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map((acc) => (
                <SelectItem key={acc._id} value={acc._id}>@{acc.username}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="follow_up_date">Follow-Up Date</SelectItem>
            </SelectContent>
          </Select>

          {pagination && (
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
              {filteredFollowUps.length}{quickFilter ? ` of ${pagination.total}` : ""} lead{filteredFollowUps.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[160px] rounded-lg" />
          ))}
        </div>
      ) : filteredFollowUps.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {search || activeTab !== "all" || accountFilter !== "all" || quickFilter
              ? "No follow-ups match your filters."
              : 'No follow-ups yet. Click "Sync Replies" to import replied leads.'}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Select all */}
          <div className="flex items-center gap-2 px-1">
            <Checkbox
              checked={selectedIds.size === filteredFollowUps.length && filteredFollowUps.length > 0}
              onCheckedChange={toggleSelectAll}
              className="h-3.5 w-3.5"
            />
            <span className="text-[11px] text-muted-foreground">Select all</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {filteredFollowUps.map((fu) => (
              <FollowUpCard
                key={fu._id}
                followUp={fu}
                selected={selectedIds.has(fu._id)}
                onToggleSelect={() => toggleSelect(fu._id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Floating bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl border bg-background/95 backdrop-blur shadow-lg px-4 py-2.5">
          <span className="text-xs font-semibold">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-border" />
          {QUICK_ACTIONS.filter((a) => a.key !== activeTab).slice(0, 4).map((a) => (
            <button
              key={a.key}
              onClick={() => handleBulkStatus(a.key)}
              className={cn(
                "px-2 py-1 rounded text-[11px] font-medium border transition-colors",
                STATUS_CONFIG[a.key].bg,
                STATUS_CONFIG[a.key].color,
                STATUS_CONFIG[a.key].border,
              )}
            >
              {a.shortLabel}
            </button>
          ))}
          <div className="h-4 w-px bg-border" />
          <span className="text-[11px] text-muted-foreground">Follow up:</span>
          {[1, 3, 7].map((d) => (
            <button
              key={d}
              onClick={() => handleBulkFollowUp(d)}
              className="px-2 py-1 rounded text-[11px] font-medium border border-border bg-background hover:bg-muted transition-colors"
            >
              +{d}d
            </button>
          ))}
          <button onClick={() => setSelectedIds(new Set())} className="ml-2 text-[11px] text-muted-foreground hover:text-foreground">
            Clear
          </button>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border text-sm disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted-foreground">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border text-sm disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Lead Card ───

function FollowUpCard({
  followUp,
  selected,
  onToggleSelect,
}: {
  followUp: FollowUp;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const updateMutation = useUpdateFollowUp();
  const [copied, setCopied] = useState(false);

  const lead = followUp.lead;
  const statusCfg = STATUS_CONFIG[followUp.status];
  const reply = timeAgo(lead?.replied_at);
  const overdue = isOverdue(followUp.follow_up_date, followUp.status);
  const dueToday = isDueToday(followUp.follow_up_date);
  const initial = (lead?.fullName?.[0] || lead?.username?.[0] || "?").toUpperCase();

  const handleStatusChange = useCallback(
    (status: FollowUpStatus) => {
      updateMutation.mutate({ id: followUp._id, updates: { status } });
    },
    [followUp._id, updateMutation],
  );

  const handleQuickDate = useCallback(
    (days: number) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      updateMutation.mutate({ id: followUp._id, updates: { follow_up_date: date.toISOString() } });
    },
    [followUp._id, updateMutation],
  );

  const handleDateChange = useCallback(
    (date: Date | undefined) => {
      updateMutation.mutate({ id: followUp._id, updates: { follow_up_date: date ? date.toISOString() : null } });
    },
    [followUp._id, updateMutation],
  );

  const handleCopy = useCallback(() => {
    if (!lead?.username) return;
    navigator.clipboard.writeText(lead.username);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [lead?.username]);

  return (
    <Card className={cn(
      "relative transition-all border-l-[3px]",
      statusCfg.borderAccent,
      overdue && "ring-1 ring-red-500/40",
      dueToday && !overdue && "ring-1 ring-amber-500/30",
      selected && "bg-muted/50 ring-2 ring-foreground/50",
    )}>
      <CardContent className="p-3 space-y-2">
        {/* Zone 1: Identity + DM action */}
        <div className="flex items-start gap-2.5">
          <Checkbox
            checked={selected}
            onCheckedChange={onToggleSelect}
            className="h-3.5 w-3.5 mt-1.5 shrink-0"
          />

          {/* Avatar */}
          <div className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            statusCfg.bg, statusCfg.color,
          )}>
            {initial}
          </div>

          {/* Lead info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <a
                href={`https://instagram.com/${lead?.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold hover:underline truncate"
              >
                @{lead?.username}
              </a>
              {lead?.isVerified && (
                <span className="text-blue-500 text-[10px]" title="Verified">&#10003;</span>
              )}
              <ExternalLink className="h-3 w-3 text-muted-foreground/40 shrink-0" />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {lead?.followersCount != null && <span>{formatFollowers(lead.followersCount)} followers</span>}
              {followUp.outbound_account?.username && (
                <>
                  <span>·</span>
                  <span className="truncate">via @{followUp.outbound_account.username}</span>
                </>
              )}
            </div>
          </div>

          {/* DM button - dominant */}
          <button
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy username to DM"}
            className={cn(
              "shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              copied
                ? "bg-green-500/10 text-green-600 border border-green-500/20"
                : "bg-amber-500 text-white hover:bg-amber-600 shadow-sm",
            )}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "DM"}
          </button>
        </div>

        {/* Zone 2: Reply heat + follow-up scheduling */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Conversation heat */}
          <span className={cn(
            "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded",
            reply.urgency === "green" && "bg-green-500/10 text-green-600",
            reply.urgency === "yellow" && "bg-amber-500/10 text-amber-600",
            reply.urgency === "red" && "bg-red-500/10 text-red-600",
          )}>
            {getHeatIcon(lead?.replied_at)}
            replied {reply.text}
          </span>

          {/* Next follow-up group */}
          <div className="flex items-center gap-1 ml-auto">
            {overdue && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-600 bg-red-500/10 px-1.5 py-0.5 rounded">
                <AlertTriangle className="h-2.5 w-2.5" />
                Overdue
              </span>
            )}
            {dueToday && !overdue && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
                <CalendarIcon className="h-2.5 w-2.5" />
                Due today
              </span>
            )}
            {followUp.follow_up_date && !overdue && !dueToday && (
              <span className="text-[10px] text-muted-foreground">
                Next: {new Date(followUp.follow_up_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
            {!followUp.follow_up_date && (
              <span className="text-[10px] text-muted-foreground/50">No follow-up set</span>
            )}
          </div>
        </div>

        {/* Zone 3: Quick actions */}
        <div className="flex items-center gap-1 pt-1 border-t border-border/40">
          {/* Status actions */}
          {QUICK_ACTIONS.filter((a) => a.key !== followUp.status).slice(0, 4).map((action) => (
            <button
              key={action.key}
              onClick={() => handleStatusChange(action.key)}
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-medium border transition-all opacity-50 hover:opacity-100",
                STATUS_CONFIG[action.key].bg,
                STATUS_CONFIG[action.key].color,
                STATUS_CONFIG[action.key].border,
              )}
            >
              {action.shortLabel}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-1">
            {/* Follow-up date chips */}
            {[1, 3, 7].map((d) => (
              <button
                key={d}
                onClick={() => handleQuickDate(d)}
                title={`Follow up in ${d} day${d > 1 ? "s" : ""}`}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium border border-border bg-background hover:bg-muted transition-colors text-muted-foreground"
              >
                +{d}d
              </button>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  title="Custom follow-up date"
                  className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground"
                >
                  <CalendarIcon className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={followUp.follow_up_date ? new Date(followUp.follow_up_date) : undefined}
                  onSelect={handleDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Notes */}
            <NotePopover followUp={followUp} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Notes Popover ───

function NotePopover({ followUp }: { followUp: FollowUp }) {
  const updateMutation = useUpdateFollowUp();
  const [note, setNote] = useState(followUp.note);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNote(followUp.note);
  }, [followUp.note]);

  const handleChange = useCallback(
    (value: string) => {
      setNote(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateMutation.mutate({ id: followUp._id, updates: { note: value } });
      }, 500);
    },
    [followUp._id, updateMutation],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          title={followUp.note || "Add note"}
          className={cn(
            "p-0.5 rounded hover:bg-muted transition-colors",
            followUp.note ? "text-amber-500" : "text-muted-foreground",
          )}
        >
          <StickyNote className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <textarea
          value={note}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Add a quick note..."
          rows={3}
          autoFocus
          className="w-full resize-none rounded-md border bg-transparent px-2 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <p className="text-[10px] text-muted-foreground mt-1">Auto-saves as you type</p>
      </PopoverContent>
    </Popover>
  );
}
