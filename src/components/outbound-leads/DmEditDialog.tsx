import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DmEditDialogProps {
  editingLead: { username: string } | null;
  setEditingLead: (lead: null) => void;
  dmMessage: string;
  setDmMessage: (value: string) => void;
  dmDate: string;
  setDmDate: (value: string) => void;
  isSavingDm: boolean;
  saveDm: () => void;
}

export default function DmEditDialog({
  editingLead,
  setEditingLead,
  dmMessage,
  setDmMessage,
  dmDate,
  setDmDate,
  isSavingDm,
  saveDm,
}: DmEditDialogProps) {
  return (
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
  );
}
