import { useState } from "react";
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

  return (
    <Card>
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
      <CardContent className="pb-0">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
            No data available
          </div>
        ) : (
          <ChartContainer
            config={config}
            className="mx-auto aspect-square max-h-[250px]"
          >
            <RadarChart data={data}>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <PolarAngleAxis dataKey="month" />
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
