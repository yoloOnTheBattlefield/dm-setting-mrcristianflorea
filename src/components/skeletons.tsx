import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Shimmer block with optional staggered animation delay */
export function Shimmer({
  className,
  delay,
  style,
}: {
  className?: string;
  delay?: string;
  style?: React.CSSProperties;
}) {
  return (
    <Skeleton
      shimmer
      className={className}
      style={{ animationDelay: delay, ...style }}
    />
  );
}

// ─── Table Skeleton ───

export function TableSkeleton({
  rows = 5,
  cols = 4,
  colWidths,
}: {
  rows?: number;
  cols?: number;
  colWidths?: string[];
}) {
  const widths = colWidths ?? Array.from({ length: cols }, (_, i) =>
    i === 0 ? "w-32" : i === cols - 1 ? "w-16" : "w-24"
  );

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 border-b">
        {widths.map((w, i) => (
          <Shimmer key={i} className={`h-3 ${w}`} delay={`${i * 40}ms`} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-4 px-4 py-3 border-b border-border/50">
          {widths.map((w, i) => (
            <Shimmer
              key={i}
              className={`h-4 ${w}`}
              delay={`${(row * cols + i) * 25}ms`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Stat Cards Skeleton ───

export function StatCardsSkeleton({
  count = 4,
  baseDelay = 0,
}: {
  count?: number;
  baseDelay?: number;
}) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-${Math.min(count, 5)} gap-3`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="py-4 px-4 flex flex-col items-center gap-2">
            <Shimmer
              className="h-5 w-5 rounded-full"
              delay={`${baseDelay + i * 80}ms`}
            />
            <Shimmer
              className="h-7 w-12"
              delay={`${baseDelay + i * 80 + 30}ms`}
            />
            <Shimmer
              className="h-3 w-16"
              delay={`${baseDelay + i * 80 + 60}ms`}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Stats Bar Skeleton (horizontal inline stats) ───

export function StatsBarSkeleton({
  count = 6,
  baseDelay = 0,
}: {
  count?: number;
  baseDelay?: number;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex gap-6 flex-wrap">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Shimmer className="h-3 w-14" delay={`${baseDelay + i * 60}ms`} />
            <Shimmer className="h-6 w-10" delay={`${baseDelay + i * 60 + 20}ms`} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Form Card Skeleton ───

export function FormCardSkeleton({
  fields = 3,
  titleWidth = "w-32",
  delay = "0ms",
}: {
  fields?: number;
  titleWidth?: string;
  delay?: string;
}) {
  const baseDelay = parseInt(delay);
  return (
    <Card>
      <CardHeader className="pb-3">
        <Shimmer className={`h-5 ${titleWidth}`} delay={delay} />
        <Shimmer className="h-3 w-48 mt-1" delay={`${baseDelay + 30}ms`} />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Shimmer
              className="h-3 w-20"
              delay={`${baseDelay + 60 + i * 50}ms`}
            />
            <Shimmer
              className="h-9 w-full rounded-md"
              delay={`${baseDelay + 80 + i * 50}ms`}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Chart Card Skeleton ───

export function ChartCardSkeleton({
  titleWidth = "w-32",
  height = 200,
  barCount = 10,
  delay = "0ms",
  type = "bar",
}: {
  titleWidth?: string;
  height?: number;
  barCount?: number;
  delay?: string;
  type?: "bar" | "pie";
}) {
  const baseDelay = parseInt(delay);
  return (
    <Card className="overflow-hidden">
      <CardContent className="py-4 px-5">
        <Shimmer className={`h-4 ${titleWidth} mb-4`} delay={delay} />
        {type === "pie" ? (
          <div
            className="flex items-center justify-center"
            style={{ height }}
          >
            <Shimmer
              className="h-36 w-36 rounded-full"
              delay={`${baseDelay + 50}ms`}
            />
          </div>
        ) : (
          <div
            className="flex items-end gap-1.5 pt-4"
            style={{ height }}
          >
            {Array.from({ length: barCount }).map((_, i) => {
              const h = 25 + Math.sin(i * 0.8) * 20 + ((i * 37) % 30);
              return (
                <Shimmer
                  key={i}
                  className="flex-1 rounded-t-sm min-w-0"
                  delay={`${baseDelay + 50 + i * 30}ms`}
                  style={{ height: `${h}%` }}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Kanban Column Skeleton ───

export function KanbanColumnSkeleton({
  cards = 2,
  delay = "0ms",
}: {
  cards?: number;
  delay?: string;
}) {
  const baseDelay = parseInt(delay);
  return (
    <div className="flex flex-col w-[300px] min-w-[300px] rounded-lg border bg-muted/30">
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50">
        <Shimmer className="h-2 w-2 rounded-full" delay={delay} />
        <Shimmer className="h-3 w-20" delay={delay} />
        <Shimmer className="h-4 w-6 rounded-full ml-auto" delay={delay} />
      </div>
      {/* Cards */}
      <div className="p-1.5 space-y-1.5">
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="rounded-md border bg-background p-2.5 space-y-2"
          >
            {/* Avatar + name row */}
            <div className="flex items-center gap-2">
              <Shimmer
                className="h-7 w-7 rounded-full"
                delay={`${baseDelay + i * 120}ms`}
              />
              <div className="flex-1 space-y-1">
                <Shimmer
                  className="h-3 w-20"
                  delay={`${baseDelay + i * 120 + 30}ms`}
                />
                <Shimmer
                  className="h-2 w-16"
                  delay={`${baseDelay + i * 120 + 50}ms`}
                />
              </div>
              <Shimmer
                className="h-6 w-14 rounded-md"
                delay={`${baseDelay + i * 120 + 70}ms`}
              />
            </div>
            {/* Activity row */}
            <div className="flex items-center gap-2">
              <Shimmer
                className="h-2.5 w-24"
                delay={`${baseDelay + i * 120 + 90}ms`}
              />
              <Shimmer
                className="h-2.5 w-12 ml-auto"
                delay={`${baseDelay + i * 120 + 100}ms`}
              />
            </div>
            {/* Actions row */}
            <div className="flex items-center gap-1 pt-1 border-t border-border/30">
              {[0, 1, 2].map((j) => (
                <Shimmer
                  key={j}
                  className="h-5 w-8 rounded"
                  delay={`${baseDelay + i * 120 + 110 + j * 20}ms`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Detail Page Skeleton ───

export function DetailPageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Shimmer className="h-9 w-9 rounded-md" />
        <div className="space-y-2">
          <Shimmer className="h-7 w-48" />
          <Shimmer className="h-4 w-64" />
        </div>
      </div>

      {/* Info card */}
      <FormCardSkeleton fields={3} titleWidth="w-40" delay="100ms" />

      {/* Second card */}
      <FormCardSkeleton fields={1} titleWidth="w-44" delay="250ms" />

      {/* Table card */}
      <Card>
        <CardHeader className="pb-3">
          <Shimmer className="h-5 w-32" delay="400ms" />
          <Shimmer className="h-3 w-56 mt-1" delay="430ms" />
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={3} cols={5} />
        </CardContent>
      </Card>
    </div>
  );
}
