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
import { SourceFilter } from "@/lib/types";

export interface RadarDataPoint {
  month: string;
  leads: number;
  link_sent: number;
  booked: number;
  ghosted: number;
  follow_up: number;
  ob_messaged: number;
  ob_replied: number;
  ob_booked: number;
}

type MetricKey = keyof Omit<RadarDataPoint, "month">;

interface MetricOption {
  value: MetricKey;
  label: string;
  color: string;
  source: "inbound" | "outbound";
}

const metricOptions: MetricOption[] = [
  { value: "leads", label: "Total Leads", color: "hsl(var(--stage-created))", source: "inbound" },
  { value: "link_sent", label: "Link Sent", color: "hsl(var(--stage-link-sent))", source: "inbound" },
  { value: "booked", label: "Booked", color: "hsl(var(--stage-booked))", source: "inbound" },
  { value: "ghosted", label: "Ghosted", color: "hsl(var(--stage-ghosted))", source: "inbound" },
  { value: "follow_up", label: "Follow Up", color: "hsl(var(--stage-fup))", source: "inbound" },
  { value: "ob_messaged", label: "OB Messaged", color: "hsl(260 60% 55%)", source: "outbound" },
  { value: "ob_replied", label: "OB Replied", color: "hsl(45 90% 55%)", source: "outbound" },
  { value: "ob_booked", label: "OB Booked", color: "hsl(150 60% 45%)", source: "outbound" },
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
  source?: SourceFilter;
}

function getDefaultMetrics(source: SourceFilter): [MetricKey, MetricKey] {
  if (source === "outbound") return ["ob_messaged", "ob_replied"];
  return ["leads", "link_sent"];
}

export function LeadsRadarChart({ data, source = "all" }: LeadsRadarChartProps) {
  const [defaults] = useState(() => getDefaultMetrics(source));
  const [metricA, setMetricA] = useState<MetricKey>(defaults[0]);
  const [metricB, setMetricB] = useState<MetricKey>(defaults[1]);

  // Filter available options based on source
  const availableOptions = useMemo(() => {
    if (source === "inbound") return metricOptions.filter((o) => o.source === "inbound");
    if (source === "outbound") return metricOptions.filter((o) => o.source === "outbound");
    return metricOptions; // all
  }, [source]);

  // Reset selections when source changes and current selections are no longer valid
  useMemo(() => {
    const validKeys = new Set(availableOptions.map((o) => o.value));
    if (!validKeys.has(metricA)) {
      const [a, b] = getDefaultMetrics(source);
      setMetricA(a);
      setMetricB(b);
    } else if (!validKeys.has(metricB)) {
      const [, b] = getDefaultMetrics(source);
      setMetricB(b);
    }
  }, [source, availableOptions]);

  const config = getConfig(metricA, metricB);
  const colorA = metricOptions.find((o) => o.value === metricA)!.color;
  const colorB = metricOptions.find((o) => o.value === metricB)!.color;

  // Cap to last 12 entries max for radar readability, then format labels
  const chartData = useMemo(() => {
    const capped = data.length > 12 ? data.slice(-12) : data;
    return capped.map((d) => ({
      ...d,
      label: formatLabel(d.month),
    }));
  }, [data]);

  const skipLabels = chartData.length > 12;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="items-center pb-3 sm:pb-4 px-3 sm:px-6">
        <CardTitle className="text-base sm:text-lg">Leads Comparison</CardTitle>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Select value={metricA} onValueChange={(v) => setMetricA(v as MetricKey)}>
            <SelectTrigger className="h-7 w-[100px] sm:w-[130px] text-[10px] sm:text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-[10px] sm:text-xs text-muted-foreground">vs</span>
          <Select value={metricB} onValueChange={(v) => setMetricB(v as MetricKey)}>
            <SelectTrigger className="h-7 w-[100px] sm:w-[130px] text-[10px] sm:text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableOptions.map((opt) => (
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
