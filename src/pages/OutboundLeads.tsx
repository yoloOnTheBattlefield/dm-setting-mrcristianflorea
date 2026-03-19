import React, { useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchParams, useNavigate } from "react-router-dom";
import { readPersisted, writePersisted } from "@/hooks/usePersistedState";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Shimmer } from "@/components/skeletons";
import {
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Copy,
  ChevronDown,
  StickyNote,
  MoreHorizontal,
  ExternalLink,
  Send,
  MessageCircle,
  Link2,
  CalendarCheck,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { usePrompts } from "@/hooks/usePrompts";
import { API_URL, fetchWithAuth } from "@/lib/api";
import OutboundLeadsFilters from "@/components/outbound-leads/OutboundLeadsFilters";
import FunnelStatsBar from "@/components/outbound-leads/FunnelStatsBar";
import SelectionActionBar from "@/components/outbound-leads/SelectionActionBar";
import DmEditDialog from "@/components/outbound-leads/DmEditDialog";
import OutboundLeadsPagination from "@/components/outbound-leads/OutboundLeadsPagination";
import { QuickNoteDialog } from "@/components/QuickNoteDialog";

interface OutboundLead {
  _id: string;
  followingKey: string;
  username: string;
  fullName: string;
  profileLink?: string;
  isVerified?: boolean;
  followersCount?: number;
  bio?: string;
  postsCount?: number;
  externalUrl?: string | null;
  email?: string | null;
  source: string;
  scrapeDate?: string;
  ig?: string | null;
  promptId?: string;
  promptLabel?: string;
  isMessaged?: boolean | null;
  dmDate?: string | null;
  message?: string | null;
  link_sent?: boolean;
  replied?: boolean;
  booked?: boolean;
  qualified?: boolean | null;
  contract_value?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

interface PaginatedResponse {
  leads: OutboundLead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface FunnelStats {
  total: number;
  messaged: number;
  replied: number;
  booked: number;
  contracts: number;
  contract_value: number;
}

// ── Pipeline status badge logic ──

const PIPELINE_STAGES = [
  { key: "dq", label: "DQ", bg: "bg-red-500/15", text: "text-red-400", dot: "bg-red-400" },
  { key: "converted", label: "Converted", bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
  { key: "replied", label: "Replied", bg: "bg-blue-500/15", text: "text-blue-400", dot: "bg-blue-400" },
  { key: "link_sent", label: "Link Sent", bg: "bg-cyan-500/15", text: "text-cyan-400", dot: "bg-cyan-400" },
  { key: "messaged", label: "Messaged", bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
  { key: "new", label: "New", bg: "bg-slate-500/15", text: "text-slate-400", dot: "bg-slate-400" },
] as const;

function getLeadStage(lead: OutboundLead) {
  if (lead.qualified === false) return PIPELINE_STAGES[0]; // DQ
  if (lead.booked) return PIPELINE_STAGES[1]; // Converted
  if (lead.replied) return PIPELINE_STAGES[2]; // Replied
  if (lead.link_sent) return PIPELINE_STAGES[3]; // Link Sent
  if (lead.isMessaged) return PIPELINE_STAGES[4]; // Messaged
  return PIPELINE_STAGES[5]; // New
}

// ── Avatar helpers ──

const AVATAR_COLORS = [
  "bg-blue-600", "bg-emerald-600", "bg-violet-600", "bg-amber-600",
  "bg-rose-600", "bg-cyan-600", "bg-indigo-600", "bg-pink-600",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts[0]?.length) return parts[0][0].toUpperCase();
  return "?";
}

// ── Time helpers ──

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  if (isNaN(then)) return "";
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function getLastActivityDate(lead: OutboundLead): string | null {
  const dates = [lead.updatedAt, lead.dmDate, lead.createdAt].filter(Boolean) as string[];
  if (dates.length === 0) return null;
  return dates.reduce((a, b) => (new Date(a) > new Date(b) ? a : b));
}

// ── API helpers ──

async function fetchSources(): Promise<string[]> {
  const response = await fetchWithAuth(`${API_URL}/outbound-leads/sources`);
  if (!response.ok) return [];
  const data = await response.json();
  return data.sources || [];
}

async function fetchOutboundLeads(params: {
  source?: string;
  qualified?: string;
  isMessaged?: string;
  replied?: string;
  booked?: string;
  search?: string;
  promptLabel?: string;
  page: number;
  limit: number;
}): Promise<PaginatedResponse> {
  const searchParams = new URLSearchParams();
  if (params.source) searchParams.append("source", params.source);
  if (params.qualified) searchParams.append("qualified", params.qualified);
  if (params.isMessaged) searchParams.append("isMessaged", params.isMessaged);
  if (params.replied) searchParams.append("replied", params.replied);
  if (params.booked) searchParams.append("booked", params.booked);
  if (params.search) searchParams.append("search", params.search);
  if (params.promptLabel)
    searchParams.append("promptLabel", params.promptLabel);
  searchParams.append("page", String(params.page));
  searchParams.append("limit", String(params.limit));

  const response = await fetchWithAuth(`${API_URL}/outbound-leads?${searchParams.toString()}`);
  if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
  return response.json();
}

async function fetchFunnelStats(qualified?: string): Promise<FunnelStats> {
  const params = new URLSearchParams();
  if (qualified) params.append("qualified", qualified);
  const qs = params.toString();
  const response = await fetchWithAuth(`${API_URL}/outbound-leads/stats${qs ? `?${qs}` : ""}`);
  if (!response.ok)
    throw new Error(`Failed to fetch stats: ${response.status}`);
  return response.json();
}

async function patchOutboundLead(
  id: string,
  body: Record<string, unknown>,
): Promise<void> {
  const response = await fetchWithAuth(`${API_URL}/outbound-leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Failed to update: ${response.status}`);
  }
}

async function bulkDeleteLeads(body: {
  ids?: string[];
  all?: boolean;
  filters?: Record<string, string>;
}): Promise<{ deleted: number }> {
  const response = await fetchWithAuth(`${API_URL}/outbound-leads/bulk-delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Failed to delete: ${response.status}`);
  }
  return response.json();
}

function formatNumber(n?: number): string {
  if (n == null) return "-";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ── Row Actions Dropdown ──

function RowActions({
  lead,
  onToggleMessaged,
  onToggleField,
  onToggleDisqualified,
  onOpenDm,
  onOpenNote,
}: {
  lead: OutboundLead;
  onToggleMessaged: (lead: OutboundLead) => void;
  onToggleField: (lead: OutboundLead, field: "link_sent" | "replied" | "booked") => void;
  onToggleDisqualified: (lead: OutboundLead) => void;
  onOpenDm: (lead: OutboundLead) => void;
  onOpenNote: (lead: OutboundLead) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => { e.stopPropagation(); onOpenNote(lead); }}
        title="Notes"
      >
        <StickyNote className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => { e.stopPropagation(); onOpenDm(lead); }}
        title="DM details"
      >
        <MessageSquare className="h-3.5 w-3.5" />
      </Button>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => {
            window.open(lead.profileLink || `https://instagram.com/${lead.username}`, "_blank");
          }}>
            <ExternalLink className="h-3.5 w-3.5 mr-2" />
            Open IG Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onToggleMessaged(lead)}>
            <Send className="h-3.5 w-3.5 mr-2 text-amber-400" />
            {lead.isMessaged ? "Unmark Messaged" : "Mark Messaged"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onToggleField(lead, "replied")}>
            <MessageCircle className="h-3.5 w-3.5 mr-2 text-blue-400" />
            {lead.replied ? "Unmark Replied" : "Mark Replied"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onToggleField(lead, "link_sent")}>
            <Link2 className="h-3.5 w-3.5 mr-2 text-cyan-400" />
            {lead.link_sent ? "Unmark Link Sent" : "Mark Link Sent"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onToggleField(lead, "booked")}>
            <CalendarCheck className="h-3.5 w-3.5 mr-2 text-emerald-400" />
            {lead.booked ? "Unmark Converted" : "Mark Converted"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onToggleDisqualified(lead)}
            className={lead.qualified === false ? "" : "text-red-400 focus:text-red-400"}
          >
            {lead.qualified === false ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                Clear DQ
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5 mr-2" />
                Disqualify
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function OutboundLeads() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: promptOptions = [] } = usePrompts();

  const [source, setSource] = useState(searchParams.get("source") || readPersisted("ob-source", "all"));
  const [qualifiedFilter, setQualifiedFilter] = useState(
    searchParams.get("qualified") || readPersisted("ob-qualified", "true"),
  );
  const [messagedFilter, setMessagedFilter] = useState(
    searchParams.get("isMessaged") || readPersisted("ob-messaged", "all"),
  );
  const [repliedFilter, setRepliedFilter] = useState(
    searchParams.get("replied") || readPersisted("ob-replied", "all"),
  );
  const [bookedFilter, setBookedFilter] = useState(
    searchParams.get("booked") || readPersisted("ob-booked", "all"),
  );
  const [promptFilter, setPromptFilter] = useState(
    searchParams.get("promptLabel") || readPersisted("ob-prompt", "all"),
  );
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const debouncedSearch = useDebounce(searchQuery.trim());
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1", 10),
  );
  const limit = 20;
  const navigate = useNavigate();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Clear selection on page/filter change
  useEffect(() => {
    setSelectedIds(new Set());
    setSelectAll(false);
  }, [
    currentPage,
    source,
    qualifiedFilter,
    messagedFilter,
    repliedFilter,
    bookedFilter,
    promptFilter,
    debouncedSearch,
  ]);

  // Note dialog state
  const [noteLead, setNoteLead] = useState<{ id: string; name: string } | null>(null);

  // DM dialog state
  const [editingLead, setEditingLead] = useState<OutboundLead | null>(null);
  const [dmMessage, setDmMessage] = useState("");
  const [dmDate, setDmDate] = useState("");
  const [isSavingDm, setIsSavingDm] = useState(false);

  // Mobile expanded card state
  const [expandedLeadIds, setExpandedLeadIds] = useState<Set<string>>(new Set());
  const toggleExpandLead = useCallback((id: string) => {
    setExpandedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    source,
    qualifiedFilter,
    messagedFilter,
    repliedFilter,
    bookedFilter,
    promptFilter,
    debouncedSearch,
  ]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (source !== "all") params.set("source", source);
    if (qualifiedFilter !== "all") params.set("qualified", qualifiedFilter);
    if (messagedFilter !== "all") params.set("isMessaged", messagedFilter);
    if (repliedFilter !== "all") params.set("replied", repliedFilter);
    if (bookedFilter !== "all") params.set("booked", bookedFilter);
    if (promptFilter !== "all") params.set("promptLabel", promptFilter);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (currentPage !== 1) params.set("page", String(currentPage));
    setSearchParams(params, { replace: true });

    writePersisted("ob-source", source);
    writePersisted("ob-qualified", qualifiedFilter);
    writePersisted("ob-messaged", messagedFilter);
    writePersisted("ob-replied", repliedFilter);
    writePersisted("ob-booked", bookedFilter);
    writePersisted("ob-prompt", promptFilter);
  }, [
    source,
    qualifiedFilter,
    messagedFilter,
    repliedFilter,
    bookedFilter,
    promptFilter,
    debouncedSearch,
    currentPage,
    setSearchParams,
  ]);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: [
      "outbound-leads",
      source === "all" ? undefined : source,
      qualifiedFilter === "true" ? undefined : qualifiedFilter,
      messagedFilter === "all" ? undefined : messagedFilter,
      repliedFilter === "all" ? undefined : repliedFilter,
      bookedFilter === "all" ? undefined : bookedFilter,
      promptFilter === "all" ? undefined : promptFilter,
      debouncedSearch || undefined,
      currentPage,
    ],
    queryFn: () =>
      fetchOutboundLeads({
        source: source === "all" ? undefined : source,
        qualified: qualifiedFilter === "true" ? undefined : qualifiedFilter,
        isMessaged: messagedFilter === "all" ? undefined : messagedFilter,
        replied: repliedFilter === "all" ? undefined : repliedFilter,
        booked: bookedFilter === "all" ? undefined : bookedFilter,
        promptLabel: promptFilter === "all" ? undefined : promptFilter,
        search: debouncedSearch || undefined,
        page: currentPage,
        limit,
      }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  const { data: sourcesData } = useQuery({
    queryKey: ["outbound-leads-sources"],
    queryFn: fetchSources,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
  const sourceOptions = sourcesData || [];

  const { data: funnelStats } = useQuery({
    queryKey: ["outbound-leads-stats", qualifiedFilter === "true" ? undefined : qualifiedFilter],
    queryFn: () => fetchFunnelStats(qualifiedFilter === "true" ? undefined : qualifiedFilter),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  const leads = data?.leads || [];
  const pagination = data?.pagination;

  // Selection callbacks
  const toggleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setSelectAll(false);
  }, []);

  const toggleSelectPage = useCallback(() => {
    if (!leads.length) return;
    const allPageSelected = leads.every((l) => selectedIds.has(l._id));
    if (allPageSelected) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      setSelectedIds(new Set(leads.map((l) => l._id)));
    }
  }, [leads, selectedIds]);

  const currentFilters = useCallback(() => {
    const f: Record<string, string> = {};
    if (source !== "all") f.source = source;
    if (qualifiedFilter !== "true" && qualifiedFilter !== "all") f.qualified = qualifiedFilter;
    if (messagedFilter !== "all") f.isMessaged = messagedFilter;
    if (repliedFilter !== "all") f.replied = repliedFilter;
    if (bookedFilter !== "all") f.booked = bookedFilter;
    if (promptFilter !== "all") f.promptLabel = promptFilter;
    if (debouncedSearch) f.search = debouncedSearch;
    return f;
  }, [
    source,
    qualifiedFilter,
    messagedFilter,
    repliedFilter,
    bookedFilter,
    promptFilter,
    debouncedSearch,
  ]);

  const handleBulkDelete = useCallback(async () => {
    const count = selectAll ? (pagination?.total ?? 0) : selectedIds.size;
    if (count === 0) return;

    try {
      setIsDeleting(true);
      let result: { deleted: number };
      if (selectAll) {
        result = await bulkDeleteLeads({
          all: true,
          filters: currentFilters(),
        });
      } else {
        result = await bulkDeleteLeads({ ids: Array.from(selectedIds) });
      }
      toast({
        title: "Deleted",
        description: `${result.deleted} lead${result.deleted !== 1 ? "s" : ""} deleted`,
      });
      setSelectedIds(new Set());
      setSelectAll(false);
      queryClient.invalidateQueries({ queryKey: ["outbound-leads"] });
      queryClient.invalidateQueries({ queryKey: ["outbound-leads-stats"] });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [selectAll, selectedIds, pagination, currentFilters, queryClient, toast]);

  const toggleMessaged = useCallback(
    async (lead: OutboundLead) => {
      const newVal = !lead.isMessaged;
      try {
        await patchOutboundLead(lead._id, {
          isMessaged: newVal,
          ...(newVal ? { dmDate: new Date().toISOString() } : { dmDate: null }),
        });
        queryClient.invalidateQueries({ queryKey: ["outbound-leads"] });
        queryClient.invalidateQueries({ queryKey: ["outbound-leads-stats"] });
        toast({
          title: "Updated",
          description: newVal ? "Marked as messaged" : "Marked as not messaged",
        });
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to update",
          variant: "destructive",
        });
      }
    },
    [queryClient, toast],
  );

  const toggleDisqualified = useCallback(
    async (lead: OutboundLead) => {
      const isCurrentlyDQ = lead.qualified === false;
      const newVal = isCurrentlyDQ ? null : false;
      try {
        await patchOutboundLead(lead._id, { qualified: newVal });
        queryClient.invalidateQueries({ queryKey: ["outbound-leads"] });
        queryClient.invalidateQueries({ queryKey: ["outbound-leads-stats"] });
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to update",
          variant: "destructive",
        });
      }
    },
    [queryClient, toast],
  );

  const toggleField = useCallback(
    async (lead: OutboundLead, field: "link_sent" | "replied" | "booked") => {
      const newVal = !lead[field];
      try {
        await patchOutboundLead(lead._id, { [field]: newVal });
        queryClient.invalidateQueries({ queryKey: ["outbound-leads"] });
        queryClient.invalidateQueries({ queryKey: ["outbound-leads-stats"] });
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to update",
          variant: "destructive",
        });
      }
    },
    [queryClient, toast],
  );

  const saveContractValue = useCallback(
    async (lead: OutboundLead, value: string) => {
      const num = value === "" ? null : parseFloat(value);
      if (num === (lead.contract_value ?? null)) return;
      if (value !== "" && isNaN(num as number)) return;
      try {
        await patchOutboundLead(lead._id, { contract_value: num });
        queryClient.invalidateQueries({ queryKey: ["outbound-leads"] });
        queryClient.invalidateQueries({ queryKey: ["outbound-leads-stats"] });
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to update",
          variant: "destructive",
        });
      }
    },
    [queryClient, toast],
  );

  const openDmDialog = (lead: OutboundLead) => {
    setEditingLead(lead);
    setDmMessage(lead.message || "");
    setDmDate(
      lead.dmDate ? new Date(lead.dmDate).toISOString().slice(0, 16) : "",
    );
  };

  const saveDm = async () => {
    if (!editingLead) return;
    setIsSavingDm(true);
    try {
      await patchOutboundLead(editingLead._id, {
        message: dmMessage || null,
        dmDate: dmDate ? new Date(dmDate).toISOString() : null,
        isMessaged: !!(dmMessage || dmDate),
      });
      queryClient.invalidateQueries({ queryKey: ["outbound-leads"] });
      queryClient.invalidateQueries({ queryKey: ["outbound-leads-stats"] });
      toast({ title: "Success", description: "DM details saved" });
      setEditingLead(null);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save",
        variant: "destructive",
      });
    } finally {
      setIsSavingDm(false);
    }
  };

  const handleSelectOneFromCard = useCallback((lead: OutboundLead) => {
    if (selectAll) {
      setSelectAll(false);
      const next = new Set(leads.map((l) => l._id));
      next.delete(lead._id);
      setSelectedIds(next);
    } else {
      toggleSelectOne(lead._id);
    }
  }, [selectAll, leads, toggleSelectOne]);

  const showTableSkeleton = isLoading;

  return (
    <div className="flex flex-1 flex-col min-w-0">
      <OutboundLeadsFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        qualifiedFilter={qualifiedFilter}
        setQualifiedFilter={setQualifiedFilter}
        source={source}
        setSource={setSource}
        sourceOptions={sourceOptions}
        promptFilter={promptFilter}
        setPromptFilter={setPromptFilter}
        promptOptions={promptOptions}
        messagedFilter={messagedFilter}
        setMessagedFilter={setMessagedFilter}
        repliedFilter={repliedFilter}
        setRepliedFilter={setRepliedFilter}
        bookedFilter={bookedFilter}
        setBookedFilter={setBookedFilter}
        onNavigateImport={() => navigate("/outbound-leads/import")}
      />

      {/* Funnel – hidden on mobile */}
      {funnelStats && (
        <FunnelStatsBar funnelStats={funnelStats} />
      )}

      {/* Table */}
      <div className="flex-1 p-6">
        {isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-lg font-semibold mb-2">Failed to load data</h2>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error
                ? error.message
                : "An unknown error occurred"}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <SelectionActionBar
              selectedIds={selectedIds}
              selectAll={selectAll}
              setSelectAll={setSelectAll}
              setSelectedIds={setSelectedIds}
              leads={leads}
              pagination={pagination}
              isDeleting={isDeleting}
              handleBulkDelete={handleBulkDelete}
            />

            {/* ── Mobile card layout ── */}
            <div className={`md:hidden space-y-2 relative${isFetching && !showTableSkeleton ? " opacity-60 pointer-events-none" : ""}`}>
              {isFetching && !showTableSkeleton && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {showTableSkeleton ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-lg border bg-card p-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <Shimmer className="h-8 w-8 rounded-full" delay={`${i * 60}ms`} />
                      <div className="space-y-1 flex-1">
                        <Shimmer className="h-4 w-24" delay={`${i * 60 + 10}ms`} />
                        <Shimmer className="h-3 w-32" delay={`${i * 60 + 20}ms`} />
                      </div>
                      <Shimmer className="h-5 w-16 rounded-full" delay={`${i * 60 + 30}ms`} />
                    </div>
                  </div>
                ))
              ) : leads.length === 0 ? (
                <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
                  No outbound leads found.
                </div>
              ) : (
                leads.map((lead) => {
                  const isExpanded = expandedLeadIds.has(lead._id);
                  const stage = getLeadStage(lead);
                  const displayName = lead.fullName || lead.username;
                  const avatarColor = getAvatarColor(displayName);
                  const initials = getInitials(displayName);
                  const activityDate = getLastActivityDate(lead);

                  return (
                    <div
                      key={lead._id}
                      className={`rounded-lg border bg-card${selectAll || selectedIds.has(lead._id) ? " bg-muted" : ""}`}
                    >
                      {/* Primary row: checkbox, avatar, name, status badge */}
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <Checkbox
                          checked={selectAll || selectedIds.has(lead._id)}
                          onCheckedChange={() => handleSelectOneFromCard(lead)}
                        />

                        {/* Avatar */}
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 ${avatarColor}`}
                        >
                          {initials}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <a
                              href={lead.profileLink || `https://instagram.com/${lead.username}`}
                              target="_blank" rel="noopener noreferrer"
                              rel="noopener noreferrer"
                              className="font-medium text-foreground hover:underline text-sm truncate"
                            >
                              @{lead.username}
                            </a>
                            <button
                              type="button"
                              onClick={() => { navigator.clipboard.writeText(lead.username); toast({ title: "Copied", description: `@${lead.username}` }); }}
                              className="shrink-0 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                          {lead.fullName && (
                            <span className="text-xs text-muted-foreground truncate block">{lead.fullName}</span>
                          )}
                        </div>

                        {/* Status badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0 ${stage.bg} ${stage.text}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${stage.dot}`} />
                          {stage.label}
                        </span>

                        {/* Expand toggle */}
                        <button
                          type="button"
                          onClick={() => toggleExpandLead(lead._id)}
                          className="shrink-0 p-1 rounded hover:bg-muted"
                        >
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform${isExpanded ? " rotate-180" : ""}`} />
                        </button>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="border-t px-3 py-2.5 space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                            <div>
                              <span className="text-muted-foreground">Followers</span>
                              <p className="font-medium">{formatNumber(lead.followersCount)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Source</span>
                              <p><Badge variant="outline" className="text-xs">@{lead.source}</Badge></p>
                            </div>
                            {lead.promptLabel && (
                              <div>
                                <span className="text-muted-foreground">Prompt</span>
                                <p><Badge variant="outline" className="text-xs">{lead.promptLabel}</Badge></p>
                              </div>
                            )}
                            {activityDate && (
                              <div>
                                <span className="text-muted-foreground">Last Activity</span>
                                <p className="font-medium">{timeAgo(activityDate)}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">Contract</span>
                              <Input
                                type="number"
                                className="w-24 h-7 text-xs mt-0.5"
                                placeholder="None"
                                defaultValue={lead.contract_value ?? ""}
                                onBlur={(e) => saveContractValue(lead, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                }}
                              />
                            </div>
                          </div>

                          {/* Quick actions */}
                          <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                            <Button
                              variant={lead.isMessaged ? "secondary" : "outline"}
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => toggleMessaged(lead)}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              {lead.isMessaged ? "Messaged" : "Mark Sent"}
                            </Button>
                            <Button
                              variant={lead.replied ? "secondary" : "outline"}
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => toggleField(lead, "replied")}
                            >
                              <MessageCircle className="h-3 w-3 mr-1" />
                              {lead.replied ? "Replied" : "Mark Reply"}
                            </Button>
                            <Button
                              variant={lead.booked ? "secondary" : "outline"}
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => toggleField(lead, "booked")}
                            >
                              <CalendarCheck className="h-3 w-3 mr-1" />
                              {lead.booked ? "Converted" : "Convert"}
                            </Button>
                            <div className="ml-auto flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-7" onClick={() => setNoteLead({ id: lead._id, name: lead.fullName || lead.username })}>
                                <StickyNote className="h-3.5 w-3.5 mr-1" />
                                Note
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7" onClick={() => openDmDialog(lead)}>
                                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                                DM
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* ── Desktop table layout ── */}
            <div className={`hidden md:block rounded-lg border bg-card overflow-x-auto relative${isFetching && !showTableSkeleton ? " opacity-60 pointer-events-none" : ""}`}>
              {isFetching && !showTableSkeleton && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          leads.length > 0 &&
                          (selectAll ||
                            leads.every((l) => selectedIds.has(l._id)))
                        }
                        onCheckedChange={toggleSelectPage}
                        disabled={showTableSkeleton}
                      />
                    </TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="text-right">Followers</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Prompt</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Contract</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {showTableSkeleton ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Shimmer className="h-4 w-4" delay={`${i * 40}ms`} /></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Shimmer className="h-8 w-8 rounded-full" delay={`${i * 40 + 5}ms`} />
                            <div className="space-y-1">
                              <Shimmer className="h-4 w-24" delay={`${i * 40 + 10}ms`} />
                              <Shimmer className="h-3 w-32" delay={`${i * 40 + 15}ms`} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Shimmer className="h-5 w-20 rounded-full" delay={`${i * 40 + 20}ms`} /></TableCell>
                        <TableCell className="text-right"><Shimmer className="h-4 w-12 ml-auto" delay={`${i * 40 + 25}ms`} /></TableCell>
                        <TableCell><Shimmer className="h-5 w-16 rounded-full" delay={`${i * 40 + 25}ms`} /></TableCell>
                        <TableCell><Shimmer className="h-5 w-16 rounded-full" delay={`${i * 40 + 30}ms`} /></TableCell>
                        <TableCell><Shimmer className="h-4 w-16" delay={`${i * 40 + 30}ms`} /></TableCell>
                        <TableCell><Shimmer className="h-7 w-20" delay={`${i * 40 + 35}ms`} /></TableCell>
                        <TableCell><Shimmer className="h-7 w-16" delay={`${i * 40 + 35}ms`} /></TableCell>
                      </TableRow>
                    ))
                  ) : leads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
                        No outbound leads found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    leads.map((lead) => {
                      const stage = getLeadStage(lead);
                      const displayName = lead.fullName || lead.username;
                      const avatarColor = getAvatarColor(displayName);
                      const initials = getInitials(displayName);
                      const activityDate = getLastActivityDate(lead);

                      return (
                        <TableRow
                          key={lead._id}
                          className="group"
                          data-state={
                            selectedIds.has(lead._id) || selectAll
                              ? "selected"
                              : undefined
                          }
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectAll || selectedIds.has(lead._id)}
                              onCheckedChange={() => {
                                if (selectAll) {
                                  setSelectAll(false);
                                  const next = new Set(leads.map((l) => l._id));
                                  next.delete(lead._id);
                                  setSelectedIds(next);
                                } else {
                                  toggleSelectOne(lead._id);
                                }
                              }}
                            />
                          </TableCell>

                          {/* Lead: Avatar + Username + Full Name */}
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 ${avatarColor}`}
                              >
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <a
                                    href={
                                      lead.profileLink ||
                                      `https://instagram.com/${lead.username}`
                                    }
                                    target="_blank" rel="noopener noreferrer"
                                    rel="noopener noreferrer"
                                    className="text-foreground hover:underline truncate"
                                  >
                                    @{lead.username}
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => { navigator.clipboard.writeText(lead.username); toast({ title: "Copied", description: `@${lead.username}` }); }}
                                    className="shrink-0 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                                {lead.fullName && (
                                  <span
                                    className="text-xs text-muted-foreground truncate block max-w-[200px]"
                                    title={lead.fullName}
                                  >
                                    {lead.fullName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Status Badge */}
                          <TableCell>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${stage.bg} ${stage.text}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${stage.dot}`} />
                              {stage.label}
                            </span>
                          </TableCell>

                          <TableCell className="text-right">
                            {formatNumber(lead.followersCount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">@{lead.source}</Badge>
                          </TableCell>
                          <TableCell>
                            {lead.promptLabel ? (
                              <Badge variant="outline">{lead.promptLabel}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          {/* Last Activity */}
                          <TableCell>
                            {activityDate ? (
                              <span className="text-sm text-muted-foreground">
                                {timeAgo(activityDate)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          <TableCell>
                            <Input
                              type="number"
                              className="w-24 h-7 text-xs"
                              placeholder="None"
                              defaultValue={lead.contract_value ?? ""}
                              onBlur={(e) =>
                                saveContractValue(lead, e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  (e.target as HTMLInputElement).blur();
                              }}
                            />
                          </TableCell>

                          {/* Row Actions */}
                          <TableCell className="pr-2">
                            <RowActions
                              lead={lead}
                              onToggleMessaged={toggleMessaged}
                              onToggleField={toggleField}
                              onToggleDisqualified={toggleDisqualified}
                              onOpenDm={openDmDialog}
                              onOpenNote={(l) => setNoteLead({ id: l._id, name: l.fullName || l.username })}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && (
              <OutboundLeadsPagination
                pagination={pagination}
                setCurrentPage={setCurrentPage}
              />
            )}
          </>
        )}
      </div>

      {/* DM Edit Dialog */}
      <DmEditDialog
        editingLead={editingLead}
        setEditingLead={setEditingLead}
        dmMessage={dmMessage}
        setDmMessage={setDmMessage}
        dmDate={dmDate}
        setDmDate={setDmDate}
        isSavingDm={isSavingDm}
        saveDm={saveDm}
      />

      {/* Quick Note Dialog */}
      {noteLead && (
        <QuickNoteDialog
          open={!!noteLead}
          onOpenChange={(open) => !open && setNoteLead(null)}
          outboundLeadId={noteLead.id}
          contactName={noteLead.name}
        />
      )}
    </div>
  );
}
