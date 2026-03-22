import { API_URL } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormValues } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { AccountMembership } from "@/contexts/AuthContext";
import { ArrowLeft, Check } from "lucide-react";

interface LoginResponse {
  email: string;
  first_name?: string;
  last_name?: string;
  _id?: string;
  account_id?: string;
  ghl?: string;
  role?: number;
  api_key?: string;
  has_outbound?: boolean;
  token?: string;
  has_research?: boolean;
  accounts?: AccountMembership[];
  needs_account_selection?: boolean;
  selection_token?: string;
  user?: { _id: string; first_name: string; last_name: string; email: string };
  error?: string;
  message?: string;
}

interface AccountSelectionState {
  selectionToken: string;
  accounts: (AccountMembership & { disabled?: boolean })[];
  user: { _id: string; first_name: string; last_name: string; email: string };
}

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [accountSelection, setAccountSelection] = useState<AccountSelectionState | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleLoginSuccess = (data: LoginResponse) => {
    login(
      data.email,
      data.first_name,
      data.last_name,
      data._id,
      data.account_id,
      data.ghl,
      data.role,
      data.api_key,
      data.has_outbound,
      data.token,
      data.has_research,
      data.accounts,
    );
    toast({
      title: "Login successful",
      description: "You have been logged in successfully.",
    });
    navigate("/");
  };

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data: LoginResponse = await response.json();

      if (response.ok) {
        if (data.needs_account_selection) {
          setAccountSelection({
            selectionToken: data.selection_token!,
            accounts: data.accounts!,
            user: data.user!,
          });
        } else {
          handleLoginSuccess(data);
        }
      } else {
        toast({
          title: "Login failed",
          description: data.error || data.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to connect to the server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAccount = async (accountId: string) => {
    if (!accountSelection) return;
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/accounts/select-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selection_token: accountSelection.selectionToken,
          account_id: accountId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        handleLoginSuccess(data);
      } else {
        toast({
          title: "Selection failed",
          description: data.error || "Could not select account",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to connect to the server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const roleLabel = (role: number) => {
    if (role === 0) return "Admin";
    if (role === 1) return "Owner";
    return "Member";
  };

  // Account selection screen
  if (accountSelection) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader>
            <button
              onClick={() => setAccountSelection(null)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 w-fit"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <CardTitle className="text-2xl">Select Account</CardTitle>
            <CardDescription>
              Choose which account to sign into
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {accountSelection.accounts.map((acc) => (
                <button
                  key={acc.account_id}
                  onClick={() => !acc.disabled && handleSelectAccount(acc.account_id)}
                  disabled={isLoading || acc.disabled}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-4 text-left transition-colors",
                    acc.disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-accent cursor-pointer"
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{acc.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {roleLabel(acc.role)}
                      {acc.disabled && " — Disabled"}
                    </span>
                  </div>
                  {acc.is_default && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Check className="h-3 w-3" />
                      Default
                    </span>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Normal login form
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <PasswordInput
                  id="password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
