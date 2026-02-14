import { useState } from "react";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FunnelStage {
  label: string;
  value: number;
  color: string;
}

interface FunnelAreaChartProps {
  stages: FunnelStage[];
}

type ScalingMode = "linear" | "sqrt" | "log";

export function FunnelAreaChart({ stages }: FunnelAreaChartProps) {
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);
  const [scalingMode, setScalingMode] = useState<ScalingMode>("sqrt");

  // SVG dimensions
  const svgWidth = 1000;
  const svgHeight = 400;
  const padding = { top: 40, right: 40, bottom: 80, left: 40 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Calculate stage width (equal horizontal spacing)
  const stageWidth = chartWidth / stages.length;

  // Find max value for scaling
  const maxValue = Math.max(...stages.map((s) => s.value));

  // Vertical center of the chart
  const centerY = padding.top + chartHeight / 2;

  // Minimum height for non-zero values (5% of chart height)
  const minHeightPercent = 0.05;
  const minHeight = chartHeight * minHeightPercent;

  // Scaling functions
  const scaleValue = (value: number, mode: ScalingMode): number => {
    if (value === 0) return 0;

    switch (mode) {
      case "linear":
        return value;
      case "sqrt":
        return Math.sqrt(value);
      case "log":
        return Math.log10(value + 1);
      default:
        return value;
    }
  };

  // Calculate height for each stage value with scaling
  const getStageHeight = (value: number) => {
    // Zero values get zero height (collapsed line)
    if (value === 0) return 0;

    const scaledValue = scaleValue(value, scalingMode);
    const scaledMax = scaleValue(maxValue, scalingMode);

    const height = (scaledValue / scaledMax) * chartHeight;

    // Ensure minimum height for visibility (only for non-zero values)
    return Math.max(height, minHeight);
  };

  // Generate trapezoid coordinates for each stage
  const getTrapezoidPath = (index: number) => {
    const stage = stages[index];
    const leftX = padding.left + index * stageWidth;
    const rightX = padding.left + (index + 1) * stageWidth;

    // Get heights for current and next stage (or use current for last stage)
    const currentHeight = getStageHeight(stage.value);
    const nextStage = stages[index + 1];
    const nextHeight = nextStage ? getStageHeight(nextStage.value) : currentHeight;

    // Calculate Y coordinates
    const leftTopY = centerY - currentHeight / 2;
    const leftBottomY = centerY + currentHeight / 2;
    const rightTopY = centerY - nextHeight / 2;
    const rightBottomY = centerY + nextHeight / 2;

    // Create trapezoid path (clockwise from top-left)
    return `
      M ${leftX},${leftTopY}
      L ${rightX},${rightTopY}
      L ${rightX},${rightBottomY}
      L ${leftX},${leftBottomY}
      Z
    `;
  };

  return (
    <CardContent className="p-3 sm:p-6">
      <div className="relative w-full">
        {/* Scaling mode toggle */}
        <div className="flex justify-end gap-1 mb-2 sm:absolute sm:top-0 sm:right-0 sm:mb-0 z-20">
          <Button
            variant={scalingMode === "linear" ? "default" : "outline"}
            size="sm"
            onClick={() => setScalingMode("linear")}
            className="h-6 text-[10px] px-2 sm:h-7 sm:text-xs sm:px-3"
          >
            Linear
          </Button>
          <Button
            variant={scalingMode === "sqrt" ? "default" : "outline"}
            size="sm"
            onClick={() => setScalingMode("sqrt")}
            className="h-6 text-[10px] px-2 sm:h-7 sm:text-xs sm:px-3"
          >
            Balanced
          </Button>
          <Button
            variant={scalingMode === "log" ? "default" : "outline"}
            size="sm"
            onClick={() => setScalingMode("log")}
            className="h-6 text-[10px] px-2 sm:h-7 sm:text-xs sm:px-3"
          >
            Readable
          </Button>
        </div>

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
          style={{ maxHeight: "450px" }}
        >
          <defs>
            <style>
              {`
                @keyframes fadeInStage {
                  from {
                    opacity: 0;
                    transform: translateY(10px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }

                @keyframes fadeIn {
                  from {
                    opacity: 0;
                  }
                  to {
                    opacity: 1;
                  }
                }

                .stage-trapezoid {
                  transition: opacity 0.3s ease, filter 0.2s ease;
                }
              `}
            </style>
          </defs>

          {/* Render each stage as a trapezoid */}
          <g>
            {stages.map((stage, index) => {
              const isZero = stage.value === 0;

              return (
                <g key={`stage-${index}`}>
                  {/* Trapezoid shape */}
                  <path
                    d={getTrapezoidPath(index)}
                    fill={isZero ? "none" : stage.color}
                    className="stage-trapezoid cursor-pointer"
                    style={{
                      opacity: isZero
                        ? 0
                        : hoveredStage === null || hoveredStage === index
                        ? 0.9
                        : 0.4,
                      animation: `fadeInStage 0.7s ease-out ${index * 0.12}s both`,
                      filter:
                        hoveredStage === index
                          ? "brightness(1.15) drop-shadow(0 4px 8px rgba(0,0,0,0.2))"
                          : "none",
                    }}
                    onMouseEnter={() => setHoveredStage(index)}
                    onMouseLeave={() => setHoveredStage(null)}
                  />

                  {/* Border around trapezoid */}
                  <path
                    d={getTrapezoidPath(index)}
                    fill="none"
                    stroke={isZero ? "rgba(0, 0, 0, 0.3)" : "black"}
                    strokeWidth={isZero ? "1" : "2"}
                    strokeLinejoin="miter"
                    strokeDasharray={isZero ? "4 2" : "none"}
                    className="pointer-events-none"
                    style={{
                      animation: `fadeIn 0.6s ease-out ${index * 0.1 + 0.5}s both`,
                    }}
                  />
                </g>
              );
            })}
          </g>

          {/* Labels and values below each stage */}
          {stages.map((stage, index) => {
            const centerX = padding.left + (index + 0.5) * stageWidth;
            const labelY = svgHeight - padding.bottom + 30;
            const valueY = svgHeight - padding.bottom + 55;
            const isZero = stage.value === 0;

            return (
              <g key={`label-${index}`} className="pointer-events-none">
                <text
                  x={centerX}
                  y={labelY}
                  textAnchor="middle"
                  className={`text-sm font-semibold ${
                    isZero ? "fill-muted-foreground opacity-50" : "fill-muted-foreground"
                  }`}
                  style={{
                    animation: `fadeIn 0.6s ease-out ${index * 0.1 + 1}s both`,
                  }}
                >
                  {stage.label}
                </text>
                <text
                  x={centerX}
                  y={valueY}
                  textAnchor="middle"
                  className={`text-xl font-bold ${
                    isZero ? "fill-muted-foreground opacity-50" : "fill-foreground"
                  }`}
                  style={{
                    animation: `fadeIn 0.6s ease-out ${index * 0.1 + 1.1}s both`,
                  }}
                >
                  {stage.value.toLocaleString()}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hoveredStage !== null && (() => {
          const currentStage = stages[hoveredStage];
          const totalContacts = stages[0].value;
          const percentOfTotal = (currentStage.value / totalContacts) * 100;

          const previousStage = hoveredStage > 0 ? stages[hoveredStage - 1] : null;
          const percentFromPrevious = previousStage && previousStage.value > 0
            ? (currentStage.value / previousStage.value) * 100
            : null;

          return (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-3 py-2 sm:px-5 sm:py-3 rounded-lg shadow-2xl border-2 animate-in fade-in-0 zoom-in-95 duration-200 z-10 max-w-[90%]">
              <p
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: currentStage.color }}
              >
                {currentStage.label}
              </p>
              <p className="text-2xl sm:text-3xl font-bold mt-1">
                {currentStage.value.toLocaleString()}
              </p>
              <div className="mt-2 pt-2 border-t border-border space-y-1">
                <p className="text-xs text-muted-foreground">
                  of total contacts: <span className="font-semibold">{percentOfTotal.toFixed(2)}%</span>
                </p>
                {previousStage && (
                  <p className="text-xs text-muted-foreground">
                    from previous stage: <span className="font-semibold">
                      {percentFromPrevious !== null ? `${percentFromPrevious.toFixed(2)}%` : 'N/A'}
                    </span>
                  </p>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </CardContent>
  );
}
