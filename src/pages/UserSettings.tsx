import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
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
import { useAccounts } from "@/hooks/useAccounts";
import { API_URL, fetchWithAuth } from "@/lib/api";
import { AppearanceCard } from "@/components/settings/appearance-card";
import { Switch } from "@/components/ui/switch";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const LEADS_API_URL = `${API_URL}/leads/generate`;
const NOTIF_SETTINGS_URL = `${API_URL}/api/notifications/settings`;

export default function UserSettings() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    first_name: user?.firstName || "",
    last_name: user?.lastName || "",
    email: user?.email || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Generate leads (admin only)
  const { data: accounts = [] } = useAccounts();
  const [leadForm, setLeadForm] = useState({
    ghl: "",
    total: "100",
    link_sent: "",
    booked: "",
    ghosted: "",
    follow_up: "",
    days_back: "30",
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const { isSupported, isSubscribed, isLoading: isPushLoading, subscribe, unsubscribe } = usePushNotifications();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [isSavingNotif, setIsSavingNotif] = useState(false);

  const [leadVisibility, setLeadVisibility] = useState({
    dms: user?.lead_visibility?.dms ?? true,
    outbound: user?.lead_visibility?.outbound ?? true,
  });
  const [isSavingVisibility, setIsSavingVisibility] = useState(false);

  useEffect(() => {
    if (user?.lead_visibility) {
      setLeadVisibility({
        dms: user.lead_visibility.dms,
        outbound: user.lead_visibility.outbound,
      });
    }
  }, [user?.lead_visibility]);

  useEffect(() => {
    fetchWithAuth(NOTIF_SETTINGS_URL)
      .then((r) => r.json())
      .then((d) => setPushEnabled(d.push_notifications_enabled ?? true))
      .catch((err) => console.error("Failed to fetch notification settings:", err));
  }, []);

  const handlePushToggle = async (enabled: boolean) => {
    setPushEnabled(enabled);
    setIsSavingNotif(true);
    try {
      await fetchWithAuth(NOTIF_SETTINGS_URL, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ push_notifications_enabled: enabled }),
      });
      if (!enabled) {
        await unsubscribe();
      } else if (isSupported && !isSubscribed) {
        await subscribe();
      }
    } catch {
      toast({ title: "Error", description: "Failed to update notification settings", variant: "destructive" });
      setPushEnabled(!enabled);
    } finally {
      setIsSavingNotif(false);
    }
  };

  const handleBrowserPushToggle = async (enabled: boolean) => {
    if (enabled) {
      await subscribe();
    } else {
      await unsubscribe();
    }
  };

  const handleGenerateLeads = async () => {
    if (!leadForm.ghl) {
      toast({ title: "Error", description: "Please select an account.", variant: "destructive" });
      return;
    }

    const body: Record<string, string | number> = { ghl: leadForm.ghl };
    if (leadForm.total) body.total = Number(leadForm.total);
    if (leadForm.link_sent) body.link_sent = Number(leadForm.link_sent);
    if (leadForm.booked) body.booked = Number(leadForm.booked);
    if (leadForm.ghosted) body.ghosted = Number(leadForm.ghosted);
    if (leadForm.follow_up) body.follow_up = Number(leadForm.follow_up);
    if (leadForm.days_back) body.days_back = Number(leadForm.days_back);

    setIsGenerating(true);
    try {
      const response = await fetchWithAuth(LEADS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: `Generated ${data.created} leads.`,
        });
      } else {
        const data = await response.json().catch(() => ({}));
        toast({
          title: "Error",
          description: data.error || "Failed to generate leads",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Error", description: "Failed to connect to the server", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVisibilityToggle = async (key: "dms" | "outbound", value: boolean) => {
    if (!user?.id) return;
    const next = { ...leadVisibility, [key]: value };
    setLeadVisibility(next);
    setIsSavingVisibility(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/accounts/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_visibility: next }),
      });
      if (response.ok) {
        const data = await response.json();
        updateUser({ lead_visibility: data.lead_visibility });
        toast({ title: "Saved", description: "Lead page visibility updated." });
      } else {
        setLeadVisibility(leadVisibility);
        const data = await response.json().catch(() => ({}));
        toast({ title: "Error", description: data.error || "Failed to update", variant: "destructive" });
      }
    } catch {
      setLeadVisibility(leadVisibility);
      toast({ title: "Error", description: "Failed to connect to the server", variant: "destructive" });
    } finally {
      setIsSavingVisibility(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast({ title: "Error", description: "Account ID not found. Try logging out and back in.", variant: "destructive" });
      return;
    }

    const payload: Record<string, string> = {};
    if (form.first_name !== (user.firstName || "")) payload.first_name = form.first_name;
    if (form.last_name !== (user.lastName || "")) payload.last_name = form.last_name;
    if (form.email !== (user.email || "")) payload.email = form.email;

    if (Object.keys(payload).length === 0) {
      toast({ title: "No changes", description: "Nothing to update." });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/accounts/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        updateUser({
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          ghl: data.ghl,
          account_id: data.account_id,
        });
        toast({ title: "Success", description: "Your details have been updated." });
      } else {
        const data = await response.json().catch(() => ({}));
        toast({
          title: "Error",
          description: data.error || "Failed to update account",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Error", description: "Failed to connect to the server", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.id) {
      toast({ title: "Error", description: "Account ID not found. Try logging out and back in.", variant: "destructive" });
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/accounts/${user.id}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (response.ok) {
        setCurrentPassword("");
        setNewPassword("");
        toast({ title: "Success", description: "Password updated successfully." });
      } else {
        const data = await response.json().catch(() => ({}));
        toast({
          title: "Error",
          description: data.error || "Failed to change password",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Error", description: "Failed to connect to the server", variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="grid gap-4">
        <AppearanceCard />

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Get notified when a new lead is created or a lead replies via Instagram DM</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Lead notifications</p>
                <p className="text-xs text-muted-foreground">New leads and DM replies</p>
              </div>
              <Switch
                checked={pushEnabled}
                onCheckedChange={handlePushToggle}
                disabled={isSavingNotif}
              />
            </div>
            {isSupported && pushEnabled && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Browser push notifications</p>
                  <p className="text-xs text-muted-foreground">
                    {isSubscribed ? "Enabled — notified even when tab is closed" : "Enable to receive alerts when tab is closed"}
                  </p>
                </div>
                <Switch
                  checked={isSubscribed}
                  onCheckedChange={handleBrowserPushToggle}
                  disabled={isPushLoading}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {(user?.role === 0 || user?.role === 1) && (
          <Card>
            <CardHeader>
              <CardTitle>Lead Page Visibility</CardTitle>
              <CardDescription>
                Choose which sections everyone in this account sees on the lead detail page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Instagram DM conversations</p>
                  <p className="text-xs text-muted-foreground">
                    Show the DM conversation history panel on lead pages
                  </p>
                </div>
                <Switch
                  checked={leadVisibility.dms}
                  onCheckedChange={(v) => handleVisibilityToggle("dms", v)}
                  disabled={isSavingVisibility}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Outbound campaign data</p>
                  <p className="text-xs text-muted-foreground">
                    Show the linked outbound lead section on lead pages
                  </p>
                </div>
                <Switch
                  checked={leadVisibility.outbound}
                  onCheckedChange={(v) => handleVisibilityToggle("outbound", v)}
                  disabled={isSavingVisibility}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  value={form.first_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  value={form.last_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            {user?.ghl && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">GHL ID</Label>
                <p className="text-sm font-medium">{user.ghl}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Role</Label>
              <p className="text-sm font-medium">
                {user?.role === 0 ? "Admin" : user?.role === 1 ? "Client" : "Team Member"}
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Verify your current password to set a new one</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <PasswordInput
                id="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <PasswordInput
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword || !currentPassword || !newPassword}
              >
                {isChangingPassword ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </CardContent>
        </Card>
        {user?.role === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Generate Mock Leads</CardTitle>
              <CardDescription>Create test leads for a client account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Account</Label>
                <Select
                  value={leadForm.ghl}
                  onValueChange={(value) => setLeadForm((prev) => ({ ...prev, ghl: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.ghl} value={account.ghl}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gen-total">Total Leads</Label>
                  <Input
                    id="gen-total"
                    type="number"
                    value={leadForm.total}
                    onChange={(e) => setLeadForm((prev) => ({ ...prev, total: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gen-days">Days Back</Label>
                  <Input
                    id="gen-days"
                    type="number"
                    value={leadForm.days_back}
                    onChange={(e) => setLeadForm((prev) => ({ ...prev, days_back: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gen-link-sent">Link Sent</Label>
                  <Input
                    id="gen-link-sent"
                    type="number"
                    placeholder="0"
                    value={leadForm.link_sent}
                    onChange={(e) => setLeadForm((prev) => ({ ...prev, link_sent: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gen-booked">Converted</Label>
                  <Input
                    id="gen-booked"
                    type="number"
                    placeholder="0"
                    value={leadForm.booked}
                    onChange={(e) => setLeadForm((prev) => ({ ...prev, booked: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gen-ghosted">Ghosted</Label>
                  <Input
                    id="gen-ghosted"
                    type="number"
                    placeholder="0"
                    value={leadForm.ghosted}
                    onChange={(e) => setLeadForm((prev) => ({ ...prev, ghosted: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gen-follow-up">Follow Up</Label>
                <Input
                  id="gen-follow-up"
                  type="number"
                  placeholder="0"
                  value={leadForm.follow_up}
                  onChange={(e) => setLeadForm((prev) => ({ ...prev, follow_up: e.target.value }))}
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleGenerateLeads} disabled={isGenerating || !leadForm.ghl}>
                  {isGenerating ? "Generating..." : "Generate Leads"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
