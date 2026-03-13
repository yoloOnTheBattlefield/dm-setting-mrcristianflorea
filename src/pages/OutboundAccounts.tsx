import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  useGenerateToken,
  useRevokeToken,
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
  Copy,
  KeyRound,
  Mail,
  Lock,
  ShieldEllipsis,
  Link2,
  Unlink,
  Globe,
  Download,
} from "lucide-react";
import AddEditAccountDialog from "@/components/outbound-accounts/AddEditAccountDialog";
import DeleteConfirmDialog from "@/components/outbound-accounts/DeleteConfirmDialog";
import WarmupDialog from "@/components/outbound-accounts/WarmupDialog";

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
  hidemyacc_profile_id: string;
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
  hidemyacc_profile_id: "",
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

  // HideMyAcc profiles
  const [hmaProfiles, setHmaProfiles] = useState<{ id: string; name: string }[]>([]);
  const [hmaAvailable, setHmaAvailable] = useState(false);
  const [openingBrowserId, setOpeningBrowserId] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:2268/profiles")
      .then((r) => r.json())
      .then((data) => {
        const profiles = Array.isArray(data) ? data : data?.data ?? [];
        setHmaProfiles(profiles.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
        setHmaAvailable(true);
      })
      .catch(() => {
        setHmaAvailable(false);
      });
  }, []);

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
  const generateToken = useGenerateToken();
  const revokeToken = useRevokeToken();

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
      hidemyacc_profile_id: account.hidemyacc_profile_id || "",
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
            hidemyacc_profile_id: form.hidemyacc_profile_id || null,
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
          hidemyacc_profile_id: form.hidemyacc_profile_id || undefined,
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

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="sticky top-16 z-50 bg-background border-b border-border">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a href="/extension.zip" download="instagram-dm-automator.zip">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Extension
              </Button>
            </a>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>
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
                    <TableHead>Token</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
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
                          <TableCell>
                            {a.browser_token ? (
                              <div className="flex items-center gap-1">
                                {a.linked_sender_status ? (
                                  <Badge className={
                                    a.linked_sender_status === "online"
                                      ? "bg-green-500/15 text-green-400 border-green-500/30 text-[10px]"
                                      : "bg-zinc-500/15 text-zinc-400 border-zinc-500/30 text-[10px]"
                                  }>
                                    <Link2 className="h-3 w-3 mr-1" />
                                    {a.linked_sender_status === "online" ? "Online" : "Offline"}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                    Token ready
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(a.browser_token!, "Browser Token")}
                                  title="Copy Token"
                                >
                                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await revokeToken.mutateAsync(a._id);
                                      toast({ title: "Revoked", description: `Token revoked for @${a.username}` });
                                    } catch (err) {
                                      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to revoke", variant: "destructive" });
                                    }
                                  }}
                                  disabled={revokeToken.isPending}
                                  title="Revoke Token"
                                >
                                  <Unlink className="h-3.5 w-3.5 text-red-400" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={async () => {
                                  try {
                                    const result = await generateToken.mutateAsync(a._id);
                                    navigator.clipboard.writeText(result.browser_token);
                                    toast({ title: "Token Generated", description: "Token copied to clipboard. Give this to your VA." });
                                  } catch (err) {
                                    toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to generate", variant: "destructive" });
                                  }
                                }}
                                disabled={generateToken.isPending}
                              >
                                <Link2 className="h-3 w-3 mr-1" />
                                Generate
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {a.hidemyacc_profile_id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Open HideMyAcc Browser"
                                  disabled={openingBrowserId === a._id}
                                  onClick={async () => {
                                    setOpeningBrowserId(a._id);
                                    try {
                                      const res = await fetch(`http://127.0.0.1:2268/profiles/start/${a.hidemyacc_profile_id}`, { method: "POST" });
                                      if (!res.ok) throw new Error("Failed to start profile");
                                      toast({ title: "Browser opened", description: `HideMyAcc profile started for @${a.username}` });
                                    } catch {
                                      toast({ title: "Error", description: "Failed to open browser — is HideMyAcc running?", variant: "destructive" });
                                    } finally {
                                      setOpeningBrowserId(null);
                                    }
                                  }}
                                >
                                  {openingBrowserId === a._id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Globe className="h-3.5 w-3.5 text-blue-400" />
                                  )}
                                </Button>
                              )}
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
      <AddEditAccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isEdit={isEdit}
        editingAccount={editingAccount}
        setEditingAccount={setEditingAccount}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        isPending={isPending}
        hmaAvailable={hmaAvailable}
        hmaProfiles={hmaProfiles}
      />

      {/* Delete Confirm */}
      <DeleteConfirmDialog
        deletingAccount={deletingAccount}
        onOpenChange={() => setDeletingAccount(null)}
        onDelete={handleDelete}
        isPending={deleteMutation.isPending}
      />

      {/* Warmup Dialog */}
      <WarmupDialog
        warmupAccount={warmupAccount}
        onOpenChange={() => setWarmupAccount(null)}
        warmupData={warmupData}
        warmupLoading={warmupLoading}
        logsData={logsData}
        warmupProgress={warmupProgress}
        onStartWarmup={handleStartWarmup}
        onStopWarmup={handleStopWarmup}
        onToggleChecklist={handleToggleChecklist}
        startWarmupPending={startWarmup.isPending}
        stopWarmupPending={stopWarmup.isPending}
        toggleChecklistPending={toggleChecklist.isPending}
      />
    </div>
  );
}
