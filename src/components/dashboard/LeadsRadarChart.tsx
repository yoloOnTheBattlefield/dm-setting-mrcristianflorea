import { useState, useMemo } from "react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface RadarDataPoint {
  month: string;
  leads: number;
  link_sent: number;
  booked: number;
  ghosted: number;
  follow_up: number;
}

type MetricKey = keyof Omit<RadarDataPoint, "month">;

const metricOptions: { value: MetricKey; label: string; color: string }[] = [
  { value: "leads", label: "Total Leads", color: "hsl(var(--stage-created))" },
  { value: "link_sent", label: "Link Sent", color: "hsl(var(--stage-link-sent))" },
  { value: "booked", label: "Booked", color: "hsl(var(--stage-booked))" },
  { value: "ghosted", label: "Ghosted", color: "hsl(var(--stage-ghosted))" },
  { value: "follow_up", label: "Follow Up", color: "hsl(var(--stage-fup))" },
];

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatLabel(raw: string): string {
  // Monthly: "2026-01" → "Jan 2026"
  if (/^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split("-");
    return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
  }
  // Daily or weekly: "2026-01-26" → "Jan 26"
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [, m, d] = raw.split("-");
    return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;
  }
  return raw;
}

function getConfig(a: MetricKey, b: MetricKey): ChartConfig {
  const optA = metricOptions.find((o) => o.value === a)!;
  const optB = metricOptions.find((o) => o.value === b)!;
  return {
    [a]: { label: optA.label, color: optA.color },
    [b]: { label: optB.label, color: optB.color },
  };
}

interface LeadsRadarChartProps {
  data: RadarDataPoint[];
}

export function LeadsRadarChart({ data }: LeadsRadarChartProps) {
  const [metricA, setMetricA] = useState<MetricKey>("leads");
  const [metricB, setMetricB] = useState<MetricKey>("link_sent");

  const config = getConfig(metricA, metricB);
  const colorA = metricOptions.find((o) => o.value === metricA)!.color;
  const colorB = metricOptions.find((o) => o.value === metricB)!.color;

  // Format labels and skip every other if too many
  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      label: formatLabel(d.month),
    }));
  }, [data]);

  const skipLabels = chartData.length > 12;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="items-center pb-4">
        <CardTitle>Leads Comparison</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={metricA} onValueChange={(v) => setMetricA(v as MetricKey)}>
            <SelectTrigger className="h-7 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {metricOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">vs</span>
          <Select value={metricB} onValueChange={(v) => setMetricB(v as MetricKey)}>
            <SelectTrigger className="h-7 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {metricOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-2 flex-1 flex flex-col">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center flex-1 text-muted-foreground text-sm">
            No data available
          </div>
        ) : (
          <ChartContainer
            config={config}
            className="mx-auto w-full flex-1"
          >
            <RadarChart
              data={chartData}
              outerRadius="65%"
              cx="50%"
              cy="50%"
            >
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <PolarAngleAxis
                dataKey="label"
                tick={({ x, y, payload, index }) => {
                  if (skipLabels && index % 2 !== 0) return null;
                  return (
                    <text
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="fill-muted-foreground"
                      fontSize={11}
                    >
                      {payload.value}
                    </text>
                  );
                }}
              />
              <PolarGrid radialLines={false} />
              <Radar
                dataKey={metricA}
                fill={colorA}
                fillOpacity={0}
                stroke={colorA}
                strokeWidth={2}
              />
              <Radar
                dataKey={metricB}
                fill={colorB}
                fillOpacity={0}
                stroke={colorB}
                strokeWidth={2}
              />
            </RadarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
