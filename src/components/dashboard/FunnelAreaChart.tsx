import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface FunnelStage {
  label: string;
  value: number;
  color: string;
}

interface FunnelAreaChartProps {
  stages: FunnelStage[];
}

export function FunnelAreaChart({ stages }: FunnelAreaChartProps) {
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);

  // SVG dimensions
  const svgWidth = 1000;
  const svgHeight = 400;
  const padding = { top: 40, right: 40, bottom: 80, left: 40 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Calculate stage width (equal spacing)
  const stageWidth = chartWidth / stages.length;

  // Find max value for scaling
  const maxValue = Math.max(...stages.map((s) => s.value));

  // Vertical center of the chart
  const centerY = padding.top + chartHeight / 2;

  // Generate boundary points with both top and bottom Y coordinates
  interface BoundaryPoint {
    x: number;
    topY: number;
    bottomY: number;
  }

  const boundaryPoints: BoundaryPoint[] = [];

  // Create a point for each stage boundary (left and right edge of each stage)
  for (let i = 0; i <= stages.length; i++) {
    const x = padding.left + i * stageWidth;
    let value;

    if (i === 0) {
      // Left edge - use first stage value
      value = stages[0].value;
    } else if (i === stages.length) {
      // Right edge - use last stage value
      value = stages[stages.length - 1].value;
    } else {
      // Boundary between stages - use exact value transition (no smoothing if 0)
      const leftStageValue = stages[i - 1].value;
      const rightStageValue = stages[i].value;

      // If either stage is 0, don't smooth - use the exact boundary
      if (leftStageValue === 0 || rightStageValue === 0) {
        // Use the average but it will collapse to 0 if one side is 0
        value = (leftStageValue + rightStageValue) / 2;
      } else {
        // Normal case - average the two adjacent stage values
        value = (leftStageValue + rightStageValue) / 2;
      }
    }

    const height = value === 0 ? 0 : (value / maxValue) * chartHeight;

    boundaryPoints.push({
      x,
      topY: centerY - height / 2,
      bottomY: centerY + height / 2,
    });
  }

  // Create smooth curve through points using cubic bezier
  const createSmoothCurve = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return "";

    let path = `M ${points[0].x},${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];

      // Cubic bezier control points for smooth curve
      const controlPointDistance = (next.x - current.x) * 0.4;

      path += ` C ${current.x + controlPointDistance},${current.y} ${
        next.x - controlPointDistance
      },${next.y} ${next.x},${next.y}`;
    }

    return path;
  };

  // Create top curve (left to right)
  const topCurve = createSmoothCurve(
    boundaryPoints.map((p) => ({ x: p.x, y: p.topY })),
  );

  // Create bottom curve (left to right) then we'll reverse it manually
  const bottomPoints = boundaryPoints.map((p) => ({ x: p.x, y: p.bottomY }));

  // Manually construct reversed bottom curve (right to left)
  let bottomCurveReversed = "";
  if (bottomPoints.length >= 2) {
    // Start from the last point (we're already at top-right, now go to bottom-right)
    const lastPoint = bottomPoints[bottomPoints.length - 1];
    bottomCurveReversed = ` L ${lastPoint.x},${lastPoint.y}`;

    // Draw bezier curves back from right to left
    for (let i = bottomPoints.length - 1; i > 0; i--) {
      const current = bottomPoints[i];
      const prev = bottomPoints[i - 1];

      const controlPointDistance = (current.x - prev.x) * 0.4;

      bottomCurveReversed += ` C ${current.x - controlPointDistance},${current.y} ${
        prev.x + controlPointDistance
      },${prev.y} ${prev.x},${prev.y}`;
    }
  }

  // Complete funnel path (ONE continuous shape that caves in)
  const funnelPath = `
    ${topCurve}
    ${bottomCurveReversed}
    Z
  `;

  return (
    <CardContent className="p-6">
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
          style={{ maxHeight: "450px" }}
        >
          <defs>
            {/* Clip path for each stage segment */}
            {stages.map((_, index) => {
              const clipLeftX = padding.left + index * stageWidth;
              const clipWidth = stageWidth;

              return (
                <clipPath key={`clip-${index}`} id={`clip-stage-${index}`}>
                  <rect
                    x={clipLeftX}
                    y={0}
                    width={clipWidth}
                    height={svgHeight}
                  />
                </clipPath>
              );
            })}

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

                  @keyframes drawOutline {
                    from {
                      stroke-dasharray: 3000;
                      stroke-dashoffset: 3000;
                    }
                    to {
                      stroke-dasharray: 3000;
                      stroke-dashoffset: 0;
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

                  .stage-segment {
                    transition: opacity 0.3s ease, filter 0.2s ease;
                  }
                `}
            </style>
          </defs>

          {/* Render the funnel sliced into colored segments using clip paths */}
          <g>
            {stages.map((stage, index) => (
              <path
                key={`segment-${index}`}
                d={funnelPath}
                fill={stage.color}
                clipPath={`url(#clip-stage-${index})`}
                className="stage-segment cursor-pointer"
                style={{
                  opacity:
                    hoveredStage === null || hoveredStage === index ? 0.9 : 0.4,
                  animation: `fadeInStage 0.7s ease-out ${index * 0.12}s both`,
                  filter:
                    hoveredStage === index
                      ? "brightness(1.15) drop-shadow(0 4px 8px rgba(0,0,0,0.2))"
                      : "none",
                }}
                onMouseEnter={() => setHoveredStage(index)}
                onMouseLeave={() => setHoveredStage(null)}
              />
            ))}
          </g>

          {/* Thin vertical separator lines between stages */}
          {boundaryPoints.slice(1, -1).map((point, index) => (
            <line
              key={`separator-${index}`}
              x1={point.x}
              y1={point.topY}
              x2={point.x}
              y2={point.bottomY}
              stroke="rgba(0, 0, 0, 0.2)"
              strokeWidth="2"
              className="pointer-events-none"
              style={{
                animation: `fadeIn 0.5s ease-out ${index * 0.1 + 0.8}s both`,
              }}
            />
          ))}

          {/* Thick black outline around the entire funnel (drawn last, on top) */}
          <path
            d={funnelPath}
            fill="none"
            stroke="black"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none"
            style={{
              animation: "drawOutline 2s ease-out 0.3s both",
            }}
          />

          {/* Labels and values below each stage */}
          {stages.map((stage, index) => {
            const centerX = padding.left + (index + 0.5) * stageWidth;
            const labelY = svgHeight - padding.bottom + 30;
            const valueY = svgHeight - padding.bottom + 55;

            return (
              <g key={`label-${index}`} className="pointer-events-none">
                <text
                  x={centerX}
                  y={labelY}
                  textAnchor="middle"
                  className="text-sm font-semibold fill-muted-foreground"
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
                  className="text-xl font-bold fill-foreground"
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
        {hoveredStage !== null && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-5 py-3 rounded-lg shadow-2xl border-2 animate-in fade-in-0 zoom-in-95 duration-200 z-10">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {stages[hoveredStage].label}
            </p>
            <p className="text-3xl font-bold mt-1">
              {stages[hoveredStage].value.toLocaleString()}
            </p>
            {hoveredStage > 0 && (
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {stages[hoveredStage].value <
                  stages[hoveredStage - 1].value ? (
                    <>
                      <span className="text-red-500 font-semibold">
                        {(
                          ((stages[hoveredStage].value -
                            stages[hoveredStage - 1].value) /
                            stages[hoveredStage - 1].value) *
                          100
                        ).toFixed(1)}
                        %
                      </span>{" "}
                      from previous stage
                    </>
                  ) : (
                    <>
                      <span className="text-green-500 font-semibold">
                        +
                        {(
                          ((stages[hoveredStage].value -
                            stages[hoveredStage - 1].value) /
                            stages[hoveredStage - 1].value) *
                          100
                        ).toFixed(1)}
                        %
                      </span>{" "}
                      from previous stage
                    </>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Conversion:{" "}
                  <span className="font-semibold">
                    {(
                      (stages[hoveredStage].value / stages[0].value) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </CardContent>
  );
}
