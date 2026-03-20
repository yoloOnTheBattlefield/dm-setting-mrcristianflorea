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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Copy, X } from "lucide-react";

interface TrackingEvent {
  _id: string;
  event_type: string;
  lead_id: string;
  url?: string;
  createdAt: string;
}

interface TrackingCardProps {
  trackingEnabled: boolean;
  onToggleTracking: (checked: boolean) => void;
  accountId: string;
  serverUrl: string;
  onCopySnippet: (snippet: string) => void;
  newRule: string;
  onNewRuleChange: (value: string) => void;
  localRules: string[];
  onAddRule: () => void;
  onRemoveRule: (index: number) => void;
  rulesChanged: boolean;
  onSaveRules: () => void;
  isSavingRules: boolean;
  events: TrackingEvent[];
  isAdmin: boolean;
  viewAll: boolean;
}

export default function TrackingCard({
  trackingEnabled,
  onToggleTracking,
  accountId,
  serverUrl,
  onCopySnippet,
  newRule,
  onNewRuleChange,
  localRules,
  onAddRule,
  onRemoveRule,
  rulesChanged,
  onSaveRules,
  isSavingRules,
  events,
  isAdmin,
  viewAll,
}: TrackingCardProps) {
  const snippet = [
    `<script>`,
    `(function(){`,
    `  var A="${accountId}";`,
    `  var B="${serverUrl}";`,
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Website Tracking</CardTitle>
            <CardDescription>
              Track when leads visit your website and detect conversions
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {trackingEnabled ? (
              <Badge className="bg-green-500/15 text-green-500 border-green-500/30 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground gap-1">
                Disabled
              </Badge>
            )}
            <Switch
              checked={trackingEnabled}
              onCheckedChange={onToggleTracking}
            />
          </div>
        </div>
      </CardHeader>

      {!trackingEnabled && (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Enable to get a tracking snippet you can add to your website.
          </p>
        </CardContent>
      )}

      {trackingEnabled && (
        <CardContent className="space-y-6">
          {/* Tracking Snippet */}
          <div className="space-y-2">
            <Label>Tracking Snippet</Label>
            <p className="text-xs text-muted-foreground">
              Copy and paste this script into your website before the closing &lt;/body&gt; tag.
            </p>
            <div className="relative">
              <pre className="bg-muted rounded-md p-3 text-xs overflow-hidden whitespace-pre-wrap break-all max-h-64">
                {snippet}
              </pre>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Copy snippet"
                className="absolute top-1 right-1 h-7 w-7"
                onClick={() => onCopySnippet(snippet)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
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
                onChange={(e) => onNewRuleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newRule.trim()) {
                    onAddRule();
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={!newRule.trim()}
                onClick={onAddRule}
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
                      onClick={() => onRemoveRule(i)}
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
                onClick={onSaveRules}
                disabled={isSavingRules}
              >
                {isSavingRules ? "Saving..." : "Save Rules"}
              </Button>
            )}
          </div>

          {/* Recent Activity */}
          <div className="space-y-2">
            <Label>Recent Activity</Label>
            {events && events.length > 0 ? (
              <div className="space-y-1.5">
                {events.map((evt) => (
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
  );
}
