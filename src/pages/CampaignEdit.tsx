import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCampaign, useUpdateCampaign } from "@/hooks/useCampaigns";
import { useOutboundAccounts } from "@/hooks/useOutboundAccounts";
import { ArrowLeft, Plus, Trash2, Loader2, Save } from "lucide-react";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

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

interface FormData {
  name: string;
  mode: "auto" | "manual";
  messages: string[];
  outbound_account_ids: string[];
  active_hours_start: number;
  active_hours_end: number;
  min_delay_seconds: number;
  max_delay_seconds: number;
  timezone: string;
  daily_limit_per_sender: number;
}

export default function CampaignEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: campaign, isLoading } = useCampaign(id ?? null);
  const updateMutation = useUpdateCampaign();
  const { data: outboundData } = useOutboundAccounts({ page: 1, limit: 100 });
  const outboundAccounts = outboundData?.accounts ?? [];

  const [form, setForm] = useState<FormData | null>(null);

  useEffect(() => {
    if (campaign && !form) {
      setForm({
        name: campaign.name,
        mode: campaign.mode || "auto",
        messages: campaign.messages.length > 0 ? [...campaign.messages] : [""],
        outbound_account_ids: [...(campaign.outbound_account_ids ?? [])],
        active_hours_start: campaign.schedule.active_hours_start,
        active_hours_end: campaign.schedule.active_hours_end,
        min_delay_seconds: campaign.schedule.min_delay_seconds,
        max_delay_seconds: campaign.schedule.max_delay_seconds,
        timezone: campaign.schedule.timezone,
        daily_limit_per_sender: campaign.daily_limit_per_sender,
      });
    }
  }, [campaign, form]);

  const updateMessage = (index: number, value: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      const msgs = [...prev.messages];
      msgs[index] = value;
      return { ...prev, messages: msgs };
    });
  };

  const addMessage = () => {
    setForm((prev) => prev ? { ...prev, messages: [...prev.messages, ""] } : prev);
  };

  const removeMessage = (index: number) => {
    setForm((prev) =>
      prev ? { ...prev, messages: prev.messages.filter((_, i) => i !== index) } : prev
    );
  };

  const toggleOutboundAccount = (accountId: string) => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            outbound_account_ids: prev.outbound_account_ids.includes(accountId)
              ? prev.outbound_account_ids.filter((id) => id !== accountId)
              : [...prev.outbound_account_ids, accountId],
          }
        : prev
    );
  };

  const handleSubmit = async () => {
    if (!form || !id) return;

    if (!form.name.trim()) {
      toast({ title: "Error", description: "Campaign name is required.", variant: "destructive" });
      return;
    }

    const body = {
      name: form.name.trim(),
      mode: form.mode,
      messages: form.messages.filter((m) => m.trim()),
      outbound_account_ids: form.outbound_account_ids,
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
      await updateMutation.mutateAsync({ id, body });
      toast({ title: "Updated", description: `"${body.name}" updated.` });
      navigate(`/campaigns/${id}`);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !form) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="sticky top-16 z-50 bg-background border-b border-border">
          <div className="px-6 py-4">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="p-6">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Sticky Header */}
      <div className="sticky top-16 z-50 bg-background border-b border-border">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Edit Campaign</h2>
              <p className="text-sm text-muted-foreground">{campaign?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(-1)} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 p-6 max-w-3xl space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
            <CardDescription>Campaign name and sending mode</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Campaign Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => p ? { ...p, name: e.target.value } : p)}
                placeholder="January Outreach"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sending Mode</Label>
              <Select
                value={form.mode}
                onValueChange={(v: "auto" | "manual") => setForm((p) => p ? { ...p, mode: v } : p)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automatic</SelectItem>
                  <SelectItem value="manual">Manual (VA Mode)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {form.mode === "auto"
                  ? "Messages are sent automatically by the scheduler."
                  : "A VA sends messages manually via the Chrome extension; backend controls pacing, limits, and message rotation."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Message Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Message Templates</CardTitle>
            <CardDescription>
              Add multiple variants to rotate. Placeholders: {"{{username}}"}, {"{{firstName}}"}, {"{{name}}"}, {"{{bio}}"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {form.messages.map((msg, i) => (
              <div key={i} className="flex gap-2">
                <Textarea
                  value={msg}
                  onChange={(e) => updateMessage(i, e.target.value)}
                  placeholder={`Message variant ${i + 1}...`}
                  rows={3}
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
          </CardContent>
        </Card>

        {/* Outbound Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Outbound Accounts</CardTitle>
            <CardDescription>
              Select which accounts will be used to send messages in this campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            {outboundAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No outbound accounts available.</p>
            ) : (
              <div className="space-y-2">
                {outboundAccounts.map((a) => (
                  <label key={a._id} className="flex items-center gap-3 cursor-pointer p-2 rounded-md hover:bg-accent">
                    <Checkbox
                      checked={form.outbound_account_ids.includes(a._id)}
                      onCheckedChange={() => toggleOutboundAccount(a._id)}
                    />
                    <span className="text-sm font-medium">@{a.username}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        a.status === "ready"
                          ? "text-green-400 border-green-500/30"
                          : a.status === "warming"
                          ? "text-yellow-400 border-yellow-500/30"
                          : "text-zinc-400 border-zinc-500/30"
                      }`}
                    >
                      {a.status}
                    </Badge>
                    {a.linked_sender_status === "online" && (
                      <span className="h-2 w-2 rounded-full bg-green-400 ml-auto" title="Browser connected" />
                    )}
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule & Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule & Limits</CardTitle>
            <CardDescription>Configure active hours, delays, and sending limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Active Hours Start</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={form.active_hours_start}
                  onChange={(e) => setForm((p) => p ? { ...p, active_hours_start: Number(e.target.value) } : p)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Active Hours End</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={form.active_hours_end}
                  onChange={(e) => setForm((p) => p ? { ...p, active_hours_end: Number(e.target.value) } : p)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Min Delay (seconds)</Label>
                <Input
                  type="number"
                  min={10}
                  value={form.min_delay_seconds}
                  onChange={(e) => setForm((p) => p ? { ...p, min_delay_seconds: Number(e.target.value) } : p)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Max Delay (seconds)</Label>
                <Input
                  type="number"
                  min={10}
                  value={form.max_delay_seconds}
                  onChange={(e) => setForm((p) => p ? { ...p, max_delay_seconds: Number(e.target.value) } : p)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Timezone</Label>
              <Select value={form.timezone} onValueChange={(v) => setForm((p) => p ? { ...p, timezone: v } : p)}>
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
            <div className="space-y-1.5">
              <Label className="text-sm">Daily Limit per Sender</Label>
              <Input
                type="number"
                min={1}
                max={200}
                value={form.daily_limit_per_sender}
                onChange={(e) => setForm((p) => p ? { ...p, daily_limit_per_sender: Number(e.target.value) } : p)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of messages each sender account can send per day.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
