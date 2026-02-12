import { useState } from "react";
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
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useSenderAccounts,
  useCreateSenderAccount,
  useUpdateSenderAccount,
  useDeleteSenderAccount,
  type SenderAccount,
} from "@/hooks/useSenderAccounts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Settings2, Plus, Trash2, Wifi, WifiOff } from "lucide-react";

interface SenderAccountsBarProps {
  apiKey: string;
}

export default function SenderAccountsBar({ apiKey }: SenderAccountsBarProps) {
  const { data, isLoading } = useSenderAccounts(apiKey);
  const senders = data?.senders ?? [];
  const createMutation = useCreateSenderAccount(apiKey);
  const updateMutation = useUpdateSenderAccount(apiKey);
  const deleteMutation = useDeleteSenderAccount(apiKey);
  const { toast } = useToast();

  // Add account dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addUsername, setAddUsername] = useState("");
  const [addDisplayName, setAddDisplayName] = useState("");
  const [addDailyLimit, setAddDailyLimit] = useState(50);

  // Edit dialog
  const [editingSender, setEditingSender] = useState<SenderAccount | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editDailyLimit, setEditDailyLimit] = useState(50);

  // Delete confirm
  const [deletingSender, setDeletingSender] = useState<SenderAccount | null>(null);

  // Extension guide
  const [guideOpen, setGuideOpen] = useState(false);

  const openAdd = () => {
    setAddUsername("");
    setAddDisplayName("");
    setAddDailyLimit(50);
    setAddOpen(true);
  };

  const handleAdd = async () => {
    if (!addUsername.trim()) return;
    try {
      await createMutation.mutateAsync({
        ig_username: addUsername.trim(),
        display_name: addDisplayName.trim() || undefined,
        daily_limit: addDailyLimit,
      });
      toast({ title: "Added", description: `@${addUsername.replace(/^@/, "")} registered. Connect the extension to bring it online.` });
      setAddOpen(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add account",
        variant: "destructive",
      });
    }
  };

  const openEdit = (sender: SenderAccount) => {
    setEditingSender(sender);
    setEditDisplayName(sender.display_name || "");
    setEditDailyLimit(sender.daily_limit);
  };

  const saveEdit = async () => {
    if (!editingSender) return;
    try {
      await updateMutation.mutateAsync({
        id: editingSender._id,
        updates: {
          display_name: editDisplayName || undefined,
          daily_limit: editDailyLimit,
        },
      });
      toast({ title: "Updated", description: `Sender @${editingSender.ig_username} updated.` });
      setEditingSender(null);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingSender) return;
    try {
      await deleteMutation.mutateAsync(deletingSender._id);
      toast({ title: "Removed", description: `@${deletingSender.ig_username} disconnected.` });
      setEditingSender(null);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to remove",
        variant: "destructive",
      });
    }
    setDeletingSender(null);
  };

  if (isLoading) {
    return (
      <div className="px-6 py-3 border-b border-white/10 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading senders...
      </div>
    );
  }

  return (
    <>
      <div className="px-6 py-3 border-b border-white/10 flex items-center gap-3 overflow-x-auto">
        <span className="text-xs text-muted-foreground shrink-0 font-medium uppercase tracking-wider">
          Senders
        </span>
        {senders.map((s) => (
          <button
            key={s._id}
            onClick={() => openEdit(s)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-colors bg-card shrink-0"
          >
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                s.status === "online" ? "bg-green-400" : "bg-zinc-500"
              }`}
            />
            <span className="text-sm font-medium">@{s.ig_username}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {s.daily_limit}/day
            </Badge>
          </button>
        ))}
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-white/20 hover:border-white/30 transition-colors text-muted-foreground hover:text-foreground shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="text-sm">Connect Account</span>
        </button>
      </div>

      {/* Add Account Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Connect Instagram Account</DialogTitle>
            <DialogDescription>
              Register an IG account as a sender. It will appear offline until the Chrome extension connects with it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Instagram Username</Label>
              <Input
                value={addUsername}
                onChange={(e) => setAddUsername(e.target.value)}
                placeholder="username"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Display Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                value={addDisplayName}
                onChange={(e) => setAddDisplayName(e.target.value)}
                placeholder="e.g. Main Account"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Daily Limit</Label>
              <Input
                type="number"
                min={1}
                max={200}
                value={addDailyLimit}
                onChange={(e) => setAddDailyLimit(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <Button variant="link" size="sm" className="text-xs px-0 text-muted-foreground" onClick={() => { setAddOpen(false); setGuideOpen(true); }}>
                How does this work?
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setAddOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={!addUsername.trim() || createMutation.isPending}>
                  {createMutation.isPending ? "Adding..." : "Add Account"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Sender Dialog */}
      <Dialog open={!!editingSender} onOpenChange={(open) => !open && setEditingSender(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              @{editingSender?.ig_username}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-1.5">
              {editingSender?.status === "online" ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-green-400">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-zinc-500" />
                  <span>Offline — connect the Chrome extension to bring online</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Display Name</Label>
              <Input
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="Optional display name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Daily Limit</Label>
              <Input
                type="number"
                min={1}
                max={200}
                value={editDailyLimit}
                onChange={(e) => setEditDailyLimit(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeletingSender(editingSender)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Remove
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingSender(null)}>
                  Cancel
                </Button>
                <Button onClick={saveEdit} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deletingSender} onOpenChange={(open) => !open && setDeletingSender(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Sender Account</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove @{deletingSender?.ig_username} as a sender. Any active campaigns using this account will no longer send from it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Extension Guide Dialog */}
      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>How to Connect an IG Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 text-sm text-muted-foreground">
            <div className="space-y-2">
              <p className="font-medium text-foreground">Step 1: Register the account</p>
              <p>Add the Instagram username here. It will show as offline until the extension connects.</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">Step 2: Install the Chrome extension</p>
              <p>Install the Quddify Chrome extension and enter your API key when prompted.</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">Step 3: Log into Instagram</p>
              <p>Open Instagram in the same Chrome profile where the extension is installed. Log into the account you registered.</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">Step 4: Activate</p>
              <p>The extension will automatically detect the logged-in account and connect it. The status will change to online.</p>
            </div>
            <div className="rounded-lg bg-muted/50 border p-3 text-xs">
              The extension must stay open for the account to remain online and process DMs.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
