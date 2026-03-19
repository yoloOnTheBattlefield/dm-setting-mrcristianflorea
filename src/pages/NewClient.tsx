import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { API_URL, fetchWithAuth } from "@/lib/api";
import { useInviteClient } from "@/hooks/useInvitations";
import { Mail, UserPlus } from "lucide-react";

export default function NewClient() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const inviteClient = useInviteClient();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    ghl: "",
    role: 0,
  });

  const [inviteData, setInviteData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    ghl: "",
  });

  // Redirect if not admin
  if (user?.role !== 0) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetchWithAuth(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Client created",
          description: "New client has been created successfully.",
        });
        setFormData({
          first_name: "",
          last_name: "",
          email: "",
          password: "",
          ghl: "",
          role: 0,
        });
      } else {
        const data = await response.json();
        toast({
          title: "Failed to create client",
          description: data.message || "An error occurred",
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
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "role" ? parseInt(value) || 0 : value,
    });
  };

  const handleInviteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInviteData({ ...inviteData, [name]: value });
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inviteClient.mutateAsync({
        email: inviteData.email,
        first_name: inviteData.first_name,
        last_name: inviteData.last_name,
        type: "client",
        ghl: inviteData.ghl || undefined,
      });
      toast({
        title: "Invitation sent",
        description: `An invite email has been sent to ${inviteData.email}`,
      });
      setInviteData({ first_name: "", last_name: "", email: "", ghl: "" });
    } catch (error) {
      toast({
        title: "Failed to send invitation",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">New Client</h2>
        <p className="text-muted-foreground">
          Create a new client or send an invitation
        </p>
      </div>

      <Tabs defaultValue="invite" className="max-w-2xl">
        <TabsList>
          <TabsTrigger value="invite">
            <Mail className="h-4 w-4 mr-2" />
            Invite via Email
          </TabsTrigger>
          <TabsTrigger value="create">
            <UserPlus className="h-4 w-4 mr-2" />
            Create Directly
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invite">
          <Card>
            <CardHeader>
              <CardTitle>Invite Client</CardTitle>
              <CardDescription>
                Send an email invitation. The client will set their own password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="invite-first_name">First Name</Label>
                    <Input
                      id="invite-first_name"
                      name="first_name"
                      value={inviteData.first_name}
                      onChange={handleInviteChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-last_name">Last Name</Label>
                    <Input
                      id="invite-last_name"
                      name="last_name"
                      value={inviteData.last_name}
                      onChange={handleInviteChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    name="email"
                    type="email"
                    value={inviteData.email}
                    onChange={handleInviteChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite-ghl">GHL ID</Label>
                  <Input
                    id="invite-ghl"
                    name="ghl"
                    value={inviteData.ghl}
                    onChange={handleInviteChange}
                    placeholder="Optional — can be set later"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={inviteClient.isPending}>
                    {inviteClient.isPending ? "Sending..." : "Send Invitation"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/")}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>
                Enter the details for the new client
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ghl">GHL ID</Label>
                  <Input
                    id="ghl"
                    name="ghl"
                    value={formData.ghl}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    name="role"
                    type="number"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Client"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/")}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
