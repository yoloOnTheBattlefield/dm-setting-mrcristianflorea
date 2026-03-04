import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import {
  useDeleteCampaign,
  useStartCampaign,
  usePauseCampaign,
  type Campaign,
} from "@/hooks/useCampaigns";
import type { OutboundAccount } from "@/hooks/useOutboundAccounts";
import {
  Plus,
  Play,
  Pause,
  Pencil,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
  active: { label: "Active", className: "bg-green-500/15 text-green-400 border-green-500/30" },
  paused: { label: "Paused", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  completed: { label: "Completed", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function progressColor(pct: number) {
  if (pct >= 80) return "bg-green-500";
  if (pct >= 30) return "bg-yellow-500";
  return "bg-red-500";
}

type SortKey = "name" | "status" | "progress" | "created";
type SortDir = "asc" | "desc";

interface CampaignListProps {
  campaigns: Campaign[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  outboundAccounts: OutboundAccount[];
  onCreateCampaign: () => void;
}

export default function CampaignList({
  campaigns: allCampaigns,
  isLoading,
  isError,
  error,
  refetch,
  outboundAccounts,
  onCreateCampaign,
}: CampaignListProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const limit = 20;

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [nameSearch, setNameSearch] = useState("");

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Deletion
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const deleteMutation = useDeleteCampaign();
  const startMutation = useStartCampaign();
  const pauseMutation = usePauseCampaign();

  const accountMap = useMemo(
    () => new Map(outboundAccounts.map((a) => [a._id, a])),
    [outboundAccounts],
  );

  // Filter → Sort → Paginate
  const filtered = useMemo(() => {
    let result = allCampaigns;
    if (statusFilter !== "all") result = result.filter((c) => c.status === statusFilter);
    if (modeFilter !== "all") result = result.filter((c) => c.mode === modeFilter);
    if (nameSearch.trim()) {
      const q = nameSearch.trim().toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q));
    }
    return result;
  }, [allCampaigns, statusFilter, modeFilter, nameSearch]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return dir * a.name.localeCompare(b.name);
        case "status":
          return dir * a.status.localeCompare(b.status);
        case "progress": {
          const pA = a.stats.total > 0 ? a.stats.sent / a.stats.total : 0;
          const pB = b.stats.total > 0 ? b.stats.sent / b.stats.total : 0;
          return dir * (pA - pB);
        }
        case "created":
          return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        default:
          return 0;
      }
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / limit));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = sorted.slice((safePage - 1) * limit, safePage * limit);

  const hasActiveFilters = statusFilter !== "all" || modeFilter !== "all" || nameSearch.trim() !== "";

  const clearFilters = () => {
    setStatusFilter("all");
    setModeFilter("all");
    setNameSearch("");
    setCurrentPage(1);
  };

  // Reset page when filters change
  const updateFilter = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    setter(value);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  // Sorting
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
    setSelectedIds(new Set());
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 ml-1" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 ml-1" />
    );
  };

  // Selection
  const allOnPageSelected = paginated.length > 0 && paginated.every((c) => selectedIds.has(c._id));
  const someOnPageSelected = paginated.some((c) => selectedIds.has(c._id));

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((c) => c._id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCampaigns = useMemo(
    () => allCampaigns.filter((c) => selectedIds.has(c._id)),
    [allCampaigns, selectedIds],
  );

  const canBulkPause = selectedCampaigns.some((c) => c.status === "active");
  const canBulkResume = selectedCampaigns.some((c) => c.status === "draft" || c.status === "paused");
  const canBulkDelete = selectedCampaigns.some((c) => c.status !== "active");

  // Actions
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync(deletingId);
      toast({ title: "Deleted", description: "Campaign deleted." });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deletingId);
        return next;
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete",
        variant: "destructive",
      });
    }
    setDeletingId(null);
  };

  const handleStartPause = useCallback(
    async (campaign: Campaign) => {
      try {
        if (campaign.status === "active") {
          await pauseMutation.mutateAsync(campaign._id);
          toast({ title: "Paused", description: `"${campaign.name}" paused.` });
        } else {
          await startMutation.mutateAsync(campaign._id);
          toast({ title: "Started", description: `"${campaign.name}" is now active.` });
        }
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Action failed",
          variant: "destructive",
        });
      }
    },
    [pauseMutation, startMutation, toast],
  );

  const handleBulkPause = async () => {
    const targets = selectedCampaigns.filter((c) => c.status === "active");
    for (const c of targets) {
      try {
        await pauseMutation.mutateAsync(c._id);
      } catch {
        /* continue */
      }
    }
    toast({ title: "Paused", description: `${targets.length} campaign(s) paused.` });
    setSelectedIds(new Set());
  };

  const handleBulkResume = async () => {
    const targets = selectedCampaigns.filter((c) => c.status === "draft" || c.status === "paused");
    for (const c of targets) {
      try {
        await startMutation.mutateAsync(c._id);
      } catch {
        /* continue */
      }
    }
    toast({ title: "Resumed", description: `${targets.length} campaign(s) started.` });
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    const targets = selectedCampaigns.filter((c) => c.status !== "active");
    for (const c of targets) {
      try {
        await deleteMutation.mutateAsync(c._id);
      } catch {
        /* continue */
      }
    }
    toast({ title: "Deleted", description: `${targets.length} campaign(s) deleted.` });
    setSelectedIds(new Set());
    setBulkDeleting(false);
  };

  return (
    <div className="flex-1 p-6">
      {/* Filter Bar */}
      <div className="flex items-end justify-between mb-4 gap-3 flex-wrap">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={nameSearch}
              onChange={(e) => updateFilter(setNameSearch, e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex flex-col gap-1 w-36">
            <Label className="text-xs">Status</Label>
            <Select value={statusFilter} onValueChange={(v) => updateFilter(setStatusFilter, v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1 w-32">
            <Label className="text-xs">Mode</Label>
            <Select value={modeFilter} onValueChange={(v) => updateFilter(setModeFilter, v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={onCreateCampaign} className="h-9">
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h2 className="text-lg font-semibold mb-2">Failed to load campaigns</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "An unknown error occurred"}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      ) : isLoading ? (
        <div className="text-center py-16 text-muted-foreground">Loading...</div>
      ) : (
        <>
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allOnPageSelected}
                      ref={(el) => {
                        if (el) (el as unknown as HTMLButtonElement).dataset.state =
                          someOnPageSelected && !allOnPageSelected ? "indeterminate" : el.dataset.state;
                      }}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>
                    <button className="flex items-center hover:text-foreground transition-colors" onClick={() => toggleSort("name")}>
                      Name <SortIcon col="name" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button className="flex items-center hover:text-foreground transition-colors" onClick={() => toggleSort("status")}>
                      Status <SortIcon col="status" />
                    </button>
                  </TableHead>
                  <TableHead>Accounts</TableHead>
                  <TableHead>
                    <button className="flex items-center hover:text-foreground transition-colors" onClick={() => toggleSort("progress")}>
                      Progress <SortIcon col="progress" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button className="flex items-center hover:text-foreground transition-colors" onClick={() => toggleSort("created")}>
                      Created <SortIcon col="created" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      {hasActiveFilters ? (
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-muted-foreground">No campaigns match your filters</p>
                          <Button variant="outline" size="sm" onClick={clearFilters}>
                            <X className="h-3.5 w-3.5 mr-1" />
                            Clear filters
                          </Button>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No campaigns found.</p>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((c) => {
                    const badge = STATUS_BADGE[c.status] || STATUS_BADGE.draft;
                    const total = c.stats.total || 0;
                    const sent = c.stats.sent || 0;
                    const pct = total > 0 ? Math.round((sent / total) * 100) : 0;
                    const isActive = c.status === "active";
                    const isCompleted = c.status === "completed";
                    const canEdit = !isActive;
                    const canDelete = !isActive;
                    const canStartPause = !isCompleted;
                    const accounts = c.outbound_account_ids ?? [];

                    return (
                      <TableRow
                        key={c._id}
                        className={`cursor-pointer ${selectedIds.has(c._id) ? "bg-muted/50" : ""}`}
                        onClick={() => navigate(`/campaigns/${c._id}`)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(c._id)}
                            onCheckedChange={() => toggleSelect(c._id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>
                          <Badge className={badge.className}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {accounts.slice(0, 2).map((aid) => {
                              const account = accountMap.get(aid);
                              return (
                                <Badge key={aid} variant="outline" className="text-[10px]">
                                  @{account?.username || "?"}
                                </Badge>
                              );
                            })}
                            {accounts.length > 2 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="text-[10px] cursor-default">
                                    +{accounts.length - 2}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-xs">
                                  <div className="flex flex-col gap-0.5 text-xs">
                                    {accounts.slice(2).map((aid) => {
                                      const account = accountMap.get(aid);
                                      return <span key={aid}>@{account?.username || "?"}</span>;
                                    })}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {accounts.length === 0 && (
                              <span className="text-xs text-muted-foreground">None</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <Progress
                              value={pct}
                              className="h-2 flex-1"
                              indicatorClassName={progressColor(pct)}
                            />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {sent}/{total}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {formatDate(c.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => navigate(`/campaigns/${c._id}`)}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStartPause(c)}
                                  disabled={!canStartPause || startMutation.isPending || pauseMutation.isPending}
                                  className={!canStartPause ? "opacity-50 cursor-not-allowed" : ""}
                                >
                                  {isActive ? (
                                    <Pause className="h-3.5 w-3.5" />
                                  ) : (
                                    <Play className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{isActive ? "Pause" : "Resume"}</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => canEdit && navigate(`/campaigns/${c._id}/edit`)}
                                  disabled={!canEdit}
                                  className={!canEdit ? "opacity-50 cursor-not-allowed" : ""}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => canDelete && setDeletingId(c._id)}
                                  disabled={!canDelete}
                                  className={!canDelete ? "opacity-50 cursor-not-allowed" : ""}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4 mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(safePage - 1) * limit + 1} to{" "}
                {Math.min(safePage * limit, sorted.length)} of {sorted.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Floating Bulk Action Bar */}
          {selectedIds.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border rounded-lg shadow-lg px-4 py-3 flex items-center gap-3">
              <span className="text-sm font-medium">
                {selectedIds.size} selected
              </span>
              <div className="h-4 w-px bg-border" />
              {canBulkPause && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkPause}
                  disabled={pauseMutation.isPending}
                >
                  <Pause className="h-3.5 w-3.5 mr-1" />
                  Pause
                </Button>
              )}
              {canBulkResume && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkResume}
                  disabled={startMutation.isPending}
                >
                  <Play className="h-3.5 w-3.5 mr-1" />
                  Resume
                </Button>
              )}
              {canBulkDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setBulkDeleting(true)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Single delete confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this campaign and all its leads. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation */}
      <AlertDialog open={bulkDeleting} onOpenChange={(open) => !open && setBulkDeleting(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Campaigns</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedCampaigns.filter((c) => c.status !== "active").length} campaign(s) and all their leads. Active campaigns will be skipped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
