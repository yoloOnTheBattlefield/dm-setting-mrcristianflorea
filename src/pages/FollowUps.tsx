import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  useFollowUps,
  useFollowUpStats,
  useSyncFollowUps,
  useUpdateFollowUp,
  type FollowUp,
  type FollowUpStatus,
} from "@/hooks/useFollowUps";
import { useOutboundAccounts } from "@/hooks/useOutboundAccounts";
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
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  RefreshCw,
  Search,
  Copy,
  Check,
  CalendarIcon,
  StickyNote,
  AlertTriangle,
  Flame,
  ExternalLink,
  Snowflake,
} from "lucide-react";

// ─── Status config ───

const STATUS_CONFIG: Record<
  FollowUpStatus,
  { label: string; color: string; bg: string; headerBg: string; dotColor: string }
> = {
  new: {
    label: "Need Follow-Up",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-500/5",
    headerBg: "bg-amber-500",
    dotColor: "bg-amber-500",
  },
  hot_lead: {
    label: "Hot Lead",
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-500/5",
    headerBg: "bg-orange-500",
    dotColor: "bg-orange-500",
  },
  contacted: {
    label: "Followed Up",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-500/5",
    headerBg: "bg-blue-500",
    dotColor: "bg-blue-500",
  },
  interested: {
    label: "Interested",
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-500/5",
    headerBg: "bg-green-500",
    dotColor: "bg-green-500",
  },
  booked: {
    label: "Booked",
    color: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-500/5",
    headerBg: "bg-purple-500",
    dotColor: "bg-purple-500",
  },
  not_interested: {
    label: "Not Interested",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-500/5",
    headerBg: "bg-red-500",
    dotColor: "bg-red-500",
  },
  no_response: {
    label: "No Response",
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-500/5",
    headerBg: "bg-gray-400",
    dotColor: "bg-gray-400",
  },
  ghosted: {
    label: "Ghosted",
    color: "text-gray-500 dark:text-gray-500",
    bg: "bg-gray-500/5",
    headerBg: "bg-gray-500",
    dotColor: "bg-gray-500",
  },
};

// Column order for the kanban board
const COLUMN_ORDER: FollowUpStatus[] = [
  "new",
  "hot_lead",
  "contacted",
  "interested",
  "booked",
  "not_interested",
  "no_response",
  "ghosted",
];

// ─── Helpers ───

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffH = diffMs / (1000 * 60 * 60);
  const diffD = diffH / 24;
  if (diffH < 1) return `${Math.max(1, Math.round(diffMs / 60000))}m`;
  if (diffH < 24) return `${Math.round(diffH)}h`;
  if (diffD < 2) return "1d";
  return `${Math.round(diffD)}d`;
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

function getHeatLevel(repliedAt: string | null | undefined): "hot" | "warm" | "cold" {
  if (!repliedAt) return "cold";
  const hours = (Date.now() - new Date(repliedAt).getTime()) / (1000 * 60 * 60);
  if (hours < 24) return "hot";
  if (hours < 72) return "warm";
  return "cold";
}

// ─── Component ───

export default function FollowUps() {
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState("all");
  const [activeId, setActiveId] = useState<string | null>(null);

  // Fetch ALL follow-ups (no status filter — we need all for the board)
  const { data, isLoading } = useFollowUps({
    page: 1,
    limit: 200,
    search,
    outbound_account_id: accountFilter,
  });
  const { data: stats } = useFollowUpStats();
  const { data: accountsData } = useOutboundAccounts({ page: 1, limit: 100 });
  const syncMutation = useSyncFollowUps();
  const updateMutation = useUpdateFollowUp();
  const [syncResult, setSyncResult] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

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
  const accounts = accountsData?.accounts ?? [];

  // Group follow-ups by status
  const columns = useMemo(() => {
    const grouped: Record<FollowUpStatus, FollowUp[]> = {
      new: [], hot_lead: [], contacted: [], interested: [],
      booked: [], not_interested: [], no_response: [], ghosted: [],
    };
    for (const fu of followUps) {
      grouped[fu.status]?.push(fu);
    }
    return grouped;
  }, [followUps]);

  const activeFollowUp = activeId ? followUps.find((f) => f._id === activeId) : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const followUpId = String(active.id);
      const targetId = String(over.id);
      // Only accept drops on column droppables (valid statuses)
      if (!COLUMN_ORDER.includes(targetId as FollowUpStatus)) return;
      const newStatus = targetId as FollowUpStatus;
      const fu = followUps.find((f) => f._id === followUpId);
      if (!fu || fu.status === newStatus) return;

      updateMutation.mutate({ id: followUpId, updates: { status: newStatus } });
    },
    [followUps, updateMutation],
  );

  const totalReplied = stats?.total ?? 0;
  const needFollowUp = (stats?.new ?? 0) + (stats?.hot_lead ?? 0);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Follow-Ups</h1>
          <p className="text-sm text-muted-foreground">
            <span>{totalReplied} replied</span>
            {needFollowUp > 0 && (
              <span className="text-amber-600 dark:text-amber-400 font-medium"> · {needFollowUp} need action</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs w-[180px]"
            />
          </div>

          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map((acc) => (
                <SelectItem key={acc._id} value={acc._id}>@{acc.username}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            onClick={handleSync}
            disabled={syncMutation.isPending}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              syncResult !== null
                ? "bg-green-500/10 text-green-600 border border-green-500/20"
                : "bg-amber-500 text-white hover:bg-amber-600",
              syncMutation.isPending && "opacity-60 cursor-not-allowed",
            )}
          >
            {syncMutation.isPending ? (
              <><RefreshCw className="h-3.5 w-3.5 animate-spin" />Syncing...</>
            ) : syncResult !== null ? (
              <><Check className="h-3.5 w-3.5" />+{syncResult} new</>
            ) : (
              <><RefreshCw className="h-3.5 w-3.5" />Sync Replies</>
            )}
          </button>
        </div>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex gap-2 overflow-x-auto pb-2 min-h-0">
          {COLUMN_ORDER.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              followUps={columns[status]}
              count={stats?.[status] ?? 0}
              isLoading={isLoading}
            />
          ))}
        </div>

        <DragOverlay>
          {activeFollowUp ? (
            <div className="opacity-90 rotate-2">
              <KanbanCardContent followUp={activeFollowUp} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// ─── Kanban Column ───

function KanbanColumn({
  status,
  followUps,
  count,
  isLoading,
}: {
  status: FollowUpStatus;
  followUps: FollowUp[];
  count: number;
  isLoading: boolean;
}) {
  const cfg = STATUS_CONFIG[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-[280px] min-w-[280px] rounded-lg border bg-muted/30 transition-colors",
        isOver && "bg-muted/60 border-foreground/20",
      )}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50">
        <span className={cn("h-2 w-2 rounded-full shrink-0", cfg.dotColor)} />
        <span className="text-xs font-semibold truncate">{cfg.label}</span>
        <span className="ml-auto text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
          {count}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5 min-h-[100px]">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-[88px] rounded-md bg-muted/50 animate-pulse" />
          ))
        ) : followUps.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[60px]">
            <p className="text-[11px] text-muted-foreground/50">No leads</p>
          </div>
        ) : (
          followUps.map((fu) => (
            <KanbanCard key={fu._id} followUp={fu} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Kanban Card (draggable wrapper) ───

function KanbanCard({ followUp }: { followUp: FollowUp }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: followUp._id });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(isDragging && "opacity-30 z-50 relative")}
    >
      <KanbanCardContent followUp={followUp} />
    </div>
  );
}

