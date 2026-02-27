import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/contexts/SocketContext";
import {
  useCampaign,
  useCampaignStats,
  useCampaignNextSend,
  useCampaignLeads,
  useStartCampaign,
  usePauseCampaign,
  useRemoveCampaignLeads,
  useRemoveSelectedCampaignLeads,
  useRetryCampaignLeads,
  useDuplicateCampaign,
  useRecalcCampaignStats,
  useUpdateCampaignLeadStatus,
  useGenerateMessages,
  useRegenerateLeadMessage,
  useEditLeadMessage,
  useClearMessages,
  useCampaignSenders,
} from "@/hooks/useCampaigns";
import type { CampaignSender } from "@/hooks/useCampaigns";
import { API_URL, fetchWithAuth } from "@/lib/api";
import { useAIPrompts, useCreateAIPrompt, useUpdateAIPrompt, useDeleteAIPrompt } from "@/hooks/useAIPrompts";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
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
  Timer,
  Wifi,
  WifiOff,
  RotateCcw,
  Copy,
  RefreshCw,
  MoreHorizontal,
  MessageSquare,
  Sparkles,
  Pencil,
  BookmarkPlus,
  Search,
  CalendarCheck,
  Link,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  delivered: { label: "Delivered", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  replied: { label: "Replied", className: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  failed: { label: "Failed", className: "bg-red-500/15 text-red-400 border-red-500/30" },
  skipped: { label: "Skipped", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
};

const MANUAL_STATUSES = ["pending", "sent", "delivered", "replied", "failed", "skipped"] as const;

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
  const { toast } = useToast();
  const { socket } = useSocket();

  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId ?? null);
  const { data: stats } = useCampaignStats(campaignId ?? null);
  const { data: nextSend } = useCampaignNextSend(campaignId ?? null, campaign?.status);
  const startMutation = useStartCampaign();
  const pauseMutation = usePauseCampaign();
  const removeMutation = useRemoveCampaignLeads();
  const removeSelectedMutation = useRemoveSelectedCampaignLeads();
  const retryMutation = useRetryCampaignLeads();
  const duplicateMutation = useDuplicateCampaign();
  const recalcMutation = useRecalcCampaignStats();
  const statusMutation = useUpdateCampaignLeadStatus();
  const generateMutation = useGenerateMessages();
  const regenerateMutation = useRegenerateLeadMessage();
  const editMessageMutation = useEditLeadMessage();
  const clearMessagesMutation = useClearMessages();
  const { data: savedPrompts = [] } = useAIPrompts();
  const createAIPromptMutation = useCreateAIPrompt();
  const updateAIPromptMutation = useUpdateAIPrompt();
  const deleteAIPromptMutation = useDeleteAIPrompt();
  const queryClient = useQueryClient();

  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [aiPrompt, setAiPrompt] = useState("");
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState("");
  const [genProgress, setGenProgress] = useState<{ progress: number; total: number } | null>(null);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [savePromptName, setSavePromptName] = useState("");
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [genScope, setGenScope] = useState<"unsent" | "without_message">("unsent");
  const [aiProvider, setAiProvider] = useState<"openai" | "claude">("openai");
  const [showSendersModal, setShowSendersModal] = useState(false);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [dupLeadFilter, setDupLeadFilter] = useState("all");

  const { data: sendersData } = useCampaignSenders(campaignId ?? null, true);

  // Real-time ETA from scheduler (overrides polled data when a message is actually sent)
  const [socketEta, setSocketEta] = useState<{ nextInSeconds: number; receivedAt: number } | null>(null);

  useEffect(() => {
    if (!socket) return;
    const handleEta = (data: { nextInSeconds: number; campaignName: string }) => {
      setSocketEta({ nextInSeconds: data.nextInSeconds, receivedAt: Date.now() });
    };
    socket.on("campaign:eta", handleEta);
    return () => { socket.off("campaign:eta", handleEta); };
  }, [socket]);

  // AI generation progress via WebSocket
  const handleGenProgress = useCallback((data: { campaignId: string; progress: number; total: number }) => {
    if (data.campaignId === campaignId) {
      setGenProgress({ progress: data.progress, total: data.total });
    }
  }, [campaignId]);

  const handleGenCompleted = useCallback((data: { campaignId: string }) => {
    if (data.campaignId === campaignId) {
      setGenProgress(null);
      queryClient.invalidateQueries({ queryKey: ["campaign"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-leads"] });
      toast({ title: "Generation Complete", description: "AI messages generated for all leads." });
    }
  }, [campaignId, queryClient, toast]);

  const handleGenFailed = useCallback((data: { campaignId: string; error: string }) => {
    if (data.campaignId === campaignId) {
      setGenProgress(null);
      queryClient.invalidateQueries({ queryKey: ["campaign"] });
      toast({ title: "Generation Failed", description: data.error, variant: "destructive" });
    }
  }, [campaignId, queryClient, toast]);

  useEffect(() => {
    if (!socket) return;
    socket.on("campaign:generation:progress", handleGenProgress);
    socket.on("campaign:generation:completed", handleGenCompleted);
    socket.on("campaign:generation:failed", handleGenFailed);
    return () => {
      socket.off("campaign:generation:progress", handleGenProgress);
      socket.off("campaign:generation:completed", handleGenCompleted);
      socket.off("campaign:generation:failed", handleGenFailed);
    };
  }, [socket, handleGenProgress, handleGenCompleted, handleGenFailed]);

  // Initialize prompt from campaign data
  useEffect(() => {
    if (campaign?.ai_personalization?.prompt && !aiPrompt) {
      setAiPrompt(campaign.ai_personalization.prompt);
    }
  }, [campaign?.ai_personalization?.prompt]);

  // Clear socket ETA when polled data refreshes with a newer last_sent_at
  useEffect(() => {
    if (nextSend?.last_sent_at && socketEta) {
      const lastSentMs = new Date(nextSend.last_sent_at).getTime();
      if (lastSentMs > socketEta.receivedAt) {
        setSocketEta(null);
      }
    }
  }, [nextSend?.last_sent_at, socketEta]);

  // Merge socket ETA into nextSend for display
  const effectiveNextSend = nextSend && socketEta
    ? {
        ...nextSend,
        next_send_at: new Date(socketEta.receivedAt + socketEta.nextInSeconds * 1000).toISOString(),
        delay_seconds: socketEta.nextInSeconds,
        last_sent_at: new Date(socketEta.receivedAt).toISOString(),
      }
    : nextSend;

  const [leadStatusFilter, setLeadStatusFilter] = useState("all");
  const [leadSearch, setLeadSearch] = useState("");
  const [leadSearchDebounced, setLeadSearchDebounced] = useState("");
  const [leadPage, setLeadPage] = useState(1);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmRemoveSelected, setConfirmRemoveSelected] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setLeadSearchDebounced(leadSearch); setLeadPage(1); }, 300);
    return () => clearTimeout(t);
  }, [leadSearch]);

  const { data: leadsData, isLoading: leadsLoading } = useCampaignLeads(campaignId ?? null, {
    status: leadStatusFilter === "all" ? undefined : leadStatusFilter,
    search: leadSearchDebounced || undefined,
    page: leadPage,
    limit: 50,
  });

  const leads = leadsData?.leads || [];

  // Retryable leads on current page (failed or skipped)
  const retryableLeads = leads.filter((l) => l.status === "failed" || l.status === "skipped");
  const allPageSelected = leads.length > 0 && leads.every((l) => selectedLeadIds.has(l._id));
  const someSelected = selectedLeadIds.size > 0;
  const selectedRetryableCount = retryableLeads.filter((l) => selectedLeadIds.has(l._id)).length;

  const toggleLeadSelection = (id: string) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllPage = () => {
    if (allPageSelected) {
      setSelectedLeadIds((prev) => {
        const next = new Set(prev);
        leads.forEach((l) => next.delete(l._id));
        return next;
      });
    } else {
      setSelectedLeadIds((prev) => {
        const next = new Set(prev);
        leads.forEach((l) => next.add(l._id));
        return next;
      });
    }
  };

  const toggleLeadField = useCallback(
    async (outboundLeadId: string, field: "replied" | "booked", currentValue: boolean) => {
      try {
        await fetchWithAuth(`${API_URL}/outbound-leads/${outboundLeadId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: !currentValue }),
        });
        queryClient.invalidateQueries({ queryKey: ["campaign-leads"] });
        queryClient.invalidateQueries({ queryKey: ["campaign-stats"] });
      } catch (err) {
        toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to update", variant: "destructive" });
      }
    },
    [queryClient, toast],
  );

  const handleRetrySelected = async () => {
    if (!campaignId || selectedLeadIds.size === 0) return;
    try {
      const result = await retryMutation.mutateAsync({
        campaignId,
        lead_ids: Array.from(selectedLeadIds),
      });
      toast({ title: "Retried", description: `${result.retried} lead(s) moved back to pending.` });
      setSelectedLeadIds(new Set());
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to retry",
        variant: "destructive",
      });
    }
  };

  const handleRemoveSelected = async () => {
    if (!campaignId || selectedLeadIds.size === 0) return;
    try {
      const result = await removeSelectedMutation.mutateAsync({
        campaignId,
        lead_ids: Array.from(selectedLeadIds),
      });
      toast({ title: "Removed", description: `${result.removed ?? selectedLeadIds.size} lead(s) removed from campaign.` });
      setSelectedLeadIds(new Set());
      setConfirmRemoveSelected(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to remove leads",
        variant: "destructive",
      });
    }
  };

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

  const s = stats || { total: 0, pending: 0, queued: 0, sent: 0, delivered: 0, replied: 0, link_sent: 0, booked: 0, failed: 0, skipped: 0, without_message: 0 };
  const processed = (s.sent || 0) + (s.failed || 0) + (s.skipped || 0);
  const progressPct = s.total > 0 ? Math.round((processed / s.total) * 100) : 0;
  const unsentCount = s.total - (s.sent || 0) - (s.delivered || 0) - (s.replied || 0);
  const withoutMessageCount = s.without_message ?? 0;
  const scopeCount = genScope === "unsent" ? unsentCount : withoutMessageCount;

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

  const handleDuplicate = async () => {
    if (!campaignId) return;
    try {
      const result = await duplicateMutation.mutateAsync({
        campaignId,
        lead_filter: dupLeadFilter,
      });
      toast({
        title: "Campaign duplicated",
        description: `Created "${result.campaign.name}" with ${result.leads_copied} lead(s).`,
      });
      setShowDuplicate(false);
      navigate(`/campaigns/${result.campaign._id}`);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to duplicate",
        variant: "destructive",
      });
    }
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
          <Badge variant="outline" className="text-[10px] font-normal">
            {campaign.mode === "manual" ? "Manual" : "Auto"}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAiModal(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            AI Personalization
          </Button>
          <Button variant="outline" onClick={() => setShowDuplicate(true)}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
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
      </div>

      {/* Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Performance</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground"
            onClick={() => recalcMutation.mutate(campaign._id)}
            disabled={recalcMutation.isPending}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${recalcMutation.isPending ? "animate-spin" : ""}`} />
            Recalc
          </Button>
        </div>
        {/* Primary metrics */}
        <div className="grid grid-cols-4 gap-3">
          <PrimaryStatCard label="Sent" value={s.sent} icon={<Send className="h-4 w-4 text-green-400" />} className="text-green-400"
            subtitle={s.total > 0 ? `${((s.sent || 0) / s.total * 100).toFixed(1)}% of total` : undefined} />
          <PrimaryStatCard label="Replied" value={s.replied || 0} icon={<MessageSquare className="h-4 w-4 text-purple-400" />} className="text-purple-400"
            subtitle={s.sent > 0 ? `${((s.replied || 0) / s.sent * 100).toFixed(1)}% of sent` : undefined} />
          <PrimaryStatCard label="Link Sent" value={s.link_sent || 0} icon={<Link className="h-4 w-4 text-orange-400" />} className="text-orange-400"
            subtitle={s.sent > 0 ? `${((s.link_sent || 0) / s.sent * 100).toFixed(1)}% of sent` : undefined} />
          <PrimaryStatCard
            label="Booked"
            value={s.booked || 0}
            icon={<CalendarCheck className="h-4 w-4 text-teal-400" />}
            className="text-teal-400"
            subtitle={s.sent > 0 ? `${((s.booked || 0) / s.sent * 100).toFixed(1)}% of sent${(s.replied || 0) > 0 ? ` · ${((s.booked || 0) / (s.replied || 1) * 100).toFixed(1)}% of replies` : ""}` : undefined}
          />
        </div>
        {/* Secondary metrics */}
        <div className="grid grid-cols-4 gap-3">
          <SecondaryStatCard label="Total" value={s.total} icon={<ListTodo className="h-3.5 w-3.5" />} />
          <SecondaryStatCard label="Pending" value={s.pending} icon={<Clock className="h-3.5 w-3.5" />} />
          <SecondaryStatCard label="Failed" value={s.failed} icon={<XCircle className="h-3.5 w-3.5" />}
            subtitle={s.sent > 0 ? `${((s.failed || 0) / s.sent * 100).toFixed(1)}% of sent` : undefined} />
          <SecondaryStatCard label="Skipped" value={s.skipped} icon={<SkipForward className="h-3.5 w-3.5" />}
            subtitle={s.sent > 0 ? `${((s.skipped || 0) / s.sent * 100).toFixed(1)}% of sent` : undefined} />
        </div>
      </div>

      {/* Senders – always visible regardless of campaign status */}
      {sendersData && (
        <Card>
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {sendersData.summary.online > 0 ? (
                  <Wifi className="h-4 w-4 text-green-400" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-400" />
                )}
                <span className="text-sm">
                  <span className="font-medium text-green-400">{sendersData.summary.online}</span>
                  <span className="text-muted-foreground"> / {sendersData.summary.total} senders online</span>
                </span>
                {sendersData.summary.issues > 0 && (
                  <span className="text-sm text-red-400 font-medium">
                    · {sendersData.summary.issues} issue{sendersData.summary.issues !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowSendersModal(true)} className="text-xs">
              View Senders
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Next Send – only for active campaigns */}
      {campaign.status === "active" && effectiveNextSend && (
        <NextSendBar nextSend={effectiveNextSend} />
      )}

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{processed} / {s.total} processed ({progressPct}%)</span>
        </div>
        <Progress value={progressPct} className="h-3" />
      </div>

      {/* Leads */}
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <div className="flex gap-3 items-end">
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                className="pl-8"
              />
            </div>
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
                  <SelectItem value="replied">Replied</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            {selectedLeadIds.size > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmRemoveSelected(true)}
                  disabled={removeSelectedMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Remove {selectedLeadIds.size} Selected
                </Button>
                {selectedRetryableCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetrySelected}
                    disabled={retryMutation.isPending}
                  >
                    {retryMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    )}
                    Retry {selectedRetryableCount} Failed
                  </Button>
                )}
              </>
            )}
            {s.pending > 0 && (
              <Button variant="outline" size="sm" onClick={() => setConfirmRemove(true)}>
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Remove Pending
              </Button>
            )}
            <Button size="sm" onClick={() => navigate(`/campaigns/${campaignId}/add-leads`)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Leads
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  {leads.length > 0 && (
                    <Checkbox
                      checked={allPageSelected}
                      onCheckedChange={toggleAllPage}
                    />
                  )}
                </TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Replied</TableHead>
                <TableHead className="text-center">Booked</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Error</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadsLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-24 text-center">
                    No qualified leads in this campaign.
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((cl) => {
                  const lb = LEAD_STATUS_BADGE[cl.status] || LEAD_STATUS_BADGE.pending;
                  const lead = cl.outbound_lead_id;
                  const sender = cl.sender_id;
                  return (
                    <TableRow key={cl._id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedLeadIds.has(cl._id)}
                          onCheckedChange={() => toggleLeadSelection(cl._id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {lead ? (
                          <a
                            href={lead.profileLink || `https://instagram.com/${lead.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground hover:underline"
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
                      <TableCell className="text-center">
                        <Checkbox
                          checked={lead?.replied ?? false}
                          onCheckedChange={() => lead && toggleLeadField(lead._id, "replied", lead.replied ?? false)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={lead?.booked ?? false}
                          onCheckedChange={() => lead && toggleLeadField(lead._id, "booked", lead.booked ?? false)}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {cl.template_index != null ? `#${cl.template_index + 1}` : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {cl.sent_at ? formatDate(cl.sent_at) : "-"}
                      </TableCell>
                      <TableCell className="max-w-[150px] text-muted-foreground">
                        {(cl.custom_message || cl.message_used) ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="flex items-center gap-1 text-left max-w-full hover:text-foreground transition-colors">
                                {cl.custom_message && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 shrink-0 bg-purple-500/15 text-purple-400 border-purple-500/30">AI</Badge>
                                )}
                                <span className="truncate">{cl.custom_message || cl.message_used}</span>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 max-h-60 overflow-y-auto text-sm whitespace-pre-wrap">
                              {cl.custom_message || cl.message_used}
                            </PopoverContent>
                          </Popover>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {cl.error ? (
                          <span className="text-red-400 text-xs">{cl.error}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingLeadId(cl._id);
                                setEditingMessage(cl.custom_message || cl.message_used || "");
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5 mr-2" />
                              Edit Message
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!campaign.ai_personalization?.prompt || regenerateMutation.isPending}
                              onClick={() => {
                                if (!campaignId || !campaign.ai_personalization?.prompt) return;
                                regenerateMutation.mutate(
                                  { campaignId, leadId: cl._id, prompt: campaign.ai_personalization.prompt, provider: aiProvider },
                                  {
                                    onSuccess: () => {
                                      toast({ title: "Regenerated", description: "Message regenerated for this lead." });
                                    },
                                    onError: (err) => {
                                      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to regenerate", variant: "destructive" });
                                    },
                                  },
                                );
                              }}
                            >
                              <Sparkles className="h-3.5 w-3.5 mr-2" />
                              Regenerate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {MANUAL_STATUSES.map((ms) => {
                              const badge = LEAD_STATUS_BADGE[ms];
                              return (
                                <DropdownMenuItem
                                  key={ms}
                                  disabled={cl.status === ms}
                                  onClick={() => {
                                    if (!campaignId) return;
                                    statusMutation.mutate(
                                      { campaignId, leadId: cl._id, status: ms },
                                      {
                                        onSuccess: () => {
                                          toast({ title: "Status updated", description: `Lead marked as ${badge?.label || ms}.` });
                                        },
                                        onError: (err) => {
                                          toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to update", variant: "destructive" });
                                        },
                                      },
                                    );
                                  }}
                                >
                                  <span className={cl.status === ms ? "font-semibold" : ""}>
                                    {badge?.label || ms}
                                  </span>
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      {/* Remove Selected Confirm */}
      <AlertDialog open={confirmRemoveSelected} onOpenChange={setConfirmRemoveSelected}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Selected Leads</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {selectedLeadIds.size} selected lead{selectedLeadIds.size !== 1 ? "s" : ""} from this campaign. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveSelected} disabled={removeSelectedMutation.isPending}>
              {removeSelectedMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Lead Message */}
      <Dialog open={!!editingLeadId} onOpenChange={(open) => { if (!open) setEditingLeadId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editingMessage}
            onChange={(e) => setEditingMessage(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLeadId(null)}>Cancel</Button>
            <Button
              disabled={editMessageMutation.isPending}
              onClick={() => {
                if (!campaignId || !editingLeadId) return;
                editMessageMutation.mutate(
                  { campaignId, leadId: editingLeadId, custom_message: editingMessage },
                  {
                    onSuccess: () => {
                      toast({ title: "Saved", description: "Message updated." });
                      setEditingLeadId(null);
                    },
                    onError: (err) => {
                      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to save", variant: "destructive" });
                    },
                  },
                );
              }}
            >
              {editMessageMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Prompt As */}
      <Dialog open={showSavePrompt} onOpenChange={setShowSavePrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Prompt</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="e.g. Casual bio outreach"
              value={savePromptName}
              onChange={(e) => setSavePromptName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSavePrompt(false)}>Cancel</Button>
            <Button
              disabled={!savePromptName.trim() || createAIPromptMutation.isPending}
              onClick={() => {
                createAIPromptMutation.mutate(
                  { name: savePromptName.trim(), promptText: aiPrompt.trim() },
                  {
                    onSuccess: () => {
                      toast({ title: "Saved", description: `Prompt "${savePromptName.trim()}" saved.` });
                      setShowSavePrompt(false);
                    },
                    onError: (err) => {
                      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to save", variant: "destructive" });
                    },
                  },
                );
              }}
            >
              {createAIPromptMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Personalization Modal */}
      <Dialog open={showAiModal} onOpenChange={setShowAiModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Message Personalization
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate unique messages for each lead using AI. Your prompt becomes the system instruction — each lead's username, name, and bio are passed automatically.
            </p>
            {savedPrompts.length > 0 && (
              <div className="flex items-center gap-2">
                <Select
                  value={editingPromptId ?? ""}
                  onValueChange={(id) => {
                    const found = savedPrompts.find((p) => p._id === id);
                    if (found) {
                      setAiPrompt(found.promptText);
                      setEditingPromptId(id);
                    }
                  }}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Load a saved prompt..." />
                  </SelectTrigger>
                  <SelectContent>
                    {savedPrompts.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {savedPrompts.map((p) => (
                      <DropdownMenuItem
                        key={p._id}
                        className="text-red-400"
                        onClick={() => {
                          deleteAIPromptMutation.mutate(p._id, {
                            onSuccess: () => {
                              if (editingPromptId === p._id) setEditingPromptId(null);
                              toast({ title: "Deleted", description: `"${p.name}" removed.` });
                            },
                          });
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete "{p.name}"
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            <Textarea
              placeholder="You are a friendly outreach specialist. Write a short, personalized Instagram DM based on the lead's bio. Keep it casual and under 2 sentences."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={4}
              disabled={campaign.ai_personalization?.status === "generating" || generateMutation.isPending}
            />
            <div className="flex flex-wrap items-center gap-2">
              {editingPromptId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const found = savedPrompts.find((p) => p._id === editingPromptId);
                    if (!found || !aiPrompt.trim()) return;
                    updateAIPromptMutation.mutate(
                      { id: editingPromptId, name: found.name, promptText: aiPrompt.trim() },
                      {
                        onSuccess: () => {
                          toast({ title: "Updated", description: `"${found.name}" updated.` });
                        },
                        onError: (err) => {
                          toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to update", variant: "destructive" });
                        },
                      },
                    );
                  }}
                  disabled={!aiPrompt.trim() || updateAIPromptMutation.isPending}
                >
                  {updateAIPromptMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Pencil className="h-3.5 w-3.5 mr-1" />}
                  Update
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!aiPrompt.trim()) return;
                  setSavePromptName("");
                  setEditingPromptId(null);
                  setShowSavePrompt(true);
                }}
                disabled={!aiPrompt.trim()}
              >
                <BookmarkPlus className="h-3.5 w-3.5 mr-1" />
                Save As New
              </Button>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-medium">AI Provider</Label>
              <Select value={aiProvider} onValueChange={(v) => setAiProvider(v as "openai" | "claude")}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
                      </svg>
                      OpenAI
                    </span>
                  </SelectItem>
                  <SelectItem value="claude">
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16.098 10.267l-4.818 2.386-3.96-7.01L12.876.782zm1.402 2.885l-5.256-9.31L6.674 13.15h5.07zm-6.89 5.252L7.044 18.4H2.156l3.985-6.883zm-6.1 1.594h9.484l-3.96 5.37zM2.674 6.4l3.45 6.108L2.155 18.4H.482zm4.462-2.17l7.834 13.874H.49zm6.396 15.475h7.13l-3.565-6.314zm7.81-1.6H11.87l3.562-1.764 3.962 7.011zM14.218 5.642l3.566 6.313-7.13.003zm7.126 12.761l-3.45-6.108 3.968-5.892h1.674zm-4.46 2.172L9.05 6.702h13.354z" />
                      </svg>
                      Claude
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-medium">Generation scope</Label>
              <RadioGroup value={genScope} onValueChange={(v) => setGenScope(v as "unsent" | "without_message")} className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unsent" id="scope-unsent" />
                  <Label htmlFor="scope-unsent" className="text-sm font-normal">All unsent leads ({unsentCount})</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="without_message" id="scope-without-message" />
                  <Label htmlFor="scope-without-message" className="text-sm font-normal">Leads without message ({withoutMessageCount})</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  if (!campaignId || !aiPrompt.trim()) return;
                  generateMutation.mutate(
                    { campaignId, prompt: aiPrompt.trim(), scope: genScope, provider: aiProvider },
                    {
                      onSuccess: (data) => {
                        setGenProgress({ progress: 0, total: data.total });
                        toast({ title: "Generating", description: `Generating messages for ${data.total} leads...` });
                      },
                      onError: (err) => {
                        toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to start generation", variant: "destructive" });
                      },
                    },
                  );
                }}
                disabled={!aiPrompt.trim() || scopeCount === 0 || generateMutation.isPending || campaign.ai_personalization?.status === "generating"}
              >
                {generateMutation.isPending || campaign.ai_personalization?.status === "generating" ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                )}
                Generate for {scopeCount} lead{scopeCount !== 1 ? "s" : ""}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!campaignId) return;
                  clearMessagesMutation.mutate(campaignId, {
                    onSuccess: (data) => {
                      toast({ title: "Cleared", description: `${data.cleared} message(s) cleared.` });
                    },
                    onError: (err) => {
                      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to clear", variant: "destructive" });
                    },
                  });
                }}
                disabled={clearMessagesMutation.isPending || campaign.ai_personalization?.status === "generating"}
              >
                Clear All Messages
              </Button>
            </div>
            {(genProgress || campaign.ai_personalization?.status === "generating") && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Generating messages...</span>
                  <span>
                    {genProgress?.progress ?? campaign.ai_personalization?.progress ?? 0} /{" "}
                    {genProgress?.total ?? campaign.ai_personalization?.total ?? 0}
                  </span>
                </div>
                <Progress
                  value={
                    ((genProgress?.progress ?? campaign.ai_personalization?.progress ?? 0) /
                      Math.max(genProgress?.total ?? campaign.ai_personalization?.total ?? 1, 1)) *
                    100
                  }
                  className="h-2"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Campaign Senders Modal */}
      <Dialog open={showSendersModal} onOpenChange={setShowSendersModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Campaign Senders</DialogTitle>
          </DialogHeader>
          {sendersData && (
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="flex gap-4 text-sm">
                <span>Total: <span className="font-medium">{sendersData.summary.total}</span></span>
                <span>Online: <span className="font-medium text-green-400">{sendersData.summary.online}</span></span>
                <span>Offline: <span className="font-medium text-muted-foreground">{sendersData.summary.offline}</span></span>
                {sendersData.summary.issues > 0 && (
                  <span>Issues: <span className="font-medium text-red-400">{sendersData.summary.issues}</span></span>
                )}
              </div>

              {/* Senders table */}
              <div className="rounded-lg border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead className="text-right">Daily Limit</TableHead>
                      <TableHead className="text-right">Sent Today</TableHead>
                      <TableHead>Health</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sendersData.senders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-16 text-center text-muted-foreground">
                          No sender accounts linked to this campaign.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sendersData.senders.map((sender, idx) => (
                        <SenderRow key={sender._id || `unlinked-${idx}`} sender={sender} />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          {!sendersData && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Duplicate Campaign */}
      <AlertDialog open={showDuplicate} onOpenChange={setShowDuplicate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Create a copy of &ldquo;{campaign.name}&rdquo; with the same settings. Choose which leads to include:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <RadioGroup value={dupLeadFilter} onValueChange={setDupLeadFilter} className="space-y-2 py-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="dup-all" />
              <Label htmlFor="dup-all">All leads ({s.total})</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pending" id="dup-pending" />
              <Label htmlFor="dup-pending">Pending only ({s.pending})</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="failed" id="dup-failed" />
              <Label htmlFor="dup-failed">Failed only ({s.failed})</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="skipped" id="dup-skipped" />
              <Label htmlFor="dup-skipped">Skipped only ({s.skipped})</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sent" id="dup-sent" />
              <Label htmlFor="dup-sent">Sent only ({s.sent})</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="none" id="dup-none" />
              <Label htmlFor="dup-none">No leads (settings only)</Label>
            </div>
          </RadioGroup>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDuplicate} disabled={duplicateMutation.isPending}>
              {duplicateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Duplicating...
                </>
              ) : (
                "Duplicate"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function NextSendBar({ nextSend }: { nextSend: import("@/hooks/useCampaigns").CampaignNextSend }) {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!nextSend.next_send_at) {
      setCountdown("");
      return;
    }

    const update = () => {
      const remaining = Math.max(0, (new Date(nextSend.next_send_at!).getTime() - Date.now()) / 1000);
      if (remaining <= 0) {
        setCountdown("any moment");
        return;
      }
      const m = Math.floor(remaining / 60);
      const s = Math.floor(remaining % 60);
      setCountdown(m > 0 ? `${m}m ${s}s` : `${s}s`);
    };

    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [nextSend.next_send_at]);

  const hasReason = !!nextSend.reason;

  return (
    <Card>
      <CardContent className="py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Next send:</span>
          {nextSend.next_send_at && countdown ? (
            <span className="text-sm font-bold text-green-400">{countdown}</span>
          ) : hasReason ? (
            <span className="text-sm text-yellow-400">{nextSend.reason}</span>
          ) : (
            <span className="text-sm text-muted-foreground">--</span>
          )}
        </div>

        {nextSend.delay_seconds && (
          <span className="text-xs text-muted-foreground">
            ~{Math.round(nextSend.delay_seconds / 60)}m between sends
          </span>
        )}

        {nextSend.last_sent_at && (
          <span className="text-xs text-muted-foreground">
            Last sent {formatRelative(nextSend.last_sent_at)}
          </span>
        )}
      </CardContent>
    </Card>
  );
}

function formatRelative(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function PrimaryStatCard({
  label,
  value,
  icon,
  className,
  subtitle,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  className?: string;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="py-4 px-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {icon}
        </div>
        <p className={`text-2xl font-bold ${className || ""}`}>{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function SecondaryStatCard({
  label,
  value,
  icon,
  subtitle,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <Card className="bg-card/50">
      <CardContent className="py-2 px-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold text-muted-foreground">{value}</p>
          {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="text-muted-foreground/50">{icon}</div>
      </CardContent>
    </Card>
  );
}

const HEALTH_CONFIG: Record<string, { label: string; className: string }> = {
  good: { label: "Good", className: "bg-green-500/15 text-green-400 border-green-500/30" },
  warning: { label: "Warning", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  risk: { label: "Risk", className: "bg-red-500/15 text-red-400 border-red-500/30" },
};

const SENDER_STATUS_DOT: Record<string, string> = {
  online: "bg-green-400",
  offline: "bg-zinc-500",
  restricted: "bg-red-400",
};

function SenderRow({ sender }: { sender: CampaignSender }) {
  const health = HEALTH_CONFIG[sender.health] || HEALTH_CONFIG.good;
  const dot = SENDER_STATUS_DOT[sender.status] || SENDER_STATUS_DOT.offline;
  const limitPct = sender.daily_limit > 0 ? Math.round((sender.sent_today / sender.daily_limit) * 100) : 0;

  return (
    <TableRow className={sender.health === "risk" ? "bg-red-500/5" : undefined}>
      <TableCell className="font-medium">@{sender.ig_username}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dot}`} />
          <span className="text-sm capitalize">{sender.status}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {sender.last_seen ? formatRelative(sender.last_seen) : "Never"}
      </TableCell>
      <TableCell className="text-right">{sender.daily_limit}</TableCell>
      <TableCell className="text-right">
        <span className={limitPct >= 90 ? "text-yellow-400 font-medium" : ""}>
          {sender.sent_today}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge className={health.className}>{health.label}</Badge>
          {sender.issue && (
            <span className="text-xs text-muted-foreground">{sender.issue}</span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
