import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCampaign,
  useCampaignStats,
  useCampaignLeads,
  useStartCampaign,
  usePauseCampaign,
  useRemoveCampaignLeads,
} from "@/hooks/useCampaigns";
import {
  ArrowLeft,
  Play,
  Pause,
  Plus,
  Trash2,
  Clock,
  Send,
  XCircle,
  SkipForward,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ListTodo,
} from "lucide-react";
import LeadPickerDialog from "./LeadPickerDialog";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
  active: { label: "Active", className: "bg-green-500/15 text-green-400 border-green-500/30" },
  paused: { label: "Paused", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  completed: { label: "Completed", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
};

const LEAD_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
  queued: { label: "Queued", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  sent: { label: "Sent", className: "bg-green-500/15 text-green-400 border-green-500/30" },
  failed: { label: "Failed", className: "bg-red-500/15 text-red-400 border-red-500/30" },
  skipped: { label: "Skipped", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CampaignDetail() {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const apiKey = user?.api_key;
  const { toast } = useToast();

  const { data: campaign, isLoading: campaignLoading } = useCampaign(apiKey, campaignId ?? null);
  const { data: stats } = useCampaignStats(apiKey, campaignId ?? null);
  const startMutation = useStartCampaign(apiKey);
  const pauseMutation = usePauseCampaign(apiKey);
  const removeMutation = useRemoveCampaignLeads(apiKey);

  const [leadStatusFilter, setLeadStatusFilter] = useState("all");
  const [leadPage, setLeadPage] = useState(1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const { data: leadsData, isLoading: leadsLoading } = useCampaignLeads(apiKey, campaignId ?? null, {
    status: leadStatusFilter === "all" ? undefined : leadStatusFilter,
    page: leadPage,
    limit: 50,
  });

  const leads = leadsData?.leads || [];
  const leadPagination = leadsData?.pagination;

  if (campaignLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-muted-foreground">Campaign not found.</p>
        <Button variant="outline" onClick={() => navigate("/campaigns")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Campaigns
        </Button>
      </div>
    );
  }

  const s = stats || { total: 0, pending: 0, queued: 0, sent: 0, failed: 0, skipped: 0 };
  const progressPct = s.total > 0 ? Math.round((s.sent / s.total) * 100) : 0;

  const badge = STATUS_BADGE[campaign.status] || STATUS_BADGE.draft;
  const canStartPause = campaign.status !== "completed";

  const handleStartPause = async () => {
    try {
      if (campaign.status === "active") {
        await pauseMutation.mutateAsync(campaign._id);
        toast({ title: "Paused", description: "Campaign paused." });
      } else {
        await startMutation.mutateAsync(campaign._id);
        toast({ title: "Started", description: "Campaign is now active." });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Action failed",
        variant: "destructive",
      });
    }
  };

  const handleRemovePending = async () => {
    try {
      const result = await removeMutation.mutateAsync(campaign._id);
      toast({ title: "Removed", description: `${result.removed} pending lead(s) removed.` });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to remove",
        variant: "destructive",
      });
    }
    setConfirmRemove(false);
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/campaigns")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h3 className="text-xl font-bold">{campaign.name}</h3>
          <Badge className={badge.className}>{badge.label}</Badge>
        </div>
        {canStartPause && (
          <Button
            onClick={handleStartPause}
            disabled={startMutation.isPending || pauseMutation.isPending}
            variant={campaign.status === "active" ? "outline" : "default"}
          >
            {startMutation.isPending || pauseMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : campaign.status === "active" ? (
              <Pause className="h-4 w-4 mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {campaign.status === "active" ? "Pause" : "Start"}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-3">
        <StatCard label="Total" value={s.total} icon={<ListTodo className="h-4 w-4" />} />
        <StatCard label="Pending" value={s.pending} icon={<Clock className="h-4 w-4 text-zinc-400" />} className="text-zinc-400" />
        <StatCard label="Queued" value={s.queued} icon={<Loader2 className="h-4 w-4 text-yellow-400" />} className="text-yellow-400" />
        <StatCard label="Sent" value={s.sent} icon={<Send className="h-4 w-4 text-green-400" />} className="text-green-400" />
        <StatCard label="Failed" value={s.failed} icon={<XCircle className="h-4 w-4 text-red-400" />} className="text-red-400" />
        <StatCard label="Skipped" value={s.skipped} icon={<SkipForward className="h-4 w-4 text-blue-400" />} className="text-blue-400" />
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{s.sent} / {s.total} sent ({progressPct}%)</span>
        </div>
        <Progress value={progressPct} className="h-3" />
      </div>

      {/* Leads */}
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <div className="flex gap-3 items-end">
            <div className="flex flex-col gap-1.5 w-40">
              <Label>Lead Status</Label>
              <Select value={leadStatusFilter} onValueChange={(v) => { setLeadStatusFilter(v); setLeadPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            {s.pending > 0 && (
              <Button variant="outline" size="sm" onClick={() => setConfirmRemove(true)}>
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Remove Pending
              </Button>
            )}
            <Button size="sm" onClick={() => setPickerOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Leads
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No leads found.
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((cl) => {
                  const lb = LEAD_STATUS_BADGE[cl.status] || LEAD_STATUS_BADGE.pending;
                  const lead = cl.outbound_lead_id;
                  const sender = cl.sender_id;

                  return (
                    <TableRow key={cl._id}>
                      <TableCell className="font-medium">
                        {lead ? (
                          <a
                            href={lead.profileLink || `https://instagram.com/${lead.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            @{lead.username}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {sender ? `@${sender.ig_username}` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={lb.className}>{lb.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {cl.sent_at ? formatDate(cl.sent_at) : "-"}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-muted-foreground">
                        {cl.message_used || "-"}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {cl.error ? (
                          <span className="text-red-400 text-xs">{cl.error}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {leadPagination && leadPagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              Showing {(leadPagination.page - 1) * leadPagination.limit + 1} to{" "}
              {Math.min(leadPagination.page * leadPagination.limit, leadPagination.total)} of{" "}
              {leadPagination.total}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLeadPage((p) => Math.max(1, p - 1))}
                disabled={leadPagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLeadPage((p) => Math.min(leadPagination.totalPages, p + 1))}
                disabled={leadPagination.page === leadPagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Lead Picker */}
      <LeadPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        campaignId={campaign._id}
        apiKey={apiKey}
      />

      {/* Remove Pending Confirm */}
      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Pending Leads</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all pending leads from this campaign ({s.pending} leads). Leads that are already queued, sent, or failed will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemovePending} disabled={removeMutation.isPending}>
              {removeMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <Card>
      <CardContent className="py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`text-xl font-bold ${className || ""}`}>{value}</p>
        </div>
        {icon}
      </CardContent>
    </Card>
  );
}
