import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/contexts/SocketContext";
import { throttle } from "@/lib/throttle";
import { useOutboundAccounts } from "@/hooks/useOutboundAccounts";
import { useCampaigns } from "@/hooks/useCampaigns";
import CampaignList from "@/components/campaigns/CampaignList";
import CampaignCreateEditDialog from "@/components/campaigns/CampaignCreateEditDialog";

export default function Campaigns() {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const [createOpen, setCreateOpen] = useState(false);

  const { data: outboundData } = useOutboundAccounts({ page: 1, limit: 100 });
  const outboundAccounts = outboundData?.accounts ?? [];

  const { data, isLoading, isError, error, refetch } = useCampaigns({ limit: 1000 });
  const campaigns = data?.campaigns ?? [];

  // Compute stat line
  const statLine = useMemo(() => {
    if (campaigns.length === 0) return null;
    const total = campaigns.length;
    const active = campaigns.filter((c) => c.status === "active").length;
    const sentSum = campaigns.reduce((s, c) => s + (c.stats.sent || 0), 0);
    const totalLeads = campaigns.reduce((s, c) => s + (c.stats.total || 0), 0);
    return `${total} campaign${total !== 1 ? "s" : ""} · ${active} active · ${sentSum}/${totalLeads} DMs sent`;
  }, [campaigns]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const onSenderChange = () => {
      queryClient.invalidateQueries({ queryKey: ["outbound-accounts"] });
    };

    const onTaskUpdate = throttle(() => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaign"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-stats"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-leads"] });
    }, 2000);

    socket.on("sender:online", onSenderChange);
    socket.on("sender:offline", onSenderChange);
    socket.on("task:completed", onTaskUpdate);
    socket.on("task:failed", onTaskUpdate);
    socket.on("task:new", onTaskUpdate);

    return () => {
      socket.off("sender:online", onSenderChange);
      socket.off("sender:offline", onSenderChange);
      socket.off("task:completed", onTaskUpdate);
      socket.off("task:failed", onTaskUpdate);
      socket.off("task:new", onTaskUpdate);
    };
  }, [socket, queryClient]);

  return (
    <div className="flex flex-1 flex-col">
      {/* Sticky Header */}
      <div className="sticky top-16 z-50 bg-background border-b border-border">
        <div className="px-6 py-4">
          {statLine && (
            <p className="text-sm text-muted-foreground">{statLine}</p>
          )}
        </div>
      </div>

      {/* Campaign List */}
      <CampaignList
        campaigns={campaigns}
        isLoading={isLoading}
        isError={isError}
        error={error as Error | null}
        refetch={refetch}
        outboundAccounts={outboundAccounts}
        onCreateCampaign={() => setCreateOpen(true)}
      />

      {/* Create Campaign Dialog */}
      <CampaignCreateEditDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        campaign={null}
        outboundAccounts={outboundAccounts}
      />
    </div>
  );
}
