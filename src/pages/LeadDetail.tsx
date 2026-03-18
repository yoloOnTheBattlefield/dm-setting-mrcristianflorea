import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiLead } from "@/lib/types";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { API_URL, fetchWithAuth } from "@/lib/api";
import { useState, useEffect, useRef, useCallback } from "react";
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
        dangerouslySetInnerHTML={{ __html: html }}
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

// Pipeline stages in order
const PIPELINE_STAGES = [
  { key: "new", label: "New", field: null, bg: "bg-slate-500", ring: "ring-slate-500" },
  { key: "link_sent", label: "Link Sent", field: "link_sent_at", bg: "bg-blue-500", ring: "ring-blue-500" },
  { key: "follow_up", label: "Follow Up", field: "follow_up_at", bg: "bg-amber-500", ring: "ring-amber-500" },
  { key: "booked", label: "Booked", field: "booked_at", bg: "bg-emerald-500", ring: "ring-emerald-500" },
  { key: "closed", label: "Closed", field: "closed_at", bg: "bg-emerald-700", ring: "ring-emerald-700" },
] as const;

function getCurrentStageIndex(lead: ApiLead): number {
  if (lead.closed_at) return 4;
  if (lead.booked_at) return 3;
  if (lead.follow_up_at) return 2;
  if (lead.link_sent_at) return 1;
  return 0;
}

