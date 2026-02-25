import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { usePrompts } from "@/hooks/usePrompts";
import { useCampaign, useCampaignLeads, useAddCampaignLeads } from "@/hooks/useCampaigns";
import { useOutboundLeads, fetchAllMatchingLeadIds } from "@/hooks/useOutboundLeads";
import { useLeadSelection } from "@/hooks/useLeadSelection";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";

function formatNumber(n?: number): string {
  if (n == null) return "-";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function CampaignAddLeads() {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId ?? null);
  const { data: prompts = [] } = usePrompts();
  const addLeadsMutation = useAddCampaignLeads();

  const [promptFilter, setPromptFilter] = useState("all");
  const [minFollowers, setMinFollowers] = useState<string>("");
  const [maxFollowers, setMaxFollowers] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const limit = 50;

  const parsedMin = minFollowers ? parseInt(minFollowers, 10) : undefined;
  const parsedMax = maxFollowers ? parseInt(maxFollowers, 10) : undefined;

  const { data: leadsData, isLoading: leadsLoading } = useOutboundLeads({
    page: currentPage,
    limit,
    promptId: promptFilter,
    minFollowers: parsedMin && !isNaN(parsedMin) ? parsedMin : undefined,
    maxFollowers: parsedMax && !isNaN(parsedMax) ? parsedMax : undefined,
  });

  const leads = leadsData?.leads ?? [];
  const pagination = leadsData?.pagination ?? null;
  const totalMatching = pagination?.total ?? 0;

  // Fetch existing campaign leads to block duplicates
  const { data: existingLeadsData } = useCampaignLeads(campaignId ?? null, {
    limit: 10000,
  });

  const existingLeadIds = useMemo(() => {
    const ids = new Set<string>();
    if (existingLeadsData?.leads) {
      for (const cl of existingLeadsData.leads) {
        if (cl.outbound_lead_id?._id) {
          ids.add(cl.outbound_lead_id._id);
        }
      }
    }
    return ids;
  }, [existingLeadsData]);

  const selection = useLeadSelection();

  // Filter out already-in-campaign leads from selectable IDs
  const selectableIds = useMemo(
    () => leads.filter((l) => !existingLeadIds.has(l._id)).map((l) => l._id),
    [leads, existingLeadIds]
  );

  const allPageSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selection.isSelected(id));

  const selectionCount = selection.getCount(totalMatching);

  const handleFilterChange = (v: string) => {
    setPromptFilter(v);
    setCurrentPage(1);
    selection.clearSelection();
  };

  const handleFollowerChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setCurrentPage(1);
    selection.clearSelection();
  };

  const handleSubmit = async () => {
    if (selectionCount === 0 || !campaignId) return;
    setSubmitting(true);

    try {
      let leadIds: string[];

      if (selection.mode === "manual") {
        leadIds = Array.from(selection.selectedIds).filter(
          (id) => !existingLeadIds.has(id)
        );
      } else {
        const allIds = await fetchAllMatchingLeadIds(
          promptFilter,
          parsedMin && !isNaN(parsedMin) ? parsedMin : undefined,
          parsedMax && !isNaN(parsedMax) ? parsedMax : undefined,
        );
        leadIds = allIds.filter(
          (id) => !selection.excludedIds.has(id) && !existingLeadIds.has(id)
        );
      }

      if (leadIds.length === 0) {
        toast({
          title: "No leads to add",
          description: "All selected leads are already in this campaign.",
        });
        setSubmitting(false);
        return;
      }

      const result = await addLeadsMutation.mutateAsync({
        campaignId,
        lead_ids: leadIds,
      });

      toast({
        title: "Leads added",
        description: `${result.added} qualified lead(s) added. ${result.duplicates_skipped || 0} duplicates skipped.`,
      });
      navigate(`/campaigns/${campaignId}`);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add leads",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="flex flex-col flex-1">
      {/* Sticky header */}
      <div className="sticky top-16 z-30 bg-background border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/campaigns/${campaignId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h3 className="text-lg font-bold">Add Leads</h3>
            <p className="text-xs text-muted-foreground">{campaign.name}</p>
          </div>
        </div>
        {selectionCount > 0 && (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add {selectionCount} Qualified Lead{selectionCount !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        )}
      </div>

      <div className="flex-1 p-6 space-y-4">
        {/* Filter bar */}
        <div className="flex gap-3 items-end">
          <div className="flex flex-col gap-1.5 w-56">
            <Label>Qualified by Prompt</Label>
            <Select value={promptFilter} onValueChange={handleFilterChange}>
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
          <div className="flex flex-col gap-1.5 w-32">
            <Label>Min Followers</Label>
            <Input
              type="number"
              placeholder="e.g. 1000"
              value={minFollowers}
              onChange={handleFollowerChange(setMinFollowers)}
            />
          </div>
          <div className="flex flex-col gap-1.5 w-32">
            <Label>Max Followers</Label>
            <Input
              type="number"
              placeholder="e.g. 50000"
              value={maxFollowers}
              onChange={handleFollowerChange(setMaxFollowers)}
            />
          </div>
          {pagination && (
            <span className="text-sm text-muted-foreground pb-2">
              {pagination.total} qualified lead{pagination.total !== 1 ? "s" : ""} available
            </span>
          )}
        </div>

        {/* Selection banner */}
        {selectionCount > 0 && (
          <div className="flex items-center gap-3 rounded-lg border bg-primary/5 border-primary/20 px-4 py-2.5">
            <span className="text-sm font-medium">
              {selectionCount} qualified lead{selectionCount !== 1 ? "s" : ""} selected
            </span>
            {selection.mode === "manual" && totalMatching > selectionCount && (
              <button
                onClick={selection.selectAllMatching}
                className="text-sm text-primary hover:underline"
              >
                Select all {totalMatching} matching leads
              </button>
            )}
            <button
              onClick={selection.clearSelection}
              className="text-sm text-muted-foreground hover:text-foreground ml-auto"
            >
              Clear
            </button>
          </div>
        )}

        {/* Table */}
        {leadsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : leads.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No qualified un-messaged leads found.
          </div>
        ) : (
          <>
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allPageSelected}
                        onCheckedChange={() => selection.toggleAll(selectableIds)}
                      />
                    </TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead className="text-right">Followers</TableHead>
                    <TableHead>Prompt</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => {
                    const inCampaign = existingLeadIds.has(lead._id);
                    const checked = !inCampaign && selection.isSelected(lead._id);

                    return (
                      <TableRow
                        key={lead._id}
                        className={inCampaign ? "opacity-50" : ""}
                      >
                        <TableCell>
                          <Checkbox
                            checked={checked}
                            disabled={inCampaign}
                            onCheckedChange={() => selection.toggle(lead._id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          @{lead.username}
                          {inCampaign && (
                            <Badge
                              variant="outline"
                              className="ml-2 text-[10px] text-muted-foreground"
                            >
                              Already added
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatNumber(lead.followersCount)}
                        </TableCell>
                        <TableCell>
                          {lead.promptLabel ? (
                            <Badge variant="outline" className="text-xs">
                              {lead.promptLabel}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            @{lead.source}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(pagination.totalPages, p + 1)
                      )
                    }
                    disabled={pagination.page === pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sticky bottom bar */}
      {selectionCount > 0 && (
        <div className="sticky bottom-0 z-30 bg-background border-t px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {selectionCount} qualified lead{selectionCount !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={selection.clearSelection}>
              Clear
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add {selectionCount} Qualified Lead{selectionCount !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
