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
  Search,
  CalendarIcon,
  StickyNote,
  AlertTriangle,
  Flame,
  MessageCircle,
  Star,
  CalendarCheck,
  XCircle,
  Clock,
  FileText,
} from "lucide-react";
import { QuickNoteDialog } from "@/components/QuickNoteDialog";

// ─── Status config ───

const STATUS_CONFIG: Record<
  FollowUpStatus,
  { label: string; color: string; bg: string; headerBg: string; dotColor: string }
> = {
  need_reply: {
    label: "Need Reply",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-500/5",
    headerBg: "bg-amber-500",
    dotColor: "bg-amber-500",
  },
  hot_lead: {
    label: "Hot Leads",
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-500/5",
    headerBg: "bg-orange-500",
    dotColor: "bg-orange-500",
  },
  follow_up_later: {
    label: "Follow Up Later",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-500/5",
    headerBg: "bg-blue-500",
    dotColor: "bg-blue-500",
  },
  waiting_for_them: {
    label: "Waiting For Them",
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-500/5",
    headerBg: "bg-gray-400",
    dotColor: "bg-gray-400",
  },
  booked: {
    label: "Booked",
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-500/5",
    headerBg: "bg-green-500",
    dotColor: "bg-green-500",
  },
  not_interested: {
    label: "Not Interested",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-500/5",
    headerBg: "bg-red-500",
    dotColor: "bg-red-500",
  },
};

// Column order for the kanban board (only action columns, not terminal)
const COLUMN_ORDER: FollowUpStatus[] = [
  "need_reply",
  "hot_lead",
  "follow_up_later",
  "waiting_for_them",
];

// ─── Helpers ───

function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffH = diffMs / (1000 * 60 * 60);
  const diffD = diffH / 24;
  if (diffH < 1) return `${Math.max(1, Math.round(diffMs / 60000))}m ago`;
  if (diffH < 24) return `${Math.round(diffH)}h ago`;
  if (diffD < 2) return "1d ago";
  return `${Math.round(diffD)}d ago`;
}

