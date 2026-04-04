import { useState, useEffect, useCallback } from "react";
import { formatDateTime } from "@/lib/formatters";
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
  usePreviewMessage,
  useRegenerateLeadMessage,
  useEditLeadMessage,
  useClearMessages,
  useCampaignSenders,
  useMoveLeads,
  useCampaigns,
  useUpdateCampaign,
} from "@/hooks/useCampaigns";
import type { CampaignSender } from "@/hooks/useCampaigns";
import { useOutboundAccounts, type OutboundAccount } from "@/hooks/useOutboundAccounts";
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
  Eye,
  X,
  ChevronDown,
  AlertTriangle,
  Check,
  Minus,
  SlidersHorizontal,
  ExternalLink,
  ArrowRightLeft,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AIReportTab } from "@/components/outbound-analytics/AIReportTab";

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
  const previewMutation = usePreviewMessage();
  const regenerateMutation = useRegenerateLeadMessage();
  const editMessageMutation = useEditLeadMessage();
  const clearMessagesMutation = useClearMessages();
  const moveMutation = useMoveLeads();
  const { data: savedPrompts = [] } = useAIPrompts();
  const createAIPromptMutation = useCreateAIPrompt();
  const updateAIPromptMutation = useUpdateAIPrompt();
  const deleteAIPromptMutation = useDeleteAIPrompt();
  const queryClient = useQueryClient();

  const { data: allCampaignsData } = useCampaigns({ limit: 100 });
  const otherCampaigns = (allCampaignsData?.campaigns ?? []).filter((c) => c._id !== campaignId);

  const [showMoveModal, setShowMoveModal] = useState(false);
  const [targetCampaignId, setTargetCampaignId] = useState("");
  const [keepInSource, setKeepInSource] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [allPendingMode, setAllPendingMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState("");
  const [genProgress, setGenProgress] = useState<{ progress: number; total: number } | null>(null);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [savePromptName, setSavePromptName] = useState("");
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [genScope, setGenScope] = useState<"unsent" | "without_message">("unsent");
  const [aiProvider, setAiProvider] = useState<"openai" | "claude" | "gemini">("openai");
  const [previewResult, setPreviewResult] = useState<{
    lead_name: string;
    lead_username: string | null;
    lead_bio: string | null;
    generated_message: string | null;
  } | null>(null);
  const [showSendersModal, setShowSendersModal] = useState(false);
  const [editingSenders, setEditingSenders] = useState(false);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [dupLeadFilter, setDupLeadFilter] = useState("all");
  const [showAiReport, setShowAiReport] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    message: false,
    error: false,
  });

  const { data: sendersData } = useCampaignSenders(campaignId ?? null, true);
  const { data: outboundData } = useOutboundAccounts({ page: 1, limit: 500, isBlacklisted: "false" });
  const outboundAccounts = (outboundData?.accounts ?? []).filter((a) => a.status !== "disabled");
  const updateCampaignMutation = useUpdateCampaign();

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
      queryClient.invalidateQueries({ queryKey: ["campaign-stats"] });
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
  const [leadSenderFilter, setLeadSenderFilter] = useState("all");
  const [leadSearch, setLeadSearch] = useState("");
  const [leadSearchDebounced, setLeadSearchDebounced] = useState("");
  const [leadPage, setLeadPage] = useState(1);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmRemoveSelected, setConfirmRemoveSelected] = useState(false);
  const [expandedLeadIds, setExpandedLeadIds] = useState<Set<string>>(new Set());
  const toggleExpandLead = useCallback((id: string) => {
    setExpandedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setLeadSearchDebounced(leadSearch.trim()); setLeadPage(1); }, 300);
    return () => clearTimeout(t);
  }, [leadSearch]);

  const { data: leadsData, isLoading: leadsLoading } = useCampaignLeads(campaignId ?? null, {
    status: leadStatusFilter === "all" ? undefined : leadStatusFilter,
    search: leadSearchDebounced || undefined,
    sender_id: leadSenderFilter === "all" ? undefined : leadSenderFilter,
    page: leadPage,
    limit: 50,
  });

  const leads = leadsData?.leads || [];

  // Retryable leads on current page (failed or skipped)
  const retryableLeads = leads.filter((l) => l.status === "failed" || l.status === "skipped");
  const allPageSelected = leads.length > 0 && leads.every((l) => selectedLeadIds.has(l._id));
  const someSelected = selectedLeadIds.size > 0;
  const selectedRetryableCount = retryableLeads.filter((l) => selectedLeadIds.has(l._id)).length;
  const selectedPendingCount = allPendingMode ? (stats?.pending ?? 0) : leads.filter((l) => selectedLeadIds.has(l._id) && l.status === "pending").length;

  const toggleLeadSelection = (id: string) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllPage = () => {
    setAllPendingMode(false);
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

  const handleSelectAllPending = async () => {
    if (!campaignId) return;
    try {
      const res = await fetchWithAuth(`${API_URL}/api/campaigns/${campaignId}/leads/ids?status=pending`);
      if (!res.ok) throw new Error("Failed to fetch lead IDs");
      const { ids } = await res.json();
      setSelectedLeadIds(new Set(ids));
      setAllPendingMode(true);
    } catch (err) {
      toast({ title: "Error", description: "Could not select all pending leads", variant: "destructive" });
    }
  };

  const toggleLeadField = useCallback(
    async (outboundLeadId: string, field: "link_sent" | "replied" | "booked", currentValue: boolean) => {
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
      setAllPendingMode(false);
      setConfirmRemoveSelected(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to remove leads",
        variant: "destructive",
      });
    }
  };

  const handleMoveSelected = async () => {
    if (!campaignId || selectedLeadIds.size === 0 || !targetCampaignId) return;
    try {
      const result = await moveMutation.mutateAsync({
        campaignId,
        lead_ids: Array.from(selectedLeadIds),
        target_campaign_id: targetCampaignId,
        keep_in_source: keepInSource,
      });
      const action = keepInSource ? "copied" : "moved";
      toast({ title: keepInSource ? "Copied" : "Moved", description: `${result.moved} lead(s) ${action} to campaign.` });
      setSelectedLeadIds(new Set());
      setAllPendingMode(false);
      setShowMoveModal(false);
      setTargetCampaignId("");
      setKeepInSource(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to move leads",
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
  const progressColor = progressPct >= 80 ? "bg-green-500" : progressPct >= 30 ? "bg-yellow-500" : "bg-red-500";
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
      {/* Mobile Header */}
      <div className="md:hidden space-y-1">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => navigate("/campaigns")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Badge className={badge.className}>{badge.label}</Badge>
          <Button variant="ghost" size="sm" className="h-8 px-2 ml-auto" onClick={() => navigate(`/campaigns/${campaignId}/edit`)}>
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground pl-1">{campaign.name}</p>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/campaigns")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h3 className="text-xl font-bold">{campaign.name}</h3>
          <Badge className={badge.className}>{badge.label}</Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-[10px] font-normal">
                  {campaign.mode === "manual" ? "Manual" : "Auto"}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{campaign.mode === "manual" ? "Messages are sent manually" : "Messages are sent automatically on schedule"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/campaigns/${campaignId}/edit`)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
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
        <div className="hidden md:flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Performance</p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => recalcMutation.mutate(campaign._id)}
                  disabled={recalcMutation.isPending}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${recalcMutation.isPending ? "animate-spin" : ""}`} />
                  Recalc
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Recalculate performance stats from raw send data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {/* Primary metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <PrimaryStatCard label="Sent" value={s.sent} icon={<Send className="h-4 w-4 text-green-400" />} className="text-green-400"
            subtitle={s.total > 0 ? `${((s.sent || 0) / s.total * 100).toFixed(1)}% of total` : undefined} />
          <PrimaryStatCard label="Replied" value={s.replied || 0} icon={<MessageSquare className="h-4 w-4 text-purple-400" />} className="text-purple-400"
            subtitle={s.sent > 0 ? `${((s.replied || 0) / s.sent * 100).toFixed(1)}% of sent` : undefined} />
          <PrimaryStatCard label="Link Sent" value={s.link_sent || 0} icon={<Link className="h-4 w-4 text-orange-400" />} className="text-orange-400"
            subtitle={s.replied > 0 ? `${((s.link_sent || 0) / (s.replied || 1) * 100).toFixed(1)}% of replies` : undefined} />
          <PrimaryStatCard
            label="Booked"
            value={s.booked || 0}
            icon={<CalendarCheck className="h-4 w-4 text-teal-400" />}
            className="text-teal-400"
            subtitle={s.sent > 0 ? `${((s.booked || 0) / s.sent * 100).toFixed(1)}% of sent${(s.replied || 0) > 0 ? ` · ${((s.booked || 0) / (s.replied || 1) * 100).toFixed(1)}% of replies` : ""}` : undefined}
          />
        </div>
        {/* Divider between tiers */}
        <div className="hidden md:block border-t border-border/40" />
        {/* Secondary metrics – desktop only */}
        <div className="hidden md:grid grid-cols-4 gap-3">
          <SecondaryStatCard label="Total Leads" value={s.total} icon={<ListTodo className="h-3.5 w-3.5" />} />
          <SecondaryStatCard
            label="Pending"
            value={s.pending}
            icon={<Clock className="h-3.5 w-3.5" />}
            subtitle={s.pending > s.total ? "Includes retried leads" : undefined}
          />
          <SecondaryStatCard label="Failed" value={s.failed} icon={<XCircle className="h-3.5 w-3.5" />}
            subtitle={s.sent > 0 ? `${((s.failed || 0) / s.sent * 100).toFixed(1)}% of sent` : undefined} />
          <SecondaryStatCard label="Skipped" value={s.skipped} icon={<SkipForward className="h-3.5 w-3.5" />}
            subtitle={s.sent > 0 ? `${((s.skipped || 0) / s.sent * 100).toFixed(1)}% of sent` : undefined} />
        </div>
      </div>

      {/* Unified Status Bar – desktop only */}
      {sendersData && (
        <Card className="hidden md:block">
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Senders info */}
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="destructive"
                          className="cursor-pointer gap-1"
                          onClick={() => setShowSendersModal(true)}
                        >
                          <AlertTriangle className="h-3 w-3" />
                          {sendersData.summary.issues} issue{sendersData.summary.issues !== 1 ? "s" : ""}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          {sendersData.senders
                            .filter((s) => s.issue)
                            .map((s) => (
                              <p key={s.ig_username}>@{s.ig_username}: {s.issue}</p>
                            ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {/* Separator + Next send info (if active) */}
              {campaign.status === "active" && effectiveNextSend && (
                <>
                  <div className="h-4 w-px bg-border" />
                  <NextSendInfo nextSend={effectiveNextSend} />
                </>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowSendersModal(true)} className="text-xs">
              View Senders
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{processed} / {s.total} processed ({progressPct}%)</span>
        </div>
        <Progress value={progressPct} className="h-2 md:h-3" indicatorClassName={progressColor} />
      </div>

      {/* AI Report */}
      <Collapsible open={showAiReport} onOpenChange={setShowAiReport}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardContent className="py-3 px-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">AI Report</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showAiReport ? "rotate-180" : ""}`} />
            </CardContent>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4">
              <AIReportTab filterParams={{ campaign_id: campaignId }} />
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Leads */}
      <div className="space-y-3">
        {/* ── Mobile filters ── */}
        <div className="md:hidden space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={leadSearch}
              onChange={(e) => setLeadSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={leadStatusFilter} onValueChange={(v) => { setLeadStatusFilter(v); setLeadPage(1); }}>
              <SelectTrigger className="h-9 flex-1">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="queued">Queued</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>
            <Select value={leadSenderFilter} onValueChange={(v) => { setLeadSenderFilter(v); setLeadPage(1); }}>
              <SelectTrigger className="h-9 flex-1">
                <SelectValue placeholder="Sender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Senders</SelectItem>
                {(sendersData?.senders ?? []).map((sender) => (
                  <SelectItem key={sender._id ?? sender.ig_username} value={sender._id ?? sender.ig_username}>
                    {sender.display_name ? `${sender.display_name} (@${sender.ig_username})` : `@${sender.ig_username}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Desktop filters ── */}
        <div className="hidden md:flex items-end justify-between">
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
            <div className="flex flex-col gap-1.5 w-48">
              <Label>Sender</Label>
              <Select value={leadSenderFilter} onValueChange={(v) => { setLeadSenderFilter(v); setLeadPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Senders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Senders</SelectItem>
                  {(sendersData?.senders ?? []).map((sender) => (
                    <SelectItem key={sender._id ?? sender.ig_username} value={sender._id ?? sender.ig_username}>
                      {sender.display_name ? `${sender.display_name} (@${sender.ig_username})` : `@${sender.ig_username}`}
                    </SelectItem>
                  ))}
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
                {selectedPendingCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMoveModal(true)}
                    disabled={moveMutation.isPending}
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
                    Move {selectedPendingCount} Pending
                  </Button>
                )}
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
              <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setConfirmRemove(true)}>
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Remove Pending
              </Button>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
                  Columns
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="end">
                <div className="space-y-1">
                  {[
                    { key: "message", label: "Message" },
                    { key: "error", label: "Error" },
                  ].map((col) => (
                    <label key={col.key} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm">
                      <Checkbox
                        checked={visibleColumns[col.key] ?? false}
                        onCheckedChange={(checked) =>
                          setVisibleColumns((prev) => ({ ...prev, [col.key]: !!checked }))
                        }
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button size="sm" onClick={() => navigate(`/campaigns/${campaignId}/add-leads`)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Leads
            </Button>
          </div>
        </div>

        {/* ── Mobile card layout ── */}
        <div className="md:hidden space-y-2">
          {leadsLoading ? (
            <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">Loading...</div>
          ) : leads.length === 0 ? (
            <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">No leads found.</div>
          ) : (
            leads.map((cl) => {
              const effectiveStatus = cl.outbound_lead_id?.replied && cl.status !== "replied" ? "replied" : cl.status;
              const lb = LEAD_STATUS_BADGE[effectiveStatus] || LEAD_STATUS_BADGE.pending;
              const lead = cl.outbound_lead_id;
              const sender = cl.sender_id;
              const isExpanded = expandedLeadIds.has(cl._id);
              return (
                <div key={cl._id} className={`rounded-lg border bg-card${selectedLeadIds.has(cl._id) ? " bg-muted" : ""}`}>
                  {/* Primary row: name, status badge, replied/booked ticks */}
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <Checkbox
                      checked={selectedLeadIds.has(cl._id)}
                      onCheckedChange={() => toggleLeadSelection(cl._id)}
                    />
                    <div className="flex-1 min-w-0">
                      {lead ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => navigate(`/outbound-leads/${lead._id}`)}
                            className="font-medium text-foreground hover:underline text-sm truncate text-left"
                          >
                            @{lead.username}
                          </button>
                          <button
                            type="button"
                            onClick={() => { navigator.clipboard.writeText(lead.username); toast({ title: "Copied", description: `@${lead.username}` }); }}
                            className="shrink-0 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                      <Badge className={`${lb.className} text-[10px] mt-0.5`}>{lb.label}</Badge>
                    </div>

                    {/* Status ticks */}
                    <div className="flex items-center gap-3 shrink-0">
                      <label className="flex flex-col items-center gap-0.5 cursor-pointer">
                        <Checkbox
                          checked={lead?.link_sent ?? false}
                          onCheckedChange={() => lead && toggleLeadField(lead._id, "link_sent", lead.link_sent ?? false)}
                        />
                        <span className="text-[10px] text-muted-foreground leading-none">Link</span>
                      </label>
                      <label className="flex flex-col items-center gap-0.5 cursor-pointer">
                        <Checkbox
                          checked={lead?.replied ?? false}
                          onCheckedChange={() => lead && toggleLeadField(lead._id, "replied", lead.replied ?? false)}
                        />
                        <span className="text-[10px] text-muted-foreground leading-none">Reply</span>
                      </label>
                      <label className="flex flex-col items-center gap-0.5 cursor-pointer">
                        <Checkbox
                          checked={lead?.booked ?? false}
                          onCheckedChange={() => lead && toggleLeadField(lead._id, "booked", lead.booked ?? false)}
                        />
                        <span className="text-[10px] text-muted-foreground leading-none">Book</span>
                      </label>
                    </div>

                    {/* Expand toggle */}
                    <button
                      type="button"
                      onClick={() => toggleExpandLead(cl._id)}
                      className="shrink-0 p-1 rounded hover:bg-muted"
                    >
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform${isExpanded ? " rotate-180" : ""}`} />
                    </button>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t px-3 py-2.5 space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                        <div>
                          <span className="text-muted-foreground">Sender</span>
                          <p className="font-medium">{sender ? `@${sender.ig_username}` : cl.status === "pending" ? <span className="text-muted-foreground/60 italic font-normal">Unassigned</span> : "-"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sent At</span>
                          <p className="font-medium">{cl.sent_at ? formatDateTime(cl.sent_at) : "-"}</p>
                        </div>
                        {cl.template_index != null && (
                          <div>
                            <span className="text-muted-foreground">Template</span>
                            <p className="font-medium">#{cl.template_index + 1}</p>
                          </div>
                        )}
                        {cl.error && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Error</span>
                            <p className="text-red-400">{cl.error}</p>
                          </div>
                        )}
                      </div>
                      {(cl.custom_message || cl.message_used) && (
                        <div>
                          <span className="text-muted-foreground">Message</span>
                          <p className="text-foreground mt-0.5 whitespace-pre-wrap line-clamp-3">{cl.custom_message || cl.message_used}</p>
                        </div>
                      )}
                      <div className="flex justify-end pt-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 text-xs">
                              <MoreHorizontal className="h-3.5 w-3.5 mr-1" />
                              Actions
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
                                    onSuccess: () => { toast({ title: "Regenerated", description: "Message regenerated for this lead." }); },
                                    onError: (err) => { toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to regenerate", variant: "destructive" }); },
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
                                        onSuccess: () => { toast({ title: "Status updated", description: `Lead marked as ${badge?.label || ms}.` }); },
                                        onError: (err) => { toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to update", variant: "destructive" }); },
                                      },
                                    );
                                  }}
                                >
                                  <span className={cl.status === ms ? "font-semibold" : ""}>{badge?.label || ms}</span>
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Desktop table ── */}
        <div className="hidden md:block rounded-lg border bg-card">
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
                <TableHead className="text-center">Link Sent</TableHead>
                <TableHead className="text-center">Replied</TableHead>
                <TableHead className="text-center">Booked</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Sent At</TableHead>
                {visibleColumns.message && <TableHead>Message</TableHead>}
                {visibleColumns.error && <TableHead>Error</TableHead>}
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Select-all-pending banner */}
              {allPageSelected && !allPendingMode && (stats?.pending ?? 0) > leads.length && (
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableCell colSpan={9 + (visibleColumns.message ? 1 : 0) + (visibleColumns.error ? 1 : 0) + 1} className="py-2 text-center text-sm">
                    All {leads.length} leads on this page are selected.{" "}
                    <button
                      type="button"
                      className="text-primary underline underline-offset-2 hover:no-underline font-medium"
                      onClick={handleSelectAllPending}
                    >
                      Select all {stats?.pending} pending leads
                    </button>
                  </TableCell>
                </TableRow>
              )}
              {allPendingMode && (
                <TableRow className="bg-primary/10 hover:bg-primary/10">
                  <TableCell colSpan={9 + (visibleColumns.message ? 1 : 0) + (visibleColumns.error ? 1 : 0) + 1} className="py-2 text-center text-sm">
                    All {stats?.pending} pending leads are selected.{" "}
                    <button
                      type="button"
                      className="text-primary underline underline-offset-2 hover:no-underline font-medium"
                      onClick={() => { setSelectedLeadIds(new Set()); setAllPendingMode(false); }}
                    >
                      Clear selection
                    </button>
                  </TableCell>
                </TableRow>
              )}
              {leadsLoading ? (
                <TableRow>
                  <TableCell colSpan={9 + (visibleColumns.message ? 1 : 0) + (visibleColumns.error ? 1 : 0) + 1} className="h-24 text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9 + (visibleColumns.message ? 1 : 0) + (visibleColumns.error ? 1 : 0) + 1} className="h-24 text-center">
                    No qualified leads in this campaign.
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((cl) => {
                  const effectiveStatus = cl.outbound_lead_id?.replied && cl.status !== "replied" ? "replied" : cl.status;
                  const lb = LEAD_STATUS_BADGE[effectiveStatus] || LEAD_STATUS_BADGE.pending;
                  const lead = cl.outbound_lead_id;
                  const sender = cl.sender_id;
                  const profileUrl = lead ? (lead.profileLink || `https://instagram.com/${lead.username}`) : null;
                  return (
                    <TableRow key={cl._id} className="group">
                      <TableCell>
                        <Checkbox
                          checked={selectedLeadIds.has(cl._id)}
                          onCheckedChange={() => toggleLeadSelection(cl._id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {lead ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => navigate(`/outbound-leads/${lead._id}`)}
                              className="text-foreground hover:underline text-left"
                            >
                              @{lead.username}
                            </button>
                            <a
                              href={profileUrl!}
                              target="_blank" rel="noopener noreferrer"
                              className="shrink-0 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <button
                              type="button"
                              onClick={() => { navigator.clipboard.writeText(lead.username); toast({ title: "Copied", description: `@${lead.username}` }); }}
                              className="shrink-0 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {sender ? `@${sender.ig_username}` : cl.status === "pending" ? (
                          <span className="text-muted-foreground/60 italic">Unassigned</span>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge className={lb.className}>{lb.label}</Badge>
                          {cl.custom_message && (
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-purple-400 cursor-default">
                                    <Sparkles className="h-3 w-3" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[260px] whitespace-pre-wrap text-xs">
                                  {cl.custom_message.length > 120 ? cl.custom_message.slice(0, 120) + "…" : cl.custom_message}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={lead?.link_sent ?? false}
                          onCheckedChange={() => lead && toggleLeadField(lead._id, "link_sent", lead.link_sent ?? false)}
                          className="mx-auto"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={lead?.replied ?? false}
                          onCheckedChange={() => lead && toggleLeadField(lead._id, "replied", lead.replied ?? false)}
                          className="mx-auto"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={lead?.booked ?? false}
                          onCheckedChange={() => lead && toggleLeadField(lead._id, "booked", lead.booked ?? false)}
                          className="mx-auto"
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {cl.template_index != null ? `#${cl.template_index + 1}` : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {cl.sent_at ? formatDateTime(cl.sent_at) : "-"}
                      </TableCell>
                      {visibleColumns.message && (
                        <TableCell className="max-w-[150px] text-muted-foreground">
                          {(cl.custom_message || cl.message_used) ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="flex items-center gap-1 text-left max-w-full hover:text-foreground transition-colors">
                                  {cl.custom_message && (
                                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 shrink-0 bg-purple-500/15 text-purple-400 border-purple-500/30">
                                      {cl.ai_provider === "claude" ? "Claude" : cl.ai_provider === "openai" ? "OpenAI" : cl.ai_provider === "gemini" ? "Gemini" : "AI"}
                                    </Badge>
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
                      )}
                      {visibleColumns.error && (
                        <TableCell className="max-w-[150px] truncate">
                          {cl.error ? (
                            <span className="text-red-400 text-xs">{cl.error}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {lead && (
                              <DropdownMenuItem asChild>
                                <a
                                  href={profileUrl!}
                                  target="_blank" rel="noopener noreferrer"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                  View Profile
                                </a>
                              </DropdownMenuItem>
                            )}
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

      {/* Move Leads Modal */}
      <Dialog open={showMoveModal} onOpenChange={(open) => { setShowMoveModal(open); if (!open) { setTargetCampaignId(""); setKeepInSource(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{keepInSource ? "Copy" : "Move"} Pending Leads</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {selectedPendingCount} pending lead{selectedPendingCount !== 1 ? "s" : ""} will be {keepInSource ? "copied" : "moved"} to another campaign. Any generated messages will be carried over.
            </p>
            <div className="space-y-1.5">
              <Label>Target Campaign</Label>
              <Select value={targetCampaignId} onValueChange={setTargetCampaignId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a campaign..." />
                </SelectTrigger>
                <SelectContent>
                  {otherCampaigns.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                  {otherCampaigns.length === 0 && (
                    <SelectItem value="__none__" disabled>No other campaigns</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={keepInSource}
                onCheckedChange={(checked) => setKeepInSource(!!checked)}
              />
              <span className="text-sm">Keep leads in this campaign too</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowMoveModal(false); setTargetCampaignId(""); setKeepInSource(false); }}>Cancel</Button>
            <Button
              disabled={!targetCampaignId || moveMutation.isPending}
              onClick={handleMoveSelected}
            >
              {moveMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              {keepInSource ? "Copy" : "Move"} Leads
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
      <Dialog open={showAiModal} onOpenChange={(open) => { setShowAiModal(open); if (!open) setPreviewResult(null); }}>
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
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-medium">AI Provider</Label>
              <Select value={aiProvider} onValueChange={(v) => setAiProvider(v as "openai" | "claude" | "gemini")}>
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
                      <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                        <path d="m3.127 10.604 3.135-1.76.053-.153-.053-.085H6.11l-.525-.032-1.791-.048-1.554-.065-1.505-.08-.38-.081L0 7.832l.036-.234.32-.214.455.04 1.009.069 1.513.105 1.097.064 1.626.17h.259l.036-.105-.089-.065-.068-.064-1.566-1.062-1.695-1.121-.887-.646-.48-.327-.243-.306-.104-.67.435-.48.585.04.15.04.593.456 1.267.981 1.654 1.218.242.202.097-.068.012-.049-.109-.181-.9-1.626-.96-1.655-.428-.686-.113-.411a2 2 0 0 1-.068-.484l.496-.674L4.446 0l.662.089.279.242.411.94.666 1.48 1.033 2.014.302.597.162.553.06.17h.105v-.097l.085-1.134.157-1.392.154-1.792.052-.504.25-.605.497-.327.387.186.319.456-.045.294-.19 1.23-.37 1.93-.243 1.29h.142l.161-.16.654-.868 1.097-1.372.484-.545.565-.601.363-.287h.686l.505.751-.226.775-.707.895-.585.759-.839 1.13-.524.904.048.072.125-.012 1.897-.403 1.024-.186 1.223-.21.553.258.06.263-.218.536-1.307.323-1.533.307-2.284.54-.028.02.032.04 1.029.098.44.024h1.077l2.005.15.525.346.315.424-.053.323-.807.411-3.631-.863-.872-.218h-.12v.073l.726.71 1.331 1.202 1.667 1.55.084.383-.214.302-.226-.032-1.464-1.101-.565-.497-1.28-1.077h-.084v.113l.295.432 1.557 2.34.08.718-.112.234-.404.141-.444-.08-.911-1.28-.94-1.44-.759-1.291-.093.053-.448 4.821-.21.246-.484.186-.403-.307-.214-.496.214-.98.258-1.28.21-1.016.19-1.263.112-.42-.008-.028-.092.012-.953 1.307-1.448 1.957-1.146 1.227-.274.109-.477-.247.045-.44.266-.39 1.586-2.018.956-1.25.617-.723-.004-.105h-.036l-4.212 2.736-.75.096-.324-.302.04-.496.154-.162 1.267-.871z" />
                      </svg>
                      Claude
                    </span>
                  </SelectItem>
                  <SelectItem value="gemini">
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12c.966 0 1.912-.115 2.816-.332A11.963 11.963 0 0 0 24 12C24 5.372 18.628 0 12 0zm5.666 16.18a.644.644 0 0 1-.61.436h-.05a.644.644 0 0 1-.596-.404l-1.36-3.36h-6.1l-1.36 3.36a.644.644 0 0 1-.596.404h-.05a.644.644 0 0 1-.61-.436.644.644 0 0 1 .014-.484L10.84 6.38a1.292 1.292 0 0 1 2.32 0l4.492 9.316a.644.644 0 0 1 .014.484zM12 7.528 9.388 12.14h5.224L12 7.528z" />
                      </svg>
                      Gemini
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            {/* Prompt History */}
            {campaign.prompt_history && campaign.prompt_history.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">Prompt History</Label>
                <div className="max-h-32 overflow-y-auto space-y-1 border rounded-md p-2">
                  {[...campaign.prompt_history].reverse().map((entry, i) => (
                    <button
                      key={i}
                      className="w-full text-left text-xs rounded px-2 py-1.5 hover:bg-muted/50 transition-colors flex items-center justify-between gap-2"
                      onClick={() => setAiPrompt(entry.prompt)}
                    >
                      <span className="truncate text-foreground">{entry.prompt.slice(0, 80)}{entry.prompt.length > 80 ? "…" : ""}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {entry.leads_count} leads · {entry.provider || "openai"} · {new Date(entry.used_at).toLocaleDateString()}
                      </span>
                    </button>
                  ))}
                </div>
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
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!campaignId || !aiPrompt.trim()) return;
                  setPreviewResult(null);
                  previewMutation.mutate(
                    { campaignId, prompt: aiPrompt.trim(), provider: aiProvider },
                    {
                      onSuccess: (data) => setPreviewResult(data),
                      onError: (err) => {
                        toast({ title: "Preview Failed", description: err instanceof Error ? err.message : "Failed to preview", variant: "destructive" });
                      },
                    },
                  );
                }}
                disabled={!aiPrompt.trim() || previewMutation.isPending || campaign.ai_personalization?.status === "generating"}
              >
                {previewMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Eye className="h-3.5 w-3.5 mr-1" />
                )}
                {previewMutation.isPending ? "Previewing..." : "Preview"}
              </Button>
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
            {previewResult && (
              <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Preview for: <span className="font-medium text-foreground">
                      {previewResult.lead_name}
                      {previewResult.lead_username && ` (@${previewResult.lead_username})`}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setPreviewResult(null)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {previewResult.lead_bio && (
                  <p className="text-xs text-muted-foreground italic">Bio: {previewResult.lead_bio}</p>
                )}
                <div className="rounded-md bg-background border p-3 text-sm whitespace-pre-wrap">
                  {previewResult.generated_message || "No message generated."}
                </div>
              </div>
            )}
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
      <Dialog
        open={showSendersModal}
        onOpenChange={(open) => {
          setShowSendersModal(open);
          if (!open) setEditingSenders(false);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle>Campaign Senders</DialogTitle>
              {campaign && (campaign.status === "draft" || campaign.status === "paused") && !editingSenders && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedAccountIds(campaign.outbound_account_ids);
                    setEditingSenders(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit Senders
                </Button>
              )}
            </div>
          </DialogHeader>

          {editingSenders && campaign ? (
            <div className="flex flex-col min-h-0 gap-4">
              <p className="text-sm text-muted-foreground shrink-0">
                Select which outbound accounts to use for this campaign.
              </p>
              {outboundAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No outbound accounts available.</p>
              ) : (
                <div className="border rounded-md overflow-y-auto min-h-0">
                  {outboundAccounts.map((a, i) => (
                    <label
                      key={a._id}
                      className={`flex items-center gap-2.5 cursor-pointer px-3 py-2 transition-colors hover:bg-muted/50 ${
                        i % 2 === 1 ? "bg-muted/25" : ""
                      }`}
                    >
                      <Checkbox
                        checked={selectedAccountIds.includes(a._id)}
                        onCheckedChange={() => {
                          setSelectedAccountIds((prev) =>
                            prev.includes(a._id)
                              ? prev.filter((id) => id !== a._id)
                              : [...prev, a._id]
                          );
                        }}
                      />
                      {a.linked_sender_status === "online" ? (
                        <span className="h-2 w-2 rounded-full bg-green-400 shrink-0" title="Browser connected" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-zinc-500 shrink-0" title="Browser offline" />
                      )}
                      <span className="text-sm">@{a.username}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          a.status === "ready"
                            ? "text-green-400 border-green-500/30"
                            : a.status === "warming"
                            ? "text-yellow-400 border-yellow-500/30"
                            : "text-zinc-400 border-zinc-500/30"
                        }`}
                      >
                        {a.status}
                      </Badge>
                      {a.isConnectedToAISetter && (
                        <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0" title="AI connected" />
                      )}
                    </label>
                  ))}
                </div>
              )}
              <DialogFooter className="shrink-0">
                <Button variant="ghost" size="sm" onClick={() => setEditingSenders(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={updateCampaignMutation.isPending}
                  onClick={async () => {
                    try {
                      await updateCampaignMutation.mutateAsync({
                        id: campaign._id,
                        body: { outbound_account_ids: selectedAccountIds },
                      });
                      queryClient.invalidateQueries({ queryKey: ["campaign-senders"] });
                      toast({ title: "Senders updated", description: "Campaign senders have been updated." });
                      setEditingSenders(false);
                    } catch {
                      toast({ title: "Error", description: "Failed to update senders.", variant: "destructive" });
                    }
                  }}
                >
                  {updateCampaignMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Saving...</>
                  ) : (
                    "Save"
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : sendersData ? (
            <div className="flex flex-col min-h-0 gap-4">
              {/* Summary bar */}
              <div className="flex gap-4 text-sm shrink-0">
                <span>Total: <span className="font-medium">{sendersData.summary.total}</span></span>
                <span>Online: <span className="font-medium text-green-400">{sendersData.summary.online}</span></span>
                <span>Offline: <span className="font-medium text-muted-foreground">{sendersData.summary.offline}</span></span>
                {sendersData.summary.issues > 0 && (
                  <span>Issues: <span className="font-medium text-red-400">{sendersData.summary.issues}</span></span>
                )}
              </div>

              {/* Senders table */}
              <div className="rounded-lg border bg-card overflow-auto min-h-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Reply Rate (7d)</TableHead>
                      <TableHead>AI</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead className="text-right">Daily Limit</TableHead>
                      <TableHead className="text-right">Sent Today</TableHead>
                      <TableHead>Health</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sendersData.senders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-16 text-center text-muted-foreground">
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
          ) : (
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

function NextSendInfo({ nextSend }: { nextSend: import("@/hooks/useCampaigns").CampaignNextSend }) {
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
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Timer className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Next send</span>
        {nextSend.next_send_at && countdown ? (
          <span className="text-sm font-semibold text-green-400">{countdown}</span>
        ) : hasReason ? (
          <span className="text-sm text-yellow-400">{nextSend.reason}</span>
        ) : (
          <span className="text-sm text-muted-foreground">--</span>
        )}
      </div>

      {nextSend.delay_seconds && (
        <>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Interval</span>
            <span className="text-sm font-medium">~{Math.round(nextSend.delay_seconds / 60)}m</span>
          </div>
        </>
      )}

      {nextSend.last_sent_at && (
        <>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Last sent</span>
            <span className="text-sm font-medium">{formatRelative(nextSend.last_sent_at)}</span>
          </div>
        </>
      )}
    </div>
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
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <div className="text-muted-foreground/50">{icon}</div>
        </div>
        <p className="text-lg font-bold text-muted-foreground">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
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
  const [copied, setCopied] = useState(false);
  const health = HEALTH_CONFIG[sender.health] || HEALTH_CONFIG.good;
  const dot = SENDER_STATUS_DOT[sender.status] || SENDER_STATUS_DOT.offline;
  const limitPct = sender.daily_limit > 0 ? Math.round((sender.sent_today / sender.daily_limit) * 100) : 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(sender.ig_username);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <TableRow className={sender.health === "risk" ? "bg-red-500/5" : undefined}>
      <TableCell className="font-medium">
        <div className="flex items-center gap-1.5">
          <span>@{sender.ig_username}</span>
          <button
            onClick={handleCopy}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Copy username"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dot}`} />
          <span className="text-sm capitalize">{sender.status}</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        {sender.reply_rate_7d !== null ? (
          <span className={sender.reply_rate_7d >= 10 ? "text-green-400 font-medium" : "text-muted-foreground"}>
            {sender.reply_rate_7d}%
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        {sender.is_connected_to_ai ? (
          <Sparkles className="h-4 w-4 text-purple-400" />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
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
        {sender.issue ? (
          <Badge className={health.className}>{sender.issue}</Badge>
        ) : (
          <span className={`inline-flex h-2 w-2 rounded-full ${dot}`} />
        )}
      </TableCell>
    </TableRow>
  );
}
