import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ClientHealth } from "@/lib/advisory-types";

const healthConfig: Record<ClientHealth, { label: string; dotClass: string; badgeClass: string }> = {
  green: {
    label: "Healthy",
    dotClass: "bg-green-500",
    badgeClass: "border-green-500/30 bg-green-500/10 text-green-400",
  },
  amber: {
    label: "At Risk",
    dotClass: "bg-amber-500",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
  red: {
    label: "Needs Attention",
    dotClass: "bg-red-500",
    badgeClass: "border-red-500/30 bg-red-500/10 text-red-400",
  },
};

interface ClientHealthBadgeProps {
  health: ClientHealth;
  className?: string;
}

export default function ClientHealthBadge({ health, className }: ClientHealthBadgeProps) {
  const config = healthConfig[health];
  return (
    <Badge variant="outline" className={cn(config.badgeClass, className)}>
      <span className={cn("mr-1.5 h-2 w-2 rounded-full", config.dotClass)} />
      {config.label}
    </Badge>
  );
}
