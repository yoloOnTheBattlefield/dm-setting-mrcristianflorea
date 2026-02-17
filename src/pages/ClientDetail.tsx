import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchWithAuth } from "@/lib/api";
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
import { useTeamMembers, useAddTeamMember, useUpdateTeamMember, useDeleteTeamMember } from "@/hooks/useTeamMembers";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface ClientData {
  account_id: string;
  ghl: string;
  name: string;
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
  const addMember = useAddTeamMember();
  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();

  // Fetch client data
  useEffect(() => {
    const fetchClient = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      const API_URL = import.meta.env.DEV
        ? "http://localhost:3000/accounts/ghl-webhook"
        : "https://quddify-server.vercel.app/accounts/ghl-webhook";

      try {
        const response = await fetchWithAuth(`${API_URL}?_id=${id}`);
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

  // Handle toggle outbound
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

    const API_URL = import.meta.env.DEV
      ? "http://localhost:3000/accounts/ghl-webhook"
      : "https://quddify-server.vercel.app/accounts/ghl-webhook";

    try {
      const response = await fetchWithAuth(API_URL, {
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Loading...</h2>
          </div>
        </div>
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
              <h4 className="text-sm font-medium">Lead Booked Webhook</h4>
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
          </CardHeader>
          <CardContent>
            {isTeamLoading ? (
              <p className="text-sm text-muted-foreground">Loading team members...</p>
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
                        Team Member
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={!!member.has_outbound}
                          onCheckedChange={() => handleToggleOutbound(member._id, !!member.has_outbound)}
                          disabled={updateMember.isPending}
                        />
                      </TableCell>
                      <TableCell>
                        {member._id !== user?.id && (
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
