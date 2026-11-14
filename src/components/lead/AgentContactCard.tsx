import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateAgentContact } from "@/hooks/useAgent";
import {
  AGENT_STAGES,
  STAGE_LABELS,
  LEAD_MAGNET_STATUSES,
  LEAD_MAGNET_LABELS,
  PITCH_OFFER_LABELS,
  LEAD_SOURCE_TYPES,
  sourceLabel,
  contactRef,
} from "@/lib/agent";
import type { AgentStage, ApiLead, LeadMagnetStatus, LeadSourceType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value === null || value === undefined || value === "" ? "—" : value}</span>
    </div>
  );
}

export function AgentContactCard({ lead }: { lead: ApiLead }) {
  const { toast } = useToast();
  const update = useUpdateAgentContact();
  const ref = contactRef(lead);
  const magnet = lead.lead_magnet ?? {};
  const pitch = lead.pitch ?? {};
  const [docUrl, setDocUrl] = useState(magnet.doc_url ?? "");

  const [sourceText, setSourceText] = useState(lead.source_label ?? "");
  const [sourceUrl, setSourceUrl] = useState(lead.source_url ?? "");

  useEffect(() => setDocUrl(lead.lead_magnet?.doc_url ?? ""), [lead.lead_magnet?.doc_url]);
  useEffect(() => setSourceText(lead.source_label ?? ""), [lead.source_label]);
  useEffect(() => setSourceUrl(lead.source_url ?? ""), [lead.source_url]);

  const sourceDirty =
    sourceText !== (lead.source_label ?? "") || sourceUrl !== (lead.source_url ?? "");

  function save(patch: Partial<ApiLead>, label: string) {
    if (!ref) return;
    update.mutate(
      { ref, patch },
      {
        onSuccess: () => toast({ title: label }),
        onError: (e) => toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" }),
      },
    );
  }

  const disabled = !ref || update.isPending;

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pipeline</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Stage</Label>
          <Select
            value={lead.stage ?? "new"}
            onValueChange={(v) => save({ stage: v as AgentStage }, `Stage: ${STAGE_LABELS[v as AgentStage]}`)}
            disabled={disabled}
          >
            <SelectTrigger className="h-8" aria-label="Stage">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AGENT_STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STAGE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="agent-skip" className="text-sm">Skip</Label>
          <Switch
            id="agent-skip"
            checked={!!lead.skip}
            onCheckedChange={(v) => save({ skip: v }, v ? "Skipped" : "Unskipped")}
            disabled={disabled}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Source</Label>
            <Select
              value={lead.source_type ?? ""}
              onValueChange={(v) =>
                save({ source_type: v as LeadSourceType }, `Source: ${sourceLabel(v)}`)
              }
              disabled={disabled}
            >
              <SelectTrigger className="h-8" aria-label="Source">
                <SelectValue placeholder="Unknown" />
              </SelectTrigger>
              <SelectContent>
                {LEAD_SOURCE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {sourceLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Label"
            aria-label="Source label"
            className="h-8 text-sm"
          />
          <div className="flex gap-2">
            <Input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="Source URL"
              aria-label="Source URL"
              className="h-8 text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              disabled={disabled || !sourceDirty}
              onClick={() =>
                save(
                  { source_label: sourceText || null, source_url: sourceUrl || null },
                  "Source saved",
                )
              }
            >
              Save
            </Button>
          </div>
          {lead.source_media_id && <Field label="Media" value={lead.source_media_id} />}
        </div>

        <Separator />

        <div className="space-y-1.5">
          <Field label="Language" value={lead.language?.toUpperCase()} />
          <Field label="Industry" value={lead.industry} />
          <Field label="Offer" value={lead.offer} />
          <Field label="Buyer" value={lead.buyer} />
          <Field label="Ticket" value={lead.ticket_size} />
          <Field label="Monthly revenue" value={lead.monthly_revenue} />
          <Field label="Pain / goal" value={lead.pain} />
          <Field label="Pitched" value={pitch.offer ? PITCH_OFFER_LABELS[pitch.offer] ?? pitch.offer : null} />
          <Field label="Amount" value={pitch.amount != null ? `$${pitch.amount.toLocaleString()}` : null} />
          <Field label="Counter" value={pitch.counter} />
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Lead magnet</Label>
            <Select
              value={(magnet.status as LeadMagnetStatus) || "none"}
              onValueChange={(v) =>
                save(
                  { lead_magnet: { ...magnet, status: v as LeadMagnetStatus } },
                  `Lead magnet: ${LEAD_MAGNET_LABELS[v as LeadMagnetStatus]}`,
                )
              }
              disabled={disabled}
            >
              <SelectTrigger className="h-8" aria-label="Lead magnet status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_MAGNET_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {LEAD_MAGNET_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {magnet.brief && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{magnet.brief}</p>}
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
              disabled={disabled || docUrl === (magnet.doc_url ?? "")}
              onClick={() => save({ lead_magnet: { ...magnet, doc_url: docUrl || null } }, "Doc link saved")}
            >
              Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
