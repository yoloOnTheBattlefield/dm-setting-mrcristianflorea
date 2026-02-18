import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Users,
  Send,
  MessageCircle,
  CalendarCheck,
  DollarSign,
  ArrowRight,
  Upload,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { usePrompts } from "@/hooks/usePrompts";
import { API_URL, fetchWithAuth } from "@/lib/api";

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
  replied?: boolean;
  booked?: boolean;
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

async function fetchSources(): Promise<string[]> {
  const response = await fetchWithAuth(`${API_URL}/outbound-leads/sources`);
  if (!response.ok) return [];
  const data = await response.json();
  return data.sources || [];
}

async function fetchOutboundLeads(params: {
  source?: string;
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

async function fetchFunnelStats(): Promise<FunnelStats> {
  const response = await fetchWithAuth(`${API_URL}/outbound-leads/stats`);
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

export default function OutboundLeads() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: promptOptions = [] } = usePrompts();

  const [source, setSource] = useState(searchParams.get("source") || "all");
  const [messagedFilter, setMessagedFilter] = useState(
    searchParams.get("isMessaged") || "all",
  );
  const [repliedFilter, setRepliedFilter] = useState(
    searchParams.get("replied") || "all",
  );
  const [bookedFilter, setBookedFilter] = useState(
    searchParams.get("booked") || "all",
  );
  const [promptFilter, setPromptFilter] = useState(
    searchParams.get("promptLabel") || "all",
  );
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [debouncedSearch, setDebouncedSearch] = useState(
    searchParams.get("search") || "",
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1", 10),
  );
  const limit = 20;
  const navigate = useNavigate();

  // Selection state (declarations only — callbacks defined after `leads`)
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
    messagedFilter,
    repliedFilter,
    bookedFilter,
    promptFilter,
    debouncedSearch,
  ]);

  // DM dialog state
  const [editingLead, setEditingLead] = useState<OutboundLead | null>(null);
  const [dmMessage, setDmMessage] = useState("");
  const [dmDate, setDmDate] = useState("");
  const [isSavingDm, setIsSavingDm] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    source,
    messagedFilter,
    repliedFilter,
    bookedFilter,
    promptFilter,
    debouncedSearch,
  ]);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (source !== "all") params.set("source", source);
    if (messagedFilter !== "all") params.set("isMessaged", messagedFilter);
    if (repliedFilter !== "all") params.set("replied", repliedFilter);
    if (bookedFilter !== "all") params.set("booked", bookedFilter);
    if (promptFilter !== "all") params.set("promptLabel", promptFilter);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (currentPage !== 1) params.set("page", String(currentPage));
    setSearchParams(params, { replace: true });
  }, [
    source,
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
    queryKey: ["outbound-leads-stats"],
    queryFn: () => fetchFunnelStats(),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  const leads = data?.leads || [];
  const pagination = data?.pagination;

  // Selection callbacks (must be after `leads` is defined)
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
    if (messagedFilter !== "all") f.isMessaged = messagedFilter;
    if (repliedFilter !== "all") f.replied = repliedFilter;
    if (bookedFilter !== "all") f.booked = bookedFilter;
    if (promptFilter !== "all") f.promptLabel = promptFilter;
    if (debouncedSearch) f.search = debouncedSearch;
    return f;
  }, [
    source,
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

  const toggleField = useCallback(
    async (lead: OutboundLead, field: "replied" | "booked") => {
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

  const showTableSkeleton = isLoading;

  return (
    <div className="flex flex-1 flex-col min-w-0">
      {/* Sticky header with filters */}
      <div className="sticky top-16 z-50 bg-background border-b border-border">
        <div className="px-6 py-4 space-y-3">
          {/* Row 1: Title + Import */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Outbound Leads
              </h2>
              <p className="text-muted-foreground">
                IG profiles from scraper uploads
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/outbound-leads/import")}
            >
              <Upload className="h-4 w-4 mr-1.5" />
              Import XLSX
            </Button>
          </div>

          {/* Row 2: Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Source filter */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {sourceOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      @{s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prompt filter */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Prompt</Label>
              <Select value={promptFilter} onValueChange={setPromptFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Prompts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prompts</SelectItem>
                  {promptOptions.map((p) => (
                    <SelectItem key={p._id} value={p.label}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Messaged filter */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Messaged</Label>
              <Select value={messagedFilter} onValueChange={setMessagedFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Replied filter */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Replied</Label>
              <Select value={repliedFilter} onValueChange={setRepliedFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Converted filter */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Converted</Label>
              <Select value={bookedFilter} onValueChange={setBookedFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search username or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Funnel */}
      {funnelStats && (
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2 w-full">
            <FunnelCard
              label="Total"
              value={funnelStats.total}
              icon={<Users className="h-4 w-4 text-blue-400" />}
            />
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
            <FunnelCard
              label="Messaged"
              value={funnelStats.messaged}
              icon={<Send className="h-4 w-4 text-violet-400" />}
            />
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
            <FunnelCard
              label="Replied"
              value={funnelStats.replied}
              icon={<MessageCircle className="h-4 w-4 text-yellow-400" />}
            />
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
            <FunnelCard
              label="Converted"
              value={funnelStats.booked}
              icon={<CalendarCheck className="h-4 w-4 text-green-400" />}
            />
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
            <FunnelCard
              label={`Revenue (${funnelStats.contracts} deal${funnelStats.contracts !== 1 ? "s" : ""})`}
              value={`$${funnelStats.contract_value.toLocaleString()}`}
              icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
            />
          </div>
        </div>
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
            {/* Selection action bar */}
            {(selectedIds.size > 0 || selectAll) && (
              <div className="flex items-center gap-3 mb-3 px-3 py-2 rounded-lg bg-muted/50 border">
                <span className="text-sm">
                  {selectAll
                    ? `All ${pagination?.total ?? 0} leads selected`
                    : `${selectedIds.size} selected`}
                </span>
                {!selectAll &&
                  selectedIds.size === leads.length &&
                  pagination &&
                  pagination.total > leads.length && (
                    <Button
                      variant="link"
                      size="sm"
                      className="text-xs h-auto p-0"
                      onClick={() => setSelectAll(true)}
                    >
                      Select all {pagination.total} matching leads
                    </Button>
                  )}
                {selectAll && (
                  <Button
                    variant="link"
                    size="sm"
                    className="text-xs h-auto p-0"
                    onClick={() => {
                      setSelectAll(false);
                      setSelectedIds(new Set(leads.map((l) => l._id)));
                    }}
                  >
                    Select this page only
                  </Button>
                )}
                <div className="ml-auto">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    {isDeleting
                      ? "Deleting..."
                      : `Delete ${selectAll ? (pagination?.total ?? 0) : selectedIds.size}`}
                  </Button>
                </div>
              </div>
            )}

            <div className={`rounded-lg border bg-card overflow-x-auto relative${isFetching && !showTableSkeleton ? " opacity-60 pointer-events-none" : ""}`}>
              {isFetching && !showTableSkeleton && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              <Table>
                <TableHeader>
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
                    <TableHead>Username</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Followers</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Prompt</TableHead>
                    <TableHead>Messaged</TableHead>
                    <TableHead>Replied</TableHead>
                    <TableHead>Converted</TableHead>
                    <TableHead>Contract</TableHead>
                    <TableHead>DM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {showTableSkeleton ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                        <TableCell><Skeleton className="h-7 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                      </TableRow>
                    ))
                  ) : leads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-24 text-center">
                        No outbound leads found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    leads.map((lead) => (
                      <TableRow
                        key={lead._id}
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
                        <TableCell className="font-medium">
                          <a
                            href={
                              lead.profileLink ||
                              `https://instagram.com/${lead.username}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            @{lead.username}
                          </a>
                        </TableCell>
                        <TableCell>{lead.fullName || "-"}</TableCell>
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
                        <TableCell>
                          <Checkbox
                            checked={!!lead.isMessaged}
                            onCheckedChange={() => toggleMessaged(lead)}
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={!!lead.replied}
                            onCheckedChange={() => toggleField(lead, "replied")}
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={!!lead.booked}
                            onCheckedChange={() => toggleField(lead, "booked")}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-24 h-7 text-xs"
                            placeholder="-"
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
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDmDialog(lead)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-4 mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}{" "}
                  of {pagination.total} leads
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (
                          pagination.page >=
                          pagination.totalPages - 2
                        ) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={
                              pagination.page === pageNum
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      },
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(pagination.totalPages, prev + 1),
                      )
                    }
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* DM Edit Dialog */}
      <Dialog
        open={!!editingLead}
        onOpenChange={(open) => !open && setEditingLead(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>DM Details — @{editingLead?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>DM Date</Label>
              <Input
                type="datetime-local"
                value={dmDate}
                onChange={(e) => setDmDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Enter the DM message..."
                value={dmMessage}
                onChange={(e) => setDmMessage(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingLead(null)}
                disabled={isSavingDm}
              >
                Cancel
              </Button>
              <Button onClick={saveDm} disabled={isSavingDm}>
                {isSavingDm ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FunnelCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="flex-1 min-w-0">
      <CardContent className="py-3 px-4 flex items-center gap-3">
        <div className="shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-lg font-bold leading-tight truncate">{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground truncate">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
