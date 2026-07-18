import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateOutboundLead } from "@/hooks/useOutboundLeads";
import { type Platform } from "@/lib/platform";

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPTY = {
  platform: "instagram" as Platform,
  username: "",
  fullName: "",
  profileLink: "",
  followers: "",
  bio: "",
};

export default function AddLeadDialog({ open, onOpenChange }: AddLeadDialogProps) {
  const { toast } = useToast();
  const createLead = useCreateOutboundLead();
  const [form, setForm] = useState({ ...EMPTY });

  const isLinkedIn = form.platform === "linkedin";

  function reset() {
    setForm({ ...EMPTY });
  }

  async function handleSubmit() {
    const username = form.username.replace(/^@+/, "").trim();
    if (!username) {
      toast({ title: "Username required", variant: "destructive" });
      return;
    }
    try {
      const followers = form.followers.trim() ? Number(form.followers) : undefined;
      await createLead.mutateAsync({
        platform: form.platform,
        username,
        fullName: form.fullName.trim() || undefined,
        profileLink: form.profileLink.trim() || undefined,
        followersCount: Number.isFinite(followers) ? followers : undefined,
        bio: form.bio.trim() || undefined,
      });
      toast({ title: "Lead added", description: `${username} added to the pipeline` });
      reset();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Failed to add lead",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Lead</DialogTitle>
          <DialogDescription>Manually add a lead to the outbound pipeline.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Platform *</Label>
              <Select
                value={form.platform}
                onValueChange={(v) => setForm((p) => ({ ...p, platform: v as Platform }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{isLinkedIn ? "Vanity slug *" : "Username *"}</Label>
              <Input
                value={form.username}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                placeholder={isLinkedIn ? "john-doe-123" : "instagram_handle"}
              />
              <p className="text-xs text-muted-foreground">
                {isLinkedIn ? "From linkedin.com/in/{slug}" : "Without the leading @"}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Full name <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              placeholder="Jane Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Profile URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                value={form.profileLink}
                onChange={(e) => setForm((p) => ({ ...p, profileLink: e.target.value }))}
                placeholder={isLinkedIn ? "https://linkedin.com/in/..." : "https://instagram.com/..."}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Followers <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                type="number"
                value={form.followers}
                onChange={(e) => setForm((p) => ({ ...p, followers: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes / bio <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Any additional context..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createLead.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createLead.isPending}>
              {createLead.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Lead"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
