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

// ─── Lead Detail Page Skeleton ───

export function LeadDetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 animate-in fade-in duration-300">
      {/* Breadcrumb + prev/next nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shimmer className="h-4 w-10" />
          <Shimmer className="h-3 w-2" />
          <Shimmer className="h-4 w-24" />
        </div>
        <div className="flex items-center gap-1">
          <Shimmer className="h-7 w-7 rounded-md" />
          <Shimmer className="h-3 w-8" />
          <Shimmer className="h-7 w-7 rounded-md" />
        </div>
      </div>

      {/* Avatar + name block */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Shimmer className="h-14 w-14 rounded-full shrink-0" />
          <div className="space-y-1.5">
            <Shimmer className="h-6 w-40" />
            <div className="flex items-center gap-3">
              <Shimmer className="h-3.5 w-20" />
              <Shimmer className="h-3.5 w-16" />
              <Shimmer className="h-3.5 w-24" />
            </div>
          </div>
        </div>

        {/* Pipeline stepper — 5 pills */}
        <div className="flex items-center gap-0.5">
          {["w-12", "w-16", "w-16", "w-12", "w-12"].map((w, i) => (
            <Shimmer key={i} className={`h-7 ${w} rounded-full`} delay={`${i * 40}ms`} />
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {["w-24", "w-16", "w-20", "w-14"].map((w, i) => (
            <Shimmer key={i} className={`h-8 ${w} rounded-md`} delay={`${i * 30}ms`} />
          ))}
        </div>
      </div>

      {/* Separator */}
      <div className="h-px bg-border" />

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Left sidebar */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <Shimmer className="h-3 w-16" />
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Shimmer className="h-3 w-12" delay={`${i * 40}ms`} />
                  <Shimmer className="h-3 w-24" delay={`${i * 40 + 20}ms`} />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <Shimmer className="h-3 w-10" />
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="space-y-1">
                <Shimmer className="h-3 w-10" delay="80ms" />
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Shimmer key={i} className="h-5 w-5 rounded" delay={`${i * 30}ms`} />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Shimmer className="h-3 w-20" delay="120ms" />
                <Shimmer className="h-7 w-20 rounded-md" delay="140ms" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <Shimmer className="h-4 w-28" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50">
                  <Shimmer className="h-8 w-8 rounded-full shrink-0" delay={`${i * 60}ms`} />
                  <div className="flex-1 space-y-1.5">
                    <Shimmer className="h-3.5 w-48" delay={`${i * 60 + 20}ms`} />
                    <Shimmer className="h-3 w-32" delay={`${i * 60 + 40}ms`} />
                  </div>
                  <Shimmer className="h-3 w-12 shrink-0" delay={`${i * 60 + 50}ms`} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Client Detail Page Skeleton ───

export function ClientDetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 animate-in fade-in duration-300">
      {/* Back button + title */}
      <div className="flex items-center gap-4">
        <Shimmer className="h-9 w-9 rounded-md" />
        <div className="space-y-1.5">
          <Shimmer className="h-7 w-40" />
          <Shimmer className="h-4 w-52" />
        </div>
      </div>

      <div className="grid gap-4">
        {/* Client Info Card */}
        <Card>
          <CardHeader className="pb-3">
            <Shimmer className="h-5 w-36" />
            <Shimmer className="h-3 w-28 mt-1" delay="30ms" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i}>
                <Shimmer className="h-3 w-20 mb-1" delay={`${i * 40}ms`} />
                <Shimmer className="h-4 w-48" delay={`${i * 40 + 20}ms`} />
              </div>
            ))}
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center justify-between rounded-md border p-3">
                <div className="space-y-1">
                  <Shimmer className="h-3.5 w-24" delay={`${100 + i * 50}ms`} />
                  <Shimmer className="h-3 w-48" delay={`${120 + i * 50}ms`} />
                </div>
                <Shimmer className="h-5 w-9 rounded-full" delay={`${140 + i * 50}ms`} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* GHL Webhook Card */}
        <Card>
          <CardHeader className="pb-3">
            <Shimmer className="h-5 w-44" />
            <Shimmer className="h-3 w-64 mt-1" delay="30ms" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Shimmer className="h-4 w-40" delay="100ms" />
            <div className="space-y-2">
              <Shimmer className="h-3 w-24" delay="120ms" />
              <Shimmer className="h-9 w-full rounded-md" delay="140ms" />
            </div>
            <div className="flex justify-end">
              <Shimmer className="h-9 w-28 rounded-md" delay="160ms" />
            </div>
          </CardContent>
        </Card>

        {/* Team Members Card */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <Shimmer className="h-5 w-32" delay="200ms" />
              <Shimmer className="h-3 w-56 mt-1" delay="220ms" />
            </div>
            <div className="flex gap-2">
              <Shimmer className="h-8 w-28 rounded-md" delay="240ms" />
              <Shimmer className="h-8 w-24 rounded-md" delay="260ms" />
            </div>
          </CardHeader>
          <CardContent>
            <TableSkeleton
              rows={4}
              cols={5}
              colWidths={["w-32", "w-40", "w-16", "w-20", "w-16"]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
