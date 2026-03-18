import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Users,
  Brain,
  TrendingUp,
  Video,
  Settings,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import type { ConstraintType } from "@/lib/advisory-types";

const constraintConfig: Record<ConstraintType, { label: string; Icon: LucideIcon }> = {
  delegation: { label: "Delegation", Icon: Users },
  psychological: { label: "Psychological", Icon: Brain },
  conversion: { label: "Conversion", Icon: TrendingUp },
  content: { label: "Content", Icon: Video },
  systems: { label: "Systems", Icon: Settings },
  ads: { label: "Ads", Icon: Megaphone },
};

interface ConstraintBadgeProps {
  constraint: ConstraintType;
  className?: string;
}

export default function ConstraintBadge({ constraint, className }: ConstraintBadgeProps) {
  const config = constraintConfig[constraint];
  const { Icon } = config;
  return (
    <Badge variant="outline" className={cn("gap-1", className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
