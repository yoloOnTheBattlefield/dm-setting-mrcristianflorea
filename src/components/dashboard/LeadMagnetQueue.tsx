import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLeadMagnetQueue, useUpdateAgentContact } from "@/hooks/useAgent";
import { contactRef, LEAD_MAGNET_LABELS } from "@/lib/agent";
import { leadDisplayName } from "@/lib/formatters";
import type { ApiLead, LeadMagnetStatus } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const EDITABLE: LeadMagnetStatus[] = ["posted", "building", "built", "sent"];

function QueueRow({ lead }: { lead: ApiLead }) {
  const { toast } = useToast();
  const update = useUpdateAgentContact();
  const magnet = lead.lead_magnet ?? {};
  const [docUrl, setDocUrl] = useState(magnet.doc_url ?? "");
  const ref = contactRef(lead);
  const name = leadDisplayName(lead.first_name, lead.last_name, lead.ig_username);

  function save(patch: Partial<NonNullable<ApiLead["lead_magnet"]>>, label: string) {
    if (!ref) return;
    update.mutate(
      { ref, patch: { lead_magnet: { ...magnet, ...patch } } },
      {
        onSuccess: () => toast({ title: label }),
        onError: (e) => toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" }),
      },
    );
  }

  return (
    <li className="space-y-2 rounded-md border p-3" data-testid="magnet-row">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/lead/${lead._id}`} className="font-medium hover:underline">
            {lead.ig_username ? `@${lead.ig_username}` : name}
          </Link>
          {magnet.brief && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{magnet.brief}</p>
          )}
        </div>
        <Select
          value={(magnet.status as LeadMagnetStatus) || "posted"}
          onValueChange={(v) => save({ status: v as LeadMagnetStatus }, `Marked ${LEAD_MAGNET_LABELS[v as LeadMagnetStatus]}`)}
          disabled={!ref || update.isPending}
        >
          <SelectTrigger className="h-8 w-32 shrink-0" aria-label="Lead magnet status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EDITABLE.map((s) => (
              <SelectItem key={s} value={s}>
                {LEAD_MAGNET_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Input
          value={docUrl}
          onChange={(e) => setDocUrl(e.target.value)}
          placeholder="Doc link"
          aria-label="Doc link"
          className="h-8 text-sm"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          disabled={!ref || update.isPending || docUrl === (magnet.doc_url ?? "")}
          onClick={() => save({ doc_url: docUrl || null }, "Doc link saved")}
        >
          Save
        </Button>
      </div>
    </li>
  );
}

export function LeadMagnetQueue() {
  const { data, isLoading, isError } = useLeadMagnetQueue();
  const contacts = data?.contacts ?? [];

  return (
    <Card>
      <CardHeader className="space-y-0">
        <CardTitle className="text-base sm:text-lg">Lead magnets to build</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : isError ? (
          <p className="text-sm text-muted-foreground">Couldn't load lead magnets</p>
        ) : contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing to build</p>
        ) : (
          <ul className="space-y-3">
            {contacts.map((lead) => (
              <QueueRow key={lead._id} lead={lead} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
