import { useState, useCallback, useRef, useEffect } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { useSeedNetwork, type GraphNode } from "@/hooks/useSeedNetwork";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Network } from "lucide-react";

function getNodeColor(node: GraphNode): string {
  if (node.type === "seed") return "#a78bfa"; // violet
  const lead = node as Extract<GraphNode, { type: "lead" }>;
  if (lead.qualified === true) return "#4ade80"; // green
  if (lead.unqualified_reason === "ai_rejected") return "#f87171"; // red
  if (lead.unqualified_reason === "low_followers") return "#facc15"; // yellow
  return "#71717a"; // zinc (unprocessed)
}

function getNodeSize(node: GraphNode): number {
  if (node.type === "seed") {
    const seed = node as Extract<GraphNode, { type: "seed" }>;
    return Math.max(6, Math.min(20, 6 + Math.sqrt(seed.leadCount) * 1.5));
  }
  const lead = node as Extract<GraphNode, { type: "lead" }>;
  if (lead.seedCount > 1) return 4; // cross-connected leads slightly bigger
  return 2.5;
}

export default function SeedNetwork() {
  const [qualifiedFilter, setQualifiedFilter] = useState("all");
  const [graphLimit, setGraphLimit] = useState(2000);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const { data, isLoading, isError } = useSeedNetwork({
    qualified: qualifiedFilter === "all" ? undefined : qualifiedFilter,
    limit: graphLimit,
  });

  // Resize observer for responsive graph
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height: Math.max(500, height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D) => {
      const size = getNodeSize(node);
      const color = getNodeColor(node);

      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      if (node.type === "seed") {
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = `bold ${Math.max(3, size * 0.6)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillText(`@${node.label}`, node.x, node.y + size + 5);
      }
    },
    [],
  );

  const nodePointerAreaPaint = useCallback(
    (node: any, color: string, ctx: CanvasRenderingContext2D) => {
      const size = getNodeSize(node);
      ctx.beginPath();
      ctx.arc(node.x, node.y, Math.max(size, 5), 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    },
    [],
  );

  const stats = data?.stats;

  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-16 z-50 bg-background border-b border-border">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Network className="h-5 w-5 text-violet-400" />
            <h1 className="text-lg font-semibold">Seed Network</h1>
            {stats && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{stats.totalSeeds} seeds</Badge>
                <Badge variant="secondary" className="text-xs">{stats.totalLeads} leads</Badge>
                <Badge variant="secondary" className="text-xs">{stats.crossConnected} cross-connected</Badge>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Filter</Label>
              <Select value={qualifiedFilter} onValueChange={setQualifiedFilter}>
                <SelectTrigger className="w-36 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leads</SelectItem>
                  <SelectItem value="true">Qualified</SelectItem>
                  <SelectItem value="false">Unqualified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Limit</Label>
              <Select value={String(graphLimit)} onValueChange={(v) => setGraphLimit(Number(v))}>
                <SelectTrigger className="w-28 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="500">500</SelectItem>
                  <SelectItem value="1000">1,000</SelectItem>
                  <SelectItem value="2000">2,000</SelectItem>
                  <SelectItem value="3000">3,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-2 flex items-center gap-4 text-xs text-muted-foreground border-b">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-violet-400" />
          Seed Account
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400" />
          Qualified
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400" />
          AI Rejected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-400" />
          Low Followers
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-zinc-500" />
          Unprocessed
        </span>
      </div>

      <div ref={containerRef} className="flex-1 bg-zinc-950 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="h-8 w-48" />
          </div>
        ) : isError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">Failed to load network data</p>
          </div>
        ) : data && data.nodes.length > 0 ? (
          <ForceGraph2D
            width={dimensions.width}
            height={dimensions.height}
            graphData={data}
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={nodePointerAreaPaint}
            linkColor={() => "rgba(255,255,255,0.06)"}
            linkWidth={0.5}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            warmupTicks={100}
            cooldownTime={3000}
            nodeLabel={(node: any) => {
              if (node.type === "seed") return `@${node.label} (${node.leadCount} leads)`;
              const fCount = node.followersCount?.toLocaleString() || "0";
              const status = node.qualified === true ? "Qualified" : node.unqualified_reason || "Pending";
              return `@${node.label} | ${fCount} followers | ${status}`;
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Network className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No leads with source seeds found</p>
          </div>
        )}
      </div>
    </div>
  );
}
