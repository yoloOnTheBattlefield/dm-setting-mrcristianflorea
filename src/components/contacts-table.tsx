"use client";

import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { ApiLead } from "@/lib/types";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronRight } from "lucide-react";
import type { LeadSortField, SortOrder } from "@/hooks/useRawLeads";

interface ContactsTableProps {
  contacts: ApiLead[];
  isLoading?: boolean;
  sortBy?: LeadSortField;
  sortOrder?: SortOrder;
  onSort?: (field: LeadSortField) => void;
  // Selection
  isSelected?: (id: string) => boolean;
  onToggle?: (id: string) => void;
  onToggleAll?: (ids: string[]) => void;
  allSelected?: boolean;
}

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
  if (lead.ghosted_at) return PIPELINE_STAGES[5]; // Ghosted
  if (lead.closed_at) return PIPELINE_STAGES[4];   // Closed
  if (lead.booked_at) return PIPELINE_STAGES[3];   // Booked
  if (lead.follow_up_at) return PIPELINE_STAGES[2]; // Follow Up
  if (lead.link_sent_at) return PIPELINE_STAGES[1]; // Link Sent
  return PIPELINE_STAGES[0]; // New
}

function getInitials(first: string, last: string): string {
  return (
    `${(first || "")[0] || ""}${(last || "")[0] || ""}`.toUpperCase() || "?"
  );
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

function timeAgo(dateString: string | null): string {
  if (!dateString) return "";
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

function getLastActivity(lead: ApiLead): string {
  const dates = [
    lead.closed_at,
    lead.booked_at,
    lead.ghosted_at,
    lead.follow_up_at,
    lead.link_sent_at,
    lead.date_created,
  ].filter(Boolean) as string[];

  if (dates.length === 0) return "";
  const latest = dates.reduce((a, b) => (new Date(a) > new Date(b) ? a : b));
  return timeAgo(latest);
}

function renderScore(score: number | null | undefined) {
  if (!score) return "";
  return (
    <span className="text-sm tabular-nums text-muted-foreground">{score}/10</span>
  );
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

export function ContactsTable({
  contacts,
  isLoading,
  sortBy,
  sortOrder,
  onSort,
  isSelected,
  onToggle,
  onToggleAll,
  allSelected,
}: ContactsTableProps) {
  const sortable = !!onSort;
  const selectable = !!onToggle;

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-10 pl-4">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() =>
                    onToggleAll?.(contacts.map((c) => c._id))
                  }
                />
              </TableHead>
            )}
            <TableHead className="w-[280px]">Name</TableHead>
            <TableHead className="w-[130px]">Status</TableHead>
            <TableHead className="w-[60px] text-center">Score</TableHead>
            <TableHead>
              {sortable ? (
                <button
                  className="flex items-center hover:text-foreground transition-colors"
                  onClick={() => onSort?.("date_created")}
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
                >
                  Link Sent
                  <SortIcon field="link_sent_at" sortBy={sortBy} sortOrder={sortOrder} />
                </button>
              ) : (
                "Link Sent"
              )}
            </TableHead>
            <TableHead>
              {sortable ? (
                <button
                  className="flex items-center hover:text-foreground transition-colors"
                  onClick={() => onSort?.("booked_at")}
                >
                  Converted
                  <SortIcon field="booked_at" sortBy={sortBy} sortOrder={sortOrder} />
                </button>
              ) : (
                "Converted"
              )}
            </TableHead>
            <TableHead>Last Activity</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                {selectable && (
                  <TableCell className="pl-4"><Skeleton className="h-4 w-4" /></TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                <TableCell />
              </TableRow>
            ))
          ) : contacts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={selectable ? 9 : 8} className="h-24 text-center">
                No contacts found.
              </TableCell>
            </TableRow>
          ) : (
            contacts.map((contact) => {
              const stage = getLeadStage(contact);
              const fullName = `${contact.first_name} ${contact.last_name}`.trim();
              const initials = getInitials(contact.first_name, contact.last_name);
              const avatarColor = getAvatarColor(fullName);

              return (
                <TableRow
                  key={contact._id}
                  className="group hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  {selectable && (
                    <TableCell
                      className="pl-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected?.(contact._id)}
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
                      <span className="truncate">{fullName || "Unknown"}</span>
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
                  <TableCell className="text-center">
                    {renderScore(contact.score)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(contact.date_created)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(contact.link_sent_at)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(contact.booked_at)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getLastActivity(contact)}
                  </TableCell>
                  <TableCell>
                    <Link to={`/lead/${contact._id}`} tabIndex={-1}>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
                    </Link>
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
