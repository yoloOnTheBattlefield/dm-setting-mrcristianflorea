import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminView } from "@/contexts/AdminViewContext";
import { useToast } from "@/hooks/use-toast";
import { API_URL, fetchWithAuth } from "@/lib/api";
import {
  useTrackingSettings,
  useUpdateTrackingSettings,
  useTrackingEvents,
} from "@/hooks/useTracking";
import {
  useApifyTokens,
  useApifyUsage,
  useAddApifyToken,
  useDeleteApifyToken,
  useResetApifyToken,
} from "@/hooks/useApifyTokens";

import AIModelsSection from "@/components/integrations/AIModelsSection";
import ApifyTokensCard from "@/components/integrations/ApifyTokensCard";
import TrackingCard from "@/components/integrations/TrackingCard";
import ConnectionsSection from "@/components/integrations/ConnectionsSection";
import CalendlyTokenModal from "@/components/integrations/CalendlyTokenModal";

const ACCOUNTS_API_URL = `${API_URL}/accounts`;

const SERVER_URL = API_URL;

export default function Integrations() {
  const { user } = useAuth();
  const { viewAll } = useAdminView();
  const { toast } = useToast();
  const [isCalendlyModalOpen, setIsCalendlyModalOpen] = useState(false);
  const [calendlyToken, setCalendlyToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OpenAI token state
  const [openaiToken, setOpenaiToken] = useState("");
  const [savedOpenaiToken, setSavedOpenaiToken] = useState("");
  const [isSavingOpenai, setIsSavingOpenai] = useState(false);

  // Claude token state
  const [claudeToken, setClaudeToken] = useState("");
  const [savedClaudeToken, setSavedClaudeToken] = useState("");
  const [isSavingClaude, setIsSavingClaude] = useState(false);

  // Gemini token state
  const [geminiToken, setGeminiToken] = useState("");
  const [savedGeminiToken, setSavedGeminiToken] = useState("");
  const [isSavingGemini, setIsSavingGemini] = useState(false);

  // Apify tokens (multi-token)
  const { data: apifyTokensData, isLoading: apifyTokensLoading } = useApifyTokens();
  const hasApifyTokens = (apifyTokensData?.tokens?.length ?? 0) > 0;
  const { data: apifyUsageData } = useApifyUsage(hasApifyTokens);
  const apifyUsageMap = new Map(
    (apifyUsageData?.usage ?? []).map((u) => [u._id, u]),
  );
  const addApifyToken = useAddApifyToken();
  const deleteApifyToken = useDeleteApifyToken();
  const resetApifyToken = useResetApifyToken();
  const [newApifyLabel, setNewApifyLabel] = useState("");
  const [newApifyToken, setNewApifyToken] = useState("");

  // Calendly connection status
  const [calendlyConnected, setCalendlyConnected] = useState(false);

  // Stripe connection status
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeSecret, setStripeSecret] = useState("");
  const [isSavingStripe, setIsSavingStripe] = useState(false);

  // Instagram OAuth state
  const [igConnected, setIgConnected] = useState(false);
  const [igUsername, setIgUsername] = useState("");
  const [isConnectingIg, setIsConnectingIg] = useState(false);
  const [isDisconnectingIg, setIsDisconnectingIg] = useState(false);

  // Tracking state
  const { data: trackingSettings } = useTrackingSettings();
  const updateTracking = useUpdateTrackingSettings();
  const isAdmin = user?.role === 0;
  const { data: trackingEventsData } = useTrackingEvents(
    20,
    isAdmin && viewAll ? "all" : undefined,
  );
  const [newRule, setNewRule] = useState("");
  const [localRules, setLocalRules] = useState<string[]>([]);
  const [rulesChanged, setRulesChanged] = useState(false);

  useEffect(() => {
    if (trackingSettings?.tracking_conversion_rules) {
      setLocalRules(trackingSettings.tracking_conversion_rules);
      setRulesChanged(false);
    }
  }, [trackingSettings?.tracking_conversion_rules]);

  // Fetch current account data (openai_token, claude_token, calendly_token)
  useEffect(() => {
    if (!user?.id) return;
    fetchWithAuth(`${ACCOUNTS_API_URL}/me`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.openai_token) {
          setOpenaiToken(data.openai_token);
          setSavedOpenaiToken(data.openai_token);
        }
        if (data?.claude_token) {
          setClaudeToken(data.claude_token);
          setSavedClaudeToken(data.claude_token);
        }
        if (data?.gemini_token) {
          setGeminiToken(data.gemini_token);
          setSavedGeminiToken(data.gemini_token);
        }
        if (data?.calendly_token) {
          setCalendlyConnected(true);
        }
        if (data?.stripe_webhook_secret) {
          setStripeConnected(true);
        }
        if (data?.ig_oauth) {
          setIgConnected(true);
          setIgUsername(data.ig_oauth.ig_username || "");
        }
      })
      .catch((err) => console.error("Failed to fetch integration status:", err));
  }, [user?.id]);

  // Handle Instagram OAuth redirect (code in URL params)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;

    const state = params.get("state") || "";
    // Clean URL immediately
    window.history.replaceState({}, "", window.location.pathname);

    // Determine endpoint based on state param
    const isOutbound = state.startsWith("oa:");
    const outboundId = isOutbound ? state.slice(3) : null;
    const endpoint = isOutbound
      ? `${API_URL}/api/instagram/outbound/${outboundId}/callback`
      : `${API_URL}/api/instagram/callback`;

    setIsConnectingIg(true);
    fetchWithAuth(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (r.ok && data.success) {
          if (isOutbound) {
            toast({ title: "Instagram Connected", description: `Outbound account connected as @${data.ig_username}` });
          } else {
            setIgConnected(true);
            setIgUsername(data.ig_username || "");
            toast({ title: "Instagram Connected", description: `Connected as @${data.ig_username}` });
          }
        } else {
          toast({ title: "Error", description: data.error || "Failed to connect Instagram", variant: "destructive" });
        }
      })
      .catch(() => {
        toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" });
      })
      .finally(() => setIsConnectingIg(false));
  }, []);

  const handleSaveOpenaiToken = async () => {
    if (!user?.id) return;
    setIsSavingOpenai(true);
    try {
      const response = await fetchWithAuth(`${ACCOUNTS_API_URL}/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openai_token: openaiToken.trim() || null }),
      });
      if (response.ok) {
        const trimmed = openaiToken.trim();
        setSavedOpenaiToken(trimmed);
        toast({ title: "Saved", description: trimmed ? "OpenAI API key updated." : "OpenAI API key removed. Using server default." });
      } else {
        const data = await response.json().catch(() => ({}));
        toast({ title: "Error", description: data.error || "Failed to save API key", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to connect to the server", variant: "destructive" });
    } finally {
      setIsSavingOpenai(false);
    }
  };

  const handleSaveClaudeToken = async () => {
    if (!user?.id) return;
    setIsSavingClaude(true);
    try {
      const response = await fetchWithAuth(`${ACCOUNTS_API_URL}/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claude_token: claudeToken.trim() || null }),
      });
      if (response.ok) {
        const trimmed = claudeToken.trim();
        setSavedClaudeToken(trimmed);
        toast({ title: "Saved", description: trimmed ? "Claude API key updated." : "Claude API key removed." });
      } else {
        const data = await response.json().catch(() => ({}));
        toast({ title: "Error", description: data.error || "Failed to save API key", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to connect to the server", variant: "destructive" });
    } finally {
      setIsSavingClaude(false);
    }
  };

  const handleSaveGeminiToken = async () => {
    if (!user?.id) return;
    setIsSavingGemini(true);
    try {
      const response = await fetchWithAuth(`${ACCOUNTS_API_URL}/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gemini_token: geminiToken.trim() || null }),
      });
      if (response.ok) {
        const trimmed = geminiToken.trim();
        setSavedGeminiToken(trimmed);
        toast({ title: "Saved", description: trimmed ? "Gemini API key updated." : "Gemini API key removed." });
      } else {
        const data = await response.json().catch(() => ({}));
        toast({ title: "Error", description: data.error || "Failed to save API key", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to connect to the server", variant: "destructive" });
    } finally {
      setIsSavingGemini(false);
    }
  };

  const handleAddApifyToken = async () => {
    const token = newApifyToken.trim();
    if (!token) return;
    try {
      await addApifyToken.mutateAsync({ label: newApifyLabel.trim(), token });
      setNewApifyToken("");
      setNewApifyLabel("");
      toast({ title: "Saved", description: "Apify token added." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add token",
        variant: "destructive",
      });
    }
  };

  const handleDeleteApifyToken = async (id: string) => {
    try {
      await deleteApifyToken.mutateAsync(id);
      toast({ title: "Removed", description: "Apify token removed." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to remove",
        variant: "destructive",
      });
    }
  };

  const handleResetApifyToken = async (id: string) => {
    try {
      await resetApifyToken.mutateAsync(id);
      toast({ title: "Reset", description: "Token marked as active." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to reset",
        variant: "destructive",
      });
    }
  };

  const handleCalendlySubmit = async () => {
    if (!calendlyToken.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Calendly token",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetchWithAuth(`${API_URL}/api/calendly/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: calendlyToken,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Calendly token added successfully",
        });
        setCalendlyConnected(true);
        setIsCalendlyModalOpen(false);
        setCalendlyToken("");
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.message || "Failed to add Calendly token",
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
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsCalendlyModalOpen(false);
    setCalendlyToken("");
  };

  const handleStripeSave = async () => {
    if (!stripeSecret.trim()) return;
    setIsSavingStripe(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/api/stripe/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhook_secret: stripeSecret }),
      });
      if (res.ok) {
        setStripeConnected(true);
        setStripeSecret("");
        toast({ title: "Stripe connected", description: "Webhook secret saved" });
      } else {
        toast({ title: "Failed to save", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to connect", variant: "destructive" });
    } finally {
      setIsSavingStripe(false);
    }
  };

  const handleStripeDisconnect = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/api/stripe/disconnect`, { method: "DELETE" });
      if (res.ok) {
        setStripeConnected(false);
        toast({ title: "Stripe disconnected" });
      }
    } catch {
      toast({ title: "Failed to disconnect", variant: "destructive" });
    }
  };

  const handleConnectInstagram = async () => {
    setIsConnectingIg(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/api/instagram/auth-url`);
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Error", description: data.error || "Failed to get auth URL", variant: "destructive" });
        setIsConnectingIg(false);
      }
    } catch {
      toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" });
      setIsConnectingIg(false);
    }
  };

  const handleDisconnectInstagram = async () => {
    setIsDisconnectingIg(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/api/instagram/disconnect`, { method: "DELETE" });
      if (response.ok) {
        setIgConnected(false);
        setIgUsername("");
        toast({ title: "Disconnected", description: "Instagram account disconnected" });
      } else {
        toast({ title: "Error", description: "Failed to disconnect", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" });
    } finally {
      setIsDisconnectingIg(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      {/* ── AI Models ── */}
      <AIModelsSection
        openaiToken={openaiToken}
        savedOpenaiToken={savedOpenaiToken}
        isSavingOpenai={isSavingOpenai}
        onOpenaiTokenChange={setOpenaiToken}
        onSaveOpenai={handleSaveOpenaiToken}
        claudeToken={claudeToken}
        savedClaudeToken={savedClaudeToken}
        isSavingClaude={isSavingClaude}
        onClaudeTokenChange={setClaudeToken}
        onSaveClaude={handleSaveClaudeToken}
        geminiToken={geminiToken}
        savedGeminiToken={savedGeminiToken}
        isSavingGemini={isSavingGemini}
        onGeminiTokenChange={setGeminiToken}
        onSaveGemini={handleSaveGeminiToken}
      />

      {/* ── Data Acquisition ── */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Data Acquisition</h3>
        </div>
        <ApifyTokensCard
          tokens={apifyTokensData?.tokens ?? []}
          isLoading={apifyTokensLoading}
          apifyUsageMap={apifyUsageMap}
          newApifyLabel={newApifyLabel}
          newApifyToken={newApifyToken}
          onNewLabelChange={setNewApifyLabel}
          onNewTokenChange={setNewApifyToken}
          onAddToken={handleAddApifyToken}
          onDeleteToken={handleDeleteApifyToken}
          onResetToken={handleResetApifyToken}
          isAdding={addApifyToken.isPending}
          isDeleting={deleteApifyToken.isPending}
          isResetting={resetApifyToken.isPending}
        />
      </section>

      {/* ── Tracking ── */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tracking</h3>
        </div>
        <TrackingCard
          trackingEnabled={trackingSettings?.tracking_enabled ?? false}
          onToggleTracking={(checked) => {
            updateTracking.mutate(
              { tracking_enabled: checked },
              {
                onSuccess: () =>
                  toast({
                    title: checked ? "Tracking enabled" : "Tracking disabled",
                  }),
                onError: () =>
                  toast({
                    title: "Error",
                    description: "Failed to update tracking",
                    variant: "destructive",
                  }),
              },
            );
          }}
          accountId={user?.account_id || "YOUR_ACCOUNT_ID"}
          serverUrl={SERVER_URL}
          onCopySnippet={(snippet) => {
            navigator.clipboard.writeText(snippet);
            toast({ title: "Copied to clipboard" });
          }}
          newRule={newRule}
          onNewRuleChange={setNewRule}
          localRules={localRules}
          onAddRule={() => {
            if (newRule.trim()) {
              const updated = [...localRules, newRule.trim()];
              setLocalRules(updated);
              setNewRule("");
              setRulesChanged(true);
            }
          }}
          onRemoveRule={(index) => {
            const updated = localRules.filter((_, idx) => idx !== index);
            setLocalRules(updated);
            setRulesChanged(true);
          }}
          rulesChanged={rulesChanged}
          onSaveRules={() => {
            updateTracking.mutate(
              { tracking_conversion_rules: localRules },
              {
                onSuccess: () => {
                  setRulesChanged(false);
                  toast({ title: "Conversion rules saved" });
                },
                onError: () =>
                  toast({
                    title: "Error",
                    description: "Failed to save rules",
                    variant: "destructive",
                  }),
              },
            );
          }}
          isSavingRules={updateTracking.isPending}
          events={trackingEventsData?.events ?? []}
          isAdmin={isAdmin}
          viewAll={viewAll}
        />
      </section>

      {/* ── Connections ── */}
      <ConnectionsSection
        calendlyConnected={calendlyConnected}
        onOpenCalendlyModal={() => setIsCalendlyModalOpen(true)}
        igConnected={igConnected}
        igUsername={igUsername}
        isConnectingIg={isConnectingIg}
        isDisconnectingIg={isDisconnectingIg}
        onConnectInstagram={handleConnectInstagram}
        onDisconnectInstagram={handleDisconnectInstagram}
        apiUrl={API_URL}
        userApiKey={user?.api_key}
        onCopy={(text, description) => {
          navigator.clipboard.writeText(text);
          toast({ title: "Copied", description });
        }}
        stripeConnected={stripeConnected}
        stripeSecret={stripeSecret}
        onStripeSecretChange={setStripeSecret}
        onStripeSave={handleStripeSave}
        onStripeDisconnect={handleStripeDisconnect}
        isSavingStripe={isSavingStripe}
        userGhl={user?.ghl}
      />

      {/* Calendly Token Modal */}
      <CalendlyTokenModal
        open={isCalendlyModalOpen}
        onOpenChange={setIsCalendlyModalOpen}
        token={calendlyToken}
        onTokenChange={setCalendlyToken}
        onSubmit={handleCalendlySubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
