import { useMemo, useState } from "react";
import { timeAgo } from "@/lib/formatters";
import { useNavigate } from "react-router-dom";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Shimmer } from "@/components/skeletons";
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
  Clock,
  Send,
  Link2,
  MessageCircle,
  CalendarCheck,
  XCircle,
  ExternalLink,
  MoreHorizontal,
  ChevronDown,
  Trash2,
  StickyNote,
  Copy,
} from "lucide-react";

interface OutboundLead {
  _id: string;
  username: string;
  fullName: string;
  profileLink?: string;
  isVerified?: boolean;
  followersCount?: number;
  bio?: string;
  email?: string | null;
  source: string;
  promptLabel?: string;
  isMessaged?: boolean | null;
  dmDate?: string | null;
  message?: string | null;
  link_sent?: boolean;
  replied?: boolean;
  booked?: boolean;
  qualified?: boolean | null;
  contract_value?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

interface OutboundKanbanProps {
  leads: OutboundLead[];
  isLoading?: boolean;
  onMove?: (leadId: string, toStage: string) => void;
  onDelete?: (leadId: string) => void;
  onOpenNote?: (lead: { id: string; name: string }) => void;
}

const KANBAN_COLUMNS = [
  { key: "new", label: "New", bg: "bg-slate-500", pillBg: "bg-slate-500/15", pillText: "text-slate-300", dot: "bg-slate-400", icon: Clock },
  { key: "messaged", label: "Messaged", bg: "bg-amber-500", pillBg: "bg-amber-500/15", pillText: "text-amber-300", dot: "bg-amber-400", icon: Send },
  { key: "link_sent", label: "Link Sent", bg: "bg-cyan-500", pillBg: "bg-cyan-500/15", pillText: "text-cyan-300", dot: "bg-cyan-400", icon: Link2 },
  { key: "replied", label: "Replied", bg: "bg-blue-500", pillBg: "bg-blue-500/15", pillText: "text-blue-300", dot: "bg-blue-400", icon: MessageCircle },
  { key: "converted", label: "Converted", bg: "bg-emerald-500", pillBg: "bg-emerald-500/15", pillText: "text-emerald-300", dot: "bg-emerald-400", icon: CalendarCheck },
  { key: "dq", label: "DQ", bg: "bg-red-500", pillBg: "bg-red-500/15", pillText: "text-red-300", dot: "bg-red-400", icon: XCircle },
] as const;

const CARD_LIMIT = 50;

function getLeadStageKey(lead: OutboundLead): string {
  if (lead.qualified === false) return "dq";
  if (lead.booked) return "converted";
  if (lead.replied) return "replied";
  if (lead.link_sent) return "link_sent";
  if (lead.isMessaged) return "messaged";
  return "new";
}

const AVATAR_COLORS = [
  "bg-blue-600", "bg-emerald-600", "bg-violet-600", "bg-amber-600",
  "bg-rose-600", "bg-cyan-600", "bg-indigo-600", "bg-pink-600",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts[0]?.length) return parts[0][0].toUpperCase();
  return "?";
}

