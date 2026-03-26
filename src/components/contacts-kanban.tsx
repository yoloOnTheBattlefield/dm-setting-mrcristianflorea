import { useMemo, useState } from "react";
import { timeAgoCompact } from "@/lib/formatters";
import { Link, useNavigate } from "react-router-dom";
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
import { ApiLead } from "@/lib/types";
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
  Ghost,
  CalendarCheck,
  Link2,
  MessageCircle,
  CheckCircle2,
  Clock,
  Send,
  ExternalLink,
  MoreHorizontal,
  ChevronDown,
  Trash2,
} from "lucide-react";

interface ContactsKanbanProps {
  contacts: ApiLead[];
  isLoading?: boolean;
  onMove?: (leadId: string, toStage: string) => void;
  onDelete?: (leadId: string) => void;
}

const KANBAN_COLUMNS = [
  { key: "new", label: "New", bg: "bg-slate-500", pillBg: "bg-slate-500/15", pillText: "text-slate-300", dot: "bg-slate-400", icon: Clock },
  { key: "link_sent", label: "Link Sent", bg: "bg-blue-500", pillBg: "bg-blue-500/15", pillText: "text-blue-300", dot: "bg-blue-400", icon: Link2 },
  { key: "follow_up", label: "Follow Up", bg: "bg-amber-500", pillBg: "bg-amber-500/15", pillText: "text-amber-300", dot: "bg-amber-400", icon: MessageCircle },
  { key: "booked", label: "Booked", bg: "bg-emerald-500", pillBg: "bg-emerald-500/15", pillText: "text-emerald-300", dot: "bg-emerald-400", icon: CalendarCheck },
  { key: "closed", label: "Closed", bg: "bg-emerald-700", pillBg: "bg-emerald-700/15", pillText: "text-emerald-200", dot: "bg-emerald-600", icon: CheckCircle2 },
  { key: "ghosted", label: "Ghosted", bg: "bg-red-500", pillBg: "bg-red-500/15", pillText: "text-red-300", dot: "bg-red-400", icon: Ghost },
] as const;

const CARD_LIMIT = 50;
const STALE_DAYS = 7;

function getLeadStageKey(lead: ApiLead): string {
  if (lead.ghosted_at) return "ghosted";
  if (lead.closed_at) return "closed";
  if (lead.booked_at) return "booked";
  if (lead.follow_up_at) return "follow_up";
  if (lead.link_sent_at) return "link_sent";
  return "new";
}

function safeName(first: string | null | undefined, last: string | null | undefined): string {
  const f = (first && first !== "null") ? first.trim() : "";
  const l = (last && last !== "null") ? last.trim() : "";
  return `${f} ${l}`.trim() || "Unknown";
}

function getInitials(first: string | null | undefined, last: string | null | undefined): string {
  const f = (first && first !== "null") ? first[0] : "";
  const l = (last && last !== "null") ? last[0] : "";
  return `${f}${l}`.toUpperCase() || "?";
}

function daysSince(dateString: string | null): number {
  if (!dateString) return 999;
  return Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
}

// Activity type detection
interface ActivityInfo {
  icon: React.ReactNode;
  label: string;
  time: string;
  color: string;
}

