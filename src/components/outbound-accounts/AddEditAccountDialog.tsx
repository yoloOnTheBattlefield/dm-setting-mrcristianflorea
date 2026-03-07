import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Loader2, CheckCircle2 } from "lucide-react";
import { type OutboundAccount } from "@/hooks/useOutboundAccounts";
import { useToast } from "@/hooks/use-toast";
import { API_URL, fetchWithAuth } from "@/lib/api";

interface FormData {
  username: string;
  password: string;
  email: string;
  emailPassword: string;
  proxy: string;
  status: string;
  isConnectedToAISetter: boolean;
  assignedTo: string;
  isBlacklisted: boolean;
  notes: string;
  twoFA: string;
  hidemyacc_profile_id: string;
}

interface AddEditAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEdit: boolean;
  editingAccount: OutboundAccount | null;
  setEditingAccount: (account: OutboundAccount | null) => void;
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  onSubmit: () => Promise<void>;
  isPending: boolean;
  hmaAvailable: boolean;
  hmaProfiles: { id: string; name: string }[];
}

export default function AddEditAccountDialog({
  open,
  onOpenChange,
  isEdit,
  editingAccount,
  setEditingAccount,
  form,
  setForm,
  onSubmit,
  isPending,
  hmaAvailable,
  hmaProfiles,
}: AddEditAccountDialogProps) {
  const { toast } = useToast();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit @${editingAccount!.username}` : "Add Outbound Account"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the account details below." : "Add a new outbound Instagram account to the vault."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Username *</Label>
              <Input
                value={form.username}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                placeholder="instagram_handle"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Account password"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="account@email.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email Password</Label>
              <Input
                type="password"
                value={form.emailPassword}
                onChange={(e) => setForm((p) => ({ ...p, emailPassword: e.target.value }))}
                placeholder="Email password"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Proxy</Label>
            <Input
              value={form.proxy}
              onChange={(e) => setForm((p) => ({ ...p, proxy: e.target.value }))}
              placeholder="ip:port:user:pass"
            />
            <p className="text-xs text-muted-foreground">Format: ip:port:user:pass</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="warming">Warming</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assigned To</Label>
              <Input
                value={form.assignedTo}
                onChange={(e) => setForm((p) => ({ ...p, assignedTo: e.target.value }))}
                placeholder="e.g. Muazm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>2FA Code <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              value={form.twoFA}
              onChange={(e) => setForm((p) => ({ ...p, twoFA: e.target.value }))}
              placeholder="2FA secret or backup code"
            />
          </div>

          <div className="space-y-1.5">
            <Label>HideMyAcc Profile <span className="text-muted-foreground font-normal">(optional)</span></Label>
            {hmaAvailable ? (
              <Select
                value={form.hidemyacc_profile_id || "none"}
                onValueChange={(v) => setForm((p) => ({ ...p, hidemyacc_profile_id: v === "none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {hmaProfiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={form.hidemyacc_profile_id}
                onChange={(e) => setForm((p) => ({ ...p, hidemyacc_profile_id: e.target.value }))}
                placeholder="Profile ID (HideMyAcc not detected)"
              />
            )}
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={form.isConnectedToAISetter}
                onCheckedChange={(c) => setForm((p) => ({ ...p, isConnectedToAISetter: !!c }))}
              />
              <span className="text-sm">Connected to AI Setter</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={form.isBlacklisted}
                onCheckedChange={(c) => setForm((p) => ({ ...p, isBlacklisted: !!c }))}
              />
              <span className="text-sm">Blacklisted</span>
            </label>
          </div>

          {/* Instagram OAuth Connect */}
          {isEdit && (
            <div className="space-y-1.5 border rounded-md p-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Instagram API</Label>
                  <p className="text-xs text-muted-foreground">Connect via OAuth to track DMs</p>
                </div>
                {editingAccount?.ig_oauth?.access_token ? (
                  <Badge className="bg-green-500/15 text-green-500 border-green-500/30 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    @{editingAccount.ig_oauth.ig_username}
                  </Badge>
                ) : null}
              </div>
              {editingAccount?.ig_oauth?.access_token ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    try {
                      const r = await fetchWithAuth(`${API_URL}/api/instagram/outbound/${editingAccount._id}/disconnect`, { method: "DELETE" });
                      if (r.ok) {
                        toast({ title: "Disconnected", description: "Instagram disconnected from this account" });
                        setEditingAccount({ ...editingAccount, ig_oauth: undefined } as OutboundAccount);
                      }
                    } catch {
                      toast({ title: "Error", description: "Failed to disconnect", variant: "destructive" });
                    }
                  }}
                >
                  Disconnect Instagram
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    try {
                      const r = await fetchWithAuth(`${API_URL}/api/instagram/auth-url?outbound_account_id=${editingAccount!._id}`);
                      const data = await r.json();
                      if (r.ok && data.url) {
                        window.location.href = data.url;
                      }
                    } catch {
                      toast({ title: "Error", description: "Failed to get auth URL", variant: "destructive" });
                    }
                  }}
                >
                  Connect Instagram
                </Button>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Add Account"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
