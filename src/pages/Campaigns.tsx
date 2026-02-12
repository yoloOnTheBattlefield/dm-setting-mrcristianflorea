import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { useSenderAccounts } from "@/hooks/useSenderAccounts";
import { type Campaign } from "@/hooks/useCampaigns";
import CampaignList from "@/components/campaigns/CampaignList";
import CampaignCreateEditDialog from "@/components/campaigns/CampaignCreateEditDialog";

const ACCOUNTS_URL = import.meta.env.DEV
  ? "http://localhost:3000/accounts"
  : "https://quddify-server.vercel.app/accounts";

const TASKS_API_URL = import.meta.env.DEV
  ? "http://localhost:3000/api/tasks"
  : "https://quddify-server.vercel.app/api/tasks";

export default function Campaigns() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const apiKey = user?.api_key;

  const [generatingKey, setGeneratingKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [pongStatus, setPongStatus] = useState<"idle" | "waiting" | "received">("idle");

  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [createEditOpen, setCreateEditOpen] = useState(false);

  const { data: sendersData } = useSenderAccounts(apiKey);
  const senders = sendersData?.senders ?? [];

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const onPong = (data: unknown) => {
      console.log("GOT PONG FROM EXTENSION:", data);
      setPongStatus("received");
    };

    const onSenderChange = () => {
      queryClient.invalidateQueries({ queryKey: ["sender-accounts"] });
    };

    const onTaskUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaign"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-stats"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-leads"] });
    };

    socket.on("ext:pong", onPong);
    socket.on("sender:online", onSenderChange);
    socket.on("sender:offline", onSenderChange);
    socket.on("task:completed", onTaskUpdate);
    socket.on("task:failed", onTaskUpdate);
    socket.on("task:new", onTaskUpdate);

    return () => {
      socket.off("ext:pong", onPong);
      socket.off("sender:online", onSenderChange);
      socket.off("sender:offline", onSenderChange);
      socket.off("task:completed", onTaskUpdate);
      socket.off("task:failed", onTaskUpdate);
      socket.off("task:new", onTaskUpdate);
    };
  }, [socket, queryClient]);

  const sendPing = async () => {
    if (!apiKey) return;
    setPinging(true);
    setPongStatus("waiting");
    try {
      const res = await fetch(`${TASKS_API_URL}/ping`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: "hello extension" }),
      });
      if (!res.ok) throw new Error(`Ping failed: ${res.status}`);
      toast({ title: "Ping sent", description: "Waiting for extension pong..." });
    } catch (err) {
      toast({
        title: "Ping failed",
        description: err instanceof Error ? err.message : "Failed to send ping",
        variant: "destructive",
      });
      setPongStatus("idle");
    } finally {
      setPinging(false);
    }
  };

  const generateApiKey = async () => {
    if (!user?.id) return;
    setGeneratingKey(true);
    try {
      const res = await fetch(`${ACCOUNTS_URL}/${user.id}/api-key`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      updateUser({ api_key: data.api_key });
      toast({ title: "API Key Generated", description: "Your extension can now connect." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to generate API key",
        variant: "destructive",
      });
    } finally {
      setGeneratingKey(false);
    }
  };

  if (!apiKey) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">No API Key Found</h2>
        <p className="text-muted-foreground max-w-md">
          Your account does not have an API key configured. Generate one so the Chrome extension can connect.
        </p>
        <Button onClick={generateApiKey} disabled={generatingKey}>
          {generatingKey ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate API Key"
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Sticky Header */}
      <div className="sticky top-16 z-50 bg-[#0b0b0b] border-b border-white/10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">Campaigns</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-7 px-2"
                onClick={() => {
                  navigator.clipboard.writeText(apiKey);
                  setCopied(true);
                  toast({ title: "Copied", description: "API key copied to clipboard" });
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                {copied ? "Copied" : "Copy API Key"}
              </Button>
            </div>
            <p className="text-muted-foreground">Manage outreach campaigns</p>
          </div>

          <Button
            variant={pongStatus === "received" ? "outline" : "secondary"}
            onClick={sendPing}
            disabled={pinging}
            className={pongStatus === "received" ? "border-green-500/50 text-green-400" : ""}
          >
            {pinging ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : pongStatus === "received" ? (
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-400" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {pongStatus === "waiting" ? "Waiting..." : pongStatus === "received" ? "Pong!" : "Ping Extension"}
          </Button>
        </div>
      </div>

      {/* Campaign List */}
      <CampaignList
        apiKey={apiKey}
        senders={senders}
        onCreateCampaign={() => {
          setEditingCampaign(null);
          setCreateEditOpen(true);
        }}
        onEditCampaign={(c) => {
          setEditingCampaign(c);
          setCreateEditOpen(true);
        }}
      />

      {/* Create / Edit Campaign Dialog */}
      <CampaignCreateEditDialog
        open={createEditOpen}
        onOpenChange={setCreateEditOpen}
        campaign={editingCampaign}
        apiKey={apiKey}
        senders={senders}
      />
    </div>
  );
}
