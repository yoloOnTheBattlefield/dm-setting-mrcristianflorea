import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamMembers, useAddTeamMember, useUpdateTeamMember, useDeleteTeamMember, checkTeamEmail } from "@/hooks/useTeamMembers";
import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

export default function TeamMembers() {
  const { user } = useAuth();
  const { toast } = useToast();

  const canManage = user?.role === 0 || user?.role === 1;

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    has_outbound: false,
  });
  const [existingUser, setExistingUser] = useState<{ exists: boolean; first_name?: string; last_name?: string } | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const checkEmail = useCallback((email: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setExistingUser(null);

    if (!email || !email.includes("@")) return;

    setCheckingEmail(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await checkTeamEmail(email);
        setExistingUser(result);
      } catch {
        setExistingUser(null);
      } finally {
        setCheckingEmail(false);
      }
    }, 500);
  }, []);

  useEffect(() => {
    if (!addDialogOpen) {
      setExistingUser(null);
      setCheckingEmail(false);
    }
  }, [addDialogOpen]);

  const { data: teamMembers = [], isLoading } = useTeamMembers();
  const addMember = useAddTeamMember();
  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();

  const handleAddMember = async () => {
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

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              {canManage
                ? "Add or remove team members from your account"
                : "View your team members"}
            </CardDescription>
          </div>
          {canManage && (
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
                    Add a new team member to your account. They will share your account access.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="tm-email">Email</Label>
                    <Input
                      id="tm-email"
                      type="email"
                      value={newMember.email}
                      onChange={(e) => {
                        const email = e.target.value;
                        setNewMember((prev) => ({ ...prev, email }));
                        checkEmail(email);
                      }}
                    />
                    {checkingEmail && (
                      <p className="text-xs text-muted-foreground">Checking...</p>
                    )}
                    {existingUser?.exists && (
                      <p className="text-xs text-muted-foreground">
                        Existing user ({existingUser.first_name} {existingUser.last_name}) will be linked to your account.
                      </p>
                    )}
                  </div>
                  {!existingUser?.exists && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tm-first-name">First Name</Label>
                          <Input
                            id="tm-first-name"
                            value={newMember.first_name}
                            onChange={(e) =>
                              setNewMember((prev) => ({ ...prev, first_name: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tm-last-name">Last Name</Label>
                          <Input
                            id="tm-last-name"
                            value={newMember.last_name}
                            onChange={(e) =>
                              setNewMember((prev) => ({ ...prev, last_name: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tm-password">Password</Label>
                        <PasswordInput
                          id="tm-password"
                          value={newMember.password}
                          onChange={(e) =>
                            setNewMember((prev) => ({ ...prev, password: e.target.value }))
                          }
                        />
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <Label htmlFor="tm-outbound">Outbound Access</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow this member to access outbound campaigns and accounts
                      </p>
                    </div>
                    <Switch
                      id="tm-outbound"
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
                      !newMember.email ||
                      checkingEmail ||
                      (existingUser?.exists
                        ? false
                        : !newMember.first_name || !newMember.last_name || !newMember.password)
                    }
                  >
                    {addMember.isPending ? "Adding..." : "Add Member"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
                  {canManage && <TableHead className="w-[80px]">Actions</TableHead>}
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
                      {member.role === 0 || member.role === 1 ? "Team Owner" : "Team Member"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={!!member.has_outbound}
                        onCheckedChange={() => handleToggleOutbound(member.user_id, !!member.has_outbound)}
                        disabled={!canManage || updateMember.isPending}
                      />
                    </TableCell>
                    {canManage && (
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
                                  This will permanently remove {member.first_name} {member.last_name} from your account. This action cannot be undone.
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
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
