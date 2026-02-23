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
  useRetryCampaignLeads,
  useDuplicateCampaign,
  useRecalcCampaignStats,
  useUpdateCampaignLeadStatus,
  useGenerateMessages,
  useRegenerateLeadMessage,
  useEditLeadMessage,
  useClearMessages,
} from "@/hooks/useCampaigns";
import { useAIPrompts, useCreateAIPrompt, useDeleteAIPrompt } from "@/hooks/useAIPrompts";
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
  CheckCheck,
  MessageSquare,
  Sparkles,
  Pencil,
  BookmarkPlus,
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
  const deleteAIPromptMutation = useDeleteAIPrompt();
  const queryClient = useQueryClient();

  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [aiPrompt, setAiPrompt] = useState("");
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState("");
  const [genProgress, setGenProgress] = useState<{ progress: number; total: number } | null>(null);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [savePromptName, setSavePromptName] = useState("");
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [dupLeadFilter, setDupLeadFilter] = useState("all");

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
  const [leadPage, setLeadPage] = useState(1);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const { data: leadsData, isLoading: leadsLoading } = useCampaignLeads(campaignId ?? null, {
    status: leadStatusFilter === "all" ? undefined : leadStatusFilter,
    page: leadPage,
    limit: 50,
  });

  const leads = leadsData?.leads || [];

  // Retryable leads on current page (failed or skipped)
  const retryableLeads = leads.filter((l) => l.status === "failed" || l.status === "skipped");
  const allRetryableSelected = retryableLeads.length > 0 && retryableLeads.every((l) => selectedLeadIds.has(l._id));

  const toggleLeadSelection = (id: string) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllRetryable = () => {
    if (allRetryableSelected) {
      setSelectedLeadIds((prev) => {
        const next = new Set(prev);
        retryableLeads.forEach((l) => next.delete(l._id));
        return next;
      });
    } else {
      setSelectedLeadIds((prev) => {
        const next = new Set(prev);
        retryableLeads.forEach((l) => next.add(l._id));
        return next;
      });
    }
  };

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

  const s = stats || { total: 0, pending: 0, queued: 0, sent: 0, delivered: 0, replied: 0, failed: 0, skipped: 0 };
  const totalSent = (s.sent || 0) + (s.delivered || 0) + (s.replied || 0);
  const progressPct = s.total > 0 ? Math.round((totalSent / s.total) * 100) : 0;

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
      <div className="space-y-1">
        <div className="flex items-center justify-end">
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
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Total" value={s.total} icon={<ListTodo className="h-4 w-4" />} />
          <StatCard label="Pending" value={s.pending} icon={<Clock className="h-4 w-4 text-zinc-400" />} className="text-zinc-400" />
          <StatCard label="Queued" value={s.queued} icon={<Loader2 className="h-4 w-4 text-yellow-400" />} className="text-yellow-400" />
          <StatCard label="Sent" value={s.sent} icon={<Send className="h-4 w-4 text-green-400" />} className="text-green-400" />
          <StatCard label="Delivered" value={s.delivered || 0} icon={<CheckCheck className="h-4 w-4 text-emerald-400" />} className="text-emerald-400" />
          <StatCard label="Replied" value={s.replied || 0} icon={<MessageSquare className="h-4 w-4 text-purple-400" />} className="text-purple-400" />
          <StatCard label="Failed" value={s.failed} icon={<XCircle className="h-4 w-4 text-red-400" />} className="text-red-400" />
          <StatCard label="Skipped" value={s.skipped} icon={<SkipForward className="h-4 w-4 text-blue-400" />} className="text-blue-400" />
        </div>
      </div>

      {/* Next Send */}
      {campaign.status === "active" && effectiveNextSend && (
        <NextSendBar nextSend={effectiveNextSend} />
      )}

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{totalSent} / {s.total} sent ({progressPct}%)</span>
        </div>
        <Progress value={progressPct} className="h-3" />
      </div>

      {/* AI Personalization */}
      {campaign.status !== "active" && s.pending > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              AI Message Personalization
            </CardTitle>
            <CardDescription>
              Generate unique messages for each lead using AI. Your prompt becomes the system instruction — each lead's username, name, and bio are passed automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {savedPrompts.length > 0 && (
              <div className="flex items-center gap-2">
                <Select
                  value=""
                  onValueChange={(id) => {
                    const found = savedPrompts.find((p) => p._id === id);
                    if (found) setAiPrompt(found.promptText);
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
                {savedPrompts.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
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
                )}
              </div>
            )}
            <Textarea
              placeholder="You are a friendly outreach specialist. Write a short, personalized Instagram DM based on the lead's bio. Keep it casual and under 2 sentences."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
              disabled={campaign.ai_personalization?.status === "generating" || generateMutation.isPending}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!aiPrompt.trim()) return;
                  setSavePromptName("");
                  setShowSavePrompt(true);
                }}
                disabled={!aiPrompt.trim()}
              >
                <BookmarkPlus className="h-3.5 w-3.5 mr-1" />
                Save As
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (!campaignId || !aiPrompt.trim()) return;
                  generateMutation.mutate(
                    { campaignId, prompt: aiPrompt.trim() },
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
                disabled={!aiPrompt.trim() || generateMutation.isPending || campaign.ai_personalization?.status === "generating"}
              >
                {generateMutation.isPending || campaign.ai_personalization?.status === "generating" ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                )}
                Generate for {s.pending} lead{s.pending !== 1 ? "s" : ""}
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
          </CardContent>
        </Card>
      )}

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
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            {selectedLeadIds.size > 0 && (
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
                Retry {selectedLeadIds.size} Selected
              </Button>
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
                  {retryableLeads.length > 0 && (
                    <Checkbox
                      checked={allRetryableSelected}
                      onCheckedChange={toggleAllRetryable}
                    />
                  )}
                </TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Status</TableHead>
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
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    No leads found.
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((cl) => {
                  const lb = LEAD_STATUS_BADGE[cl.status] || LEAD_STATUS_BADGE.pending;
                  const lead = cl.outbound_lead_id;
                  const sender = cl.sender_id;
                  const isRetryable = cl.status === "failed" || cl.status === "skipped";

                  return (
                    <TableRow key={cl._id}>
                      <TableCell>
                        {isRetryable ? (
                          <Checkbox
                            checked={selectedLeadIds.has(cl._id)}
                            onCheckedChange={() => toggleLeadSelection(cl._id)}
                          />
                        ) : null}
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
                                  { campaignId, leadId: cl._id, prompt: campaign.ai_personalization.prompt },
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

  const sendersOnline = nextSend.online_senders ?? 0;
  const sendersTotal = nextSend.total_senders ?? 0;
  const hasReason = !!nextSend.reason;

  return (
    <Card>
      <CardContent className="py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
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
        </div>

        <div className="flex items-center gap-2">
          {sendersOnline > 0 ? (
            <Wifi className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-red-400" />
          )}
          <span className="text-xs text-muted-foreground">
            {sendersOnline}/{sendersTotal} senders online
          </span>
        </div>
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
