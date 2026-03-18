import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function ShimmerBlock({
  className,
  delay = "0ms",
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

function StatCardSkeleton({ delay }: { delay: string }) {
  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg border bg-card/50">
      <ShimmerBlock className="h-3 w-16" delay={delay} />
      <ShimmerBlock className="h-7 w-12" delay={delay} />
      <ShimmerBlock className="h-3 w-20" delay={delay} />
    </div>
  );
}

/** Renders fake chart bars with varying heights */
function BarsSkeleton({
  bars,
  baseDelay,
}: {
  bars: number[];
  baseDelay: number;
}) {
  return (
    <>
      {bars.map((h, i) => (
        <ShimmerBlock
          key={i}
          className="flex-1 rounded-t-sm min-w-0"
          delay={`${baseDelay + i * 40}ms`}
          style={{ height: `${h}%` }}
        />
      ))}
    </>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Funnel Overview — 5 stat cards */}
      <Card>
        <CardHeader className="pb-3">
          <ShimmerBlock className="h-5 w-36" delay="0ms" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
            {[0, 80, 160, 240, 320].map((d, i) => (
              <StatCardSkeleton key={i} delay={`${d}ms`} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Row 2: Three chart cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Velocity chart */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <ShimmerBlock className="h-5 w-28" delay="100ms" />
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-end gap-2 pt-4">
              <BarsSkeleton
                bars={[65, 45, 80, 55, 70, 40, 60]}
                baseDelay={100}
              />
            </div>
          </CardContent>
        </Card>

        {/* Cumulative bookings chart */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <ShimmerBlock className="h-5 w-36" delay="200ms" />
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-end gap-2 pt-4">
              <BarsSkeleton
                bars={[20, 30, 35, 50, 55, 65, 75, 85]}
                baseDelay={200}
              />
            </div>
          </CardContent>
        </Card>

        {/* Radar chart — circular placeholder */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <ShimmerBlock className="h-5 w-24" delay="300ms" />
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center">
              <ShimmerBlock
                className="h-40 w-40 rounded-full"
                delay="300ms"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Full-width daily volume chart */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <ShimmerBlock className="h-5 w-32" delay="400ms" />
          <ShimmerBlock className="h-3 w-56 mt-1" delay="420ms" />
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-end gap-1 pt-4">
            <BarsSkeleton
              bars={[
                40, 55, 30, 70, 60, 45, 80, 35, 65, 50, 75, 42, 58, 68, 38,
                72, 48, 62, 52, 44,
              ]}
              baseDelay={440}
            />
          </div>
        </CardContent>
      </Card>

      {/* Row 4: Stage aging table */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <ShimmerBlock className="h-5 w-28" delay="500ms" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Table header */}
            <div className="flex gap-4">
              {["w-24", "w-16", "w-16", "w-20"].map((w, i) => (
                <ShimmerBlock
                  key={i}
                  className={`h-3 ${w}`}
                  delay={`${500 + i * 40}ms`}
                />
              ))}
            </div>
            {/* Table rows */}
            {[0, 1, 2, 3, 4].map((row) => (
              <div
                key={row}
                className="flex gap-4 py-2 border-t border-border/50"
              >
                {["w-24", "w-16", "w-16", "w-20"].map((w, i) => (
                  <ShimmerBlock
                    key={i}
                    className={`h-4 ${w}`}
                    delay={`${560 + row * 60 + i * 30}ms`}
                  />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
