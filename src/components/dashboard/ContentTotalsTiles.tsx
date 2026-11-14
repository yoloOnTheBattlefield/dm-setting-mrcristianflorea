import { Card, CardContent } from "@/components/ui/card";
import type { ContentTotals } from "@/hooks/useContentAnalytics";

interface ContentTotalsTilesProps {
  totals: ContentTotals;
  showLeads?: boolean;
}

export function ContentTotalsTiles({ totals, showLeads = false }: ContentTotalsTilesProps) {
  const tiles = [
    { label: "Posts", value: totals.posts },
    { label: "Views", value: totals.views },
    { label: "Reach", value: totals.reach ?? 0 },
    { label: "Likes", value: totals.likes },
    { label: "Comments", value: totals.comments },
    { label: "Shares", value: totals.shares },
    { label: "Saves", value: totals.saved ?? 0 },
    ...(showLeads ? [{ label: "Leads", value: totals.leads_generated }] : []),
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {tiles.map((tile) => (
        <Card key={tile.label}>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs">{tile.label}</p>
            <p className="text-2xl font-semibold tabular-nums">
              {(tile.value ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
