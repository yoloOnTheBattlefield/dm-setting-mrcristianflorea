import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Loader2,
  X,
} from "lucide-react";
import type { DeepScrapeJob } from "@/lib/types";

interface EditJobDialogProps {
  editingJob: DeepScrapeJob | null;
  onClose: () => void;
  editSeeds: string[];
  editNewSeedText: string;
  setEditNewSeedText: (text: string) => void;
  editName: string;
  setEditName: (name: string) => void;
  editReelLimit: number;
  setEditReelLimit: (limit: number) => void;
  editCommentLimit: number;
  setEditCommentLimit: (limit: number) => void;
  editMinFollowers: number;
  setEditMinFollowers: (min: number) => void;
  editIsRecurring: boolean;
  setEditIsRecurring: (recurring: boolean) => void;
  editRepeatInterval: number;
  setEditRepeatInterval: (interval: number) => void;
  showEditConfirm: boolean;
  setShowEditConfirm: (show: boolean) => void;
  onRemoveEditSeed: (seed: string) => void;
  onAddEditSeeds: () => void;
  onSaveEdit: () => void;
  isSaving: boolean;
  targetQualMap: Record<string, { qualRate: number | null; qualified: number; rejected: number }>;
}

export function EditJobDialog({
  editingJob,
  onClose,
  editSeeds,
  editNewSeedText,
  setEditNewSeedText,
  editName,
  setEditName,
  editReelLimit,
  setEditReelLimit,
  editCommentLimit,
  setEditCommentLimit,
  editMinFollowers,
  setEditMinFollowers,
  editIsRecurring,
  setEditIsRecurring,
  editRepeatInterval,
  setEditRepeatInterval,
  showEditConfirm,
  setShowEditConfirm,
  onRemoveEditSeed,
  onAddEditSeeds,
  onSaveEdit,
  isSaving,
  targetQualMap,
}: EditJobDialogProps) {
  return (
    <Dialog open={!!editingJob} onOpenChange={(open) => { if (!open) { onClose(); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Deep Scrape Job</DialogTitle>
          <DialogDescription>
            Update targets and settings. Changes apply to future runs only.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Job Name</Label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. Fitness niche round 1"
            />
          </div>

          <div className="space-y-2">
            <Label>Targets ({editSeeds.length})</Label>
            <div className="flex flex-wrap gap-1.5 min-h-[36px] rounded-md border p-2">
              {editSeeds.length === 0 ? (
                <span className="text-xs text-muted-foreground">No targets. Add at least one below.</span>
              ) : (
                editSeeds.map((seed) => {
                  const stats = targetQualMap[seed];
                  const qualRate = stats?.qualRate;
                  const qualColor = qualRate === null || qualRate === undefined
                    ? "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
                    : qualRate <= 20
                      ? "bg-red-500/15 text-red-400 border-red-500/30"
                      : qualRate <= 40
                        ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
                        : "bg-green-500/15 text-green-400 border-green-500/30";
                  return (
                    <Badge
                      key={seed}
                      variant="secondary"
                      className="gap-1.5 pl-2 pr-1 py-0.5 text-xs"
                    >
                      @{seed}
                      <span className={`inline-flex items-center rounded px-1 py-px text-[9px] font-medium leading-none border ${qualColor}`}>
                        {qualRate !== null && qualRate !== undefined ? `${qualRate}%` : "N/A"}
                      </span>
                      <button
                        onClick={() => onRemoveEditSeed(seed)}
                        className="rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Add Targets</Label>
            <div className="flex gap-2">
              <Textarea
                placeholder={"newuser1\nnewuser2"}
                value={editNewSeedText}
                onChange={(e) => setEditNewSeedText(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={onAddEditSeeds}
                disabled={!editNewSeedText.trim()}
                className="self-end"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">One username per line, without @</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{editingJob?.scrape_type === "posts" ? "Post Limit" : "Reel Limit"}</Label>
              <Input type="number" min={1} value={editReelLimit} onChange={(e) => setEditReelLimit(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Comment Limit</Label>
              <Input type="number" min={1} value={editCommentLimit} onChange={(e) => setEditCommentLimit(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Min Followers</Label>
              <Input type="number" min={0} value={editMinFollowers} onChange={(e) => setEditMinFollowers(Number(e.target.value))} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label>Recurring</Label>
              <p className="text-xs text-muted-foreground">Automatically re-run on a schedule.</p>
            </div>
            <Switch checked={editIsRecurring} onCheckedChange={setEditIsRecurring} />
          </div>
          {editIsRecurring && (
            <div className="flex items-center gap-3 pl-1">
              <Label className="whitespace-nowrap text-sm">Repeat Every</Label>
              <Input type="number" min={1} className="w-20" value={editRepeatInterval} onChange={(e) => setEditRepeatInterval(Number(e.target.value))} />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
          )}
        </div>
        {showEditConfirm && (
          <div className="rounded-md border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-200">
            This is a recurring job. Changes will apply to future runs only. Previously scraped data will not be affected.
          </div>
        )}
        <DialogFooter className="pt-2">
          {showEditConfirm ? (
            <>
              <Button variant="outline" onClick={() => setShowEditConfirm(false)}>
                Go Back
              </Button>
              <Button
                onClick={onSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                ) : (
                  "Confirm & Save"
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={onSaveEdit}
                disabled={editSeeds.length === 0 || isSaving}
              >
                {isSaving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
