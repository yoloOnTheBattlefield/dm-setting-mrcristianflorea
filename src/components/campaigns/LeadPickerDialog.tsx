import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
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
import { useToast } from "@/hooks/use-toast";
import { useAddCampaignLeads } from "@/hooks/useCampaigns";
import { usePrompts } from "@/hooks/usePrompts";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const LEADS_URL = import.meta.env.DEV
  ? "http://localhost:3000/outbound-leads"
  : "https://quddify-server.vercel.app/outbound-leads";

interface OutboundLead {
  _id: string;
  username: string;
  fullName: string;
  followersCount?: number;
  source: string;
  promptLabel?: string;
}

function formatNumber(n?: number): string {
  if (n == null) return "-";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface LeadPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  apiKey: string;
}

export default function LeadPickerDialog({
  open,
  onOpenChange,
  campaignId,
  apiKey,
}: LeadPickerDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const addLeadsMutation = useAddCampaignLeads(apiKey);
  const { data: prompts = [] } = usePrompts(user?.account_id);

  const [leads, setLeads] = useState<OutboundLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [promptFilter, setPromptFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const limit = 50;

  const fetchLeads = async (page: number, promptId: string) => {
    setLoading(true);
    try {
      const sp = new URLSearchParams({
        qualified: "true",
        isMessaged: "false",
        limit: String(limit),
        page: String(page),
      });
      if (promptId !== "all") {
        sp.append("promptId", promptId);
      }
      const res = await fetch(`${LEADS_URL}?${sp.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch leads");
      const data = await res.json();
      setLeads(data.leads || []);
      setPagination(data.pagination || null);
    } catch {
      toast({ title: "Error", description: "Failed to load leads", variant: "destructive" });
      setLeads([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when dialog opens or filter/page changes
  useEffect(() => {
    if (open) {
      fetchLeads(currentPage, promptFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentPage, promptFilter]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set());
      setCurrentPage(1);
      setPromptFilter("all");
    }
  }, [open]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map((l) => l._id)));
    }
  };

  const handleAdd = async () => {
    if (selectedIds.size === 0) return;
    try {
      const result = await addLeadsMutation.mutateAsync({
        campaignId,
        lead_ids: Array.from(selectedIds),
      });
      toast({
        title: "Leads added",
        description: `${result.added} lead(s) added. ${result.duplicates_skipped || 0} duplicates skipped.`,
      });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add leads",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Leads to Campaign</DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="flex gap-3 items-end">
          <div className="flex flex-col gap-1.5 w-56">
            <Label>Qualified by Prompt</Label>
            <Select
              value={promptFilter}
              onValueChange={(v) => {
                setPromptFilter(v);
                setCurrentPage(1);
                setSelectedIds(new Set());
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Prompts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prompts</SelectItem>
                {prompts.map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {pagination && (
            <span className="text-sm text-muted-foreground pb-2">
              {pagination.total} lead{pagination.total !== 1 ? "s" : ""} available
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : leads.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No qualified un-messaged leads found.
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedIds.size === leads.length && leads.length > 0}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead className="text-right">Followers</TableHead>
                    <TableHead>Prompt</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead._id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(lead._id)}
                          onCheckedChange={() => toggleSelection(lead._id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">@{lead.username}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatNumber(lead.followersCount)}
                      </TableCell>
                      <TableCell>
                        {lead.promptLabel ? (
                          <Badge variant="outline" className="text-xs">{lead.promptLabel}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">@{lead.source}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={selectedIds.size === 0 || addLeadsMutation.isPending}
              >
                {addLeadsMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  `Add ${selectedIds.size} Lead${selectedIds.size !== 1 ? "s" : ""}`
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
