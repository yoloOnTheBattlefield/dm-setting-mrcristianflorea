import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { OutboundFunnelData } from "@/hooks/useOutboundAnalytics";

interface FunnelDropoffProps {
  data: OutboundFunnelData;
}

interface FunnelStage {
  label: string;
  value: number;
  color: string;
  dropPct: number;
  dropAbs: number;
  isLargestDrop: boolean;
}

// Semantic colors: blue=volume, green=good, yellow=watch, red=critical
function getStageColor(index: number, isLargestDrop: boolean): string {
  if (isLargestDrop) return "hsl(0 70% 55%)"; // red for critical drop
  const colors = [
    "hsl(220 70% 55%)", // Messaged - blue (volume)
    "hsl(45 90% 55%)",  // Replied - yellow (watch)
    "hsl(150 60% 50%)", // Converted - green (good)
    "hsl(160 70% 45%)", // Closed - teal (good)
  ];
  return colors[index] || colors[0];
}

export function FunnelDropoff({ data }: FunnelDropoffProps) {
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);

  const stages = useMemo(() => {
    const raw = [
      { label: "Messaged", value: data.messaged ?? 0 },
      { label: "Replied", value: data.replied ?? 0 },
      { label: "Converted", value: data.booked ?? 0 },
      { label: "Closed", value: data.contracts ?? 0 },
    ];

    let largestDropIdx = -1;
    let largestDropPct = 0;

    const result: FunnelStage[] = raw.map((stage, i) => {
      if (i === 0) {
        return { ...stage, dropPct: 0, dropAbs: 0, isLargestDrop: false, color: "" };
      }
      const prev = raw[i - 1].value;
      const drop = prev > 0 ? ((prev - stage.value) / prev) * 100 : 0;
      const dropAbs = prev - stage.value;
      if (drop > largestDropPct && prev > 0) {
        largestDropPct = drop;
        largestDropIdx = i;
      }
      return { ...stage, dropPct: drop, dropAbs, isLargestDrop: false, color: "" };
    });

    if (largestDropIdx >= 0) {
      result[largestDropIdx].isLargestDrop = true;
    }

    // Assign colors
    result.forEach((s, i) => {
      s.color = getStageColor(i, s.isLargestDrop);
    });

    return result;
  }, [data]);

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 280;
  const padding = { top: 20, right: 30, bottom: 60, left: 30 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;
  const stageWidth = chartWidth / stages.length;
  const maxValue = Math.max(...stages.map((s) => s.value), 1);
  const centerY = padding.top + chartHeight / 2;
  const minHeight = chartHeight * 0.06;

  const getStageHeight = (value: number) => {
    if (value === 0) return 0;
    const height = (Math.sqrt(value) / Math.sqrt(maxValue)) * chartHeight;
    return Math.max(height, minHeight);
  };

  const getTrapezoidPath = (index: number) => {
    const currentHeight = getStageHeight(stages[index].value);
    const nextStage = stages[index + 1];
    const nextHeight = nextStage ? getStageHeight(nextStage.value) : currentHeight;

    const leftX = padding.left + index * stageWidth;
    const rightX = padding.left + (index + 1) * stageWidth;
    const leftTopY = centerY - currentHeight / 2;
    const leftBottomY = centerY + currentHeight / 2;
    const rightTopY = centerY - nextHeight / 2;
    const rightBottomY = centerY + nextHeight / 2;
    const cp = stageWidth * 0.35;

    return `
      M ${leftX},${leftTopY}
      C ${leftX + cp},${leftTopY} ${rightX - cp},${rightTopY} ${rightX},${rightTopY}
      L ${rightX},${rightBottomY}
      C ${rightX - cp},${rightBottomY} ${leftX + cp},${leftBottomY} ${leftX},${leftBottomY}
      Z
    `;
  };

  return (
    <Card>
      <CardContent className="py-4 px-5">
        <h3 className="text-sm font-medium mb-2">Funnel Drop-Off</h3>

        <div className="relative w-full">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto"
            preserveAspectRatio="xMidYMid meet"
            style={{ maxHeight: "320px" }}
          >
            <defs>
              <style>{`
                .funnel-stage { transition: opacity 0.3s ease, filter 0.2s ease; }
                @keyframes funnelFadeIn {
                  from { opacity: 0; transform: translateY(6px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>
            </defs>

            {/* Trapezoid stages */}
            {stages.map((stage, index) => {
              const isZero = stage.value === 0;
              return (
                <g key={`stage-${index}`}>
                  <path
                    d={getTrapezoidPath(index)}
                    fill={isZero ? "none" : stage.color}
                    className="funnel-stage cursor-pointer"
                    style={{
                      opacity: isZero
                        ? 0
                        : hoveredStage === null || hoveredStage === index
                        ? 0.85
                        : 0.35,
                      animation: `funnelFadeIn 0.5s ease-out ${index * 0.1}s both`,
                      filter:
                        hoveredStage === index
                          ? "brightness(1.15) drop-shadow(0 3px 6px rgba(0,0,0,0.2))"
                          : "none",
                    }}
                    onMouseEnter={() => setHoveredStage(index)}
                    onMouseLeave={() => setHoveredStage(null)}
                  />
                  <path
                    d={getTrapezoidPath(index)}
                    fill="none"
                    stroke={isZero ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.3)"}
                    strokeWidth={isZero ? "1" : "1.5"}
                    strokeDasharray={isZero ? "4 2" : "none"}
                    className="pointer-events-none"
                  />
                </g>
              );
            })}

            {/* Labels and values */}
            {stages.map((stage, index) => {
              const centerX = padding.left + (index + 0.5) * stageWidth;
              const labelY = svgHeight - padding.bottom + 25;
              const valueY = svgHeight - padding.bottom + 48;
              const isZero = stage.value === 0;

              return (
                <g key={`label-${index}`} className="pointer-events-none">
                  <text
                    x={centerX}
                    y={labelY}
                    textAnchor="middle"
                    className={cn(
                      "text-xs font-semibold",
                      isZero ? "fill-muted-foreground opacity-40" : "fill-muted-foreground"
                    )}
                    style={{ animation: `funnelFadeIn 0.4s ease-out ${index * 0.1 + 0.4}s both` }}
                  >
                    {stage.label}
                  </text>
                  <text
                    x={centerX}
                    y={valueY}
                    textAnchor="middle"
                    className={cn(
                      "text-base font-bold",
                      isZero ? "fill-muted-foreground opacity-40" : "fill-foreground"
                    )}
                    style={{ animation: `funnelFadeIn 0.4s ease-out ${index * 0.1 + 0.5}s both` }}
                  >
                    {stage.value.toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* Drop-off annotations between stages */}
            {stages.map((stage, index) => {
              if (index === 0 || stage.dropPct === 0) return null;
              const x = padding.left + index * stageWidth;
              const y = padding.top + 10;

              return (
                <text
                  key={`drop-${index}`}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  className={cn(
                    "text-[10px] font-medium",
                    stage.isLargestDrop ? "fill-red-400" : "fill-muted-foreground"
                  )}
                  style={{ animation: `funnelFadeIn 0.4s ease-out ${index * 0.1 + 0.6}s both` }}
                >
                  -{stage.dropPct.toFixed(0)}%
                </text>
              );
            })}
          </svg>

          {/* Hover tooltip */}
          {hoveredStage !== null && (() => {
            const stage = stages[hoveredStage];
            const total = stages[0].value;
            const pctOfTotal = total > 0 ? (stage.value / total) * 100 : 0;
            const prev = hoveredStage > 0 ? stages[hoveredStage - 1] : null;
            const pctFromPrev = prev && prev.value > 0 ? (stage.value / prev.value) * 100 : null;

            return (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-4 py-3 rounded-lg shadow-2xl border-2 animate-in fade-in-0 zoom-in-95 duration-200 z-10">
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: stage.color }}>
                  {stage.label}
                </p>
                <p className="text-2xl font-bold mt-1">{stage.value.toLocaleString()}</p>
                <div className="mt-2 pt-2 border-t border-border space-y-1">
                  <p className="text-xs text-muted-foreground">
                    of total: <span className="font-semibold">{pctOfTotal.toFixed(1)}%</span>
                  </p>
                  {pctFromPrev !== null && (
                    <p className="text-xs text-muted-foreground">
                      from previous: <span className="font-semibold">{pctFromPrev.toFixed(1)}%</span>
                    </p>
                  )}
                  {stage.isLargestDrop && (
                    <p className="text-xs text-red-400 font-medium mt-1">Largest drop-off</p>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}
