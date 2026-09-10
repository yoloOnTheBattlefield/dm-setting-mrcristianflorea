import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  useZernioStatus,
  useZernioProfiles,
  useZernioIgAccounts,
  useConnectZernio,
  useDisconnectZernio,
  type ZernioProfile,
  type ZernioIgAccount,
} from "@/hooks/useZernio";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export default function ZernioCard() {
  const { toast } = useToast();
  const { data: status, isLoading } = useZernioStatus();

  const loadProfiles = useZernioProfiles();
  const loadAccounts = useZernioIgAccounts();
  const connect = useConnectZernio();
  const disconnect = useDisconnectZernio();

  const [apiKey, setApiKey] = useState("");
  const [profiles, setProfiles] = useState<ZernioProfile[]>([]);
  const [profileId, setProfileId] = useState("");
  const [accounts, setAccounts] = useState<ZernioIgAccount[]>([]);
  const [accountId, setAccountId] = useState("");

  const connected = !!status?.connected;

  async function handleLoadProfiles() {
    try {
      const res = await loadProfiles.mutateAsync(apiKey ? { api_key: apiKey } : {});
      setProfiles(res.profiles);
      setProfileId("");
      setAccounts([]);
      setAccountId("");
      if (res.profiles.length === 0) {
        toast({ title: "No profiles on this Zernio account", variant: "destructive" });
      }
    } catch (err) {
      toast({
        title: "Could not reach Zernio",
        description: errorMessage(err, "Check the API key and try again."),
        variant: "destructive",
      });
    }
  }

  async function handleSelectProfile(value: string) {
    setProfileId(value);
    setAccounts([]);
    setAccountId("");
    try {
      const res = await loadAccounts.mutateAsync({
        ...(apiKey ? { api_key: apiKey } : {}),
        profile_id: value,
      });
      setAccounts(res.accounts);
      if (res.accounts.length === 0) {
        toast({ title: "No Instagram accounts on this profile", variant: "destructive" });
      }
    } catch (err) {
      toast({
        title: "Could not list Instagram accounts",
        description: errorMessage(err, "Try again."),
        variant: "destructive",
      });
    }
  }

  async function handleConnect() {
    const account = accounts.find((a) => a.id === accountId);
    if (!profileId || !account) {
      toast({
        title: "Pick a profile and an Instagram account",
        variant: "destructive",
      });
      return;
    }

    try {
      await connect.mutateAsync({
        ...(apiKey ? { api_key: apiKey } : {}),
        profile_id: profileId,
        zernio_account_id: account.id,
        ig_user_id: account.ig_user_id,
        ig_username: account.username,
      });
      setApiKey("");
      toast({ title: `Zernio connected to @${account.username}` });
    } catch (err) {
      toast({
        title: "Could not connect Zernio",
        description: errorMessage(err, "Try again."),
        variant: "destructive",
      });
    }
  }

  async function handleDisconnect() {
    try {
      await disconnect.mutateAsync();
      setProfiles([]);
      setAccounts([]);
      setProfileId("");
      setAccountId("");
      toast({ title: "Zernio disconnected" });
    } catch (err) {
      toast({
        title: "Could not disconnect Zernio",
        description: errorMessage(err, "Try again."),
        variant: "destructive",
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Zernio</CardTitle>
          {connected ? (
            <Badge className="gap-1 border-green-500/30 bg-green-500/15 text-green-500">
              <CheckCircle2 className="h-3 w-3" />
              @{status?.ig_username ?? status?.ig_user_id}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground gap-1">
              Not Connected
            </Badge>
          )}
        </div>
        <CardDescription>
          Optional paid provider. Reaches Instagram without our own Meta app — no App Review
          and no re-auth. Don't point Zernio and Meta at the same Instagram account, or
          commenters get two DMs.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : connected ? (
          <>
            <p className="text-muted-foreground text-xs">
              Webhook {status?.webhook_registered ? "registered" : "not registered"} at{" "}
              <code className="break-all">{status?.webhook_url}</code>
            </p>
            <Button
              onClick={handleDisconnect}
              className="w-full"
              variant="outline"
              disabled={disconnect.isPending}
            >
              {disconnect.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Disconnect Zernio
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="zernio-key">API key</Label>
              <Input
                id="zernio-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Unrestricted read/write key with Inbox access"
              />
            </div>

            <Button
              onClick={handleLoadProfiles}
              className="w-full"
              variant="secondary"
              disabled={loadProfiles.isPending || !apiKey}
            >
              {loadProfiles.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Load profiles
            </Button>

            {profiles.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="zernio-profile">Profile</Label>
                <Select value={profileId} onValueChange={handleSelectProfile}>
                  <SelectTrigger id="zernio-profile">
                    <SelectValue placeholder="Select a profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {accounts.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="zernio-account">Instagram account</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger id="zernio-account">
                    <SelectValue placeholder="Select an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        @{account.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              onClick={handleConnect}
              className="w-full"
              disabled={connect.isPending || !accountId}
            >
              {connect.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Connect Zernio
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