function formatFollowers(count: number | null | undefined): string {
  if (count == null) return "";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

function isOverdue(dateStr: string | null, status: FollowUpStatus): boolean {
  if (!dateStr) return false;
  if (status === "booked" || status === "not_interested") return false;
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
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
    sort: "priority",
    outbound_account_id: accountFilter,
  });
  const { data: stats } = useFollowUpStats();
  const { data: accountsData } = useOutboundAccounts({ page: 1, limit: 100 });
  const syncMutation = useSyncFollowUps();
  const updateMutation = useUpdateFollowUp();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Auto-sync replied leads on mount
  const hasSynced = useRef(false);
  useEffect(() => {
    if (!hasSynced.current) {
      hasSynced.current = true;
      syncMutation.mutateAsync().catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const followUps = data?.followUps ?? [];
  const accounts = accountsData?.accounts ?? [];

  // Group follow-ups by status
  const columns = useMemo(() => {
    const grouped: Record<string, FollowUp[]> = {};
    for (const s of COLUMN_ORDER) grouped[s] = [];
    for (const fu of followUps) {
      if (grouped[fu.status]) grouped[fu.status].push(fu);
    }
    return grouped as Record<FollowUpStatus, FollowUp[]>;
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
      if (!COLUMN_ORDER.includes(targetId as FollowUpStatus)) return;
      const newStatus = targetId as FollowUpStatus;
      const fu = followUps.find((f) => f._id === followUpId);
      if (!fu || fu.status === newStatus) return;

      updateMutation.mutate({ id: followUpId, updates: { status: newStatus } });
    },
    [followUps, updateMutation],
  );

  const needAction = (stats?.need_reply ?? 0) + (stats?.hot_lead ?? 0);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Follow-Ups</h1>
          <p className="text-sm text-muted-foreground">
            <span>{stats?.total ?? 0} total</span>
            {needAction > 0 && (
              <span className="text-amber-600 dark:text-amber-400 font-medium"> · {needAction} need action</span>
            )}
            {(stats?.booked ?? 0) > 0 && (
              <span className="text-green-600 dark:text-green-400"> · {stats!.booked} booked</span>
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
              followUps={columns[status] ?? []}
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
        "flex flex-col w-[300px] min-w-[300px] rounded-lg border bg-muted/30 transition-colors",
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
            <div key={i} className="h-[110px] rounded-md bg-muted/50 animate-pulse" />
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

  const lead = followUp.lead;
  const overdue = isOverdue(followUp.follow_up_date, followUp.status);
  const activityDays = daysSince(followUp.last_activity);
  const lastMsgTime = timeAgo(lead?.dmDate || lead?.replied_at);
  const initial = (lead?.fullName?.[0] || lead?.username?.[0] || "?").toUpperCase();

  const handleReply = useCallback(() => {
    if (!lead?.username) return;
    window.open(`https://instagram.com/direct/t/${lead.username}`, "_blank");
    updateMutation.mutate({ id: followUp._id, updates: { status: "waiting_for_them" } });
  }, [lead?.username, followUp._id, updateMutation]);

  const handleQuickDate = useCallback(
    (days: number) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      updateMutation.mutate({
        id: followUp._id,
        updates: { status: "follow_up_later", follow_up_date: date.toISOString() },
      });
    },
    [followUp._id, updateMutation],
  );

  const handleDateChange = useCallback(
    (date: Date | undefined) => {
      updateMutation.mutate({
        id: followUp._id,
        updates: {
          status: date ? "follow_up_later" : followUp.status,
          follow_up_date: date ? date.toISOString() : null,
        },
      });
    },
    [followUp._id, followUp.status, updateMutation],
  );

  const handleMarkHot = useCallback(() => {
    updateMutation.mutate({ id: followUp._id, updates: { status: "hot_lead" } });
  }, [followUp._id, updateMutation]);

  const handleMarkBooked = useCallback(() => {
    updateMutation.mutate({ id: followUp._id, updates: { status: "booked" } });
  }, [followUp._id, updateMutation]);

  const handleMarkNotInterested = useCallback(() => {
    updateMutation.mutate({ id: followUp._id, updates: { status: "not_interested" } });
  }, [followUp._id, updateMutation]);

  return (
    <div
      className={cn(
        "rounded-md border bg-background p-2.5 space-y-2 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow",
        overdue && "border-red-500/40",
        isDragging && "shadow-lg",
      )}
    >
      {/* Row 1: avatar + name + reply button */}
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
          onClick={(e) => { e.stopPropagation(); handleReply(); }}
          title="Reply on Instagram"
          className="shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          <MessageCircle className="h-3 w-3" />
          Reply
        </button>
      </div>

      {/* Row 2: activity info */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            {activityDays != null
              ? activityDays === 0
                ? "Active today"
                : `${activityDays}d since activity`
              : "No activity"}
          </span>
        </div>

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
          {lastMsgTime && (
            <span className="text-[10px] text-muted-foreground/70">
              · msg {lastMsgTime}
            </span>
          )}
        </div>
      </div>

      {/* Row 3: action buttons */}
      <div className="flex items-center gap-1 pt-1 border-t border-border/30">
        {/* Quick schedule buttons */}
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

        <div className="ml-auto flex items-center gap-0.5">
          {followUp.status !== "hot_lead" && (
            <button
              onClick={(e) => { e.stopPropagation(); handleMarkHot(); }}
              title="Mark as Hot Lead"
              className="p-0.5 rounded hover:bg-orange-500/10 transition-colors text-muted-foreground hover:text-orange-500"
            >
              <Flame className="h-3 w-3" />
            </button>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); handleMarkBooked(); }}
            title="Mark as Booked"
            className="p-0.5 rounded hover:bg-green-500/10 transition-colors text-muted-foreground hover:text-green-500"
          >
            <CalendarCheck className="h-3 w-3" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); handleMarkNotInterested(); }}
            title="Mark as Not Interested"
            className="p-0.5 rounded hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-500"
          >
            <XCircle className="h-3 w-3" />
          </button>

          <NotePopover followUp={followUp} />

          <QuickNoteButton outboundLeadId={followUp.outbound_lead_id} contactName={lead?.fullName || lead?.username || "Unknown"} />
        </div>
      </div>
    </div>
  );
}

// ─── Quick Note Button (opens full dialog) ───

function QuickNoteButton({ outboundLeadId, contactName }: { outboundLeadId: string; contactName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        title="Full notes"
        className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground"
      >
        <FileText className="h-3 w-3" />
      </button>
      <QuickNoteDialog
        open={open}
        onOpenChange={setOpen}
        outboundLeadId={outboundLeadId}
        contactName={contactName}
      />
    </>
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
