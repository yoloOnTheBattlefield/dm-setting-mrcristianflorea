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
import { ApiLead } from "@/lib/types";

interface ContactsTableProps {
  contacts: ApiLead[];
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

export function ContactsTable({ contacts }: ContactsTableProps) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Booked</TableHead>
            <TableHead>Qualified</TableHead>
            <TableHead>Follow Up</TableHead>
            <TableHead>Ghosted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
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
                  <StatusBadge date={contact.booked_at} />
                </TableCell>
                <TableCell>
                  <StatusBadge date={contact.qualified_at} />
                </TableCell>
                <TableCell>
                  <StatusBadge date={contact.follow_up_at} />
                </TableCell>
                <TableCell>
                  <StatusBadge date={contact.ghosted_at} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
