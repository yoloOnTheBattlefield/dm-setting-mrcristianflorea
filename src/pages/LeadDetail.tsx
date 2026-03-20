import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { ApiLead } from "@/lib/types";
import { LeadDetailSkeleton } from "@/components/skeletons";
import {
  AlertCircle,
  RefreshCw,
  DollarSign,
  Star,
  CheckCircle,
  Link2,
  Unlink,
  Search,
  Loader2,
  Instagram,
  Mail,
  Clock,
  FileText,
  MessageSquare,
  StickyNote,
  CalendarClock,
  SquareCheckBig,
  Plus,
  Trash2,
  Ghost,
  X,
  Send,
  Check,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Copy,
  AlertTriangle,
  Keyboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { API_URL, fetchWithAuth } from "@/lib/api";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  useLeadNotes,
  useCreateLeadNote,
  useDeleteLeadNote,
} from "@/hooks/useLeadNotes";
import {
  useLeadTasks,
  useCreateLeadTask,
  useUpdateLeadTask,
  useDeleteLeadTask,
} from "@/hooks/useLeadTasks";
import { useLeadConversation } from "@/hooks/useLeadConversation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "")
    .replace(/javascript:/gi, "");
}

function parseBoldSectionsToObject(str: string) {
  const regex = /<b>(.*?)<\/b>\s*([\s\S]*?)(?=<b>|$)/g;
  const obj: Record<string, string> = {};
  let match;
  while ((match = regex.exec(str)) !== null) {
    obj[match[1].trim()] = match[2].replace(/\n+/g, "\n").trim();
  }
  return obj;
}

function SummarySections({ html }: { html: string }) {
  const sections = parseBoldSectionsToObject(html);
  const entries = Object.entries(sections);

  if (entries.length === 0) {
    return (
      <div
        className="prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {entries.map(([title, content]) => (
        <div key={title} className="rounded-lg border bg-muted/30 p-3 space-y-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </h4>
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {String(content)}
          </p>
        </div>
      ))}
    </div>
  );
}

async function fetchLead(contactId: string): Promise<ApiLead> {
  const response = await fetchWithAuth(`${API_URL}/leads/${contactId}`);
  if (!response.ok) throw new Error(`Failed to fetch lead: ${response.status}`);
  return response.json();
}

function formatShortDate(dateString: string | null): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAbsoluteDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeAgo(dateString: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatShortDate(dateString);
}

function daysBetween(dateA: string, dateB: string | null): number {
  const a = new Date(dateA).getTime();
  const b = dateB ? new Date(dateB).getTime() : Date.now();
  return Math.floor(Math.abs(b - a) / (1000 * 60 * 60 * 24));
}

function getScoreInfo(score: number | null | undefined): {
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
} {
  if (score == null) return { label: "—", color: "gray", bgClass: "bg-muted", textClass: "text-muted-foreground" };
  if (score >= 7) return { label: `${score}/10`, color: "green", bgClass: "bg-emerald-100 dark:bg-emerald-950", textClass: "text-emerald-700 dark:text-emerald-400" };
  if (score >= 4) return { label: `${score}/10`, color: "yellow", bgClass: "bg-amber-100 dark:bg-amber-950", textClass: "text-amber-700 dark:text-amber-400" };
  return { label: `${score}/10`, color: "red", bgClass: "bg-red-100 dark:bg-red-950", textClass: "text-red-700 dark:text-red-400" };
}

// Pipeline stages in order
const PIPELINE_STAGES = [
  { key: "new", label: "New", field: null, bg: "bg-slate-500", ring: "ring-slate-500", text: "text-slate-500" },
  { key: "link_sent", label: "Link Sent", field: "link_sent_at", bg: "bg-blue-500", ring: "ring-blue-500", text: "text-blue-500" },
  { key: "follow_up", label: "Follow Up", field: "follow_up_at", bg: "bg-amber-500", ring: "ring-amber-500", text: "text-amber-500" },
  { key: "booked", label: "Booked", field: "booked_at", bg: "bg-emerald-500", ring: "ring-emerald-500", text: "text-emerald-500" },
  { key: "closed", label: "Closed", field: "closed_at", bg: "bg-emerald-700", ring: "ring-emerald-700", text: "text-emerald-700" },
] as const;

function getCurrentStageIndex(lead: ApiLead): number {
  if (lead.closed_at) return 4;
  if (lead.booked_at) return 3;
  if (lead.follow_up_at) return 2;
  if (lead.link_sent_at) return 1;
  return 0;
}

function getStageEnteredDate(lead: ApiLead, stageIndex: number): string | null {
  if (stageIndex === 0) return lead.date_created;
  const field = PIPELINE_STAGES[stageIndex].field;
  if (!field) return null;
  return (lead as Record<string, unknown>)[field] as string | null;
}

function getInitials(first: string, last: string): string {
  return (
    `${(first || "")[0] || ""}${(last || "")[0] || ""}`.toUpperCase() || "?"
  );
}