function getLastActivity(lead: ApiLead): ActivityInfo | null {
  const entries: { date: string; label: string; icon: React.ReactNode; color: string }[] = [];

  if (lead.closed_at) entries.push({ date: lead.closed_at, label: "Closed", icon: <CheckCircle2 className="h-3 w-3" />, color: "text-emerald-400" });
  if (lead.booked_at) entries.push({ date: lead.booked_at, label: "Booked", icon: <CalendarCheck className="h-3 w-3" />, color: "text-emerald-400" });
  if (lead.ghosted_at) entries.push({ date: lead.ghosted_at, label: "Ghosted", icon: <Ghost className="h-3 w-3" />, color: "text-red-400" });
  if (lead.follow_up_at) entries.push({ date: lead.follow_up_at, label: "Follow up", icon: <MessageCircle className="h-3 w-3" />, color: "text-amber-400" });
  if (lead.link_sent_at) entries.push({ date: lead.link_sent_at, label: "Link sent", icon: <Link2 className="h-3 w-3" />, color: "text-blue-400" });
  if (lead.date_created) entries.push({ date: lead.date_created, label: "Created", icon: <Send className="h-3 w-3" />, color: "text-slate-400" });

  if (entries.length === 0) return null;
  const latest = entries.reduce((a, b) => (new Date(a.date) > new Date(b.date) ? a : b));
  return { icon: latest.icon, label: latest.label, time: timeAgoCompact(latest.date), color: latest.color };
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

// --- Draggable Card ---
function KanbanCard({ lead, onMove, onDelete }: { lead: ApiLead; onMove?: (leadId: string, toStage: string) => void; onDelete?: (leadId: string) => void }) {
  const navigate = useNavigate();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead._id,
  });

  const fullName = safeName(lead.first_name, lead.last_name);
  const initials = getInitials(lead.first_name, lead.last_name);
  const avatarColor = getAvatarColor(fullName);
  const activity = getLastActivity(lead);
  const stale = daysSince(lead.date_created) > STALE_DAYS && !lead.link_sent_at && !lead.booked_at && !lead.closed_at;

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
      } ${stale ? "opacity-50" : ""}`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0 ${avatarColor}`}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <Link
            to={`/lead/${lead._id}`}
            className="text-sm font-medium text-foreground hover:underline truncate block"
            onClick={(e) => e.stopPropagation()}
          >
            {fullName}
          </Link>
          {lead.email && (
            <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
          )}
          {lead.source && (
            <p className="text-xs text-muted-foreground/70 truncate">{lead.source}</p>
          )}
        </div>
        {lead.score && (
          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 bg-muted rounded px-1 py-0.5">{lead.score}/10</span>
        )}
      </div>

      {/* Activity row */}
      <div className="mt-2 flex items-center justify-between">
        {activity ? (
          <span className={`inline-flex items-center gap-1 text-[11px] ${activity.color}`}>
            {activity.icon}
            <span>{activity.label}</span>
            <span className="text-muted-foreground">· {activity.time}</span>
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
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); navigate(`/lead/${lead._id}`); }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
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
            <DropdownMenuContent align="end" className="w-40">
              {!lead.link_sent_at && (
                <DropdownMenuItem onClick={() => onMove?.(lead._id, "link_sent")}>
                  <Link2 className="h-3.5 w-3.5 mr-2 text-blue-400" /> Link Sent
                </DropdownMenuItem>
              )}
              {!lead.booked_at && (
                <DropdownMenuItem onClick={() => onMove?.(lead._id, "booked")}>
                  <CalendarCheck className="h-3.5 w-3.5 mr-2 text-emerald-400" /> Booked
                </DropdownMenuItem>
              )}
              {!lead.closed_at && lead.booked_at && (
                <DropdownMenuItem onClick={() => onMove?.(lead._id, "closed")}>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-300" /> Closed
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {lead.ghosted_at ? (
                <DropdownMenuItem onClick={() => onMove?.(lead._id, "new")}>
                  <Ghost className="h-3.5 w-3.5 mr-2" /> Clear Ghosted
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onMove?.(lead._id, "ghosted")} className="text-red-400 focus:text-red-400">
                  <Ghost className="h-3.5 w-3.5 mr-2" /> Ghosted
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

      {/* Stale indicator */}
      {stale && (
        <p className="text-[10px] text-amber-400/70 mt-1.5">Stale — no activity in {daysSince(lead.date_created)}d</p>
      )}

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
function DragOverlayCard({ lead }: { lead: ApiLead }) {
  const fullName = safeName(lead.first_name, lead.last_name);
  const initials = getInitials(lead.first_name, lead.last_name);
  const avatarColor = getAvatarColor(fullName);

  return (
    <div className="rounded-lg border bg-card p-3 shadow-xl w-64">
      <div className="flex items-center gap-2.5">
        <div
          className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0 ${avatarColor}`}
        >
          {initials}
        </div>
        <span className="text-sm font-medium truncate">{fullName}</span>
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
}: {
  column: typeof KANBAN_COLUMNS[number];
  leads: ApiLead[];
  totalCount: number;
  onMove?: (leadId: string, toStage: string) => void;
  onDelete?: (leadId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });
  const [expanded, setExpanded] = useState(false);
  const Icon = column.icon;

  const displayLimit = expanded ? leads.length : CARD_LIMIT;
  const visibleLeads = leads.slice(0, displayLimit);
  const hiddenCount = totalCount - visibleLeads.length;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border min-w-[260px] flex-1 transition-colors ${isOver ? "border-blue-500/50 bg-blue-500/5" : "bg-muted/20"}`}
    >
      {/* Column header — colored pill style */}
      <div className="px-3 py-2.5 border-b flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${column.pillBg} ${column.pillText}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${column.dot}`} />
          {column.label}
        </span>
        <span className="text-xs font-medium text-muted-foreground ml-auto tabular-nums">{totalCount}</span>
      </div>

      {/* Cards — custom scrollbar */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)] scrollbar-thin">
        {visibleLeads.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No leads</p>
        ) : (
          <>
            {visibleLeads.map((lead) => (
              <KanbanCard key={lead._id} lead={lead} onMove={onMove} onDelete={onDelete} />
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

export function ContactsKanban({ contacts, isLoading, onMove, onDelete }: ContactsKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Group contacts by stage, sort each group by most recent activity
  const grouped = useMemo(() => {
    const groups: Record<string, ApiLead[]> = {};
    for (const col of KANBAN_COLUMNS) {
      groups[col.key] = [];
    }
    for (const contact of contacts) {
      const stage = getLeadStageKey(contact);
      if (groups[stage]) groups[stage].push(contact);
    }
    // Sort each column: most recent activity first
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => {
        const aDate = [a.closed_at, a.booked_at, a.ghosted_at, a.follow_up_at, a.link_sent_at, a.date_created].filter(Boolean).reduce((x, y) => (new Date(x!) > new Date(y!) ? x : y), null);
        const bDate = [b.closed_at, b.booked_at, b.ghosted_at, b.follow_up_at, b.link_sent_at, b.date_created].filter(Boolean).reduce((x, y) => (new Date(x!) > new Date(y!) ? x : y), null);
        return new Date(bDate || 0).getTime() - new Date(aDate || 0).getTime();
      });
    }
    return groups;
  }, [contacts]);

  const activeLead = useMemo(
    () => contacts.find((c) => c._id === activeId) ?? null,
    [contacts, activeId]
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

    const lead = contacts.find((c) => c._id === leadId);
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
                <Shimmer key={i} className="h-24 w-full rounded-lg" delay={`${ci * 80 + (i + 1) * 60}ms`} />
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
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? <DragOverlayCard lead={activeLead} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
