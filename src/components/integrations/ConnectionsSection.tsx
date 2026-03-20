import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";

interface ConnectionsSectionProps {
  // Calendly
  calendlyConnected: boolean;
  onOpenCalendlyModal: () => void;
  // Instagram
  igConnected: boolean;
  igUsername: string;
  isConnectingIg: boolean;
  isDisconnectingIg: boolean;
  onConnectInstagram: () => void;
  onDisconnectInstagram: () => void;
  // ManyChat
  apiUrl: string;
  userApiKey: string | undefined;
  onCopy: (text: string, description: string) => void;
}

export default function ConnectionsSection({
  calendlyConnected,
  onOpenCalendlyModal,
  igConnected,
  igUsername,
  isConnectingIg,
  isDisconnectingIg,
  onConnectInstagram,
  onDisconnectInstagram,
  apiUrl,
  userApiKey,
  onCopy,
}: ConnectionsSectionProps) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Connections</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Calendly Integration Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Calendly</CardTitle>
              {calendlyConnected ? (
                <Badge className="bg-green-500/15 text-green-500 border-green-500/30 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground gap-1">
                  Not Connected
                </Badge>
              )}
            </div>
            <CardDescription>
              Connect your Calendly account to sync scheduling data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={onOpenCalendlyModal}
              className="w-full"
              variant={calendlyConnected ? "outline" : "default"}
            >
              {calendlyConnected ? "Reconnect Calendly" : "Connect Calendly"}
            </Button>
          </CardContent>
        </Card>

        {/* Instagram DMs Integration Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Instagram DMs</CardTitle>
              {igConnected ? (
                <Badge className="bg-green-500/15 text-green-500 border-green-500/30 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  @{igUsername}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground gap-1">
                  Not Connected
                </Badge>
              )}
            </div>
            <CardDescription>
              Connect your Instagram to track DM conversations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {igConnected ? (
              <Button
                onClick={onDisconnectInstagram}
                className="w-full"
                variant="outline"
                disabled={isDisconnectingIg}
              >
                {isDisconnectingIg ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  "Disconnect Instagram"
                )}
              </Button>
            ) : (
              <Button
                onClick={onConnectInstagram}
                className="w-full"
                disabled={isConnectingIg}
              >
                {isConnectingIg ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect Instagram"
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ManyChat Integration Card (full-width) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>ManyChat</CardTitle>
              <CardDescription>
                Capture inbound leads from Instagram DMs and comments
              </CardDescription>
            </div>
            {userApiKey ? (
              <Badge className="bg-green-500/15 text-green-500 border-green-500/30 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Ready
              </Badge>
            ) : (
              <Badge className="bg-orange-500/15 text-orange-500 border-orange-500/30 gap-1">
                <AlertTriangle className="h-3 w-3" />
                Setup Required
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Webhook URL</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  readOnly
                  value={`${apiUrl}/api/manychat/webhook`}
                  className="text-xs font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Copy webhook URL"
                  className="shrink-0"
                  onClick={() => onCopy(`${apiUrl}/api/manychat/webhook`, "Webhook URL copied to clipboard")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">API Key Header</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  readOnly
                  value={userApiKey || "No API key generated"}
                  className="text-xs font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Copy API key"
                  className="shrink-0"
                  onClick={() => {
                    if (userApiKey) {
                      onCopy(userApiKey, "API key copied to clipboard");
                    }
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Add as <span className="font-mono">x-api-key</span> header in ManyChat's External Request
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
