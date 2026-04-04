import { useState, useEffect } from "react";
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
import { Loader2, Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCampaigns, useRelaunchCampaign, type Campaign } from "@/hooks/useCampaigns";

interface RelaunchCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RelaunchCampaignDialog({ open, onOpenChange }: RelaunchCampaignDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: campaignsData } = useCampaigns({ limit: 200 });
  const relaunchMutation = useRelaunchCampaign();

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [prompt, setPrompt] = useState("");

  const campaigns = campaignsData?.campaigns || [];
  const selectedCampaign = campaigns.find((c: Campaign) => c._id === selectedCampaignId);

  // When a campaign is selected, populate the prompt from its AI personalization
  useEffect(() => {
    if (selectedCampaign?.ai_personalization?.prompt) {
      setPrompt(selectedCampaign.ai_personalization.prompt);
    } else {
      setPrompt("");
    }
  }, [selectedCampaignId]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedCampaignId("");
      setPrompt("");
    }
  }, [open]);

  const handleRelaunch = async () => {
    if (!selectedCampaignId) return;

    try {
      const result = await relaunchMutation.mutateAsync({
        campaignId: selectedCampaignId,
        prompt: prompt || undefined,
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

  const pendingCount = selectedCampaign?.stats?.pending || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Relaunch Campaign</DialogTitle>
          <DialogDescription>
            Create a new versioned campaign with unsent leads and an updated prompt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Campaign selector */}
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

          {/* Show pending count */}
          {selectedCampaign && (
            <div className="text-sm text-muted-foreground">
              <strong>{pendingCount}</strong> unsent lead{pendingCount !== 1 ? "s" : ""} will be moved to the new campaign.
              {pendingCount === 0 && (
                <span className="text-amber-600 ml-1">No unsent leads in this campaign.</span>
              )}
            </div>
          )}

          {/* Prompt editor */}
          <div className="space-y-2">
            <Label>AI Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={selectedCampaign ? "No prompt was used in the source campaign. Enter a new one or leave empty." : "Select a campaign first"}
              rows={8}
              className="text-sm font-mono"
              disabled={!selectedCampaignId}
            />
            <p className="text-xs text-muted-foreground">
              Edit the prompt to incorporate feedback from the report. This will be saved on the new campaign.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleRelaunch}
            disabled={!selectedCampaignId || pendingCount === 0 || relaunchMutation.isPending}
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
      </DialogContent>
    </Dialog>
  );
}