// ─── Card Content ───

function KanbanCardContent({
  followUp,
  isDragging,
}: {
  followUp: FollowUp;
  isDragging?: boolean;
}) {
  const updateMutation = useUpdateFollowUp();
  const [copied, setCopied] = useState(false);

  const lead = followUp.lead;
  const overdue = isOverdue(followUp.follow_up_date, followUp.status);
  const heat = getHeatLevel(lead?.replied_at);
  const replyTime = timeAgo(lead?.replied_at);
  const initial = (lead?.fullName?.[0] || lead?.username?.[0] || "?").toUpperCase();

  const handleCopy = useCallback(() => {
    if (!lead?.username) return;
    navigator.clipboard.writeText(lead.username);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [lead?.username]);

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

  return (
    <div
      className={cn(
        "rounded-md border bg-background p-2.5 space-y-2 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow",
        overdue && "border-red-500/40",
        isDragging && "shadow-lg",
      )}
    >
      {/* Row 1: avatar + name + DM */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
          STATUS_CONFIG[followUp.status].bg,
          STATUS_CONFIG[followUp.status].color,
        )}>
          {initial}
        </div>

        <div className="flex-1 min-w-0">
          <a
            href={`https://instagram.com/${lead?.username}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-semibold hover:underline truncate block"
          >
            @{lead?.username}
          </a>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            {lead?.followersCount != null && <span>{formatFollowers(lead.followersCount)}</span>}
            {followUp.outbound_account?.username && (
              <>
                {lead?.followersCount != null && <span>·</span>}
                <span className="truncate">via @{followUp.outbound_account.username}</span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); handleCopy(); }}
          title={copied ? "Copied!" : "Copy username"}
          className={cn(
            "shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-colors",
            copied
              ? "bg-green-500/10 text-green-600"
              : "bg-amber-500 text-white hover:bg-amber-600",
          )}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          DM
        </button>
      </div>

      {/* Row 2: reply heat + follow-up date */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5">
          {/* Heat indicator */}
          {heat === "hot" && <Flame className="h-3 w-3 text-orange-500" />}
          {heat === "warm" && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />}
          {heat === "cold" && <Snowflake className="h-3 w-3 text-blue-400/60" />}
          <span className={cn(
            "text-[10px]",
            heat === "hot" ? "text-orange-600 font-medium" : "text-muted-foreground",
          )}>
            {replyTime ? `replied ${replyTime}` : "no reply"}
          </span>
        </div>

        {/* Follow-up date */}
        <div className="flex items-center gap-1">
          {overdue && (
            <span className="text-[10px] font-semibold text-red-600 flex items-center gap-0.5">
              <AlertTriangle className="h-2.5 w-2.5" />
              Overdue
            </span>
          )}
          {followUp.follow_up_date && !overdue && (
            <span className="text-[10px] text-muted-foreground">
              {new Date(followUp.follow_up_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      </div>

      {/* Row 3: quick actions */}
      <div className="flex items-center gap-1 pt-1 border-t border-border/30">
        {[1, 3, 7].map((d) => (
          <button
            key={d}
            onClick={(e) => { e.stopPropagation(); handleQuickDate(d); }}
            title={`Follow up in ${d}d`}
            className="px-1.5 py-0.5 rounded text-[10px] font-medium border border-border/60 bg-background hover:bg-muted transition-colors text-muted-foreground"
          >
            +{d}d
          </button>
        ))}

        <Popover>
          <PopoverTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              title="Pick date"
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

        <div className="ml-auto">
          <NotePopover followUp={followUp} />
        </div>
      </div>
    </div>
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
          onClick={(e) => e.stopPropagation()}
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
