import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useResearchAlerts } from "@/hooks/useResearchAlerts";
import type { AlertType } from "@/lib/research-types";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell } from "lucide-react";

const ALERT_TYPE_OPTIONS: { value: AlertType | "all"; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "new_lead_magnet", label: "New Lead Magnet" },
  { value: "keyword_spike", label: "Keyword Spike" },
  { value: "competitor_keyword_post", label: "Competitor Keyword Post" },
  { value: "new_theme_cluster", label: "New Theme Cluster" },
];

const ALERT_TYPE_COLORS: Record<AlertType, string> = {
  new_lead_magnet: "bg-purple-500/15 text-purple-700 border-purple-500/20 hover:bg-purple-500/15",
  keyword_spike: "bg-orange-500/15 text-orange-700 border-orange-500/20 hover:bg-orange-500/15",
  competitor_keyword_post: "bg-blue-500/15 text-blue-700 border-blue-500/20 hover:bg-blue-500/15",
  new_theme_cluster: "bg-green-500/15 text-green-700 border-green-500/20 hover:bg-green-500/15",
};

function formatAlertTypeLabel(type: string) {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function Alerts() {
  const { data: alerts, isLoading } = useResearchAlerts();

  const [typeFilter, setTypeFilter] = useState<AlertType | "all">("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");

  const filtered = useMemo(() => {
    if (!alerts) return [];

    const result = alerts
      .filter((alert) => {
        if (typeFilter !== "all" && alert.type !== typeFilter) return false;
        if (readFilter === "unread" && alert.isRead) return false;
        if (readFilter === "read" && !alert.isRead) return false;
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    return result;
  }, [alerts, typeFilter, readFilter]);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col min-w-0">
        <div className="sticky top-16 z-50 bg-background border-b border-border">
          <div className="px-6 py-4">
            <Skeleton className="h-8 w-56 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="flex-1 p-6 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-52" />
            <Skeleton className="h-10 w-40" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-64" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-w-0">
      <div className="flex-1 p-6 space-y-6">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Select
            value={typeFilter}
            onValueChange={(val) => setTypeFilter(val as AlertType | "all")}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Alert type" />
            </SelectTrigger>
            <SelectContent>
              {ALERT_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Button
              variant={readFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setReadFilter("all")}
            >
              All
            </Button>
            <Button
              variant={readFilter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setReadFilter("unread")}
            >
              Unread
            </Button>
            <Button
              variant={readFilter === "read" ? "default" : "outline"}
              size="sm"
              onClick={() => setReadFilter("read")}
            >
              Read
            </Button>
          </div>
        </div>

        {/* Alert cards */}
        <div className="space-y-3">
          {filtered.map((alert) => (
            <Card
              key={alert.id}
              className={
                !alert.isRead
                  ? "border-l-4 border-l-blue-500"
                  : ""
              }
            >
              <CardContent className="p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className={ALERT_TYPE_COLORS[alert.type]}>
                      {formatAlertTypeLabel(alert.type)}
                    </Badge>
                    {!alert.isRead && (
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {alert.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(alert.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Bell className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">No alerts match the current filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
