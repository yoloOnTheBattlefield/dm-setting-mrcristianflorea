import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { API_URL, fetchWithAuth } from "@/lib/api";
import { Loader2, CheckCircle2, AlertCircle, Database } from "lucide-react";

const COLLECTIONS = [
  { key: "prompts", label: "Prompts", description: "AI qualification prompts" },
  { key: "apify_tokens", label: "Apify Tokens", description: "Scraping API tokens" },
  { key: "deep_scrape_jobs", label: "Deep Scrape Jobs", description: "Job configs, stats, and checkpoints" },
  { key: "research_posts", label: "Research Posts", description: "Scraped reels/posts" },
  { key: "research_comments", label: "Research Comments", description: "Comments from reels" },
  { key: "outbound_leads", label: "Outbound Leads", description: "Scraped profiles and lead data" },
] as const;

type CollectionKey = (typeof COLLECTIONS)[number]["key"];

interface MigrationResult {
  success: boolean;
  summary: Record<string, number>;
  error?: string;
}

export default function DataMigration() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [targetUri, setTargetUri] = useState("");
  const [targetAccountId, setTargetAccountId] = useState("");
  const [selected, setSelected] = useState<Set<CollectionKey>>(
    new Set(COLLECTIONS.map((c) => c.key)),
  );
  const [isMigrating, setIsMigrating] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);

  // Admin guard
  if (user?.role !== 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  const toggleCollection = (key: CollectionKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleMigrate = async () => {
    if (!targetUri.trim() || !targetAccountId.trim()) {
      toast({
        title: "Missing fields",
        description: "Please enter the target MongoDB URI and Account ID.",
        variant: "destructive",
      });
      return;
    }

    if (selected.size === 0) {
      toast({
        title: "No collections",
        description: "Select at least one collection to migrate.",
        variant: "destructive",
      });
      return;
    }

    setIsMigrating(true);
    setResult(null);

    try {
      const res = await fetchWithAuth(`${API_URL}/api/admin/migrate-scrape-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_mongo_uri: targetUri.trim(),
          target_account_id: targetAccountId.trim(),
          collections: [...selected],
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ success: true, summary: data.summary });
        const total = Object.values(data.summary as Record<string, number>).reduce(
          (a, b) => a + b,
          0,
        );
        toast({
          title: "Migration complete",
          description: `${total.toLocaleString()} documents migrated.`,
        });
      } else {
        setResult({
          success: false,
          summary: data.summary || {},
          error: data.error || "Migration failed",
        });
        toast({
          title: "Migration failed",
          description: data.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (err) {
      setResult({
        success: false,
        summary: {},
        error: err instanceof Error ? err.message : "Network error",
      });
      toast({
        title: "Error",
        description: "Failed to connect to the server.",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Data Migration</h2>
        <p className="text-muted-foreground">
          Copy scrape data from this database to another environment.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Target Database
          </CardTitle>
          <CardDescription>
            All documents from your current account will be copied to the target database under the specified account ID. Cross-references are automatically remapped.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target-uri">MongoDB Connection URI</Label>
            <Input
              id="target-uri"
              type="password"
              placeholder="mongodb+srv://user:pass@cluster.mongodb.net/dbname"
              value={targetUri}
              onChange={(e) => setTargetUri(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-account">Target Account ID</Label>
            <Input
              id="target-account"
              placeholder="ObjectId of the account in the target database"
              value={targetAccountId}
              onChange={(e) => setTargetAccountId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The account_id that the migrated data will belong to in the target database.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Collections</Label>
            <div className="space-y-2">
              {COLLECTIONS.map((c) => (
                <label
                  key={c.key}
                  className="flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selected.has(c.key)}
                    onCheckedChange={() => toggleCollection(c.key)}
                  />
                  <div>
                    <span className="text-sm font-medium">{c.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {c.description}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleMigrate}
            disabled={isMigrating || !targetUri.trim() || !targetAccountId.trim() || selected.size === 0}
          >
            {isMigrating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Migrating...
              </>
            ) : (
              "Start Migration"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              {result.success ? "Migration Complete" : "Migration Failed"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                {result.error}
              </div>
            )}

            {Object.keys(result.summary).length > 0 && (
              <div className="space-y-1.5">
                {Object.entries(result.summary).map(([key, count]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <span className="text-sm font-medium">
                      {COLLECTIONS.find((c) => c.key === key)?.label || key}
                    </span>
                    <Badge variant="secondary">
                      {(count as number).toLocaleString()} docs
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
