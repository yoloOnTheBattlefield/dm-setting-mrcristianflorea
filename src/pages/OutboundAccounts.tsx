import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  useOutboundAccounts,
  useCreateOutboundAccount,
  useUpdateOutboundAccount,
  useDeleteOutboundAccount,
  type OutboundAccount,
} from "@/hooks/useOutboundAccounts";
import {
  useWarmupStatus,
  useStartWarmup,
  useStopWarmup,
  useToggleChecklistItem,
  useWarmupLogs,
} from "@/hooks/useWarmup";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Flame,
  Play,
  Square,
  ShieldOff,
  ShieldCheck,
  Copy,
  KeyRound,
  Mail,
  Lock,
  ShieldEllipsis,
} from "lucide-react";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  new: { label: "New", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  warming: { label: "Warming", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  ready: { label: "Ready", className: "bg-green-500/15 text-green-400 border-green-500/30" },
  restricted: { label: "Restricted", className: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  disabled: { label: "Disabled", className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
};

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
}

const DEFAULT_FORM: FormData = {
  username: "",
  password: "",
  email: "",
  emailPassword: "",
  proxy: "",
  status: "new",
  isConnectedToAISetter: false,
  assignedTo: "",
  isBlacklisted: false,
  notes: "",
  twoFA: "",
};

export default function OutboundAccounts() {
  const { toast } = useToast();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 50;

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [blacklistedFilter, setBlacklistedFilter] = useState("");
  const [connectedFilter, setConnectedFilter] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, blacklistedFilter, connectedFilter]);

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<OutboundAccount | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<OutboundAccount | null>(null);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);

  // Warmup dialog
  const [warmupAccount, setWarmupAccount] = useState<OutboundAccount | null>(null);
  const warmupAccountId = warmupAccount?._id ?? null;
  const { data: warmupData, isLoading: warmupLoading } = useWarmupStatus(warmupAccountId);
  const { data: logsData } = useWarmupLogs(warmupAccountId, { page: 1, limit: 20 });
  const startWarmup = useStartWarmup();
  const stopWarmup = useStopWarmup();
  const toggleChecklist = useToggleChecklistItem();

  const { data, isLoading } = useOutboundAccounts({
    page: currentPage,
    limit,
    status: statusFilter || undefined,
    isBlacklisted: blacklistedFilter || undefined,
    isConnectedToAISetter: connectedFilter || undefined,
    search: debouncedSearch || undefined,
  });

  const accounts = data?.accounts ?? [];
  const pagination = data?.pagination;

  const createMutation = useCreateOutboundAccount();
  const updateMutation = useUpdateOutboundAccount();
  const deleteMutation = useDeleteOutboundAccount();

  const isEdit = !!editingAccount;

  const openAdd = () => {
    setEditingAccount(null);
    setForm(DEFAULT_FORM);
    setDialogOpen(true);
  };

  const openEdit = (account: OutboundAccount) => {
    setEditingAccount(account);
    setForm({
      username: account.username,
      password: account.password || "",
      email: account.email || "",
      emailPassword: account.emailPassword || "",
      proxy: account.proxy || "",
      status: account.status,
      isConnectedToAISetter: account.isConnectedToAISetter,
      assignedTo: account.assignedTo || "",
      isBlacklisted: account.isBlacklisted,
      notes: account.notes || "",
      twoFA: account.twoFA || "",
    });
    setDialogOpen(true);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard.` });
  };

  const handleSubmit = async () => {
    if (!form.username.trim()) {
      toast({ title: "Error", description: "Username is required.", variant: "destructive" });
      return;
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: editingAccount._id,
          updates: {
            username: form.username.trim(),
            password: form.password || null,
            email: form.email || null,
            emailPassword: form.emailPassword || null,
            proxy: form.proxy || null,
            status: form.status as OutboundAccount["status"],
            isConnectedToAISetter: form.isConnectedToAISetter,
            assignedTo: form.assignedTo || null,
            isBlacklisted: form.isBlacklisted,
            notes: form.notes || null,
            twoFA: form.twoFA || null,
          },
        });
        toast({ title: "Updated", description: `@${form.username} updated.` });
      } else {
        await createMutation.mutateAsync({
          username: form.username.trim(),
          password: form.password || undefined,
          email: form.email || undefined,
          emailPassword: form.emailPassword || undefined,
          proxy: form.proxy || undefined,
          status: form.status,
          isConnectedToAISetter: form.isConnectedToAISetter,
          assignedTo: form.assignedTo || undefined,
          isBlacklisted: form.isBlacklisted,
          notes: form.notes || undefined,
          twoFA: form.twoFA || undefined,
        });
        toast({ title: "Added", description: `@${form.username} added to vault.` });
      }
      setDialogOpen(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save account",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingAccount) return;
    try {
      await deleteMutation.mutateAsync(deletingAccount._id);
      toast({ title: "Deleted", description: `@${deletingAccount.username} removed.` });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete",
        variant: "destructive",
      });
    }
    setDeletingAccount(null);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const getWarmupDay = (account: OutboundAccount) => {
    if (!account.warmup?.enabled || !account.warmup?.startDate) return null;
    const msPerDay = 86400000;
    return Math.floor((Date.now() - new Date(account.warmup.startDate).getTime()) / msPerDay) + 1;
  };

  const handleStartWarmup = async (account: OutboundAccount) => {
    try {
      await startWarmup.mutateAsync(account._id);
      toast({ title: "Warmup Started", description: `Warmup tracking started for @${account.username}` });
      setWarmupAccount(account);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to start warmup",
        variant: "destructive",
      });
    }
  };

  const handleStopWarmup = async () => {
    if (!warmupAccount) return;
    try {
      await stopWarmup.mutateAsync(warmupAccount._id);
      toast({ title: "Warmup Stopped", description: `Warmup tracking stopped for @${warmupAccount.username}` });
      setWarmupAccount(null);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to stop warmup",
        variant: "destructive",
      });
    }
  };

  const handleToggleChecklist = async (key: string) => {
    if (!warmupAccount) return;
    try {
      await toggleChecklist.mutateAsync({ outboundAccountId: warmupAccount._id, key });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update checklist",
        variant: "destructive",
      });
    }
  };

  const warmupProgress = warmupData ? Math.min((warmupData.currentDay / 14) * 100, 100) : 0;

  const ACTION_LABELS: Record<string, string> = {
    warmup_started: "Warmup started",
    warmup_stopped: "Warmup stopped",
    warmup_completed: "Warmup completed",
    checklist_toggled: "Checklist updated",
    cap_enforced: "Cap enforced",
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="sticky top-16 z-50 bg-[#0b0b0b] border-b border-white/10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Outbound Accounts</h2>
            <p className="text-muted-foreground">Manage outbound Instagram accounts, credentials, and proxies</p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px] max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search username, email, proxy..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="w-36">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="warming">Warming</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-36">
            <Select value={blacklistedFilter} onValueChange={setBlacklistedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Blacklisted" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Blacklisted</SelectItem>
                <SelectItem value="false">Not Blacklisted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-36">
            <Select value={connectedFilter} onValueChange={setConnectedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Connected" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Connected</SelectItem>
                <SelectItem value="false">Not Connected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {pagination && (
            <span className="text-sm text-muted-foreground pb-2">
              {pagination.total} account{pagination.total !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Loading...
          </div>
        ) : (
          <>
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Proxy</TableHead>
                    <TableHead>AI Setter</TableHead>
                    <TableHead>Blacklisted</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-muted-foreground">No outbound accounts found.</p>
                          <Button variant="outline" size="sm" onClick={openAdd}>
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Add your first account
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    accounts.map((a) => {
                      const badge = STATUS_BADGE[a.status] || STATUS_BADGE.new;

                      return (
                        <TableRow
                          key={a._id}
                          className={a.isBlacklisted ? "bg-red-500/5" : ""}
                        >
                          <TableCell className="font-medium">
                            @{a.username}
                            {a.isBlacklisted && (
                              <Badge className="ml-2 bg-red-500/15 text-red-400 border-red-500/30 text-[10px]">
                                BLACKLISTED
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Badge className={badge.className}>{badge.label}</Badge>
                              {a.warmup?.enabled && (() => {
                                const day = getWarmupDay(a);
                                return day ? (
                                  <Badge variant="outline" className="text-[10px] text-yellow-400 border-yellow-500/30">
                                    Day {day}
                                  </Badge>
                                ) : null;
                              })()}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {a.assignedTo || "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[150px] truncate font-mono text-xs">
                            {a.proxy}
                          </TableCell>
                          <TableCell>
                            {a.isConnectedToAISetter ? (
                              <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-xs">YES</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-muted-foreground">NO</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {a.isBlacklisted ? (
                              <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-xs">YES</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-muted-foreground">NO</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[120px] truncate text-xs">
                            {a.notes || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {a.warmup?.enabled ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setWarmupAccount(a)}
                                  className="text-yellow-400 hover:text-yellow-300"
                                >
                                  <Flame className="h-3.5 w-3.5" />
                                </Button>
                              ) : a.status === "new" ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStartWarmup(a)}
                                  disabled={startWarmup.isPending}
                                  title="Start Warmup"
                                >
                                  <Play className="h-3.5 w-3.5 text-yellow-400" />
                                </Button>
                              ) : null}
                              {a.password && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(a.password!, "IG Password")}
                                  title="Copy IG Password"
                                >
                                  <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              )}
                              {a.email && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(a.email!, "Email")}
                                  title="Copy Email"
                                >
                                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              )}
                              {a.emailPassword && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(a.emailPassword!, "Email Password")}
                                  title="Copy Email Password"
                                >
                                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              )}
                              {a.twoFA && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(a.twoFA!, "2FA Code")}
                                  title="Copy 2FA Code"
                                >
                                  <ShieldEllipsis className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeletingAccount(a)}>
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

            {/* Pagination */}
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? `Edit @${editingAccount.username}` : "Add Outbound Account"}</DialogTitle>
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
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>
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
                  "Add Account"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deletingAccount} onOpenChange={(open) => !open && setDeletingAccount(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Outbound Account</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete @{deletingAccount?.username} from the vault. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Warmup Dialog */}
      <Dialog open={!!warmupAccount} onOpenChange={(open) => !open && setWarmupAccount(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-yellow-400" />
              Warmup: @{warmupAccount?.username}
            </DialogTitle>
            <DialogDescription>
              Track warmup progress, checklist, and automation status.
            </DialogDescription>
          </DialogHeader>

          {warmupLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : warmupData?.enabled ? (
            <div className="space-y-5 pt-2">
              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Day {warmupData.currentDay} of 14
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStopWarmup}
                    disabled={stopWarmup.isPending}
                    className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                  >
                    <Square className="h-3 w-3 mr-1.5" />
                    {stopWarmup.isPending ? "Stopping..." : "Stop Warmup"}
                  </Button>
                </div>
                <Progress value={warmupProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {warmupData.currentDay >= 15
                    ? "Warmup complete"
                    : `${Math.round(warmupProgress)}% complete`}
                </p>
              </div>

              {/* Automation Status */}
              <div className={`rounded-lg border p-3 ${
                warmupData.automationBlocked
                  ? "border-red-500/30 bg-red-500/5"
                  : "border-green-500/30 bg-green-500/5"
              }`}>
                <div className="flex items-center gap-2">
                  {warmupData.automationBlocked ? (
                    <>
                      <ShieldOff className="h-4 w-4 text-red-400" />
                      <span className="text-sm font-medium text-red-400">
                        Automation blocked until Day 9
                      </span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 text-green-400" />
                      <span className="text-sm font-medium text-green-400">
                        Automation active — {warmupData.todayCap !== null ? `${warmupData.todayCap} DMs/day cap` : "No cap"}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Checklist</h4>
                  <span className="text-xs text-muted-foreground">
                    {warmupData.checklistProgress.completed}/{warmupData.checklistProgress.total} complete
                  </span>
                </div>
                <div className="space-y-2">
                  {warmupData.checklist.map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-2.5 cursor-pointer rounded-md border border-white/5 px-3 py-2 hover:bg-white/5 transition-colors"
                    >
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => handleToggleChecklist(item.key)}
                        disabled={toggleChecklist.isPending}
                      />
                      <span className={`text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div>
                <h4 className="text-sm font-medium mb-2">Warmup Schedule</h4>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="py-1.5 text-xs">Day</TableHead>
                        <TableHead className="py-1.5 text-xs">DM Cap</TableHead>
                        <TableHead className="py-1.5 text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {warmupData.schedule.map((s) => {
                        const isCurrent = s.day === warmupData.currentDay;
                        const isPast = s.day < warmupData.currentDay;
                        return (
                          <TableRow
                            key={s.day}
                            className={isCurrent ? "bg-yellow-500/10" : isPast ? "opacity-50" : ""}
                          >
                            <TableCell className="py-1.5 text-xs font-mono">
                              {s.day}
                              {isCurrent && (
                                <Badge className="ml-1.5 text-[9px] bg-yellow-500/15 text-yellow-400 border-yellow-500/30">
                                  TODAY
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="py-1.5 text-xs">
                              {s.cap === 0 ? "-" : s.cap}
                            </TableCell>
                            <TableCell className="py-1.5 text-xs text-muted-foreground">
                              {s.cap === 0 ? "Blocked" : "Active"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Activity Log */}
              {logsData && logsData.logs.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Activity Log</h4>
                  <div className="space-y-1.5">
                    {logsData.logs.map((log) => (
                      <div
                        key={log._id}
                        className="flex items-center justify-between text-xs border-b border-white/5 pb-1.5"
                      >
                        <div>
                          <span className="text-muted-foreground">
                            {new Date(log.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="ml-2">
                            {ACTION_LABELS[log.action] || log.action}
                            {log.details?.label && (
                              <span className="text-muted-foreground">
                                : &ldquo;{log.details.label as string}&rdquo;
                                {log.details?.completed ? " ✓" : " ✗"}
                              </span>
                            )}
                          </span>
                        </div>
                        <span className="text-muted-foreground">{log.performedBy}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-3">Warmup is not active for this account.</p>
              <Button
                onClick={() => warmupAccount && handleStartWarmup(warmupAccount)}
                disabled={startWarmup.isPending}
              >
                <Play className="h-4 w-4 mr-2" />
                {startWarmup.isPending ? "Starting..." : "Start Warmup"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
