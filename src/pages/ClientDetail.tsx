import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL, fetchWithAuth } from "@/lib/api";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamMembers, useAddTeamMember, useUpdateTeamMember, useDeleteTeamMember, useResetPassword } from "@/hooks/useTeamMembers";
import { useInviteTeamMember } from "@/hooks/useInvitations";
import { useClientTrackingEvents } from "@/hooks/useTracking";
import { Badge } from "@/components/ui/badge";
import { DetailPageSkeleton, TableSkeleton } from "@/components/skeletons";
import { ArrowLeft, Plus, Trash2, RefreshCw, KeyRound, Mail } from "lucide-react";

interface ClientData {
  account_id: string;
  ghl: string;
  name: string;
  has_outbound?: boolean;
  has_research?: boolean;
  ghl_lead_booked_webhook?: string;
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [client, setClient] = useState<ClientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ghlWebhookUrl, setGhlWebhookUrl] = useState("");
  const [ghlValidationError, setGhlValidationError] = useState("");
  const [isGhlSaving, setIsGhlSaving] = useState(false);

  // Team members
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    has_outbound: false,
  });
  const { data: teamMembers = [], isLoading: isTeamLoading } = useTeamMembers(client?.account_id);
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{ open: boolean; userId: string; name: string }>({ open: false, userId: "", name: "" });
  const [newPassword, setNewPassword] = useState("");
  const addMember = useAddTeamMember();
  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();
  const resetPassword = useResetPassword();
  const inviteTeamMember = useInviteTeamMember();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteMember, setInviteMember] = useState({
    first_name: "",
    last_name: "",
    email: "",
    has_outbound: false,
  });
  const { data: trackingData, isLoading: isTrackingLoading, refetch: refetchTracking } = useClientTrackingEvents(client?.account_id);
  const [isTogglingOutbound, setIsTogglingOutbound] = useState(false);
  const [isTogglingResearch, setIsTogglingResearch] = useState(false);

  // Fetch client data
  useEffect(() => {
    const fetchClient = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetchWithAuth(`${API_URL}/accounts/ghl-webhook?_id=${id}`);
        if (response.ok) {
          const data = await response.json();
          setClient(data);
          if (data.ghl_lead_booked_webhook) {
            setGhlWebhookUrl(data.ghl_lead_booked_webhook);
          }
        } else {
          toast({
            title: "Error",
            description: "Failed to load client data",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Failed to fetch client:", error);
        toast({
          title: "Error",
          description: "Failed to connect to the server",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchClient();
  }, [id, toast]);

  // Handle add team member
  const handleAddMember = async () => {
    if (!id) {
      toast({ title: "Error", description: "Client ID is missing", variant: "destructive" });
      return;
    }
    try {
      await addMember.mutateAsync({
        email: newMember.email,
        password: newMember.password,
        first_name: newMember.first_name,
        last_name: newMember.last_name,
        role: 2,
        has_outbound: newMember.has_outbound,
      });
      toast({ title: "Success", description: "Team member added" });
      setNewMember({ first_name: "", last_name: "", email: "", password: "", has_outbound: false });
      setAddDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add team member",
        variant: "destructive",
      });
    }
  };

  // Handle invite team member
  const handleInviteMember = async () => {
    if (!client) return;
    try {
      await inviteTeamMember.mutateAsync({
        email: inviteMember.email,
        first_name: inviteMember.first_name,
        last_name: inviteMember.last_name,
        type: "team_member",
        account_id: client.account_id,
        role: 2,
        has_outbound: inviteMember.has_outbound,
      });
      toast({ title: "Invitation sent", description: `Invite email sent to ${inviteMember.email}` });
      setInviteMember({ first_name: "", last_name: "", email: "", has_outbound: false });
      setInviteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation",
        variant: "destructive",
      });
    }
  };

  // Handle toggle account-level outbound
  const handleToggleAccountOutbound = async () => {
    if (!client) return;
    setIsTogglingOutbound(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/accounts/${client.account_id}/has-outbound`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ has_outbound: !client.has_outbound }),
      });
      if (res.ok) {
        setClient((prev) => prev ? { ...prev, has_outbound: !prev.has_outbound } : prev);
        toast({ title: "Updated", description: `Outbound ${!client.has_outbound ? "enabled" : "disabled"} for this client` });
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error || "Failed to update", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to connect to the server", variant: "destructive" });
    } finally {
      setIsTogglingOutbound(false);
    }
  };

  // Handle toggle account-level research
  const handleToggleAccountResearch = async () => {
    if (!client) return;
    setIsTogglingResearch(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/accounts/${client.account_id}/has-research`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ has_research: !client.has_research }),
      });
      if (res.ok) {
        setClient((prev) => prev ? { ...prev, has_research: !prev.has_research } : prev);
        toast({ title: "Updated", description: `Research ${!client.has_research ? "enabled" : "disabled"} for this client` });
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error || "Failed to update", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to connect to the server", variant: "destructive" });
    } finally {
      setIsTogglingResearch(false);
    }
  };

  // Handle toggle member outbound
  const handleToggleOutbound = async (memberId: string, current: boolean) => {
    try {
      await updateMember.mutateAsync({ id: memberId, body: { has_outbound: !current } });
      toast({ title: "Updated", description: `Outbound access ${!current ? "enabled" : "disabled"}` });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update",
        variant: "destructive",
      });
    }
  };

  // Handle delete team member
  const handleDeleteMember = async (memberId: string) => {
    try {
      await deleteMember.mutateAsync(memberId);
      toast({ title: "Success", description: "Team member removed" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove team member",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async () => {
    try {
      await resetPassword.mutateAsync({ userId: resetPasswordDialog.userId, new_password: newPassword });
      toast({ title: "Success", description: `Password updated for ${resetPasswordDialog.name}` });
      setResetPasswordDialog({ open: false, userId: "", name: "" });
      setNewPassword("");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset password",
        variant: "destructive",
      });
    }
  };

  // Handle webhook URL change
  const handleGhlWebhookChange = (value: string) => {
    setGhlWebhookUrl(value);
    setGhlValidationError("");

    if (value && !value.startsWith("http")) {
      setGhlValidationError("URL must start with http or https");
    }
  };

  // Save webhook URL
  const handleGhlWebhookSave = async () => {
    if (!ghlWebhookUrl.startsWith("http")) {
      setGhlValidationError("URL must start with http or https");
      return;
    }

    if (!id) {
      toast({
        title: "Error",
        description: "Client ID is missing",
        variant: "destructive",
      });
      return;
    }

    setIsGhlSaving(true);

    try {
      const response = await fetchWithAuth(`${API_URL}/accounts/ghl-webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _id: id,
          ghl_lead_booked_webhook: ghlWebhookUrl,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Webhook saved successfully",
        });
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.message || "Failed to save webhook",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to the server",
        variant: "destructive",
      });
    } finally {
      setIsGhlSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <DetailPageSkeleton />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Client not found</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{client.name}</h2>
          <p className="text-muted-foreground">Client settings and integrations</p>
        </div>
      </div>

      <div className="grid gap-4">
        {/* Client Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>Basic client details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label className="text-muted-foreground">Account ID</Label>
              <p className="font-medium">{client.account_id}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">GHL ID</Label>
              <p className="font-medium">{client.ghl}</p>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3 mt-2">
              <div>
                <Label>Has Outbound</Label>
                <p className="text-xs text-muted-foreground">
                  Enable outbound campaigns and sender accounts for this client
                </p>
              </div>
              <Switch
                checked={!!client.has_outbound}
                onCheckedChange={handleToggleAccountOutbound}
                disabled={isTogglingOutbound}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>Has Research</Label>
                <p className="text-xs text-muted-foreground">
                  Enable research tools and competitor analysis for this client
                </p>
              </div>
              <Switch
                checked={!!client.has_research}
                onCheckedChange={handleToggleAccountResearch}
                disabled={isTogglingResearch}
              />
            </div>
          </CardContent>
        </Card>

        {/* GoHighLevel Webhook Card */}
        <Card>
          <CardHeader>
            <CardTitle>GoHighLevel Integration</CardTitle>
            <CardDescription>
              Configure webhook URLs for automation triggers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Lead Converted Webhook</h4>
              <div className="space-y-2">
                <Label htmlFor="ghl-webhook-url">Webhook URL</Label>
                <Input
                  id="ghl-webhook-url"
                  type="url"
                  placeholder="https://services.leadconnectorhq.com/hooks/..."
                  value={ghlWebhookUrl}
                  onChange={(e) => handleGhlWebhookChange(e.target.value)}
                  className={ghlValidationError ? "border-destructive" : ""}
                />
                {ghlValidationError && (
                  <p className="text-sm text-destructive">{ghlValidationError}</p>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleGhlWebhookSave}
                  disabled={!ghlWebhookUrl || isGhlSaving || !!ghlValidationError}
                >
                  {isGhlSaving ? "Saving..." : "Save Webhook"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage team members for this client account
              </CardDescription>
            </div>
            <div className="flex gap-2">
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Invite via Email
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an email invitation. The member will set their own password.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-first-name">First Name</Label>
                      <Input
                        id="invite-first-name"
                        value={inviteMember.first_name}
                        onChange={(e) =>
                          setInviteMember((prev) => ({ ...prev, first_name: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-last-name">Last Name</Label>
                      <Input
                        id="invite-last-name"
                        value={inviteMember.last_name}
                        onChange={(e) =>
                          setInviteMember((prev) => ({ ...prev, last_name: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={inviteMember.email}
                      onChange={(e) =>
                        setInviteMember((prev) => ({ ...prev, email: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <Label htmlFor="invite-outbound">Outbound Access</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow this member to access outbound campaigns and accounts
                      </p>
                    </div>
                    <Switch
                      id="invite-outbound"
                      checked={inviteMember.has_outbound}
                      onCheckedChange={(checked) =>
                        setInviteMember((prev) => ({ ...prev, has_outbound: checked }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleInviteMember}
                    disabled={
                      inviteTeamMember.isPending ||
                      !inviteMember.email
                    }
                  >
                    {inviteTeamMember.isPending ? "Sending..." : "Send Invitation"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                  <DialogDescription>
                    Add a new team member to this client account. They will inherit the client's GHL access.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="member-first-name">First Name</Label>
                      <Input
                        id="member-first-name"
                        value={newMember.first_name}
                        onChange={(e) =>
                          setNewMember((prev) => ({ ...prev, first_name: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="member-last-name">Last Name</Label>
                      <Input
                        id="member-last-name"
                        value={newMember.last_name}
                        onChange={(e) =>
                          setNewMember((prev) => ({ ...prev, last_name: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="member-email">Email</Label>
                    <Input
                      id="member-email"
                      type="email"
                      value={newMember.email}
                      onChange={(e) =>
                        setNewMember((prev) => ({ ...prev, email: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="member-password">Password</Label>
                    <PasswordInput
                      id="member-password"
                      value={newMember.password}
                      onChange={(e) =>
                        setNewMember((prev) => ({ ...prev, password: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <Label htmlFor="member-outbound">Outbound Access</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow this member to access outbound campaigns and accounts
                      </p>
                    </div>
                    <Switch
                      id="member-outbound"
                      checked={newMember.has_outbound}
                      onCheckedChange={(checked) =>
                        setNewMember((prev) => ({ ...prev, has_outbound: checked }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleAddMember}
                    disabled={
                      addMember.isPending ||
                      !newMember.first_name ||
                      !newMember.last_name ||
                      !newMember.email ||
                      !newMember.password
                    }
                  >
                    {addMember.isPending ? "Adding..." : "Add Member"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isTeamLoading ? (
              <TableSkeleton rows={3} cols={5} colWidths={["w-28", "w-32", "w-20", "w-12", "w-12"]} />
            ) : teamMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No team members yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Outbound</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member._id}>
                      <TableCell className="font-medium">
                        {member.first_name} {member.last_name}
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.role === 1 ? "Owner" : "Team Member"}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={!!member.has_outbound}
                          onCheckedChange={() => handleToggleOutbound(member.user_id, !!member.has_outbound)}
                          disabled={updateMember.isPending}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Reset password"
                            onClick={() => setResetPasswordDialog({ open: true, userId: member.user_id, name: `${member.first_name} ${member.last_name}` })}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          {member.role !== 1 && member._id !== user?.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove team member?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove {member.first_name} {member.last_name} from this account. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteMember(member._id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Website Tracking Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Website Tracking Events</CardTitle>
              <CardDescription>
                Recent tracking activity for this client
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchTracking()}
              disabled={isTrackingLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isTrackingLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {isTrackingLoading ? (
              <TableSkeleton rows={3} cols={5} colWidths={["w-20", "w-28", "w-36", "w-28", "w-24"]} />
            ) : !trackingData?.events || trackingData.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tracking events recorded for this client yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Lead ID</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trackingData.events.map((evt) => (
                    <TableRow key={evt._id}>
                      <TableCell>
                        <Badge
                          variant={
                            evt.event_type === "conversion"
                              ? "default"
                              : evt.event_type === "first_visit"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {evt.event_type.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[150px] truncate">
                        {evt.lead_id}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs" title={evt.url || ""}>
                        {evt.url || "—"}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-xs" title={evt.referrer || ""}>
                        {evt.referrer || "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(evt.createdAt).toLocaleDateString()}{" "}
                        {new Date(evt.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={resetPasswordDialog.open} onOpenChange={(open) => { setResetPasswordDialog((prev) => ({ ...prev, open })); if (!open) setNewPassword(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {resetPasswordDialog.name}. They will need to use this new password to log in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="reset-password">New Password</Label>
            <PasswordInput
              id="reset-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetPasswordDialog({ open: false, userId: "", name: "" }); setNewPassword(""); }}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={resetPassword.isPending || newPassword.length < 6}>
              {resetPassword.isPending ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
