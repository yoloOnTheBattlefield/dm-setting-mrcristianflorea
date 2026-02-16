import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useCreateCampaign, useUpdateCampaign, type Campaign } from "@/hooks/useCampaigns";
import type { SenderAccount } from "@/hooks/useSenderAccounts";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

interface CampaignCreateEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign | null;
  senders: SenderAccount[];
}

interface FormData {
  name: string;
  messages: string[];
  sender_ids: string[];
  active_hours_start: number;
  active_hours_end: number;
  min_delay_seconds: number;
  max_delay_seconds: number;
  timezone: string;
  daily_limit_per_sender: number;
}

const DEFAULT_FORM: FormData = {
  name: "",
  messages: [""],
  sender_ids: [],
  active_hours_start: 9,
  active_hours_end: 21,
  min_delay_seconds: 60,
  max_delay_seconds: 180,
  timezone: "America/New_York",
  daily_limit_per_sender: 50,
};

export default function CampaignCreateEditDialog({
  open,
  onOpenChange,
  campaign,
  senders,
}: CampaignCreateEditDialogProps) {
  const { toast } = useToast();
  const createMutation = useCreateCampaign();
  const updateMutation = useUpdateCampaign();
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);

  const isEdit = !!campaign;

  useEffect(() => {
    if (open) {
      if (campaign) {
        setForm({
          name: campaign.name,
          messages: campaign.messages.length > 0 ? [...campaign.messages] : [""],
          sender_ids: [...campaign.sender_ids],
          active_hours_start: campaign.schedule.active_hours_start,
          active_hours_end: campaign.schedule.active_hours_end,
          min_delay_seconds: campaign.schedule.min_delay_seconds,
          max_delay_seconds: campaign.schedule.max_delay_seconds,
          timezone: campaign.schedule.timezone,
          daily_limit_per_sender: campaign.daily_limit_per_sender,
        });
      } else {
        setForm(DEFAULT_FORM);
      }
    }
  }, [open, campaign]);

  const updateMessage = (index: number, value: string) => {
    setForm((prev) => {
      const msgs = [...prev.messages];
      msgs[index] = value;
      return { ...prev, messages: msgs };
    });
  };

  const addMessage = () => {
    setForm((prev) => ({ ...prev, messages: [...prev.messages, ""] }));
  };

  const removeMessage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      messages: prev.messages.filter((_, i) => i !== index),
    }));
  };

  const toggleSender = (senderId: string) => {
    setForm((prev) => ({
      ...prev,
      sender_ids: prev.sender_ids.includes(senderId)
        ? prev.sender_ids.filter((id) => id !== senderId)
        : [...prev.sender_ids, senderId],
    }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast({ title: "Error", description: "Campaign name is required.", variant: "destructive" });
      return;
    }

    const body = {
      name: form.name.trim(),
      messages: form.messages.filter((m) => m.trim()),
      sender_ids: form.sender_ids,
      schedule: {
        active_hours_start: form.active_hours_start,
        active_hours_end: form.active_hours_end,
        min_delay_seconds: form.min_delay_seconds,
        max_delay_seconds: form.max_delay_seconds,
        timezone: form.timezone,
      },
      daily_limit_per_sender: form.daily_limit_per_sender,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: campaign._id, body });
        toast({ title: "Updated", description: `"${body.name}" updated.` });
      } else {
        await createMutation.mutateAsync(body);
        toast({ title: "Created", description: `"${body.name}" created as draft.` });
      }
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save",
        variant: "destructive",
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Campaign" : "New Campaign"}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-5 pb-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label>Campaign Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="January Outreach"
              />
            </div>

            {/* Messages */}
            <div className="space-y-2">
              <Label>Message Templates</Label>
              <p className="text-xs text-muted-foreground">
                Add multiple variants to rotate. Use {"{{username}}"} for the target handle.
              </p>
              {form.messages.map((msg, i) => (
                <div key={i} className="flex gap-2">
                  <Textarea
                    value={msg}
                    onChange={(e) => updateMessage(i, e.target.value)}
                    placeholder={`Message variant ${i + 1}...`}
                    rows={2}
                    className="flex-1"
                  />
                  {form.messages.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeMessage(i)} className="shrink-0 mt-1">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addMessage}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Variant
              </Button>
            </div>

            {/* Senders */}
            <div className="space-y-2">
              <Label>Sender Accounts</Label>
              {senders.length === 0 ? (
                <p className="text-xs text-muted-foreground">No sender accounts available.</p>
              ) : (
                <div className="space-y-1.5 border rounded-md p-3">
                  {senders.map((s) => (
                    <label key={s._id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={form.sender_ids.includes(s._id)}
                        onCheckedChange={() => toggleSender(s._id)}
                      />
                      <span
                        className={`h-2 w-2 rounded-full ${s.status === "online" ? "bg-green-400" : "bg-zinc-500"}`}
                      />
                      <span className="text-sm">@{s.ig_username}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{s.daily_limit}/day</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Schedule */}
            <div className="space-y-2">
              <Label>Schedule</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Active Hours Start</Label>
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={form.active_hours_start}
                    onChange={(e) => setForm((p) => ({ ...p, active_hours_start: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Active Hours End</Label>
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={form.active_hours_end}
                    onChange={(e) => setForm((p) => ({ ...p, active_hours_end: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Min Delay (sec)</Label>
                  <Input
                    type="number"
                    min={10}
                    value={form.min_delay_seconds}
                    onChange={(e) => setForm((p) => ({ ...p, min_delay_seconds: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Max Delay (sec)</Label>
                  <Input
                    type="number"
                    min={10}
                    value={form.max_delay_seconds}
                    onChange={(e) => setForm((p) => ({ ...p, max_delay_seconds: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Timezone</Label>
                <Select value={form.timezone} onValueChange={(v) => setForm((p) => ({ ...p, timezone: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Daily Limit */}
            <div className="space-y-1.5">
              <Label>Daily Limit per Sender</Label>
              <Input
                type="number"
                min={1}
                max={200}
                value={form.daily_limit_per_sender}
                onChange={(e) => setForm((p) => ({ ...p, daily_limit_per_sender: Number(e.target.value) }))}
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Create Campaign"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
