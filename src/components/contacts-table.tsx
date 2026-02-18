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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiLead } from "@/lib/types";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { LeadSortField, SortOrder } from "@/hooks/useRawLeads";

interface ContactsTableProps {
  contacts: ApiLead[];
  isLoading?: boolean;
  sortBy?: LeadSortField;
  sortOrder?: SortOrder;
  onSort?: (field: LeadSortField) => void;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ date }: { date: string | null }) {
  if (date) {
    return (
      <Badge variant="secondary" className="font-normal">
        {formatDate(date)}
      </Badge>
    );
  }
  return <span className="text-muted-foreground text-sm">—</span>;
}

function SortIcon({ field, sortBy, sortOrder }: { field: LeadSortField; sortBy?: LeadSortField; sortOrder?: SortOrder }) {
  if (sortBy !== field) {
    return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-muted-foreground/50" />;
  }
  return sortOrder === "asc"
    ? <ArrowUp className="h-3.5 w-3.5 ml-1" />
    : <ArrowDown className="h-3.5 w-3.5 ml-1" />;
}

export function ContactsTable({ contacts, isLoading, sortBy, sortOrder, onSort }: ContactsTableProps) {
  const sortable = !!onSort;

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
              </TableRow>
            ))
          ) : contacts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No contacts found.
              </TableCell>
            </TableRow>
          ) : (
            contacts.map((contact) => (
              <TableRow key={contact._id}>
                <TableCell className="font-medium">
                  <Link
                    to={`/lead/${contact._id}`}
                    className="text-primary hover:underline"
                  >
                    {contact.first_name} {contact.last_name}
                  </Link>
                </TableCell>
                <TableCell>{formatDate(contact.date_created)}</TableCell>
                <TableCell>
                  <StatusBadge date={contact.link_sent_at} />
                </TableCell>
                <TableCell>
                  <StatusBadge date={contact.booked_at} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
