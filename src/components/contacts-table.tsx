"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Shimmer } from "@/components/skeletons";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ApiLead } from "@/lib/types";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  MessageCircle,
  Send,
  Link2,
  CalendarCheck,
  Ghost,
  CheckCircle2,
  MoreHorizontal,
  ExternalLink,
  Trash2,
} from "lucide-react";
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
import type { LeadSortField, SortOrder } from "@/hooks/useRawLeads";

interface ContactsTableProps {
  contacts: ApiLead[];
  isLoading?: boolean;
  sortBy?: LeadSortField;
  sortOrder?: SortOrder;
  onSort?: (field: LeadSortField) => void;
  onQuickAction?: (leadId: string, action: QuickAction) => void;
  // Selection
  isSelected?: (id: string) => boolean;
  onToggle?: (id: string) => void;
  onToggleAll?: (ids: string[]) => void;
  allSelected?: boolean;
}

export type QuickAction =
  | { type: "set_stage"; stage: "link_sent" | "booked" | "closed" | "ghosted" }
  | { type: "clear_ghosted" }
  | { type: "delete" };

// Pipeline stages matching LeadDetail.tsx
const PIPELINE_STAGES = [
  { key: "new", label: "New", bg: "bg-slate-500/15", text: "text-slate-400", dot: "bg-slate-400" },
  { key: "link_sent", label: "Link Sent", bg: "bg-blue-500/15", text: "text-blue-400", dot: "bg-blue-400" },
  { key: "follow_up", label: "Follow Up", bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
  { key: "booked", label: "Booked", bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
  { key: "closed", label: "Closed", bg: "bg-emerald-700/15", text: "text-emerald-300", dot: "bg-emerald-600" },
  { key: "ghosted", label: "Ghosted", bg: "bg-red-500/15", text: "text-red-400", dot: "bg-red-400" },
] as const;

function getLeadStage(lead: ApiLead) {
  if (lead.ghosted_at) return PIPELINE_STAGES[5];
  if (lead.closed_at) return PIPELINE_STAGES[4];
  if (lead.booked_at) return PIPELINE_STAGES[3];
  if (lead.follow_up_at) return PIPELINE_STAGES[2];
  if (lead.link_sent_at) return PIPELINE_STAGES[1];
  return PIPELINE_STAGES[0];
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

function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// Activity type icons + labels based on which field was most recently updated
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
  return {
    icon: latest.icon,
    label: latest.label,
    time: timeAgo(latest.date),
    color: latest.color,
  };
}

// Initials avatar color based on name hash
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

function SortIcon({ field, sortBy, sortOrder }: { field: LeadSortField; sortBy?: LeadSortField; sortOrder?: SortOrder }) {
  if (sortBy !== field) {
    return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-muted-foreground/50" />;
  }
  return sortOrder === "asc"
    ? <ArrowUp className="h-3.5 w-3.5 ml-1" />
    : <ArrowDown className="h-3.5 w-3.5 ml-1" />;
}

// Row-level quick action menu
function RowActions({
  lead,
  onAction,
}: {
  lead: ApiLead;
  onAction?: (leadId: string, action: QuickAction) => void;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const isGhosted = !!lead.ghosted_at;

  return (
    <div className="flex items-center gap-1">
      {/* Quick action buttons visible on hover */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Open lead"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/lead/${lead._id}`);
        }}
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </Button>

      {/* More actions dropdown */}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity"
            aria-label="More actions"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => navigate(`/lead/${lead._id}`)}>
            <ExternalLink className="h-3.5 w-3.5 mr-2" />
            Open Lead
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {!lead.link_sent_at && (
            <DropdownMenuItem onClick={() => onAction?.(lead._id, { type: "set_stage", stage: "link_sent" })}>
              <Link2 className="h-3.5 w-3.5 mr-2 text-blue-400" />
              Mark Link Sent
            </DropdownMenuItem>
          )}
          {!lead.booked_at && (
            <DropdownMenuItem onClick={() => onAction?.(lead._id, { type: "set_stage", stage: "booked" })}>
              <CalendarCheck className="h-3.5 w-3.5 mr-2 text-emerald-400" />
              Mark Booked
            </DropdownMenuItem>
          )}
          {!lead.closed_at && lead.booked_at && (
            <DropdownMenuItem onClick={() => onAction?.(lead._id, { type: "set_stage", stage: "closed" })}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-300" />
              Mark Closed
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {isGhosted ? (
            <DropdownMenuItem onClick={() => onAction?.(lead._id, { type: "clear_ghosted" })}>
              <Ghost className="h-3.5 w-3.5 mr-2" />
              Clear Ghosted
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => onAction?.(lead._id, { type: "set_stage", stage: "ghosted" })}
              className="text-red-400 focus:text-red-400"
            >
              <Ghost className="h-3.5 w-3.5 mr-2" />
              Mark Ghosted
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => { setOpen(false); setDeleteConfirm(true); }}
            className="text-red-400 focus:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Delete Lead
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
              onClick={() => onAction?.(lead._id, { type: "delete" })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function ContactsTable({
  contacts,
  isLoading,
  sortBy,
  sortOrder,
  onSort,
  onQuickAction,
  isSelected,
  onToggle,
  onToggleAll,
  allSelected,
}: ContactsTableProps) {
  const sortable = !!onSort;
  const selectable = !!onToggle;
  const colCount = (selectable ? 1 : 0) + 6;

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-10 pl-4">
                <Checkbox
                  checked={allSelected}
                  aria-label="Select all contacts"
                  onCheckedChange={() =>
                    onToggleAll?.(contacts.map((c) => c._id))
                  }
                />
              </TableHead>
            )}
            <TableHead>Name</TableHead>
            <TableHead className="w-[130px]">Status</TableHead>
            <TableHead>
              {sortable ? (
                <button
                  className="flex items-center hover:text-foreground transition-colors"
                  onClick={() => onSort?.("date_created")}
                  aria-label={`Sort by created date${sortBy === "date_created" ? (sortOrder === "asc" ? ", ascending" : ", descending") : ""}`}
                >
                  Created
                  <SortIcon field="date_created" sortBy={sortBy} sortOrder={sortOrder} />
                </button>
              ) : (
                "Created"
              )}
            </TableHead>
            <TableHead>
              {sortable ? (
                <button
                  className="flex items-center hover:text-foreground transition-colors"
                  onClick={() => onSort?.("link_sent_at")}
                  aria-label={`Sort by link sent date${sortBy === "link_sent_at" ? (sortOrder === "asc" ? ", ascending" : ", descending") : ""}`}
                >
                  Link Sent
                  <SortIcon field="link_sent_at" sortBy={sortBy} sortOrder={sortOrder} />
                </button>
              ) : (
                "Link Sent"
              )}
            </TableHead>
            <TableHead>Last Activity</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                {selectable && (
                  <TableCell className="pl-4"><Shimmer className="h-4 w-4" delay={`${i * 40}ms`} /></TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Shimmer className="h-8 w-8 rounded-full" delay={`${i * 40}ms`} />
                    <Shimmer className="h-4 w-32" delay={`${i * 40 + 10}ms`} />
                  </div>
                </TableCell>
                <TableCell><Shimmer className="h-5 w-20 rounded-full" delay={`${i * 40 + 15}ms`} /></TableCell>
                <TableCell><Shimmer className="h-4 w-20" delay={`${i * 40 + 20}ms`} /></TableCell>
                <TableCell><Shimmer className="h-4 w-20" delay={`${i * 40 + 25}ms`} /></TableCell>
                <TableCell><Shimmer className="h-4 w-24" delay={`${i * 40 + 30}ms`} /></TableCell>
                <TableCell />
              </TableRow>
            ))
          ) : contacts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colCount + 1} className="h-24 text-center">
                No contacts found.
              </TableCell>
            </TableRow>
          ) : (
            contacts.map((contact) => {
              const stage = getLeadStage(contact);
              const fullName = safeName(contact.first_name, contact.last_name);
              const initials = getInitials(contact.first_name, contact.last_name);
              const avatarColor = getAvatarColor(fullName);
              const activity = getLastActivity(contact);

              return (
                <TableRow
                  key={contact._id}
                  className="group cursor-pointer"
                >
                  {selectable && (
                    <TableCell
                      className="pl-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected?.(contact._id)}
                        aria-label={`Select ${safeName(contact.first_name, contact.last_name)}`}
                        onCheckedChange={() => onToggle?.(contact._id)}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    <Link
                      to={`/lead/${contact._id}`}
                      className="flex items-center gap-3 text-foreground hover:underline"
                    >
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 ${avatarColor}`}
                      >
                        {initials}
                      </div>
                      <span className="truncate">{fullName}</span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${stage.bg} ${stage.text}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${stage.dot}`} />
                      {stage.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(contact.date_created)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(contact.link_sent_at)}
                  </TableCell>
                  <TableCell>
                    {activity && (
                      <span className={`inline-flex items-center gap-1.5 text-xs ${activity.color}`}>
                        {activity.icon}
                        <span>{activity.label}</span>
                        <span className="text-muted-foreground">· {activity.time}</span>
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="pr-2">
                    <div className="flex items-center justify-end">
                      <RowActions lead={contact} onAction={onQuickAction} />
                      <Link to={`/lead/${contact._id}`} tabIndex={-1}>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
