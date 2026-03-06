import { useState, useCallback, useRef, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Users,
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
} from "lucide-react";

// ─── Status config ───

const STATUS_CONFIG: Record<
  FollowUpStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  new: {
    label: "New",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  contacted: {
    label: "Contacted",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  interested: {
    label: "Interested",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  not_interested: {
    label: "Not Interested",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  booked: {
    label: "Booked",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  no_response: {
    label: "No Response",
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
  },
  ghosted: {
    label: "Ghosted",
    color: "text-gray-500",
    bg: "bg-gray-100",
    border: "border-gray-300",
  },
  hot_lead: {
    label: "Hot Lead",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
};

const STAT_CARDS: {
  key: keyof typeof STATUS_CONFIG | "total";
  label: string;
  icon: React.ReactNode;
  colorClass: string;
}[] = [
  {
    key: "total",
    label: "Total Replied",
    icon: <Users className="h-4 w-4" style={{ color: "#64748B" }} />,
    colorClass: "",
  },
  {
    key: "new",
    label: "Need Follow-Up",
    icon: <Clock className="h-4 w-4" style={{ color: "#D97706" }} />,
    colorClass: "text-amber-600",
  },
  {
    key: "hot_lead",
    label: "Hot Lead",
    icon: <Flame className="h-4 w-4" style={{ color: "#EA580C" }} />,
    colorClass: "text-orange-600",
  },
  {
    key: "contacted",
    label: "Followed Up",
    icon: <MessageCircle className="h-4 w-4" style={{ color: "#2563EB" }} />,
    colorClass: "text-blue-600",
  },
  {
    key: "interested",
    label: "Interested",
    icon: <ThumbsUp className="h-4 w-4" style={{ color: "#16A34A" }} />,
    colorClass: "text-green-600",
  },
  {
    key: "booked",
    label: "Booked",
    icon: <CalendarCheck className="h-4 w-4" style={{ color: "#7C3AED" }} />,
    colorClass: "text-purple-600",
  },
  {
    key: "not_interested",
    label: "Not Interested",
    icon: <ThumbsDown className="h-4 w-4" style={{ color: "#DC2626" }} />,
    colorClass: "text-red-600",
  },
  {
    key: "ghosted",
    label: "Ghosted",
    icon: <Ghost className="h-4 w-4" style={{ color: "#6B7280" }} />,
    colorClass: "text-gray-500",
  },
];

// ─── Component ───

export default function FollowUps() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = usePersistedState("fu-status", "all");
  const [sort, setSort] = usePersistedState("fu-sort", "newest");
  const [accountFilter, setAccountFilter] = usePersistedState(
    "fu-account",
    "all",
  );
  const limit = 20;

  const { data, isLoading } = useFollowUps({
    page,
    limit,
    status,
    search,
    sort,
    outbound_account_id: accountFilter,
  });
  const { data: stats } = useFollowUpStats();
  const { data: accountsData } = useOutboundAccounts({ page: 1, limit: 100 });
  const syncMutation = useSyncFollowUps();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Follow-Ups</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage leads who replied to your outbound DMs
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncMutation.isPending}
          className={cn(
            "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            syncResult !== null
              ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-amber-500 text-white hover:bg-amber-600",
            syncMutation.isPending && "opacity-60 cursor-not-allowed",
          )}
        >
          {syncMutation.isPending ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : syncResult !== null ? (
            <>
              <Check className="h-4 w-4" />
              Synced! +{syncResult} new
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Sync from Campaigns
            </>
          )}
        </button>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {STAT_CARDS.map((card) => {
          const value = stats?.[card.key] ?? 0;
          const isZero = value === 0;
          return (
            <Card key={card.key} className="flex-1 min-w-0">
              <CardContent className="py-2.5 px-3 flex items-center gap-2.5">
                {card.icon}
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {card.label}
                  </p>
                  <p
                    className={cn(
                      "font-bold text-lg leading-tight",
                      isZero ? "text-[#A0AEC0]" : card.colorClass,
                    )}
                  >
                    {value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search username, name, or notes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={accountFilter}
          onValueChange={(v) => {
            setAccountFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            {accounts.map((acc) => (
              <SelectItem key={acc._id} value={acc._id}>
                @{acc.username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sort}
          onValueChange={(v) => {
            setSort(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="follow_up_date">Follow-Up Date</SelectItem>
          </SelectContent>
        </Select>

        {pagination && (
          <span className="text-sm text-muted-foreground ml-auto whitespace-nowrap">
            {pagination.total} result{pagination.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      ) : followUps.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {search || status !== "all" || accountFilter !== "all"
              ? "No follow-ups match your filters."
              : 'No follow-ups yet. Click "Sync from Campaigns" to import replied leads.'}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[240px]">Lead</TableHead>
                <TableHead className="w-[150px]">Status</TableHead>
                <TableHead className="w-[170px]">Follow-Up Date</TableHead>
                <TableHead className="min-w-[200px]">Notes</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {followUps.map((fu) => (
                <FollowUpRow key={fu._id} followUp={fu} />
              ))}
            </TableBody>
          </Table>
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
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() =>
              setPage((p) => Math.min(pagination.totalPages, p + 1))
            }
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

// ─── Row component ───

function FollowUpRow({ followUp }: { followUp: FollowUp }) {
  const updateMutation = useUpdateFollowUp();
  const [note, setNote] = useState(followUp.note);
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local note when data refreshes
  useEffect(() => {
    setNote(followUp.note);
  }, [followUp.note]);

  const handleStatusChange = useCallback(
    (newStatus: string) => {
      updateMutation.mutate({
        id: followUp._id,
        updates: { status: newStatus as FollowUpStatus },
      });
    },
    [followUp._id, updateMutation],
  );

  const handleDateChange = useCallback(
    (date: Date | undefined) => {
      updateMutation.mutate({
        id: followUp._id,
        updates: { follow_up_date: date ? date.toISOString() : null },
      });
    },
    [followUp._id, updateMutation],
  );

  const handleNoteChange = useCallback(
    (value: string) => {
      setNote(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateMutation.mutate({
          id: followUp._id,
          updates: { note: value },
        });
      }, 500);
    },
    [followUp._id, updateMutation],
  );

  const handleCopyUsername = useCallback(() => {
    if (!followUp.lead?.username) return;
    navigator.clipboard.writeText(followUp.lead.username);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [followUp.lead?.username]);

  const lead = followUp.lead;
  const statusCfg = STATUS_CONFIG[followUp.status];
  const followUpDate = followUp.follow_up_date
    ? new Date(followUp.follow_up_date)
    : undefined;
  const isOverdue =
    followUpDate &&
    followUpDate < new Date(new Date().toDateString()) &&
    followUp.status !== "booked" &&
    followUp.status !== "not_interested";

  const initial = lead?.fullName?.[0] || lead?.username?.[0] || "?";

  return (
    <TableRow>
      {/* Lead */}
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
            {initial.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <a
                href={`https://instagram.com/${lead?.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:underline truncate"
              >
                @{lead?.username}
              </a>
              {lead?.isVerified && (
                <span className="text-blue-500 text-xs" title="Verified">
                  ✓
                </span>
              )}
            </div>
            {lead?.fullName && (
              <p className="text-xs text-muted-foreground truncate">
                {lead.fullName}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {lead?.followersCount != null && (
                <span>
                  {lead.followersCount >= 1000
                    ? `${(lead.followersCount / 1000).toFixed(1)}k`
                    : lead.followersCount}{" "}
                  followers
                </span>
              )}
              {followUp.outbound_account?.username && (
                <>
                  <span>·</span>
                  <span>via @{followUp.outbound_account.username}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </TableCell>

      {/* Status */}
      <TableCell>
        <StatusPill
          value={followUp.status}
          onChange={handleStatusChange}
        />
      </TableCell>

      {/* Follow-Up Date */}
      <TableCell>
        <div className="flex flex-col gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors hover:bg-muted",
                  followUpDate ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                {followUpDate
                  ? followUpDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Set date"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={followUpDate}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {isOverdue && (
            <span className="text-xs text-red-600 font-medium">
              ⚠️ Overdue
            </span>
          )}
        </div>
      </TableCell>

      {/* Notes */}
      <TableCell>
        <textarea
          value={note}
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder="Add a note..."
          rows={2}
          className="w-full resize-none rounded-md border bg-transparent px-2 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </TableCell>

      {/* Actions */}
      <TableCell>
        <button
          onClick={handleCopyUsername}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            copied
              ? "bg-green-100 text-green-700"
              : "bg-amber-500 text-white hover:bg-amber-600",
          )}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              DM
            </>
          )}
        </button>
      </TableCell>
    </TableRow>
  );
}

// ─── Status Pill (custom dropdown) ───

function StatusPill({
  value,
  onChange,
}: {
  value: FollowUpStatus;
  onChange: (status: string) => void;
}) {
  const cfg = STATUS_CONFIG[value];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors cursor-pointer",
            cfg.bg,
            cfg.color,
            cfg.border,
          )}
        >
          {cfg.label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="start">
        {Object.entries(STATUS_CONFIG).map(([key, c]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-muted",
              key === value && "bg-muted font-medium",
            )}
          >
            <span
              className={cn(
                "inline-block h-2 w-2 rounded-full",
                c.bg,
                c.border,
                "border",
              )}
            />
            {c.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