function formatNumber(n?: number): string {
  if (n == null) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function getLastActivityDate(lead: OutboundLead): string | null {
  const dates = [lead.updatedAt, lead.dmDate, lead.createdAt].filter(Boolean) as string[];
  if (dates.length === 0) return null;
  return dates.reduce((a, b) => (new Date(a) > new Date(b) ? a : b));
}

// --- Draggable Card ---
function KanbanCard({
  lead,
  onMove,
  onDelete,
  onOpenNote,
}: {
  lead: OutboundLead;
  onMove?: (leadId: string, toStage: string) => void;
  onDelete?: (leadId: string) => void;
  onOpenNote?: (lead: { id: string; name: string }) => void;
}) {
  const navigate = useNavigate();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead._id,
  });

  const displayName = lead.fullName || lead.username;
  const initials = getInitials(displayName);
  const avatarColor = getAvatarColor(displayName);
  const activityDate = getLastActivityDate(lead);
  const followers = formatNumber(lead.followersCount);

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group/card rounded-lg border bg-card p-3 cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? "opacity-50 shadow-lg" : "hover:shadow-md hover:border-border/80"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0 ${avatarColor}`}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <span
            className="text-sm font-medium text-foreground hover:underline truncate block cursor-pointer"
            onClick={(e) => { e.stopPropagation(); navigate(`/outbound-leads/${lead._id}`); }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            @{lead.username}
          </span>
          {lead.fullName && (
            <p className="text-xs text-muted-foreground truncate">{lead.fullName}</p>
          )}
          {lead.source && (
            <p className="text-xs text-muted-foreground/70 truncate">{lead.source}</p>
          )}
        </div>
        {followers && (
          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 bg-muted rounded px-1 py-0.5">{followers}</span>
        )}
      </div>

      {/* Activity row */}
      <div className="mt-2 flex items-center justify-between">
        {activityDate ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{timeAgo(activityDate)}</span>
          </span>
        ) : (
          <span />
        )}

        {/* Hover quick actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            title="Open lead"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); navigate(`/outbound-leads/${lead._id}`); }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
          {onOpenNote && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              title="Add note"
              onClick={(e) => { e.stopPropagation(); onOpenNote({ id: lead._id, name: displayName }); }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <StickyNote className="h-3 w-3" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="More actions"
                className="h-6 w-6"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => window.open(lead.profileLink || `https://instagram.com/${lead.username}`, "_blank")}>
                <ExternalLink className="h-3.5 w-3.5 mr-2" /> Open IG Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(lead.username); }}>
                <Copy className="h-3.5 w-3.5 mr-2" /> Copy Username
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!lead.isMessaged && (
                <DropdownMenuItem onClick={() => onMove?.(lead._id, "messaged")}>
                  <Send className="h-3.5 w-3.5 mr-2 text-amber-400" /> Messaged
                </DropdownMenuItem>
              )}
              {!lead.link_sent && (
                <DropdownMenuItem onClick={() => onMove?.(lead._id, "link_sent")}>
                  <Link2 className="h-3.5 w-3.5 mr-2 text-cyan-400" /> Link Sent
                </DropdownMenuItem>
              )}
              {!lead.replied && (
                <DropdownMenuItem onClick={() => onMove?.(lead._id, "replied")}>
                  <MessageCircle className="h-3.5 w-3.5 mr-2 text-blue-400" /> Replied
                </DropdownMenuItem>
              )}
              {!lead.booked && (
                <DropdownMenuItem onClick={() => onMove?.(lead._id, "converted")}>
                  <CalendarCheck className="h-3.5 w-3.5 mr-2 text-emerald-400" /> Converted
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {lead.qualified === false ? (
                <DropdownMenuItem onClick={() => onMove?.(lead._id, "new")}>
                  <XCircle className="h-3.5 w-3.5 mr-2" /> Clear DQ
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onMove?.(lead._id, "dq")} className="text-red-400 focus:text-red-400">
                  <XCircle className="h-3.5 w-3.5 mr-2" /> Disqualify
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteConfirm(true)}
                className="text-red-400 focus:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Lead
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this lead. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => onDelete?.(lead._id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- Drag Overlay Card ---
function DragOverlayCard({ lead }: { lead: OutboundLead }) {
  const displayName = lead.fullName || lead.username;
  const initials = getInitials(displayName);
  const avatarColor = getAvatarColor(displayName);

  return (
    <div className="rounded-lg border bg-card p-3 shadow-xl w-64">
      <div className="flex items-center gap-2.5">
        <div
          className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0 ${avatarColor}`}
        >
          {initials}
        </div>
        <span className="text-sm font-medium truncate">@{lead.username}</span>
      </div>
    </div>
  );
}

// --- Droppable Column ---
function KanbanColumn({
  column,
  leads,
  totalCount,
  onMove,
  onDelete,
  onOpenNote,
}: {
  column: typeof KANBAN_COLUMNS[number];
  leads: OutboundLead[];
  totalCount: number;
  onMove?: (leadId: string, toStage: string) => void;
  onDelete?: (leadId: string) => void;
  onOpenNote?: (lead: { id: string; name: string }) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });
  const [expanded, setExpanded] = useState(false);

  const displayLimit = expanded ? leads.length : CARD_LIMIT;
  const visibleLeads = leads.slice(0, displayLimit);
  const hiddenCount = totalCount - visibleLeads.length;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border min-w-[260px] flex-1 transition-colors ${isOver ? "border-blue-500/50 bg-blue-500/5" : "bg-muted/20"}`}
    >
      {/* Column header */}
      <div className="px-3 py-2.5 border-b flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${column.pillBg} ${column.pillText}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${column.dot}`} />
          {column.label}
        </span>
        <span className="text-xs font-medium text-muted-foreground ml-auto tabular-nums">{totalCount}</span>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)] scrollbar-thin">
        {visibleLeads.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No leads</p>
        ) : (
          <>
            {visibleLeads.map((lead) => (
              <KanbanCard key={lead._id} lead={lead} onMove={onMove} onDelete={onDelete} onOpenNote={onOpenNote} />
            ))}
            {hiddenCount > 0 && !expanded && (
              <button
                className="w-full text-center py-2 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg border border-dashed hover:border-border"
                onClick={() => setExpanded(true)}
              >
                <ChevronDown className="h-3 w-3 inline mr-1" />
                Show {hiddenCount} more
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function OutboundKanban({ leads, isLoading, onMove, onDelete, onOpenNote }: OutboundKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const grouped = useMemo(() => {
    const groups: Record<string, OutboundLead[]> = {};
    for (const col of KANBAN_COLUMNS) {
      groups[col.key] = [];
    }
    for (const lead of leads) {
      const stage = getLeadStageKey(lead);
      if (groups[stage]) groups[stage].push(lead);
    }
    // Sort each column: most recent activity first
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => {
        const aDate = getLastActivityDate(a);
        const bDate = getLastActivityDate(b);
        return new Date(bDate || 0).getTime() - new Date(aDate || 0).getTime();
      });
    }
    return groups;
  }, [leads]);

  const activeLead = useMemo(
    () => leads.find((l) => l._id === activeId) ?? null,
    [leads, activeId]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const toStage = String(over.id);
    const leadId = String(active.id);

    const lead = leads.find((l) => l._id === leadId);
    if (!lead) return;
    const currentStage = getLeadStageKey(lead);
    if (currentStage === toStage) return;

    onMove?.(leadId, toStage);
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col, ci) => (
          <div key={col.key} className="flex flex-col rounded-xl border min-w-[260px] flex-1 bg-muted/20">
            <div className="px-3 py-2.5 border-b">
              <Shimmer className="h-6 w-24 rounded-full" delay={`${ci * 80}ms`} />
            </div>
            <div className="p-2 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Shimmer key={i} className="h-20 w-full rounded-lg" delay={`${ci * 80 + (i + 1) * 60}ms`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.key}
            column={col}
            leads={grouped[col.key] || []}
            totalCount={(grouped[col.key] || []).length}
            onMove={onMove}
            onDelete={onDelete}
            onOpenNote={onOpenNote}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? <DragOverlayCard lead={activeLead} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
