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
import { useIgSessions, useAddIgSession, useRemoveIgSession } from "@/hooks/useIgSessions";
import { Textarea } from "@/components/ui/textarea";
import { Copy, X, CheckCircle2, Loader2, Trash2 } from "lucide-react";

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

  // Apify token state
  const [apifyToken, setApifyToken] = useState("");
  const [savedApifyToken, setSavedApifyToken] = useState("");
  const [isSavingApify, setIsSavingApify] = useState(false);

  // IG Sessions (multi-profile)
  const { data: igSessionsData, isLoading: igSessionsLoading } = useIgSessions();
  const addIgSession = useAddIgSession();
  const removeIgSession = useRemoveIgSession();
  const [igUsername, setIgUsername] = useState("");
  const [igCookieJson, setIgCookieJson] = useState("");

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

  // Fetch current account data (openai_token, calendly_token)
  useEffect(() => {
    if (!user?.id) return;
    fetchWithAuth(`${ACCOUNTS_API_URL}/${user.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.openai_token) {
          setOpenaiToken(data.openai_token);
          setSavedOpenaiToken(data.openai_token);
        }
        if (data?.apify_token) {
          setApifyToken(data.apify_token);
          setSavedApifyToken(data.apify_token);
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

  const handleSaveApifyToken = async () => {
    if (!user?.id) return;
    setIsSavingApify(true);
    try {
      const response = await fetchWithAuth(`${ACCOUNTS_API_URL}/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apify_token: apifyToken.trim() || null }),
      });
      if (response.ok) {
        const trimmed = apifyToken.trim();
        setSavedApifyToken(trimmed);
        toast({ title: "Saved", description: trimmed ? "Apify API token updated." : "Apify API token removed." });
      } else {
        const data = await response.json().catch(() => ({}));
        toast({ title: "Error", description: data.error || "Failed to save token", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to connect to the server", variant: "destructive" });
    } finally {
      setIsSavingApify(false);
    }
  };

  const apifyTokenChanged = apifyToken.trim() !== savedApifyToken;

  // Parse the pasted cookie JSON to extract the 3 needed values
  const parsedIgCookies = (() => {
    if (!igCookieJson.trim()) return null;
    try {
      const arr = JSON.parse(igCookieJson.trim());
      if (!Array.isArray(arr)) return null;
      const find = (name: string) => arr.find((c: { name: string; value: string }) => c.name === name)?.value || null;
      const sessionId = find("sessionid");
      const csrfToken = find("csrftoken");
      const dsUserId = find("ds_user_id");
      if (!sessionId) return null;
      return { sessionId, csrfToken, dsUserId };
    } catch {
      return null;
    }
  })();

  const handleAddIgSession = async () => {
    const username = igUsername.replace(/^@/, "").trim();
    if (!username || !parsedIgCookies) return;
    try {
      const arr = JSON.parse(igCookieJson.trim());
      await addIgSession.mutateAsync({ ig_username: username, cookies: arr });
      setIgCookieJson("");
      setIgUsername("");
      toast({ title: "Saved", description: `Instagram cookies saved for @${username}.` });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save cookies",
        variant: "destructive",
      });
    }
  };

  const handleRemoveIgSession = async (username: string) => {
    try {
      await removeIgSession.mutateAsync(username);
      toast({ title: "Removed", description: `Cookies for @${username} removed.` });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to remove",
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

      {/* Apify API Token */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Apify API Token</CardTitle>
              <CardDescription>
                Required for Instagram deep scraping (reels, comments, profiles).
              </CardDescription>
            </div>
            {savedApifyToken && (
              <Badge className="bg-green-500/15 text-green-500 border-green-500/30 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="apify-token">API Token</Label>
            <Input
              id="apify-token"
              type="password"
              placeholder="apify_api_..."
              value={apifyToken}
              onChange={(e) => setApifyToken(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {savedApifyToken ? "Token configured" : "No token set"}
            </p>
            <Button
              size="sm"
              onClick={handleSaveApifyToken}
              disabled={isSavingApify || !apifyTokenChanged}
            >
              {isSavingApify ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instagram Session Cookies */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Instagram Sessions</CardTitle>
              <CardDescription>
                Manage multiple Instagram cookie profiles for scraping.
              </CardDescription>
            </div>
            {(igSessionsData?.ig_sessions?.length ?? 0) > 0 && (
              <Badge className="bg-green-500/15 text-green-500 border-green-500/30 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {igSessionsData!.ig_sessions.length} profile{igSessionsData!.ig_sessions.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Saved profiles list */}
          {igSessionsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading profiles...
            </div>
          ) : (igSessionsData?.ig_sessions?.length ?? 0) > 0 ? (
            <div className="space-y-2">
              <Label>Saved Profiles</Label>
              <div className="space-y-1.5">
                {igSessionsData!.ig_sessions.map((profile) => (
                  <div
                    key={profile.ig_username}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">@{profile.ig_username}</span>
                      {profile.has_cookies ? (
                        <Badge variant="outline" className="text-green-500 border-green-500/30 text-[10px] px-1.5 py-0">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 text-[10px] px-1.5 py-0">
                          Missing cookies
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveIgSession(profile.ig_username)}
                      disabled={removeIgSession.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No Instagram profiles saved yet.</p>
          )}

          {/* Add new profile form */}
          <div className="border-t pt-4 space-y-3">
            <Label>Add Profile</Label>
            <div className="space-y-2">
              <Label htmlFor="ig-username" className="text-xs text-muted-foreground">Instagram Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input
                  id="ig-username"
                  placeholder="username"
                  value={igUsername}
                  onChange={(e) => setIgUsername(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ig-cookies" className="text-xs text-muted-foreground">Cookie JSON</Label>
              <Textarea
                id="ig-cookies"
                placeholder={'Paste exported cookies JSON array...\n[\n  { "name": "sessionid", "value": "..." },\n  ...\n]'}
                value={igCookieJson}
                onChange={(e) => setIgCookieJson(e.target.value)}
                rows={4}
                className="font-mono text-xs"
              />
            </div>
            {igCookieJson.trim() && (
              parsedIgCookies ? (
                <div className="rounded-md border border-green-500/30 bg-green-500/5 p-3 space-y-1">
                  <p className="text-xs font-medium text-green-500">Cookies detected:</p>
                  <p className="text-xs text-muted-foreground font-mono">sessionid: {parsedIgCookies.sessionId?.slice(0, 20)}...</p>
                  <p className="text-xs text-muted-foreground font-mono">csrftoken: {parsedIgCookies.csrfToken || "—"}</p>
                  <p className="text-xs text-muted-foreground font-mono">ds_user_id: {parsedIgCookies.dsUserId || "—"}</p>
                </div>
              ) : (
                <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3">
                  <p className="text-xs text-destructive">Invalid JSON or missing sessionid cookie.</p>
                </div>
              )
            )}
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleAddIgSession}
                disabled={addIgSession.isPending || !parsedIgCookies || !igUsername.replace(/^@/, "").trim()}
              >
                {addIgSession.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Add Profile"
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
