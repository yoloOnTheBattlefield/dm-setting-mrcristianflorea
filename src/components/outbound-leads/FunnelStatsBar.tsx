import React from "react";
import {
  ChevronRight,
  Users,
  Send,
  MessageCircle,
  CalendarCheck,
  DollarSign,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FunnelStats {
  total: number;
  messaged: number;
  replied: number;
  booked: number;
  contracts: number;
  contract_value: number;
}

interface FunnelStatsBarProps {
  funnelStats: FunnelStats;
}

function pct(num: number, denom: number): string {
  if (denom === 0) return "0%";
  return `${((num / denom) * 100).toFixed(1)}%`;
}

function FunnelCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="flex-1 min-w-0">
      <CardContent className="py-3 px-4 flex items-center gap-3">
        <div className="shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-lg font-bold leading-tight truncate">{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground truncate">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function FunnelArrow({ rate }: { rate: string }) {
  return (
    <div className="flex flex-col items-center shrink-0 gap-0.5">
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
      <span className="text-[10px] text-muted-foreground font-medium">{rate}</span>
    </div>
  );
}

export default function FunnelStatsBar({ funnelStats }: FunnelStatsBarProps) {
  return (
    <div className="hidden md:block px-6 pt-4">
      <div className="flex items-center gap-1.5 w-full">
        <FunnelCard
          label="Total"
          value={funnelStats.total}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <FunnelArrow rate={pct(funnelStats.messaged, funnelStats.total)} />
        <FunnelCard
          label="Messaged"
          value={funnelStats.messaged}
          sub={`${pct(funnelStats.messaged, funnelStats.total)} of total`}
          icon={<Send className="h-4 w-4 text-muted-foreground" />}
        />
        <FunnelArrow rate={pct(funnelStats.replied, funnelStats.messaged)} />
        <FunnelCard
          label="Replied"
          value={funnelStats.replied}
          sub={`${pct(funnelStats.replied, funnelStats.messaged)} reply rate`}
          icon={<MessageCircle className="h-4 w-4 text-muted-foreground" />}
        />
        <FunnelArrow rate={pct(funnelStats.booked, funnelStats.replied)} />
        <FunnelCard
          label="Converted"
          value={funnelStats.booked}
          sub={`${pct(funnelStats.booked, funnelStats.replied)} close rate`}
          icon={<CalendarCheck className="h-4 w-4 text-green-400" />}
        />
        <FunnelArrow rate={pct(funnelStats.contracts, funnelStats.booked)} />
        <FunnelCard
          label={`Revenue (${funnelStats.contracts} deal${funnelStats.contracts !== 1 ? "s" : ""})`}
          value={`$${funnelStats.contract_value.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4 text-green-400" />}
        />
      </div>
    </div>
  );
}
