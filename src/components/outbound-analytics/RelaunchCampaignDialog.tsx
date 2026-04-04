import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Rocket, ArrowRight, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCampaigns, useRelaunchCampaign, type Campaign } from "@/hooks/useCampaigns";
import type { AIReportContent } from "@/hooks/useAIReports";

interface RelaunchCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: AIReportContent | null;
  preselectedCampaignId?: string;
}

/**
 * Extract only MESSAGE-RELATED recommendations from a report.
 * Operational stuff (timing, senders, targeting) is excluded —
 * the DM-writing AI can't act on those.
 */
function extractMessageGuidelines(report: AIReportContent): string[] {
  const lines: string[] = [];

  // New structured fields (from reports generated after the schema split)
  if (report.message_recommendations) {
    const mr = report.message_recommendations;
    if (mr.summary) lines.push(mr.summary, "");
    if (mr.do_more?.length) {
      lines.push("## Do More");
      mr.do_more.forEach((r) => lines.push(`- ${r}`));
      lines.push("");
    }
    if (mr.avoid?.length) {
      lines.push("## Avoid");
      mr.avoid.forEach((r) => lines.push(`- ${r}`));
      lines.push("");
    }
    if (mr.example_openers?.length) {
      lines.push("## Example Openers");
      mr.example_openers.forEach((o) => lines.push(`- "${o}"`));
    }
    return lines;
  }

  // Backwards-compatible fallback for older reports without the split
  if (report.message_strategy?.recommendations?.length) {
    lines.push("## Message Strategy");
    report.message_strategy.recommendations.forEach((r) => lines.push(`- ${r}`));
  }
  if (report.message_strategy?.top_performers?.length) {
    lines.push("## Top Performing Messages");
    report.message_strategy.top_performers.forEach((m) =>
      lines.push(`- "${m.preview}" — ${m.why_it_works}`),
    );
  }
  if (report.message_strategy?.worst_performers?.length) {
    lines.push("## Messages to Avoid");
    report.message_strategy.worst_performers.forEach((m) =>
      lines.push(`- "${m.preview}" — ${m.why_it_fails}`),
    );
  }
  if (report.conversation_analysis?.positive_patterns?.length) {
    lines.push("## Patterns That Convert");
    report.conversation_analysis.positive_patterns.forEach((p) =>
      lines.push(`- ${p.pattern}: ${p.why_it_works}`),
    );
  }
  if (report.conversation_analysis?.negative_patterns?.length) {
    lines.push("## Patterns to Avoid");
    report.conversation_analysis.negative_patterns.forEach((p) =>
      lines.push(`- ${p.pattern}: ${p.why_it_fails}`),
    );
  }
  return lines;
}

/** Build enhanced prompt using only message-related guidelines */
function buildEnhancedPrompt(originalPrompt: string, report: AIReportContent): string {
  const lines = extractMessageGuidelines(report);
  if (lines.length === 0) return originalPrompt;

  const guidelines = lines.join("\n");
  const separator = "\n\n---\n\n";

  if (!originalPrompt.trim()) {
    return `# Message Guidelines from AI Report\n\n${guidelines}`;
  }

  return `${originalPrompt.trim()}${separator}# Message Guidelines from AI Report\n\n${guidelines}`;
}

type Step = "select" | "diff" | "edit";

