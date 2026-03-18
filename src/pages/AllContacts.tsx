import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useRawLeads, type LeadSortField, type SortOrder } from "@/hooks/useRawLeads";
import { useAccounts } from "@/hooks/useAccounts";
import { ContactsTable, type QuickAction } from "@/components/contacts-table";
import { ContactsKanban } from "@/components/contacts-kanban";
import { readPersisted, writePersisted } from "@/hooks/usePersistedState";
import { useLeadSelection } from "@/hooks/useLeadSelection";
import {
  AlertCircle, RefreshCw, Search, ChevronLeft, ChevronRight, Plus, X,
  List, Columns3, Download, Ghost, CalendarCheck, Link2, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { DateRangeFilter, ApiLead } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminView } from "@/contexts/AdminViewContext";
import { API_URL, fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const STATUS_OPTIONS = [
  { value: "new", label: "New", dot: "bg-slate-400" },
  { value: "link_sent", label: "Link Sent", dot: "bg-blue-400" },
  { value: "follow_up", label: "Follow Up", dot: "bg-amber-400" },
  { value: "booked", label: "Booked", dot: "bg-emerald-400" },
  { value: "closed", label: "Closed", dot: "bg-emerald-600" },
  { value: "ghosted", label: "Ghosted", dot: "bg-red-400" },
];

type LeadStatus = "new" | "link_sent" | "booked" | "closed";

const LEAD_STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "link_sent", label: "Link Sent" },
  { value: "booked", label: "Booked" },
  { value: "closed", label: "Closed" },
];

type ViewMode = "list" | "kanban";

