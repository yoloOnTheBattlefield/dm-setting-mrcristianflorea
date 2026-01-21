import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "created" | "qualified" | "booked" | "ghosted" | "fup";
  className?: string;
}

const variantStyles = {
  default: "border-border",
  created: "border-l-4 border-l-stage-created",
  qualified: "border-l-4 border-l-stage-qualified",
  booked: "border-l-4 border-l-stage-booked",
  ghosted: "border-l-4 border-l-stage-ghosted",
  fup: "border-l-4 border-l-stage-fup",
};

export function StatCard({
  label,
  value,
  subValue,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 shadow-sm",
        variantStyles[variant],
        className
      )}
    >
      <p className="stat-label mb-1">{label}</p>
      <p className="stat-value">{value}</p>
      {subValue && (
        <p
          className={cn(
            "mt-1 text-sm",
            trend === "up" && "text-stage-booked",
            trend === "down" && "text-stage-ghosted",
            trend === "neutral" && "text-muted-foreground"
          )}
        >
          {subValue}
        </p>
      )}
    </div>
  );
}