export function RelaunchCampaignDialog({ open, onOpenChange, report, preselectedCampaignId }: RelaunchCampaignDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: campaignsData } = useCampaigns({ limit: 200 });
  const relaunchMutation = useRelaunchCampaign();

  const [step, setStep] = useState<Step>("select");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [enhancedPrompt, setEnhancedPrompt] = useState("");

  const campaigns = campaignsData?.campaigns || [];
  const selectedCampaign = campaigns.find((c: Campaign) => c._id === selectedCampaignId);
  const originalPrompt = selectedCampaign?.ai_personalization?.prompt || "";
  const pendingCount = selectedCampaign?.stats?.pending || 0;

  // Pre-select campaign when provided
  useEffect(() => {
    if (open && preselectedCampaignId && !selectedCampaignId) {
      setSelectedCampaignId(preselectedCampaignId);
    }
  }, [open, preselectedCampaignId]);

  // Build enhanced prompt when campaign is selected
  const autoEnhancedPrompt = useMemo(() => {
    if (!report) return originalPrompt;
    return buildEnhancedPrompt(originalPrompt, report);
  }, [originalPrompt, report]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep("select");
      setSelectedCampaignId("");
      setEnhancedPrompt("");
    }
  }, [open]);

  const handleContinueToDiff = () => {
    setEnhancedPrompt(autoEnhancedPrompt);
    setStep("diff");
  };

  const handleRelaunch = async () => {
    if (!selectedCampaignId) return;
    try {
      const result = await relaunchMutation.mutateAsync({
        campaignId: selectedCampaignId,
        prompt: enhancedPrompt || undefined,
      });
      toast({
        title: "Campaign relaunched",
        description: `Created "${result.campaign.name}" with ${result.leads_copied} unsent lead(s).`,
      });
      onOpenChange(false);
      navigate(`/campaigns/${result.campaign._id}`);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to relaunch campaign",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-h-[85vh] overflow-y-auto", step === "diff" ? "sm:max-w-3xl" : "sm:max-w-lg")}>
        <DialogHeader>
          <DialogTitle>
            {step === "select" && "Relaunch Campaign"}
            {step === "diff" && "Review Prompt Changes"}
            {step === "edit" && "Edit Prompt"}
          </DialogTitle>
          <DialogDescription>
            {step === "select" && "Choose a campaign to relaunch with an AI-improved prompt."}
            {step === "diff" && "Review the AI-enhanced prompt based on the report's findings."}
            {step === "edit" && "Make manual adjustments to the prompt."}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Select campaign */}
        {step === "select" && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Source Campaign</Label>
              <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((c: Campaign) => (
                    <SelectItem key={c._id} value={c._id}>
                      <span className="flex items-center gap-2">
                        {c.name}
                        {c.stats.pending > 0 && (
                          <Badge variant="secondary" className="text-[10px] ml-1">
                            {c.stats.pending} unsent
                          </Badge>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCampaign && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <strong>{pendingCount}</strong> unsent lead{pendingCount !== 1 ? "s" : ""} will be moved to the new campaign.
                  {pendingCount === 0 && (
                    <span className="text-amber-600 ml-1">No unsent leads in this campaign.</span>
                  )}
                </div>

                {originalPrompt && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Current Prompt</Label>
                    <div className="rounded-md border bg-muted/50 p-3 text-xs font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {originalPrompt}
                    </div>
                  </div>
                )}

                {!originalPrompt && (
                  <p className="text-xs text-amber-600">
                    No AI prompt was used in this campaign. The report's recommendations will be used as the new prompt.
                  </p>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleContinueToDiff}
                disabled={!selectedCampaignId || pendingCount === 0}
                className="gap-1.5"
              >
                Review Changes
                <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2: Diff view */}
        {step === "diff" && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              {/* Original */}
              <div className="space-y-1.5">
                <Label className="text-xs">
                  <Badge variant="outline" className="text-[10px] mr-1.5">Original</Badge>
                  Current prompt
                </Label>
                <div className="rounded-md border bg-red-50 dark:bg-red-950/20 p-3 text-xs font-mono whitespace-pre-wrap max-h-[50vh] overflow-y-auto leading-relaxed">
                  {originalPrompt || <span className="italic text-muted-foreground">No prompt</span>}
                </div>
              </div>

              {/* Enhanced */}
              <div className="space-y-1.5">
                <Label className="text-xs">
                  <Badge variant="default" className="text-[10px] mr-1.5">Enhanced</Badge>
                  With report insights
                </Label>
                <div className="rounded-md border bg-emerald-50 dark:bg-emerald-950/20 p-3 text-xs font-mono whitespace-pre-wrap max-h-[50vh] overflow-y-auto leading-relaxed">
                  {enhancedPrompt}
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              The enhanced prompt includes guidelines extracted from the report's message strategy, conversation patterns, and recommendations.
            </div>

            <DialogFooter className="flex-row justify-between sm:justify-between">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setStep("select")}>
                  Back
                </Button>
                <Button variant="outline" size="sm" onClick={() => setStep("edit")} className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
              <Button
                onClick={handleRelaunch}
                disabled={relaunchMutation.isPending}
                size="sm"
                className="gap-1.5"
              >
                {relaunchMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Rocket className="h-4 w-4" />
                )}
                {relaunchMutation.isPending ? "Relaunching..." : "Accept & Relaunch"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Manual edit */}
        {step === "edit" && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Enhanced Prompt</Label>
              <Textarea
                value={enhancedPrompt}
                onChange={(e) => setEnhancedPrompt(e.target.value)}
                rows={16}
                className="text-xs font-mono"
              />
            </div>

            <DialogFooter className="flex-row justify-between sm:justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep("diff")}>
                Back to Diff
              </Button>
              <Button
                onClick={handleRelaunch}
                disabled={relaunchMutation.isPending}
                size="sm"
                className="gap-1.5"
              >
                {relaunchMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Rocket className="h-4 w-4" />
                )}
                {relaunchMutation.isPending ? "Relaunching..." : "Relaunch"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
