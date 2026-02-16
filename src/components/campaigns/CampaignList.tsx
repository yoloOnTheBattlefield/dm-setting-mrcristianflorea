import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  useCampaigns,
  useDeleteCampaign,
  useStartCampaign,
  usePauseCampaign,
  type Campaign,
} from "@/hooks/useCampaigns";
import type { SenderAccount } from "@/hooks/useSenderAccounts";
import {
  Plus,
  Play,
  Pause,
  Pencil,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
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

interface CampaignListProps {
  senders: SenderAccount[];
  onCreateCampaign: () => void;
  onEditCampaign: (campaign: Campaign) => void;
}

export default function CampaignList({
  senders,
  onCreateCampaign,
  onEditCampaign,
}: CampaignListProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const limit = 20;

  const { data, isLoading, isError, error, refetch } = useCampaigns({
    status: statusFilter === "all" ? undefined : statusFilter,
    page: currentPage,
    limit,
  });

  const deleteMutation = useDeleteCampaign();
  const startMutation = useStartCampaign();
  const pauseMutation = usePauseCampaign();

  const campaigns = data?.campaigns || [];
  const pagination = data?.pagination;

  const senderMap = new Map(senders.map((s) => [s._id, s]));

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync(deletingId);
      toast({ title: "Deleted", description: "Campaign deleted." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete",
        variant: "destructive",
      });
    }
    setDeletingId(null);
  };

  const handleStartPause = async (campaign: Campaign) => {
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
  };

  return (
    <div className="flex-1 p-6">
      <div className="flex items-end justify-between mb-4">
        <div className="flex gap-4 items-end">
          <div className="flex flex-col gap-2 w-44">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger>
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
        </div>
        <Button onClick={onCreateCampaign}>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">Failed to load campaigns</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "An unknown error occurred"}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
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
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Senders</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No campaigns found.
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((c) => {
                    const badge = STATUS_BADGE[c.status] || STATUS_BADGE.draft;
                    const total = c.stats.total || 0;
                    const sent = c.stats.sent || 0;
                    const pct = total > 0 ? Math.round((sent / total) * 100) : 0;
                    const canEdit = c.status === "draft" || c.status === "paused";
                    const canStartPause = c.status !== "completed";
                    const canDelete = c.status !== "active";

                    return (
                      <TableRow key={c._id} className="cursor-pointer" onClick={() => navigate(`/campaigns/${c._id}`)}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>
                          <Badge className={badge.className}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {c.sender_ids.slice(0, 3).map((sid) => {
                              const sender = senderMap.get(sid);
                              return (
                                <Badge key={sid} variant="outline" className="text-[10px]">
                                  @{sender?.ig_username || "?"}
                                </Badge>
                              );
                            })}
                            {c.sender_ids.length > 3 && (
                              <span className="text-xs text-muted-foreground">+{c.sender_ids.length - 3}</span>
                            )}
                            {c.sender_ids.length === 0 && (
                              <span className="text-xs text-muted-foreground">None</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <Progress value={pct} className="h-2 flex-1" />
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
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/campaigns/${c._id}`)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {canStartPause && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStartPause(c)}
                                disabled={startMutation.isPending || pauseMutation.isPending}
                              >
                                {c.status === "active" ? (
                                  <Pause className="h-3.5 w-3.5" />
                                ) : (
                                  <Play className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            )}
                            {canEdit && (
                              <Button variant="ghost" size="sm" onClick={() => onEditCampaign(c)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button variant="ghost" size="sm" onClick={() => setDeletingId(c._id)}>
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4 mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
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
    </div>
  );
}
