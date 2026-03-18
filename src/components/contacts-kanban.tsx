import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ApiLead } from "@/lib/types";
import {
  Ghost,
  CalendarCheck,
  Link2,
  MessageCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface ContactsKanbanProps {
  contacts: ApiLead[];
  isLoading?: boolean;
  onMove?: (leadId: string, toStage: string) => void;
}

const KANBAN_COLUMNS = [
  { key: "new", label: "New", bg: "bg-slate-500", dotBg: "bg-slate-400", headerText: "text-slate-300", icon: Clock },
  { key: "link_sent", label: "Link Sent", bg: "bg-blue-500", dotBg: "bg-blue-400", headerText: "text-blue-300", icon: Link2 },
  { key: "follow_up", label: "Follow Up", bg: "bg-amber-500", dotBg: "bg-amber-400", headerText: "text-amber-300", icon: MessageCircle },
  { key: "booked", label: "Booked", bg: "bg-emerald-500", dotBg: "bg-emerald-400", headerText: "text-emerald-300", icon: CalendarCheck },
  { key: "closed", label: "Closed", bg: "bg-emerald-700", dotBg: "bg-emerald-600", headerText: "text-emerald-200", icon: CheckCircle2 },
  { key: "ghosted", label: "Ghosted", bg: "bg-red-500", dotBg: "bg-red-400", headerText: "text-red-300", icon: Ghost },
] as const;

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

function timeAgo(dateString: string | null): string {
  if (!dateString) return "";
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
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
function KanbanCard({ lead }: { lead: ApiLead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead._id,
  });

  const fullName = safeName(lead.first_name, lead.last_name);
  const initials = getInitials(lead.first_name, lead.last_name);
  const avatarColor = getAvatarColor(fullName);

  const latestDate = [lead.closed_at, lead.booked_at, lead.ghosted_at, lead.follow_up_at, lead.link_sent_at, lead.date_created]
    .filter(Boolean)
    .reduce((a, b) => (new Date(a!) > new Date(b!) ? a : b), null);

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`rounded-lg border bg-card p-3 cursor-grab active:cursor-grabbing transition-shadow ${isDragging ? "opacity-50 shadow-lg" : "hover:shadow-md"}`}
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
          {latestDate && (
            <p className="text-xs text-muted-foreground mt-1">{timeAgo(latestDate)}</p>
          )}
        </div>
        {lead.score && (
          <span className="text-xs text-muted-foreground tabular-nums shrink-0">{lead.score}/10</span>
        )}
      </div>
    </div>
  );
}

// --- Drag Overlay Card (shown while dragging) ---
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
  count,
}: {
  column: typeof KANBAN_COLUMNS[number];
  leads: ApiLead[];
  count: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });
  const Icon = column.icon;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border min-w-[240px] flex-1 transition-colors ${isOver ? "border-blue-500/50 bg-blue-500/5" : "bg-muted/30"}`}
    >
      {/* Column header */}
      <div className="px-3 py-2.5 border-b flex items-center gap-2">
        <div className={`h-5 w-5 rounded flex items-center justify-center ${column.bg}`}>
          <Icon className="h-3 w-3 text-white" />
        </div>
        <span className="text-sm font-semibold">{column.label}</span>
        <span className="text-xs text-muted-foreground ml-auto tabular-nums">{count}</span>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)]">
        {leads.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No leads</p>
        ) : (
          leads.map((lead) => <KanbanCard key={lead._id} lead={lead} />)
        )}
      </div>
    </div>
  );
}

export function ContactsKanban({ contacts, isLoading, onMove }: ContactsKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Group contacts by stage
  const grouped = useMemo(() => {
    const groups: Record<string, ApiLead[]> = {};
    for (const col of KANBAN_COLUMNS) {
      groups[col.key] = [];
    }
    for (const contact of contacts) {
      const stage = getLeadStageKey(contact);
      if (groups[stage]) groups[stage].push(contact);
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

    // Find the lead's current stage
    const lead = contacts.find((c) => c._id === leadId);
    if (!lead) return;
    const currentStage = getLeadStageKey(lead);
    if (currentStage === toStage) return;

    onMove?.(leadId, toStage);
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => (
          <div key={col.key} className="flex flex-col rounded-xl border min-w-[240px] flex-1 bg-muted/30">
            <div className="px-3 py-2.5 border-b">
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="p-2 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
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
            count={(grouped[col.key] || []).length}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? <DragOverlayCard lead={activeLead} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