function getInitials(first: string, last: string): string {
  return (
    `${(first || "")[0] || ""}${(last || "")[0] || ""}`.toUpperCase() || "?"
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
        // Mark the outbound lead as replied, using the inbound lead's creation date
        await fetchWithAuth(`${API_URL}/outbound-leads/${outboundId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            replied: true,
            replied_at: leadCreatedAt || new Date().toISOString(),
          }),
        }).catch(() => {}); // best-effort, don't block linking
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

export default function LeadDetail() {
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [contractInput, setContractInput] = useState("");
  const [noteText, setNoteText] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [showFollowUpInput, setShowFollowUpInput] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");

  // Fetch lead IDs for prev/next navigation (exclude outbound-linked to match contacts list)
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

  // Keyboard navigation (left/right arrows)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't navigate when typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowLeft" && prevLeadId) {
        navigate(`/lead/${prevLeadId}`);
      } else if (e.key === "ArrowRight" && nextLeadId) {
        navigate(`/lead/${nextLeadId}`);
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
    if (stageIndex === currentStageIndex) return;

    const body: Record<string, unknown> = {};

    if (stageIndex === 0) {
      // Going back to "New" — clear all stage dates
      for (const s of PIPELINE_STAGES) {
        if (s.field) body[s.field] = null;
      }
    } else if (stageIndex > currentStageIndex) {
      // Advancing forward — set the target stage date
      const stage = PIPELINE_STAGES[stageIndex];
      if (stage.field) body[stage.field] = new Date().toISOString();
    } else {
      // Going backward — clear dates for all stages after the target
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
      { onSuccess: () => { setNoteText(""); setShowNoteInput(false); } }
    );
  };

  const handleAddTask = () => {
    if (!taskTitle.trim() || !lead) return;
    createTask.mutate(
      { lead_id: lead._id, title: taskTitle.trim(), due_date: taskDueDate || null },
      { onSuccess: () => { setTaskTitle(""); setTaskDueDate(""); setShowTaskInput(false); } }
    );
  };

  const handleScheduleFollowUp = () => {
    if (!followUpDate) return;
    patchLead({ follow_up_at: new Date(followUpDate).toISOString() }, "Follow-up scheduled");
    setFollowUpDate("");
    setShowFollowUpInput(false);
  };

  // Loading / Error / Not Found
  if (isLoading) return <div className="flex flex-1 flex-col gap-4 p-4"><DashboardSkeleton /></div>;

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

  return (
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
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            disabled={!prevLeadId}
            onClick={() => prevLeadId && navigate(`/lead/${prevLeadId}`)}
            title="Previous lead (←)"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {currentIndex >= 0 && leadIds.length > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums px-1">
              {currentIndex + 1}/{leadIds.length}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            disabled={!nextLeadId}
            onClick={() => nextLeadId && navigate(`/lead/${nextLeadId}`)}
            title="Next lead (→)"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="space-y-3">
        {/* Row 1: Avatar + Name + IG handle */}
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-14 w-14 text-lg shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(lead.first_name, lead.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
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
              {isGhosted && (
                <Badge variant="destructive" className="shrink-0">
                  <Ghost className="h-3 w-3 mr-1" />Ghosted
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
              {lead.email && (
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>
              )}
              {lead.source && (
                <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{lead.source}</span>
              )}
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatShortDate(lead.date_created)}</span>
            </div>
          </div>
        </div>

        {/* Row 2: Pipeline Stepper — directly below name for visual connection */}
        <div className="flex items-center gap-0.5">
          {PIPELINE_STAGES.map((stage, i) => {
            const isCompleted = i < currentStageIndex;
            const isCurrent = i === currentStageIndex;
            const isFuture = i > currentStageIndex;
            return (
              <div key={stage.key} className="flex items-center">
                <button
                  onClick={() => handleSetStage(i)}
                  disabled={isSaving || isCurrent}
                  className={cn(
                    "relative px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap cursor-pointer",
                    i === 0 && "rounded-l-full",
                    i === PIPELINE_STAGES.length - 1 && "rounded-r-full",
                    isCompleted && `${stage.bg} text-white hover:opacity-80`,
                    isCurrent && `${stage.bg} text-white ring-2 ${stage.ring} ring-offset-2 ring-offset-background rounded-full z-10 scale-110`,
                    isFuture && "bg-muted/60 text-muted-foreground hover:bg-muted",
                  )}
                >
                  {isCompleted ? (
                    <span className="flex items-center gap-1">
                      <Check className="h-3 w-3" />{stage.label}
                    </span>
                  ) : (
                    stage.label
                  )}
                </button>
                {i < PIPELINE_STAGES.length - 1 && !isCurrent && i + 1 !== currentStageIndex && (
                  <div className={cn(
                    "w-px h-4",
                    i < currentStageIndex ? stage.bg : "bg-border",
                  )} />
                )}
              </div>
            );
          })}
        </div>

        {/* Row 2: Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Send DM — primary action */}
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowNoteInput(true); setShowTaskInput(false); setShowFollowUpInput(false); }}
            className="h-8"
          >
            <StickyNote className="h-3.5 w-3.5 mr-1.5" />Note
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowFollowUpInput(true); setShowNoteInput(false); setShowTaskInput(false); }}
            className="h-8"
          >
            <CalendarClock className="h-3.5 w-3.5 mr-1.5" />Follow-Up
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowTaskInput(true); setShowNoteInput(false); setShowFollowUpInput(false); }}
            className="h-8"
          >
            <SquareCheckBig className="h-3.5 w-3.5 mr-1.5" />Task
          </Button>

          {/* Ghosted toggle — visually distinct since it's a stage-terminating action */}
          {!isGhosted ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 ml-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              onClick={() => patchLead({ ghosted_at: new Date().toISOString() }, "Marked as ghosted")}
              disabled={isSaving}
            >
              <Ghost className="h-3.5 w-3.5 mr-1.5" />Mark Ghosted
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-8 ml-auto border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
              onClick={() => patchLead({ ghosted_at: null }, "Ghosted cleared")}
              disabled={isSaving}
            >
              <Ghost className="h-3.5 w-3.5 mr-1.5" />Clear Ghosted
            </Button>
          )}
        </div>

        {/* Inline quick-action forms */}
        {showNoteInput && (
          <div className="flex gap-2 items-start">
            <Textarea
              placeholder="Write a note..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="min-h-[60px] text-sm flex-1"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddNote(); }}
            />
            <div className="flex flex-col gap-1">
              <Button size="sm" onClick={handleAddNote} disabled={createNote.isPending || !noteText.trim()} className="h-8">
                {createNote.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowNoteInput(false); setNoteText(""); }} className="h-8">Cancel</Button>
            </div>
          </div>
        )}
        {showFollowUpInput && (
          <div className="flex gap-2 items-center">
            <Input
              type="datetime-local"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="h-8 text-sm w-auto"
              autoFocus
            />
            <Button size="sm" onClick={handleScheduleFollowUp} disabled={isSaving || !followUpDate} className="h-8">Schedule</Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowFollowUpInput(false); setFollowUpDate(""); }} className="h-8">Cancel</Button>
          </div>
        )}
        {showTaskInput && (
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Task title..."
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="h-8 text-sm flex-1"
              autoFocus
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
            <Button size="sm" variant="ghost" onClick={() => { setShowTaskInput(false); setTaskTitle(""); setTaskDueDate(""); }} className="h-8">Cancel</Button>
          </div>
        )}
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
            </CardContent>
          </Card>

          {/* Deal — Score + Contract Value separated from contact info */}
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
                    <span className="text-xs text-muted-foreground ml-1">{lead.score}/10</span>
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5"
                  onClick={() => { setShowTaskInput(true); setShowNoteInput(false); setShowFollowUpInput(false); }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
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
                          <p className={cn("text-xs", new Date(t.due_date) < new Date() ? "text-red-500" : "text-muted-foreground")}>
                            Due {formatShortDate(t.due_date)}
                          </p>
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

        {/* Right: Activity Feed */}
        <div className="flex flex-col gap-4">
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
                      onClick={() => { setShowNoteInput(true); setShowTaskInput(false); setShowFollowUpInput(false); }}
                    >
                      <StickyNote className="h-3 w-3 mr-1" />Add Note
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative space-y-0">
                  {/* Vertical line */}
                  <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

                  {activityItems.map((item, idx) => (
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
                              <span className="text-xs text-muted-foreground">{timeAgo(item.date)}</span>
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
                            <span className="text-xs text-muted-foreground">{timeAgo(item.date)}</span>
                          </div>
                        )}
                        {item.type === "task_completed" && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm"><CheckCircle className="h-3.5 w-3.5 inline mr-1 text-emerald-500" />Completed: {String(item.data.title)}</span>
                            <span className="text-xs text-muted-foreground">{timeAgo(item.date)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {/* Nudge at bottom when activity is sparse */}
                  {activityItems.length <= 3 && (
                    <div className="relative flex gap-3 pt-3">
                      <div className="relative z-10 mt-1 h-[9px] w-[9px] rounded-full border-2 border-dashed border-muted-foreground/30 shrink-0" />
                      <button
                        className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                        onClick={() => { setShowNoteInput(true); setShowTaskInput(false); setShowFollowUpInput(false); }}
                      >
                        + Add a note to keep track of this lead...
                      </button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
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