// Relative time display with absolute tooltip on hover
function RelativeTime({ date }: { date: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-xs text-muted-foreground cursor-default">
          {timeAgo(date)}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{formatAbsoluteDateTime(date)}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// OutboundLeadLinker (compact version for sidebar)
// ---------------------------------------------------------------------------

interface OutboundLeadResult {
  _id: string;
  username: string;
  fullName: string;
  followersCount?: number;
}

function OutboundLeadLinker({
  leadId,
  outboundLeadId,
  leadName,
  leadCreatedAt,
  onLinked,
}: {
  leadId: string;
  outboundLeadId?: string | null;
  leadName: string;
  leadCreatedAt?: string | null;
  onLinked: () => void;
}) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<OutboundLeadResult[]>([]);
  const [autoResults, setAutoResults] = useState<OutboundLeadResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [linkedLead, setLinkedLead] = useState<OutboundLeadResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [autoSearched, setAutoSearched] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!outboundLeadId) { setLinkedLead(null); return; }
    fetchWithAuth(`${API_URL}/outbound-leads/${outboundLeadId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setLinkedLead(d); });
  }, [outboundLeadId]);

  useEffect(() => {
    if (outboundLeadId || autoSearched || leadName.trim().length < 2) return;
    setAutoSearched(true);
    const sp = new URLSearchParams({ search: leadName.trim(), limit: "5", page: "1" });
    fetchWithAuth(`${API_URL}/outbound-leads?${sp}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.leads?.length) setAutoResults(d.leads); });
  }, [outboundLeadId, leadName, autoSearched]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setShowResults(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const searchOutbound = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setIsSearching(true);
    try {
      const sp = new URLSearchParams({ search: q.trim(), limit: "10", page: "1" });
      const res = await fetchWithAuth(`${API_URL}/outbound-leads?${sp}`);
      if (res.ok) setResults((await res.json()).leads || []);
    } finally { setIsSearching(false); }
  }, []);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setShowResults(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchOutbound(val), 300);
  };

  const linkOutbound = async (outboundId: string) => {
    setIsLinking(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outbound_lead_id: outboundId }),
      });
      if (res.ok) {
        await fetchWithAuth(`${API_URL}/outbound-leads/${outboundId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            replied: true,
            replied_at: leadCreatedAt || new Date().toISOString(),
          }),
        }).catch(() => {});
        toast({ title: "Linked", description: "Outbound lead linked and marked as replied." });
        setSearch(""); setResults([]); setAutoResults([]); setShowResults(false);
        onLinked();
      } else {
        toast({ title: "Error", description: "Failed to link", variant: "destructive" });
      }
    } finally { setIsLinking(false); }
  };

  const unlinkOutbound = async () => {
    setIsLinking(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outbound_lead_id: null }),
      });
      if (res.ok) {
        toast({ title: "Unlinked", description: "Outbound lead unlinked." });
        setLinkedLead(null);
        onLinked();
      } else {
        toast({ title: "Error", description: "Failed to unlink", variant: "destructive" });
      }
    } finally { setIsLinking(false); }
  };

  if (outboundLeadId && linkedLead) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Link2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">@{linkedLead.username}</p>
            <p className="text-xs text-muted-foreground truncate">
              {linkedLead.fullName}
              {linkedLead.followersCount != null && ` · ${linkedLead.followersCount.toLocaleString()}`}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={unlinkOutbound} disabled={isLinking}>
          <Unlink className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {autoResults.length > 0 && !dismissed && (
        <div className="rounded-md border border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30 p-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
              Match{autoResults.length > 1 ? "es" : ""} for "{leadName}"
            </p>
            <Button variant="ghost" size="sm" className="h-5 px-1 text-xs" onClick={() => setDismissed(true)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          {autoResults.map((ob) => (
            <button key={ob._id} className="flex w-full items-center justify-between rounded bg-white dark:bg-background border px-2 py-1.5 text-left hover:bg-accent transition-colors" onClick={() => linkOutbound(ob._id)} disabled={isLinking}>
              <span className="text-xs font-medium truncate">@{ob.username}</span>
              <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      )}
      <div ref={wrapperRef} className="relative">
        <div className="relative">
          <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search outbound leads..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => search.trim().length >= 2 && setShowResults(true)}
            className="pl-7 h-8 text-sm"
          />
          {isSearching && <Loader2 className="absolute right-2 top-2 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
        {showResults && results.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
            {results.map((ob) => (
              <button key={ob._id} className="flex w-full items-center justify-between px-2 py-1.5 text-left hover:bg-accent transition-colors" onClick={() => linkOutbound(ob._id)} disabled={isLinking}>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">@{ob.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{ob.fullName}</p>
                </div>
                <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
        {showResults && search.trim().length >= 2 && !isSearching && results.length === 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg px-2 py-3 text-center text-xs text-muted-foreground">
            No outbound leads found
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LeadDetail
// ---------------------------------------------------------------------------

const STUCK_THRESHOLD_DAYS = 5;

export default function LeadDetail() {
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [contractInput, setContractInput] = useState("");
  const [noteText, setNoteText] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [activeComposeTab, setActiveComposeTab] = useState("note");
  const [showGhostedDialog, setShowGhostedDialog] = useState(false);
  const [followUpPopoverOpen, setFollowUpPopoverOpen] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  // Fetch lead IDs for prev/next navigation
  const { data: leadIds = [] } = useQuery({
    queryKey: ["lead-ids"],
    queryFn: async () => {
      const res = await fetchWithAuth(`${API_URL}/leads?limit=500&sort_by=date_created&sort_order=desc&exclude_linked=true`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.leads || data).map((l: { _id: string }) => l._id);
    },
    staleTime: 1000 * 60 * 5,
  });

  const currentIndex = contactId ? leadIds.indexOf(contactId) : -1;
  const prevLeadId = currentIndex > 0 ? leadIds[currentIndex - 1] : null;
  const nextLeadId = currentIndex >= 0 && currentIndex < leadIds.length - 1 ? leadIds[currentIndex + 1] : null;

  // Keyboard navigation (J/K + arrow keys + shortcuts)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key) {
        case "ArrowLeft":
        case "j":
          if (prevLeadId) navigate(`/lead/${prevLeadId}`);
          break;
        case "ArrowRight":
        case "k":
          if (nextLeadId) navigate(`/lead/${nextLeadId}`);
          break;
        case "n":
          e.preventDefault();
          setActiveComposeTab("note");
          setTimeout(() => noteRef.current?.focus(), 50);
          break;
        case "f":
          e.preventDefault();
          setActiveComposeTab("followup");
          break;
        case "t":
          e.preventDefault();
          setActiveComposeTab("task");
          break;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevLeadId, nextLeadId, navigate]);

  const {
    data: lead,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["lead", contactId],
    queryFn: () => fetchLead(contactId!),
    enabled: !!contactId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const { data: notes = [] } = useLeadNotes(lead?._id);
  const { data: tasks = [] } = useLeadTasks(lead?._id);
  const { data: conversationData } = useLeadConversation(lead?._id);
  const [linkConvOpen, setLinkConvOpen] = useState(false);
  const { data: allConversations } = useQuery<{ conversations: import("@/lib/types").IgConversation[] }>({
    queryKey: ["ig-conversations-list"],
    queryFn: async () => {
      const res = await fetchWithAuth(`${API_URL}/api/ig-conversations?limit=100`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: linkConvOpen,
  });
  const linkConversation = useMutation({
    mutationFn: async (conversationId: string) => {
      const res = await fetchWithAuth(`${API_URL}/api/ig-conversations/${conversationId}/link-lead`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: lead!._id }),
      });
      if (!res.ok) throw new Error("Failed to link");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-conversation", lead!._id] });
      setLinkConvOpen(false);
      toast({ title: "Conversation linked" });
    },
    onError: () => toast({ title: "Failed to link conversation", variant: "destructive" }),
  });
  const createNote = useCreateLeadNote();
  const deleteNote = useDeleteLeadNote();
  const createTask = useCreateLeadTask();
  const updateTask = useUpdateLeadTask();
  const deleteTask = useDeleteLeadTask();

  const patchLead = async (body: Record<string, unknown>, successMsg: string) => {
    if (!contactId) return;
    setIsSaving(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/leads/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["lead", contactId] });
        toast({ title: "Success", description: successMsg });
      } else {
        const data = await response.json().catch(() => ({}));
        toast({ title: "Error", description: data.error || "Failed to update", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to connect", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetStage = (stageIndex: number) => {
    if (!lead) return;
    const currentSI = getCurrentStageIndex(lead);
    if (stageIndex === currentSI) return;

    const body: Record<string, unknown> = {};

    if (stageIndex === 0) {
      for (const s of PIPELINE_STAGES) {
        if (s.field) body[s.field] = null;
      }
    } else if (stageIndex > currentSI) {
      const stage = PIPELINE_STAGES[stageIndex];
      if (stage.field) body[stage.field] = new Date().toISOString();
    } else {
      for (let i = stageIndex + 1; i < PIPELINE_STAGES.length; i++) {
        const s = PIPELINE_STAGES[i];
        if (s.field) body[s.field] = null;
      }
    }

    patchLead(body, `Stage set to ${PIPELINE_STAGES[stageIndex].label}`);
  };

  const handleAddNote = () => {
    if (!noteText.trim() || !lead) return;
    createNote.mutate(
      { lead_id: lead._id, content: noteText.trim() },
      { onSuccess: () => setNoteText("") }
    );
  };

  const handleAddTask = () => {
    if (!taskTitle.trim() || !lead) return;
    createTask.mutate(
      { lead_id: lead._id, title: taskTitle.trim(), due_date: taskDueDate || null },
      { onSuccess: () => { setTaskTitle(""); setTaskDueDate(""); } }
    );
  };

  const handleScheduleFollowUp = (date: Date) => {
    patchLead({ follow_up_at: date.toISOString() }, "Follow-up scheduled");
    setFollowUpDate("");
    setFollowUpPopoverOpen(false);
  };

  const handleGhosted = (scheduleReengagement: boolean) => {
    const body: Record<string, unknown> = { ghosted_at: new Date().toISOString() };
    if (scheduleReengagement) {
      const reengageDate = new Date();
      reengageDate.setDate(reengageDate.getDate() + 30);
      body.follow_up_at = reengageDate.toISOString();
    }
    patchLead(body, scheduleReengagement ? "Marked ghosted — re-engagement scheduled in 30 days" : "Marked as ghosted");
    setShowGhostedDialog(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard` });
  };

  // Loading / Error / Not Found
  if (isLoading) return <LeadDetailSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">Failed to load lead</h2>
          <p className="text-muted-foreground mb-4">{error instanceof Error ? error.message : "An unknown error occurred"}</p>
          <Button onClick={() => refetch()} variant="outline"><RefreshCw className="h-4 w-4 mr-2" />Try Again</Button>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Lead not found</h2>
        </div>
      </div>
    );
  }

  const leadName = `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim() || "Unknown";
  const currentStageIndex = getCurrentStageIndex(lead);
  const isGhosted = !!lead.ghosted_at;
  const openTasks = tasks.filter((t) => !t.completed_at);
  const completedTasks = tasks.filter((t) => t.completed_at);
  const igHandle = lead.ig_username?.replace(/^@/, "") || null;
  const scoreInfo = getScoreInfo(lead.score);

  // Days in current stage
  const stageEnteredDate = getStageEnteredDate(lead, currentStageIndex);
  const daysInStage = stageEnteredDate ? daysBetween(stageEnteredDate, null) : 0;

  // Last activity date (for stuck detection)
  const allActivityDates = [
    lead.date_created,
    lead.link_sent_at,
    lead.follow_up_at,
    lead.booked_at,
    lead.closed_at,
    lead.ghosted_at,
    ...notes.map((n) => n.createdAt),
    ...(conversationData?.messages?.length ? [conversationData.messages[conversationData.messages.length - 1].timestamp] : []),
  ].filter(Boolean) as string[];
  const lastActivityDate = allActivityDates.length > 0
    ? allActivityDates.reduce((latest, d) => (new Date(d) > new Date(latest) ? d : latest))
    : lead.date_created;
  const daysSinceActivity = daysBetween(lastActivityDate, null);
  const isStuck = daysSinceActivity >= STUCK_THRESHOLD_DAYS && currentStageIndex < 4;

  // Last contacted (last outbound DM or note)
  const lastOutboundMsg = conversationData?.messages?.filter((m) => m.direction === "outbound").slice(-1)[0];
  const lastContactedDate = lastOutboundMsg?.timestamp || null;

  // Next follow-up
  const hasFollowUp = !!lead.follow_up_at;
  const followUpIsPast = hasFollowUp && new Date(lead.follow_up_at!) < new Date();
  const nextTask = openTasks
    .filter((t) => t.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())[0];

  // Build unified activity feed
  const activityItems: {
    type: "note" | "stage" | "task_completed";
    date: string;
    id: string;
    data: Record<string, unknown>;
  }[] = [];

  for (const n of notes) {
    activityItems.push({
      type: "note",
      date: n.createdAt,
      id: `note-${n._id}`,
      data: { content: n.content, author: n.author_name, noteId: n._id, leadId: n.lead_id },
    });
  }

  const stageEvents = [
    { label: "Created", date: lead.date_created, icon: "created" },
    { label: "Link Sent", date: lead.link_sent_at, icon: "link_sent" },
    { label: "Follow Up", date: lead.follow_up_at, icon: "follow_up" },
    { label: "Booked", date: lead.booked_at, icon: "booked" },
    { label: "Ghosted", date: lead.ghosted_at, icon: "ghosted" },
    { label: "Closed", date: lead.closed_at, icon: "closed" },
  ];
  for (const ev of stageEvents) {
    if (ev.date) {
      activityItems.push({
        type: "stage",
        date: ev.date,
        id: `stage-${ev.icon}`,
        data: { label: ev.label, icon: ev.icon },
      });
    }
  }

  for (const t of completedTasks) {
    activityItems.push({
      type: "task_completed",
      date: t.completed_at!,
      id: `task-${t._id}`,
      data: { title: t.title },
    });
  }

  activityItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Follow-up preset helpers
  const getPresetDate = (preset: "today" | "tomorrow" | "3days") => {
    const d = new Date();
    if (preset === "tomorrow") d.setDate(d.getDate() + 1);
    if (preset === "3days") d.setDate(d.getDate() + 3);
    d.setHours(9, 0, 0, 0);
    return d;
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        {/* Breadcrumb + prev/next nav */}
        <div className="flex items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/contacts/all">Leads</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{leadName}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={!prevLeadId}
                  onClick={() => prevLeadId && navigate(`/lead/${prevLeadId}`)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">Previous lead (J or &larr;)</p></TooltipContent>
            </Tooltip>
            {currentIndex >= 0 && leadIds.length > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums px-1">
                {currentIndex + 1} of {leadIds.length} Leads
              </span>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={!nextLeadId}
                  onClick={() => nextLeadId && navigate(`/lead/${nextLeadId}`)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">Next lead (K or &rarr;)</p></TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* ── Header ── */}
        <div className="space-y-3">
          {/* Row 1: Avatar + Name + Score Badge + Follow-Up Date + Overflow Menu */}
          <div className="flex items-start gap-3 min-w-0">
            <Avatar className="h-14 w-14 text-lg shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(lead.first_name, lead.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight truncate">{leadName}</h1>
                {igHandle && (
                  <a
                    href={`https://instagram.com/${igHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Instagram className="h-3.5 w-3.5" />
                    <span>@{igHandle}</span>
                  </a>
                )}
                {/* Lead Score Badge */}
                {lead.score != null && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className={cn("shrink-0 font-semibold", scoreInfo.bgClass, scoreInfo.textClass)}>
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        {scoreInfo.label}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent><p className="text-xs">Lead Score</p></TooltipContent>
                  </Tooltip>
                )}
                {isGhosted && (
                  <Badge variant="destructive" className="shrink-0">
                    <Ghost className="h-3 w-3 mr-1" />Ghosted
                  </Badge>
                )}
                {/* Follow-up date in header */}
                {hasFollowUp && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0",
                          followUpIsPast
                            ? "border-red-200 text-red-600 bg-red-50 dark:border-red-800 dark:text-red-400 dark:bg-red-950"
                            : "border-amber-200 text-amber-600 bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:bg-amber-950"
                        )}
                      >
                        <CalendarClock className="h-3 w-3 mr-1" />
                        {followUpIsPast ? "Overdue" : "Follow-up"}: {formatShortDate(lead.follow_up_at)}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent><p className="text-xs">{formatAbsoluteDateTime(lead.follow_up_at!)}</p></TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                {lead.email && (
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>
                )}
                {lead.source && (
                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{lead.source}</span>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 cursor-default"><Clock className="h-3 w-3" />{timeAgo(lead.date_created)}</span>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">{formatAbsoluteDateTime(lead.date_created)}</p></TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Overflow menu (Mark Ghosted, etc.) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isGhosted ? (
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => setShowGhostedDialog(true)}
                  >
                    <Ghost className="h-4 w-4 mr-2" />
                    Mark Ghosted
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => patchLead({ ghosted_at: null }, "Ghosted cleared")}
                    disabled={isSaving}
                  >
                    <Ghost className="h-4 w-4 mr-2" />
                    Clear Ghosted
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                  <Keyboard className="h-3.5 w-3.5 mr-2" />
                  N: Note &middot; F: Follow-up &middot; T: Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Row 2: Pipeline Stepper with connecting lines */}
          <div className="flex items-center gap-0">
            {PIPELINE_STAGES.map((stage, i) => {
              const isCompleted = i < currentStageIndex;
              const isCurrent = i === currentStageIndex;
              const isFuture = i > currentStageIndex;
              return (
                <div key={stage.key} className="flex items-center flex-1 last:flex-none">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleSetStage(i)}
                        disabled={isSaving || isCurrent}
                        className={cn(
                          "relative flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap cursor-pointer rounded-full",
                          isCompleted && `${stage.bg} text-white hover:opacity-80`,
                          isCurrent && `${stage.bg} text-white ring-2 ${stage.ring} ring-offset-2 ring-offset-background z-10 scale-110`,
                          isFuture && "bg-muted/60 text-muted-foreground hover:bg-muted",
                          isCurrent && isStuck && "ring-orange-500",
                        )}
                      >
                        {isCompleted && <Check className="h-3 w-3" />}
                        {isCurrent && isStuck && <AlertTriangle className="h-3 w-3" />}
                        {stage.label}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        {isCurrent
                          ? `In "${stage.label}" for ${daysInStage} day${daysInStage !== 1 ? "s" : ""}`
                          : isCompleted
                          ? `Completed`
                          : `Click to advance to ${stage.label}`}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  {/* Connecting line */}
                  {i < PIPELINE_STAGES.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 min-w-3",
                        i < currentStageIndex ? stage.bg : "bg-border",
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Days in stage + stuck warning */}
          {isCurrent_NotClosed(currentStageIndex) && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">
                {daysInStage} day{daysInStage !== 1 ? "s" : ""} in {PIPELINE_STAGES[currentStageIndex].label}
              </span>
              {isStuck && (
                <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
                  <AlertTriangle className="h-3 w-3" />
                  No activity for {daysSinceActivity}d — follow up?
                </span>
              )}
            </div>
          )}

          {/* Row 3: Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {igHandle && (
              <Button
                size="sm"
                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                asChild
              >
                <a
                  href={`https://instagram.com/direct/t/${lead.ig_thread_id || igHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />Send DM
                </a>
              </Button>
            )}
            {/* Follow-Up with presets popover */}
            <Popover open={followUpPopoverOpen} onOpenChange={setFollowUpPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <CalendarClock className="h-3.5 w-3.5 mr-1.5" />Follow-Up
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground px-2 py-1">Quick schedule</p>
                  <button
                    className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors"
                    onClick={() => handleScheduleFollowUp(getPresetDate("today"))}
                  >
                    Today
                  </button>
                  <button
                    className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors"
                    onClick={() => handleScheduleFollowUp(getPresetDate("tomorrow"))}
                  >
                    Tomorrow
                  </button>
                  <button
                    className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors"
                    onClick={() => handleScheduleFollowUp(getPresetDate("3days"))}
                  >
                    In 3 days
                  </button>
                  <Separator className="my-1" />
                  <div className="px-2 py-1 space-y-1.5">
                    <p className="text-xs text-muted-foreground">Custom</p>
                    <Input
                      type="datetime-local"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="h-7 text-xs"
                    />
                    <Button
                      size="sm"
                      className="w-full h-7 text-xs"
                      disabled={!followUpDate || isSaving}
                      onClick={() => handleScheduleFollowUp(new Date(followUpDate))}
                    >
                      Schedule
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Smart "Next Action" Banner */}
          <NextActionBanner
            hasFollowUp={hasFollowUp}
            followUpIsPast={followUpIsPast}
            followUpDate={lead.follow_up_at}
            nextTask={nextTask}
            onScheduleFollowUp={() => setFollowUpPopoverOpen(true)}
            igHandle={igHandle}
            igThreadId={lead.ig_thread_id}
          />
        </div>

        <Separator />

        {/* ── Two-Panel Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Left Sidebar */}
          <div className="flex flex-col gap-4">
            {/* Contact Details */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <EditableDetailRow
                  label="Source"
                  value={lead.source}
                  placeholder="Add source..."
                  onSave={(val) => patchLead({ source: val }, val ? `Source set to ${val}` : "Source cleared")}
                  disabled={isSaving}
                />
                <EditableDetailRow
                  label="Email"
                  value={lead.email}
                  placeholder="Add email..."
                  onSave={(val) => patchLead({ email: val }, val ? `Email set to ${val}` : "Email cleared")}
                  disabled={isSaving}
                />
                <EditableDetailRow
                  label="Instagram"
                  value={igHandle ? `@${igHandle}` : null}
                  placeholder="Add handle..."
                  href={igHandle ? `https://instagram.com/${igHandle}` : undefined}
                  onSave={(val) => {
                    const clean = val?.replace(/^@/, "") || null;
                    patchLead({ ig_username: clean }, clean ? `Instagram set to @${clean}` : "Instagram cleared");
                  }}
                  disabled={isSaving}
                />
                {/* Last Contacted */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Last Contacted</p>
                  {lastContactedDate ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-sm font-medium cursor-default">{timeAgo(lastContactedDate)}</p>
                      </TooltipTrigger>
                      <TooltipContent><p className="text-xs">{formatAbsoluteDateTime(lastContactedDate)}</p></TooltipContent>
                    </Tooltip>
                  ) : (
                    <p className="text-sm text-muted-foreground/50 italic">Never</p>
                  )}
                </div>

                {/* Quick Action Icons */}
                <div className="flex items-center gap-1 pt-1">
                  {lead.email && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => copyToClipboard(lead.email!, "Email")}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p className="text-xs">Copy email</p></TooltipContent>
                    </Tooltip>
                  )}
                  {igHandle && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                            <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer">
                              <Instagram className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p className="text-xs">Open Instagram</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                            <a href={`https://instagram.com/direct/t/${lead.ig_thread_id || igHandle}`} target="_blank" rel="noopener noreferrer">
                              <Send className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p className="text-xs">Send DM</p></TooltipContent>
                      </Tooltip>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Deal — Score + Contract Value */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deal</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                {/* Score */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Score</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => {
                          const newScore = lead.score === n * 2 ? null : n * 2;
                          patchLead({ score: newScore }, newScore ? `Score set to ${newScore}/10` : "Score cleared");
                        }}
                        disabled={isSaving}
                        className="p-0.5"
                      >
                        <Star
                          className={cn(
                            "h-4 w-4 transition-colors",
                            lead.score != null && n <= Math.ceil(lead.score / 2)
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30 hover:text-amber-300"
                          )}
                        />
                      </button>
                    ))}
                    {lead.score != null && (
                      <Badge variant="outline" className={cn("ml-1 text-[10px] h-5", scoreInfo.bgClass, scoreInfo.textClass)}>
                        {scoreInfo.label}
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Contract Value */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Contract Value</p>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                    <Input
                      type="number"
                      placeholder="0"
                      value={contractInput}
                      onChange={(e) => setContractInput(e.target.value)}
                      onFocus={() => setContractInput(lead.contract_value != null ? String(lead.contract_value) : "")}
                      onBlur={() => {
                        const num = contractInput === "" ? null : Number(contractInput);
                        if (num !== lead.contract_value) {
                          patchLead({ contract_value: num }, num == null ? "Contract value cleared" : `Contract value set to $${num}`);
                        }
                        setContractInput("");
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                      disabled={isSaving}
                      className="pl-5 h-8 text-sm"
                    />
                  </div>
                  {lead.contract_value != null && !contractInput && (
                    <p className="text-sm font-medium text-green-600">${lead.contract_value.toLocaleString()}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Outbound Lead (if has_outbound) */}
            {user?.has_outbound && (
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outbound Lead</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <OutboundLeadLinker
                    leadId={lead._id}
                    outboundLeadId={lead.outbound_lead_id}
                    leadName={leadName}
                    leadCreatedAt={lead.date_created}
                    onLinked={() => queryClient.invalidateQueries({ queryKey: ["lead", contactId] })}
                  />
                </CardContent>
              </Card>
            )}

            {/* Tasks */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tasks {openTasks.length > 0 && <span className="text-primary">({openTasks.length})</span>}
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5"
                        onClick={() => setActiveComposeTab("task")}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p className="text-xs">Add task (T)</p></TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {openTasks.length === 0 && completedTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">No tasks yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {openTasks.map((t) => (
                      <div key={t._id} className="flex items-start gap-2 group">
                        <Checkbox
                          checked={false}
                          onCheckedChange={() =>
                            updateTask.mutate({ id: t._id, lead_id: t.lead_id, completed_at: new Date().toISOString() })
                          }
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-tight">{t.title}</p>
                          {t.due_date && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className={cn("text-xs cursor-default", new Date(t.due_date) < new Date() ? "text-red-500" : "text-muted-foreground")}>
                                  Due {timeAgo(t.due_date)}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent><p className="text-xs">{formatAbsoluteDateTime(t.due_date)}</p></TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                          onClick={() => deleteTask.mutate({ id: t._id, lead_id: t.lead_id })}
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                    {completedTasks.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer">
                          {completedTasks.length} completed
                        </summary>
                        <div className="space-y-1.5 mt-1.5">
                          {completedTasks.map((t) => (
                            <div key={t._id} className="flex items-start gap-2 group">
                              <Checkbox
                                checked={true}
                                onCheckedChange={() =>
                                  updateTask.mutate({ id: t._id, lead_id: t.lead_id, completed_at: null })
                                }
                                className="mt-0.5"
                              />
                              <p className="text-sm leading-tight text-muted-foreground line-through flex-1">{t.title}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                                onClick={() => deleteTask.mutate({ id: t._id, lead_id: t.lead_id })}
                              >
                                <Trash2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Compose + Activity Feed */}
          <div className="flex flex-col gap-4">
            {/* Persistent Compose Box */}
            <Card>
              <Tabs value={activeComposeTab} onValueChange={setActiveComposeTab}>
                <CardHeader className="pb-0 pt-3 px-4">
                  <TabsList className="h-8">
                    <TabsTrigger value="note" className="text-xs h-7 gap-1">
                      <StickyNote className="h-3 w-3" />Note
                    </TabsTrigger>
                    <TabsTrigger value="dm" className="text-xs h-7 gap-1">
                      <Send className="h-3 w-3" />DM
                    </TabsTrigger>
                    <TabsTrigger value="followup" className="text-xs h-7 gap-1">
                      <CalendarClock className="h-3 w-3" />Follow-Up
                    </TabsTrigger>
                    <TabsTrigger value="task" className="text-xs h-7 gap-1">
                      <SquareCheckBig className="h-3 w-3" />Task
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <TabsContent value="note" className="mt-2">
                    <div className="flex gap-2 items-start">
                      <Textarea
                        ref={noteRef}
                        placeholder="Write a note... (Ctrl+Enter to save)"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="min-h-[60px] text-sm flex-1 resize-none"
                        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddNote(); }}
                      />
                      <Button
                        size="sm"
                        onClick={handleAddNote}
                        disabled={createNote.isPending || !noteText.trim()}
                        className="h-8"
                      >
                        {createNote.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="dm" className="mt-2">
                    {igHandle ? (
                      <div className="flex items-center gap-3 py-2">
                        <p className="text-sm text-muted-foreground">
                          Open Instagram to send a DM to @{igHandle}
                        </p>
                        <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                          <a
                            href={`https://instagram.com/direct/t/${lead.ig_thread_id || igHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Send className="h-3.5 w-3.5 mr-1.5" />Open DM
                          </a>
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">
                        No Instagram handle set. Add one in the Contact card to send DMs.
                      </p>
                    )}
                  </TabsContent>
                  <TabsContent value="followup" className="mt-2">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleScheduleFollowUp(getPresetDate("today"))}
                          disabled={isSaving}
                        >
                          Today
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleScheduleFollowUp(getPresetDate("tomorrow"))}
                          disabled={isSaving}
                        >
                          Tomorrow
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleScheduleFollowUp(getPresetDate("3days"))}
                          disabled={isSaving}
                        >
                          In 3 days
                        </Button>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="datetime-local"
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                          className="h-8 text-sm w-auto flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => followUpDate && handleScheduleFollowUp(new Date(followUpDate))}
                          disabled={isSaving || !followUpDate}
                          className="h-8"
                        >
                          Schedule
                        </Button>
                      </div>
                      {hasFollowUp && (
                        <p className="text-xs text-muted-foreground">
                          Current follow-up: {formatShortDate(lead.follow_up_at)}
                          {followUpIsPast && <span className="text-red-500 ml-1">(overdue)</span>}
                        </p>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="task" className="mt-2">
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="Task title..."
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        className="h-8 text-sm flex-1"
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddTask(); }}
                      />
                      <Input
                        type="date"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="h-8 text-sm w-auto"
                      />
                      <Button size="sm" onClick={handleAddTask} disabled={createTask.isPending || !taskTitle.trim()} className="h-8">
                        {createTask.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}
                      </Button>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>

            {/* Summary (collapsible if present) */}
            {(lead.summary || (lead.questions_and_answers && lead.questions_and_answers.length > 0)) && (
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {lead.summary ? "Summary" : "Q&A"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {lead.summary && <SummarySections html={lead.summary} />}
                  {lead.questions_and_answers && lead.questions_and_answers.length > 0 && (
                    <div className={cn("space-y-3", lead.summary && "mt-4")}>
                      {lead.summary && <Separator />}
                      {lead.questions_and_answers
                        .sort((a, b) => a.position - b.position)
                        .map((qa, i) => (
                          <div key={i}>
                            <p className="text-sm font-medium">{qa.question}</p>
                            <p className="text-sm text-muted-foreground mt-0.5">{qa.answer}</p>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* DM Conversation — link prompt when none found */}
            {conversationData === null && (
              <Card>
                <CardContent className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Instagram className="h-3.5 w-3.5" />
                    No DM conversation linked
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setLinkConvOpen(true)}>
                    Link conversation
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Link conversation dialog */}
            <Dialog open={linkConvOpen} onOpenChange={setLinkConvOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Link a conversation</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
                  {!allConversations && <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>}
                  {allConversations?.conversations.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">No conversations found</p>
                  )}
                  {allConversations?.conversations.map((conv) => {
                    const usernames = Object.values(conv.participant_usernames ?? {});
                    const label = usernames.length ? usernames.join(", ") : conv.participant_ids.join(", ");
                    return (
                      <button
                        key={conv._id}
                        onClick={() => linkConversation.mutate(conv._id)}
                        disabled={linkConversation.isPending}
                        className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                      >
                        <span className="font-medium truncate">{label}</span>
                        {conv.last_message_at && (
                          <span className="text-xs text-muted-foreground ml-2 shrink-0">{timeAgo(conv.last_message_at)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>

            {/* DM Conversation */}
            {conversationData?.messages && conversationData.messages.length > 0 && (
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Instagram className="h-3.5 w-3.5" />
                    DM Conversation
                    <span className="ml-auto font-normal normal-case text-muted-foreground/60">
                      {conversationData.total} message{conversationData.total !== 1 ? "s" : ""}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
                    {conversationData.messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={cn(
                          "flex flex-col max-w-[80%]",
                          msg.direction === "outbound" ? "ml-auto items-end" : "items-start"
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-2xl px-3 py-2 text-sm",
                            msg.direction === "outbound"
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-muted rounded-tl-sm"
                          )}
                        >
                          {msg.message_text || <span className="italic opacity-60">Media</span>}
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-[10px] text-muted-foreground/60 mt-0.5 px-1 cursor-default">
                              {timeAgo(msg.timestamp)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent><p className="text-xs">{formatAbsoluteDateTime(msg.timestamp)}</p></TooltipContent>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                  {conversationData.total > conversationData.messages.length && (
                    <p className="text-xs text-muted-foreground/60 text-center mt-2">
                      Showing {conversationData.messages.length} of {conversationData.total} messages
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Activity Feed */}
            <Card className="flex-1">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {activityItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="rounded-full bg-muted p-3 mb-3">
                      <Send className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1 mb-3">
                      Send a DM or add a note to get started.
                    </p>
                    <div className="flex gap-2">
                      {igHandle && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                          <a href={`https://instagram.com/direct/t/${lead.ig_thread_id || igHandle}`} target="_blank" rel="noopener noreferrer">
                            <Send className="h-3 w-3 mr-1" />Send DM
                          </a>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => {
                          setActiveComposeTab("note");
                          setTimeout(() => noteRef.current?.focus(), 50);
                        }}
                      >
                        <StickyNote className="h-3 w-3 mr-1" />Add Note
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative space-y-0">
                    {/* Vertical line */}
                    <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

                    {activityItems.map((item) => (
                      <div key={item.id} className="relative flex gap-3 py-3 first:pt-0 last:pb-0">
                        {/* Dot */}
                        <div className={cn(
                          "relative z-10 mt-1 h-[9px] w-[9px] rounded-full border-2 shrink-0",
                          item.type === "note"
                            ? "bg-blue-500 border-blue-500"
                            : item.type === "task_completed"
                            ? "bg-emerald-500 border-emerald-500"
                            : item.data.icon === "ghosted"
                            ? "bg-red-500 border-red-500"
                            : item.data.icon === "booked" || item.data.icon === "closed"
                            ? "bg-emerald-500 border-emerald-500"
                            : item.data.icon === "follow_up"
                            ? "bg-amber-500 border-amber-500"
                            : item.data.icon === "link_sent"
                            ? "bg-blue-500 border-blue-500"
                            : "bg-muted-foreground/40 border-muted-foreground/40"
                        )} />

                        {/* Content */}
                        <div className="flex-1 min-w-0 -mt-0.5">
                          {item.type === "note" && (
                            <div className="group">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">{String(item.data.author)}</span>
                                <RelativeTime date={item.date} />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 ml-auto"
                                  onClick={() => deleteNote.mutate({ id: String(item.data.noteId), lead_id: String(item.data.leadId) })}
                                >
                                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              </div>
                              <p className="text-sm mt-0.5 whitespace-pre-wrap">{String(item.data.content)}</p>
                            </div>
                          )}
                          {item.type === "stage" && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{String(item.data.label)}</span>
                              <RelativeTime date={item.date} />
                            </div>
                          )}
                          {item.type === "task_completed" && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm"><CheckCircle className="h-3.5 w-3.5 inline mr-1 text-emerald-500" />Completed: {String(item.data.title)}</span>
                              <RelativeTime date={item.date} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Ghosted Confirmation Dialog */}
        <AlertDialog open={showGhostedDialog} onOpenChange={setShowGhostedDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark as Ghosted</AlertDialogTitle>
              <AlertDialogDescription>
                Would you like to schedule a re-engagement follow-up in 30 days?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button
                variant="outline"
                onClick={() => handleGhosted(false)}
              >
                Just Ghost
              </Button>
              <AlertDialogAction onClick={() => handleGhosted(true)}>
                Ghost + Schedule Follow-Up
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// NextActionBanner
// ---------------------------------------------------------------------------

function NextActionBanner({
  hasFollowUp,
  followUpIsPast,
  followUpDate,
  nextTask,
  onScheduleFollowUp,
  igHandle,
  igThreadId,
}: {
  hasFollowUp: boolean;
  followUpIsPast: boolean;
  followUpDate: string | null | undefined;
  nextTask?: { title: string; due_date?: string | null };
  onScheduleFollowUp: () => void;
  igHandle: string | null;
  igThreadId?: string | null;
}) {
  if (hasFollowUp && followUpIsPast) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30 px-4 py-2.5 flex items-center gap-3">
        <CalendarClock className="h-4 w-4 text-red-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            Overdue follow-up: {formatShortDate(followUpDate ?? null)}
          </p>
          <p className="text-xs text-red-600/70 dark:text-red-400/70">This follow-up was due — take action now.</p>
        </div>
        {igHandle && (
          <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shrink-0" asChild>
            <a href={`https://instagram.com/direct/t/${igThreadId || igHandle}`} target="_blank" rel="noopener noreferrer">
              <Send className="h-3 w-3 mr-1" />Send DM
            </a>
          </Button>
        )}
      </div>
    );
  }

  if (hasFollowUp) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30 px-4 py-2.5 flex items-center gap-3">
        <CalendarClock className="h-4 w-4 text-blue-500 shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-400 flex-1">
          <span className="font-medium">Next follow-up:</span> {formatShortDate(followUpDate ?? null)}
        </p>
      </div>
    );
  }

  if (nextTask) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30 px-4 py-2.5 flex items-center gap-3">
        <SquareCheckBig className="h-4 w-4 text-blue-500 shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-400 flex-1">
          <span className="font-medium">Next task:</span> {nextTask.title}
          {nextTask.due_date && ` — due ${formatShortDate(nextTask.due_date)}`}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-2.5 flex items-center gap-3">
      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
      <p className="text-sm text-amber-700 dark:text-amber-400 flex-1">
        No follow-up scheduled — add one now
      </p>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950 shrink-0"
        onClick={onScheduleFollowUp}
      >
        <CalendarClock className="h-3 w-3 mr-1" />Schedule
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper: check if current stage is not terminal
// ---------------------------------------------------------------------------

function isCurrent_NotClosed(stageIndex: number): boolean {
  return stageIndex < 4;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function EditableDetailRow({
  label,
  value,
  placeholder,
  href,
  onSave,
  disabled,
}: {
  label: string;
  value: string | null | undefined;
  placeholder: string;
  href?: string;
  onSave?: (val: string | null) => void;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const hasValue = !!value;
  const display = hasValue ? value : placeholder;

  const commit = () => {
    const trimmed = draft.trim();
    const newVal = trimmed || null;
    if (newVal !== (value || null)) {
      onSave?.(newVal);
    }
    setEditing(false);
  };

  if (editing && onSave) {
    return (
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground shrink-0">{label}</p>
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          autoFocus
          className="h-7 text-sm text-right flex-1 min-w-0"
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between group",
        onSave && !disabled && "cursor-pointer hover:bg-muted/50 -mx-1.5 px-1.5 py-0.5 rounded"
      )}
      onClick={() => {
        if (onSave && !disabled) {
          setDraft(value || "");
          setEditing(true);
        }
      }}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      {hasValue && href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium truncate ml-4 text-right hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {display}
        </a>
      ) : (
        <p className={cn(
          "text-sm truncate ml-4 text-right",
          hasValue ? "font-medium" : "text-muted-foreground/50 italic"
        )}>
          {display}
        </p>
      )}
    </div>
  );
}
