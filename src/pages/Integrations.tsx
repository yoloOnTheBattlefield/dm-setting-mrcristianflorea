import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminView } from "@/contexts/AdminViewContext";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { Copy, X, CheckCircle2, Loader2, Trash2, RotateCcw, AlertTriangle } from "lucide-react";

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
      })
      .catch(() => {});
  }, [user?.id]);

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

  const openaiTokenChanged = openaiToken.trim() !== savedOpenaiToken;

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

  const claudeTokenChanged = claudeToken.trim() !== savedClaudeToken;

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

  const geminiTokenChanged = geminiToken.trim() !== savedGeminiToken;

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

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Integrations</h2>
        <p className="text-muted-foreground">
          Connect and manage your third-party integrations
        </p>
      </div>

      {/* OpenAI API Key */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>OpenAI API Key</CardTitle>
              <CardDescription>
                Provide your own OpenAI key for lead qualification. Leave empty to use the server default.
              </CardDescription>
            </div>
            {savedOpenaiToken && (
              <Badge className="bg-green-500/15 text-green-500 border-green-500/30 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="openai-token">API Key</Label>
            <Input
              id="openai-token"
              type="password"
              placeholder="sk-..."
              value={openaiToken}
              onChange={(e) => setOpenaiToken(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {savedOpenaiToken ? "Custom key active" : "Using server default"}
            </p>
            <Button
              size="sm"
              onClick={handleSaveOpenaiToken}
              disabled={isSavingOpenai || !openaiTokenChanged}
            >
              {isSavingOpenai ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Claude API Key */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Claude API Key</CardTitle>
              <CardDescription>
                Provide your own Claude API key for AI-powered features.
              </CardDescription>
            </div>
            {savedClaudeToken && (
              <Badge className="bg-green-500/15 text-green-500 border-green-500/30 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="claude-token">API Key</Label>
            <Input
              id="claude-token"
              type="password"
              placeholder="sk-ant-..."
              value={claudeToken}
              onChange={(e) => setClaudeToken(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {savedClaudeToken ? "Custom key active" : "No key configured"}
            </p>
            <Button
              size="sm"
              onClick={handleSaveClaudeToken}
              disabled={isSavingClaude || !claudeTokenChanged}
            >
              {isSavingClaude ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gemini API Key */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gemini API Key</CardTitle>
              <CardDescription>
                Provide your own Gemini API key for AI-powered features.
              </CardDescription>
            </div>
            {savedGeminiToken && (
              <Badge className="bg-green-500/15 text-green-500 border-green-500/30 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="gemini-token">API Key</Label>
            <Input
              id="gemini-token"
              type="password"
              placeholder="AIza..."
              value={geminiToken}
              onChange={(e) => setGeminiToken(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {savedGeminiToken ? "Custom key active" : "No key configured"}
            </p>
            <Button
              size="sm"
              onClick={handleSaveGeminiToken}
              disabled={isSavingGemini || !geminiTokenChanged}
            >
              {isSavingGemini ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Apify API Tokens (multi-token) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Apify API Tokens</CardTitle>
              <CardDescription>
                Manage multiple Apify tokens for deep scraping. Tokens auto-rotate when one hits its monthly limit.
              </CardDescription>
            </div>
            {(() => {
              const tokens = apifyTokensData?.tokens ?? [];
              const active = tokens.filter((t) => t.status === "active").length;
              const limited = tokens.filter((t) => t.status === "limit_reached").length;
              if (tokens.length === 0) return null;
              return (
                <div className="flex gap-1.5">
                  {active > 0 && (
                    <Badge className="bg-green-500/15 text-green-500 border-green-500/30 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {active} active
                    </Badge>
                  )}
                  {limited > 0 && (
                    <Badge className="bg-orange-500/15 text-orange-500 border-orange-500/30 gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {limited} limited
                    </Badge>
                  )}
                </div>
              );
            })()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Token list */}
          {apifyTokensLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading tokens...
            </div>
          ) : (apifyTokensData?.tokens?.length ?? 0) > 0 ? (
            <div className="space-y-2">
              <Label>Saved Tokens</Label>
              <div className="space-y-1.5">
                {apifyTokensData!.tokens.map((t) => (
                  <div
                    key={t._id}
                    className={`rounded-md border px-3 py-2 ${
                      t.status === "limit_reached" ? "border-orange-500/30 bg-orange-500/5" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium truncate">
                          {t.label || "Unnamed"}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">{t.token}</span>
                        {t.status === "active" && (
                          <Badge variant="outline" className="text-green-500 border-green-500/30 text-[10px] px-1.5 py-0 shrink-0">
                            Active
                          </Badge>
                        )}
                        {t.status === "limit_reached" && (
                          <Badge variant="outline" className="text-orange-500 border-orange-500/30 text-[10px] px-1.5 py-0 shrink-0">
                            Limit Reached
                          </Badge>
                        )}
                        {t.status === "disabled" && (
                          <Badge variant="outline" className="text-muted-foreground text-[10px] px-1.5 py-0 shrink-0">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {t.status === "limit_reached" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-green-500"
                            onClick={() => handleResetApifyToken(t._id)}
                            disabled={resetApifyToken.isPending}
                            title="Reset to active"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteApifyToken(t._id)}
                          disabled={deleteApifyToken.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {(() => {
                      const usage = apifyUsageMap.get(t._id);
                      if (!usage) return null;
                      if (usage.error) return (
                        <p className="text-[10px] text-muted-foreground mt-1">Usage: unavailable</p>
                      );
                      const used = usage.totalUsageUsd ?? 0;
                      const limit = usage.monthlyUsageLimitUsd;
                      const pct = limit ? Math.min((used / limit) * 100, 100) : null;
                      return (
                        <div className="mt-1.5 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>${used.toFixed(2)} used{limit ? ` / $${limit.toFixed(2)} limit` : ""}</span>
                            {pct !== null && <span>{pct.toFixed(0)}%</span>}
                          </div>
                          {pct !== null && (
                            <div className="h-1 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-orange-500" : "bg-green-500"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No Apify tokens added yet.</p>
          )}

          {/* Add new token form */}
          <div className="border-t pt-4 space-y-3">
            <Label>Add Token</Label>
            <div className="space-y-2">
              <Label htmlFor="apify-label" className="text-xs text-muted-foreground">Label (optional)</Label>
              <Input
                id="apify-label"
                placeholder="e.g. Main account, Backup"
                value={newApifyLabel}
                onChange={(e) => setNewApifyLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apify-token-new" className="text-xs text-muted-foreground">API Token</Label>
              <Input
                id="apify-token-new"
                type="password"
                placeholder="apify_api_..."
                value={newApifyToken}
                onChange={(e) => setNewApifyToken(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleAddApifyToken}
                disabled={addApifyToken.isPending || !newApifyToken.trim()}
              >
                {addApifyToken.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Token"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Website Tracking */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Website Tracking</CardTitle>
              <CardDescription>
                Track when leads visit your website and detect conversions
              </CardDescription>
            </div>
            <Switch
              checked={trackingSettings?.tracking_enabled ?? false}
              onCheckedChange={(checked) => {
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
            />
          </div>
        </CardHeader>

        {trackingSettings?.tracking_enabled && (
          <CardContent className="space-y-6">
            {/* Tracking Snippet */}
            <div className="space-y-2">
              <Label>Tracking Snippet</Label>
              <p className="text-xs text-muted-foreground">
                Copy and paste this script into your website before the closing &lt;/body&gt; tag.
              </p>
              {(() => {
                const acctId = user?.account_id || "YOUR_ACCOUNT_ID";
                const snippet = [
                  `<script>`,
                  `(function(){`,
                  `  var A="${acctId}";`,
                  `  var B="${SERVER_URL}";`,
                  `  function post(p,d){`,
                  `    try{`,
                  `      var x=new XMLHttpRequest();`,
                  `      x.open("POST",B+p,true);`,
                  `      x.setRequestHeader(`,
                  `        "Content-Type","application/json"`,
                  `      );`,
                  `      x.send(JSON.stringify(d));`,
                  `    }catch(e){}`,
                  `  }`,
                  `  function get(p,cb){`,
                  `    try{`,
                  `      var x=new XMLHttpRequest();`,
                  `      x.open("GET",B+p,true);`,
                  `      x.onload=function(){`,
                  `        if(x.status===200)`,
                  `          try{cb(JSON.parse(x.responseText))}`,
                  `          catch(e){}`,
                  `      };`,
                  `      x.send();`,
                  `    }catch(e){}`,
                  `  }`,
                  `  get("/t/config/"+A,function(cfg){`,
                  `    if(!cfg||!cfg.enabled)return;`,
                  `    var sp=new URLSearchParams(`,
                  `      window.location.search`,
                  `    );`,
                  `    var lid=sp.get("utm_medium");`,
                  `    var k="qd_lead_"+A;`,
                  `    if(lid)`,
                  `      try{localStorage.setItem(k,lid)}`,
                  `      catch(e){}`,
                  `    else`,
                  `      try{lid=localStorage.getItem(k)}`,
                  `      catch(e){}`,
                  `    if(!lid)return;`,
                  `    var ev={`,
                  `      account_id:A,`,
                  `      lead_id:lid,`,
                  `      url:window.location.href,`,
                  `      referrer:document.referrer||null`,
                  `    };`,
                  `    var fk="qd_fv_"+A+"_"+lid;`,
                  `    try{`,
                  `      if(!localStorage.getItem(fk)){`,
                  `        ev.event_type="first_visit";`,
                  `        post("/t/event",ev);`,
                  `        localStorage.setItem(fk,"1");`,
                  `      }`,
                  `    }catch(e){}`,
                  `    ev.event_type="page_view";`,
                  `    post("/t/event",ev);`,
                  `    if(cfg.conversion_rules`,
                  `      &&cfg.conversion_rules.length>0){`,
                  `      var ck="qd_cv_"+A+"_"+lid;`,
                  `      try{`,
                  `        if(!localStorage.getItem(ck)){`,
                  `          var u=window.location.href`,
                  `            .toLowerCase();`,
                  `          for(var i=0;`,
                  `            i<cfg.conversion_rules.length;`,
                  `            i++){`,
                  `            var r=cfg.conversion_rules[i]`,
                  `              .toLowerCase();`,
                  `            if(u.indexOf(r)!==-1){`,
                  `              ev.event_type="conversion";`,
                  `              post("/t/event",ev);`,
                  `              localStorage.setItem(ck,"1");`,
                  `              break;`,
                  `            }`,
                  `          }`,
                  `        }`,
                  `      }catch(e){}`,
                  `    }`,
                  `  });`,
                  `})();`,
                  `</script>`,
                ].join("\n");
                return (
                  <div className="relative">
                    <pre className="bg-muted rounded-md p-3 text-xs overflow-hidden whitespace-pre-wrap break-all max-h-64">
                      {snippet}
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-7 w-7"
                      onClick={() => {
                        navigator.clipboard.writeText(snippet);
                        toast({ title: "Copied to clipboard" });
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })()}
            </div>

            {/* Conversion Rules */}
            <div className="space-y-2">
              <Label>Conversion Rules</Label>
              <p className="text-xs text-muted-foreground">
                Add URL keywords that indicate a conversion (e.g. "thank-you", "success").
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. thank-you"
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newRule.trim()) {
                      const updated = [...localRules, newRule.trim()];
                      setLocalRules(updated);
                      setNewRule("");
                      setRulesChanged(true);
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!newRule.trim()}
                  onClick={() => {
                    const updated = [...localRules, newRule.trim()];
                    setLocalRules(updated);
                    setNewRule("");
                    setRulesChanged(true);
                  }}
                >
                  Add
                </Button>
              </div>
              {localRules.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {localRules.map((rule, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {rule}
                      <button
                        onClick={() => {
                          const updated = localRules.filter((_, idx) => idx !== i);
                          setLocalRules(updated);
                          setRulesChanged(true);
                        }}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {rulesChanged && (
                <Button
                  size="sm"
                  onClick={() => {
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
                  disabled={updateTracking.isPending}
                >
                  {updateTracking.isPending ? "Saving..." : "Save Rules"}
                </Button>
              )}
            </div>

            {/* Recent Activity */}
            <div className="space-y-2">
              <Label>Recent Activity</Label>
              {trackingEventsData?.events && trackingEventsData.events.length > 0 ? (
                <div className="space-y-1.5">
                  {trackingEventsData.events.map((evt) => (
                    <div
                      key={evt._id}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <Badge
                        variant={
                          evt.event_type === "conversion"
                            ? "default"
                            : evt.event_type === "first_visit"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-[10px] px-1.5 py-0"
                      >
                        {evt.event_type}
                      </Badge>
                      {isAdmin && viewAll && evt.url && (
                        <span className="truncate max-w-[140px] text-foreground font-medium">
                          {(() => {
                            try { return new URL(evt.url).hostname.replace(/^www\./, ""); }
                            catch { return evt.url; }
                          })()}
                        </span>
                      )}
                      <span className="truncate">{evt.lead_id}</span>
                      <span className="ml-auto whitespace-nowrap">
                        {new Date(evt.createdAt).toLocaleDateString()}{" "}
                        {new Date(evt.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No tracking events received yet.
                </p>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Calendly Integration Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Calendly</CardTitle>
                <CardDescription>
                  Connect your Calendly account to sync scheduling data
                </CardDescription>
              </div>
              {calendlyConnected && (
                <Badge className="bg-green-500/15 text-green-500 border-green-500/30 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <Button
              onClick={() => setIsCalendlyModalOpen(true)}
              className="w-full"
              variant={calendlyConnected ? "outline" : "default"}
            >
              {calendlyConnected ? "Reconnect Calendly" : "Connect Calendly"}
            </Button>
          </CardContent>
        </Card>

        {/* Placeholder for future integrations */}
        <Card className="opacity-50">
          <CardHeader>
            <CardTitle>Google Calendar</CardTitle>
            <CardDescription>
              Sync events with your Google Calendar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled className="w-full">
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader>
            <CardTitle>Slack</CardTitle>
            <CardDescription>
              Get notifications in your Slack workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled className="w-full">
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Calendly Token Modal */}
      <Dialog open={isCalendlyModalOpen} onOpenChange={setIsCalendlyModalOpen}>
        <DialogContent className="bg-background max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add Calendly Token</DialogTitle>
            <DialogDescription>
              Watch the tutorial below to learn how to get your Calendly API
              token
            </DialogDescription>
          </DialogHeader>

          {/* Tutorial Video */}
          <div className="w-full" style={{ aspectRatio: "16/9" }}>
            <iframe
              src="https://scribehow.com/embed/Connect_Calendly_to_Your_DM_Settings__u05VqL8yQrSDlTONdLtVgg?as=video"
              width="100%"
              height="100%"
              allow="fullscreen"
              style={{ border: 0 }}
              title="Calendly Integration Tutorial"
            />
          </div>

          <div className="py-4">
            <Label htmlFor="calendly-token">Token</Label>
            <Input
              id="calendly-token"
              type="text"
              placeholder="Enter your Calendly token"
              value={calendlyToken}
              onChange={(e) => setCalendlyToken(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCalendlySubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
