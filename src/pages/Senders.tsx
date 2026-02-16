import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { fetchWithAuth } from "@/lib/api";
import {
  useSenderAccounts,
  useCreateSenderAccount,
  useUpdateSenderAccount,
  useDeleteSenderAccount,
  type SenderAccount,
} from "@/hooks/useSenderAccounts";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react";

const ACCOUNTS_URL = import.meta.env.DEV
  ? "http://localhost:3000/accounts"
  : "https://quddify-server.vercel.app/accounts";

const TASK_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  in_progress: { label: "In Progress", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
};

function formatLastSeen(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Senders() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const apiKey = user?.api_key;

  const [generatingKey, setGeneratingKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  // Dialogs
  const [addOpen, setAddOpen] = useState(false);
  const [addUsername, setAddUsername] = useState("");
  const [addDisplayName, setAddDisplayName] = useState("");
  const [addDailyLimit, setAddDailyLimit] = useState(50);

  const [editingSender, setEditingSender] = useState<SenderAccount | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editDailyLimit, setEditDailyLimit] = useState(50);

  const [deletingSender, setDeletingSender] = useState<SenderAccount | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const { data, isLoading } = useSenderAccounts({
    page: currentPage,
    limit,
    refetchInterval: 10_000,
  });

  const senders = data?.senders ?? [];
  const pagination = data?.pagination;

  const createMutation = useCreateSenderAccount();
  const updateMutation = useUpdateSenderAccount();
  const deleteMutation = useDeleteSenderAccount();

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    const onSenderChange = () => {
      queryClient.invalidateQueries({ queryKey: ["sender-accounts"] });
    };
    socket.on("sender:online", onSenderChange);
    socket.on("sender:offline", onSenderChange);
    return () => {
      socket.off("sender:online", onSenderChange);
      socket.off("sender:offline", onSenderChange);
    };
  }, [socket, queryClient]);

  // Handlers
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
      toast({ title: "Updated", description: `@${editingSender.ig_username} updated.` });
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

  const generateApiKey = async () => {
    if (!user?.id) return;
    setGeneratingKey(true);
    try {
      const res = await fetchWithAuth(`${ACCOUNTS_URL}/${user.id}/api-key`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const d = await res.json();
      updateUser({ api_key: d.api_key });
      toast({ title: "API Key Generated", description: "Your extension can now connect." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to generate API key",
        variant: "destructive",
      });
    } finally {
      setGeneratingKey(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="sticky top-16 z-50 bg-[#0b0b0b] border-b border-white/10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">Browsers</h2>
              {apiKey ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground h-7 px-2"
                  onClick={() => {
                    navigator.clipboard.writeText(apiKey);
                    setCopied(true);
                    toast({ title: "Copied", description: "API key copied to clipboard" });
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                  {copied ? "Copied" : "Copy API Key"}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground h-7 px-2"
                  onClick={generateApiKey}
                  disabled={generatingKey}
                >
                  {generatingKey ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate API Key"
                  )}
                </Button>
              )}
            </div>
            <p className="text-muted-foreground">Connected Instagram accounts for sending DMs</p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Connect Account
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Loading...</div>
        ) : (
          <>
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">Status</TableHead>
                    <TableHead>IG Username</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Upcoming Task</TableHead>
                    <TableHead>Daily Limit</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {senders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-muted-foreground">No sender accounts connected yet.</p>
                          <Button variant="outline" size="sm" onClick={openAdd}>
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Connect your first account
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    senders.map((s) => {
                      const taskBadge = s.upcomingTask
                        ? TASK_STATUS_BADGE[s.upcomingTask.status] || TASK_STATUS_BADGE.pending
                        : null;

                      return (
                        <TableRow key={s._id}>
                          <TableCell>
                            <span
                              className={`inline-block h-2.5 w-2.5 rounded-full ${
                                s.status === "online" ? "bg-green-400" : "bg-zinc-500"
                              }`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">@{s.ig_username}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {s.display_name || "-"}
                          </TableCell>
                          <TableCell>
                            {s.upcomingTask ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm">@{s.upcomingTask.target}</span>
                                <Badge className={taskBadge!.className}>{taskBadge!.label}</Badge>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {s.daily_limit}/day
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {formatLastSeen(s.last_seen)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeletingSender(s)}>
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-4 mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
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

      {/* Edit Dialog */}
      <Dialog open={!!editingSender} onOpenChange={(open) => !open && setEditingSender(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit @{editingSender?.ig_username}</DialogTitle>
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingSender(null)}>
                Cancel
              </Button>
              <Button onClick={saveEdit} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
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

      {/* Extension Guide */}
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
    </div>
  );
}