export default function AllContacts() {
  const { user } = useAuth();
  const { viewAll } = useAdminView();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const selection = useLeadSelection();

  const [viewMode, setViewMode] = useState<ViewMode>(
    readPersisted<ViewMode>("contacts-viewMode", "list")
  );

  // Add Lead modal state
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [addLeadSubmitting, setAddLeadSubmitting] = useState(false);
  const [leadForm, setLeadForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    contact_id: "",
    score: "",
    contract_value: "",
    status: "new" as LeadStatus,
    summary: "",
  });

  const resetLeadForm = () => {
    setLeadForm({
      first_name: "",
      last_name: "",
      email: "",
      contact_id: "",
      score: "",
      contract_value: "",
      status: "new",
      summary: "",
    });
  };

  const handleAddLead = async () => {
    if (!leadForm.first_name.trim()) return;
    setAddLeadSubmitting(true);
    try {
      const now = new Date().toISOString();
      const body: Record<string, unknown> = {
        first_name: leadForm.first_name.trim(),
        date_created: now,
        account_id: user?.ghl,
      };
      if (leadForm.last_name.trim()) body.last_name = leadForm.last_name.trim();
      if (leadForm.email.trim()) body.email = leadForm.email.trim();
      if (leadForm.contact_id.trim()) body.contact_id = leadForm.contact_id.trim();
      if (leadForm.score && leadForm.score !== "none") body.score = Number(leadForm.score);
      if (leadForm.contract_value) body.contract_value = Number(leadForm.contract_value);
      if (leadForm.summary.trim()) body.summary = leadForm.summary.trim();

      if (leadForm.status === "link_sent" || leadForm.status === "booked" || leadForm.status === "closed") {
        body.link_sent_at = now;
      }
      if (leadForm.status === "booked" || leadForm.status === "closed") {
        body.booked_at = now;
      }
      if (leadForm.status === "closed") {
        body.closed_at = now;
      }

      const res = await fetchWithAuth(`${API_URL}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Failed to create lead: ${res.status}`);

      await queryClient.invalidateQueries({ queryKey: ["rawLeads"] });
      toast({ title: "Success", description: "Lead created successfully" });
      setAddLeadOpen(false);
      resetLeadForm();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create lead",
        variant: "destructive",
      });
    } finally {
      setAddLeadSubmitting(false);
    }
  };
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params, falling back to localStorage
  const [selectedAccount, setSelectedAccount] = useState<string>(
    searchParams.get("account") || readPersisted("contacts-account", "all")
  );
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    searchParams.get("status")?.split(",").filter(Boolean) || readPersisted<string[]>("contacts-statuses", [])
  );
  const [dateRange, setDateRange] = useState<DateRangeFilter>(() => {
    const urlVal = searchParams.get("dateRange");
    if (urlVal) return urlVal === "all" ? "all" : (Number(urlVal) as DateRangeFilter);
    return readPersisted<DateRangeFilter>("contacts-dateRange", 14);
  });
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get("search") || ""
  );
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>(
    searchParams.get("search") || ""
  );
  const [currentPage, setCurrentPage] = useState<number>(
    parseInt(searchParams.get("page") || "1", 10)
  );
  const [itemsPerPage] = useState<number>(
    parseInt(searchParams.get("limit") || "20", 10)
  );
  const [sortBy, setSortBy] = useState<LeadSortField>(readPersisted<LeadSortField>("contacts-sortBy", "date_created"));
  const [sortOrder, setSortOrder] = useState<SortOrder>(readPersisted<SortOrder>("contacts-sortOrder", "desc"));
  const [hideLinked, setHideLinked] = useState<boolean>(readPersisted<boolean>("contacts-hideLinked", true));

  const handleSort = (field: LeadSortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Calculate start and end dates based on dateRange
  const endDate = useMemo(() => {
    if (dateRange === "all") return undefined;
    return new Date().toISOString().split("T")[0];
  }, [dateRange]);

  const startDate = useMemo(() => {
    if (dateRange === "all") return undefined;
    const date = new Date();
    date.setDate(date.getDate() - dateRange);
    return date.toISOString().split("T")[0];
  }, [dateRange]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAccount, selectedStatuses, startDate, endDate, debouncedSearchQuery, hideLinked]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  // Persist view mode
  useEffect(() => {
    writePersisted("contacts-viewMode", viewMode);
  }, [viewMode]);

  // Update URL params when state changes
  useEffect(() => {
    const params = new URLSearchParams();

    if (selectedAccount !== "all") {
      params.set("account", selectedAccount);
    }

    if (selectedStatuses.length > 0) {
      params.set("status", selectedStatuses.join(","));
    }

    if (dateRange !== 14) {
      params.set("dateRange", dateRange.toString());
    }

    if (debouncedSearchQuery) {
      params.set("search", debouncedSearchQuery);
    }

    if (currentPage !== 1) {
      params.set("page", currentPage.toString());
    }

    if (itemsPerPage !== 20) {
      params.set("limit", itemsPerPage.toString());
    }

    setSearchParams(params, { replace: true });

    // Persist filter settings to localStorage
    writePersisted("contacts-account", selectedAccount);
    writePersisted("contacts-statuses", selectedStatuses);
    writePersisted("contacts-dateRange", dateRange);
    writePersisted("contacts-sortBy", sortBy);
    writePersisted("contacts-sortOrder", sortOrder);
    writePersisted("contacts-hideLinked", hideLinked);
  }, [selectedAccount, selectedStatuses, dateRange, debouncedSearchQuery, currentPage, itemsPerPage, setSearchParams, sortBy, sortOrder, hideLinked]);

  // For kanban, we need all leads (no pagination limit)
  const kanbanLimit = viewMode === "kanban" ? 500 : itemsPerPage;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useRawLeads({
    statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
    startDate,
    endDate,
    search: debouncedSearchQuery || undefined,
    page: viewMode === "kanban" ? 1 : currentPage,
    limit: kanbanLimit,
    accountId: user?.role === 0
      ? (viewAll
          ? (selectedAccount !== "all" ? selectedAccount : "all")
          : undefined)
      : undefined,
    sortBy,
    sortOrder,
    excludeLinked: hideLinked || undefined,
  });

  const contacts = data?.leads || [];
  const pagination = data?.pagination;

  // Stats query: same filters, large limit to get all records for counting
  const { data: statsData, isLoading: statsLoading } = useRawLeads({
    statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
    startDate,
    endDate,
    search: debouncedSearchQuery || undefined,
    page: 1,
    limit: 9999,
    accountId: user?.role === 0
      ? (viewAll
          ? (selectedAccount !== "all" ? selectedAccount : "all")
          : undefined)
      : undefined,
    sortBy,
    sortOrder,
    excludeLinked: hideLinked || undefined,
  });

  const stats = useMemo(() => {
    if (!statsData?.leads) return null;
    const leads = statsData.leads;
    const total = statsData.pagination.total;
    const linkSent = leads.filter((l) => l.link_sent_at).length;
    const booked = leads.filter((l) => l.booked_at).length;
    const closed = leads.filter((l) => l.closed_at).length;
    const ghosted = leads.filter((l) => l.ghosted_at).length;
    const followUp = leads.filter((l) => l.follow_up_at && !l.booked_at && !l.ghosted_at).length;

    // Avg days from created to booked
    const bookedLeads = leads.filter((l) => l.booked_at && l.date_created);
    const avgDaysToBook = bookedLeads.length > 0
      ? (bookedLeads.reduce((sum, l) => sum + (new Date(l.booked_at!).getTime() - new Date(l.date_created).getTime()) / (1000 * 60 * 60 * 24), 0) / bookedLeads.length).toFixed(1)
      : null;

    return {
      total,
      linkSent,
      booked,
      closed,
      ghosted,
      followUp,
      avgDaysToBook,
      bookRate: total > 0 ? ((booked / total) * 100).toFixed(1) : "0.0",
      closeRate: total > 0 ? ((closed / total) * 100).toFixed(1) : "0.0",
      ghostRate: total > 0 ? ((ghosted / total) * 100).toFixed(1) : "0.0",
    };
  }, [statsData]);

  // Get accounts from /accounts endpoint
  const { data: accounts = [] } = useAccounts();

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  // --- Quick actions (single lead) ---
  const patchLead = useCallback(async (leadId: string, body: Record<string, unknown>, successMsg: string) => {
    try {
      const response = await fetchWithAuth(`${API_URL}/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ["rawLeads"] });
        toast({ title: "Success", description: successMsg });
      } else {
        const d = await response.json().catch(() => ({}));
        toast({ title: "Error", description: d.error || "Failed to update", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to connect", variant: "destructive" });
    }
  }, [queryClient, toast]);

  const handleQuickAction = useCallback((leadId: string, action: QuickAction) => {
    const now = new Date().toISOString();
    if (action.type === "clear_ghosted") {
      patchLead(leadId, { ghosted_at: null }, "Ghosted cleared");
    } else if (action.type === "set_stage") {
      const stageFields: Record<string, Record<string, unknown>> = {
        link_sent: { link_sent_at: now },
        booked: { link_sent_at: now, booked_at: now },
        closed: { link_sent_at: now, booked_at: now, closed_at: now },
        ghosted: { ghosted_at: now },
      };
      const labels: Record<string, string> = {
        link_sent: "Marked as Link Sent",
        booked: "Marked as Booked",
        closed: "Marked as Closed",
        ghosted: "Marked as Ghosted",
      };
      patchLead(leadId, stageFields[action.stage], labels[action.stage]);
    }
  }, [patchLead]);

  // --- Bulk actions ---
  const [bulkActing, setBulkActing] = useState(false);

  const getSelectedIds = useCallback((): string[] => {
    if (selection.mode === "manual") return Array.from(selection.selectedIds);
    // For select-all mode, use current page contacts minus excluded
    return contacts.filter((c) => !selection.excludedIds.has(c._id)).map((c) => c._id);
  }, [selection, contacts]);

  const handleBulkStatusChange = useCallback(async (stage: string) => {
    const ids = getSelectedIds();
    if (ids.length === 0) return;
    setBulkActing(true);
    const now = new Date().toISOString();
    const stageFields: Record<string, Record<string, unknown>> = {
      link_sent: { link_sent_at: now },
      booked: { link_sent_at: now, booked_at: now },
      closed: { link_sent_at: now, booked_at: now, closed_at: now },
      ghosted: { ghosted_at: now },
    };
    const body = stageFields[stage];
    if (!body) return;

    let success = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        const res = await fetchWithAuth(`${API_URL}/leads/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) success++;
        else failed++;
      } catch {
        failed++;
      }
    }

    await queryClient.invalidateQueries({ queryKey: ["rawLeads"] });
    selection.clearSelection();
    setBulkActing(false);
    toast({
      title: "Bulk Update",
      description: `${success} updated${failed > 0 ? `, ${failed} failed` : ""}`,
    });
  }, [getSelectedIds, queryClient, selection, toast]);

  const handleExportSelected = useCallback(() => {
    const ids = new Set(getSelectedIds());
    const selected = contacts.filter((c) => ids.has(c._id));
    const rows = [
      ["Name", "Email", "Status", "Created", "Link Sent", "Booked", "Closed"].join(","),
      ...selected.map((c) => {
        const stage = c.ghosted_at ? "Ghosted" : c.closed_at ? "Closed" : c.booked_at ? "Booked" : c.follow_up_at ? "Follow Up" : c.link_sent_at ? "Link Sent" : "New";
        return [
          `"${(c.first_name || "")} ${(c.last_name || "")}"`.replace(/null/g, "").trim(),
          c.email || "",
          stage,
          c.date_created?.split("T")[0] || "",
          c.link_sent_at?.split("T")[0] || "",
          c.booked_at?.split("T")[0] || "",
          c.closed_at?.split("T")[0] || "",
        ].join(",");
      }),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${selected.length} leads exported as CSV` });
  }, [getSelectedIds, contacts, toast]);

  // --- Clickable stat filter ---
  const handleStatClick = useCallback((filter: string) => {
    setSelectedStatuses((prev) => {
      if (prev.length === 1 && prev[0] === filter) return [];
      return [filter];
    });
  }, []);

  // --- Kanban stage move ---
  const handleKanbanMove = useCallback((leadId: string, toStage: string) => {
    const now = new Date().toISOString();
    const stageFields: Record<string, Record<string, unknown>> = {
      new: { link_sent_at: null, booked_at: null, closed_at: null, ghosted_at: null, follow_up_at: null },
      link_sent: { link_sent_at: now, booked_at: null, closed_at: null, ghosted_at: null },
      follow_up: { follow_up_at: now, ghosted_at: null },
      booked: { link_sent_at: now, booked_at: now, closed_at: null, ghosted_at: null },
      closed: { link_sent_at: now, booked_at: now, closed_at: now, ghosted_at: null },
      ghosted: { ghosted_at: now },
    };
    const body = stageFields[toStage];
    if (!body) return;
    patchLead(leadId, body, `Moved to ${toStage.replace("_", " ")}`);
  }, [patchLead]);

  const selectionCount = selection.getCount(pagination?.total || 0);

  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-16 z-50 bg-background border-b border-border">
        <div className="px-6 py-4 flex items-end justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setAddLeadOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Lead
            </Button>

            {/* View toggle */}
            <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-7 px-2.5", viewMode === "list" && "bg-background shadow-sm")}
                onClick={() => setViewMode("list")}
              >
                <List className="h-3.5 w-3.5 mr-1" />
                List
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-7 px-2.5", viewMode === "kanban" && "bg-background shadow-sm")}
                onClick={() => setViewMode("kanban")}
              >
                <Columns3 className="h-3.5 w-3.5 mr-1" />
                Board
              </Button>
            </div>
          </div>

          <div className="flex gap-4 items-end">
          {user?.role === 0 && viewAll && (
            <div className="flex flex-col gap-2 w-64">
              <Label htmlFor="account-filter">Filter by Account</Label>
              <Select
                value={selectedAccount}
                onValueChange={setSelectedAccount}
              >
                <SelectTrigger id="account-filter">
                  <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.ghl} value={account.ghl}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-2 w-64">
            <Label>Filter by Status</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedStatuses.length && "text-muted-foreground",
                  )}
                >
                  {selectedStatuses.length > 0
                    ? `${selectedStatuses.length} selected`
                    : "All Statuses"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <div className="space-y-1">
                  {STATUS_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-2 rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleStatus(option.value)}
                    >
                      <Checkbox
                        id={`status-${option.value}`}
                        checked={selectedStatuses.includes(option.value)}
                        onCheckedChange={() => toggleStatus(option.value)}
                      />
                      <span className={`h-2 w-2 rounded-full ${option.dot}`} />
                      <label
                        htmlFor={`status-${option.value}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                  {selectedStatuses.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => setSelectedStatuses([])}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-2 w-64">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Date Range</Label>
            <DateFilter value={dateRange} onChange={setDateRange} />
          </div>

          <div className="flex flex-col gap-2 justify-end">
            <div className="flex items-center gap-2 h-9">
              <Checkbox
                id="hide-linked"
                checked={hideLinked}
                onCheckedChange={(v) => setHideLinked(!!v)}
              />
              <Label htmlFor="hide-linked" className="text-sm font-normal cursor-pointer whitespace-nowrap">
                Hide outbound-linked
              </Label>
            </div>
          </div>
        </div>
        </div>
      </div>

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
          {/* Conversion Rate Stats Bar */}
          {statsLoading ? (
            <div className="mb-4 rounded-lg border bg-card p-4 animate-pulse">
              <div className="flex gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex-1">
                    <div className="h-4 bg-muted rounded w-16 mb-2" />
                    <div className="h-6 bg-muted rounded w-10" />
                  </div>
                ))}
              </div>
            </div>
          ) : stats && stats.total > 0 ? (
            <div className="mb-4 rounded-lg border bg-card px-5 py-4">
              <div className="flex gap-6 flex-wrap items-end">
                <button className="text-left hover:opacity-80 transition-opacity" onClick={() => setSelectedStatuses([])}>
                  <p className="text-[10px] font-medium text-muted-foreground/80 uppercase tracking-wide">Total</p>
                  <p className="text-xl font-bold tabular-nums">{stats.total}</p>
                </button>
                <button className="text-left hover:opacity-80 transition-opacity" onClick={() => handleStatClick("link_sent")}>
                  <p className="text-[10px] font-medium text-muted-foreground/80 uppercase tracking-wide">Link Sent</p>
                  <p className="text-xl font-bold tabular-nums">{stats.linkSent}</p>
                </button>
                <button className="text-left hover:opacity-80 transition-opacity" onClick={() => handleStatClick("follow_up")}>
                  <p className="text-[10px] font-medium text-muted-foreground/80 uppercase tracking-wide">Follow Up</p>
                  <p className="text-xl font-bold tabular-nums">{stats.followUp}</p>
                </button>
                <button className="text-left hover:opacity-80 transition-opacity" onClick={() => handleStatClick("booked")}>
                  <p className="text-[10px] font-medium text-muted-foreground/80 uppercase tracking-wide">Booked</p>
                  <p className="text-xl font-bold tabular-nums">{stats.booked}</p>
                </button>
                <button className="text-left hover:opacity-80 transition-opacity" onClick={() => handleStatClick("closed")}>
                  <p className="text-[10px] font-medium text-muted-foreground/80 uppercase tracking-wide">Closed</p>
                  <p className="text-xl font-bold tabular-nums">{stats.closed}</p>
                </button>
                <button className="text-left hover:opacity-80 transition-opacity" onClick={() => handleStatClick("ghosted")}>
                  <p className="text-[10px] font-medium text-muted-foreground/80 uppercase tracking-wide">Ghosted</p>
                  <p className="text-xl font-bold tabular-nums text-red-400/80">{stats.ghosted}</p>
                </button>
                <div className="border-l pl-6">
                  <p className="text-[10px] font-medium text-muted-foreground/80 uppercase tracking-wide">Book Rate</p>
                  <p className={`text-xl font-bold tabular-nums ${Number(stats.bookRate) >= 5 ? "text-emerald-400" : Number(stats.bookRate) >= 2 ? "text-amber-400" : "text-red-400"}`}>{stats.bookRate}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground/80 uppercase tracking-wide">Close Rate</p>
                  <p className={`text-xl font-bold tabular-nums ${Number(stats.closeRate) >= 3 ? "text-emerald-400" : Number(stats.closeRate) >= 1 ? "text-amber-400" : "text-red-400"}`}>{stats.closeRate}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground/80 uppercase tracking-wide">Ghost Rate</p>
                  <p className={`text-xl font-bold tabular-nums ${Number(stats.ghostRate) <= 10 ? "text-emerald-400" : Number(stats.ghostRate) <= 25 ? "text-amber-400" : "text-red-400"}`}>{stats.ghostRate}%</p>
                </div>
                {stats.avgDaysToBook && (
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground/80 uppercase tracking-wide">Avg Days to Book</p>
                    <p className="text-xl font-bold tabular-nums">{stats.avgDaysToBook}</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Bulk Action Bar */}
          {selectionCount > 0 && (
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-2.5">
              <span className="text-sm font-medium">
                {selectionCount} selected
              </span>
              {selection.mode === "manual" && pagination && pagination.total > contacts.length && (
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs h-auto p-0"
                  onClick={selection.selectAllMatching}
                >
                  Select all {pagination.total}
                </Button>
              )}
              <div className="ml-auto flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={bulkActing}>
                      Change Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => handleBulkStatusChange("link_sent")}>
                      <Link2 className="h-3.5 w-3.5 mr-2 text-blue-400" />
                      Link Sent
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusChange("booked")}>
                      <CalendarCheck className="h-3.5 w-3.5 mr-2 text-emerald-400" />
                      Booked
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusChange("closed")}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-300" />
                      Closed
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleBulkStatusChange("ghosted")}
                      className="text-red-400 focus:text-red-400"
                    >
                      <Ghost className="h-3.5 w-3.5 mr-2" />
                      Ghosted
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportSelected}
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Export
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selection.clearSelection}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          )}

          {viewMode === "list" ? (
            <>
              <ContactsTable
                contacts={contacts}
                isLoading={isLoading}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                onQuickAction={handleQuickAction}
                isSelected={selection.isSelected}
                onToggle={selection.toggle}
                onToggleAll={selection.toggleAll}
                allSelected={
                  contacts.length > 0 &&
                  contacts.every((c) => selection.isSelected(c._id))
                }
              />

              {/* Pagination Controls */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} contacts
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={pagination.page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <ContactsKanban
              contacts={contacts}
              isLoading={isLoading}
              onMove={handleKanbanMove}
            />
          )}
        </>
      )}
      </div>

      {/* Add Lead Modal */}
      <Dialog open={addLeadOpen} onOpenChange={(open) => { setAddLeadOpen(open); if (!open) resetLeadForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Lead</DialogTitle>
            <DialogDescription>Manually create a new lead.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="lead-first-name">First Name *</Label>
              <Input
                id="lead-first-name"
                value={leadForm.first_name}
                onChange={(e) => setLeadForm((f) => ({ ...f, first_name: e.target.value }))}
                placeholder="First name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lead-last-name">Last Name</Label>
              <Input
                id="lead-last-name"
                value={leadForm.last_name}
                onChange={(e) => setLeadForm((f) => ({ ...f, last_name: e.target.value }))}
                placeholder="Last name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lead-email">Email</Label>
              <Input
                id="lead-email"
                type="email"
                value={leadForm.email}
                onChange={(e) => setLeadForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lead-contact-id">Instagram / Social Handle</Label>
              <Input
                id="lead-contact-id"
                value={leadForm.contact_id}
                onChange={(e) => setLeadForm((f) => ({ ...f, contact_id: e.target.value }))}
                placeholder="@handle"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="lead-score">Score</Label>
                <Select
                  value={leadForm.score || "none"}
                  onValueChange={(v) => setLeadForm((f) => ({ ...f, score: v === "none" ? "" : v }))}
                >
                  <SelectTrigger id="lead-score">
                    <SelectValue placeholder="Not scored" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not scored</SelectItem>
                    {Array.from({ length: 10 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lead-contract-value">Contract Value $</Label>
                <Input
                  id="lead-contract-value"
                  type="number"
                  value={leadForm.contract_value}
                  onChange={(e) => setLeadForm((f) => ({ ...f, contract_value: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <div className="flex gap-1">
                {LEAD_STATUS_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    size="sm"
                    variant={leadForm.status === opt.value ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setLeadForm((f) => ({ ...f, status: opt.value }))}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lead-summary">Notes / Summary</Label>
              <Textarea
                id="lead-summary"
                value={leadForm.summary}
                onChange={(e) => setLeadForm((f) => ({ ...f, summary: e.target.value }))}
                placeholder="Optional notes..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddLeadOpen(false)} disabled={addLeadSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleAddLead}
              disabled={!leadForm.first_name.trim() || addLeadSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {addLeadSubmitting ? "Creating..." : "Create Lead"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
