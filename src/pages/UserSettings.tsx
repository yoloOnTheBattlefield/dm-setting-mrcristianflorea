import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UserSettings() {
  const { user } = useAuth();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">User Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and integrations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* User Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-base">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-base">{user?.email}</p>
            </div>
            {user?.ghl && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  GHL ID
                </p>
                <p className="text-base">{user.ghl}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <p className="text-base">{user?.role === 0 ? "Admin" : "User"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
