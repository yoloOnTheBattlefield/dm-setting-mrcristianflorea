import { Skeleton } from "@/components/ui/skeleton";

function S({
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

/** Stat card matching real StatCard: left-colored border, label → big value → subvalue */
function StatCardSkeleton({ delay, accent = true }: { delay: string; accent?: boolean }) {
  const d = parseInt(delay);
  return (
    <div className={`rounded-lg border bg-card p-3 sm:p-4 shadow-sm${accent ? " border-l-4" : ""}`}>
      <S className="h-3 w-20 mb-2" delay={delay} />
      <S className="h-7 w-14" delay={`${d + 30}ms`} />
      <S className="h-3 w-24 mt-1.5" delay={`${d + 60}ms`} />
    </div>
  );
}

function Bars({ bars, baseDelay }: { bars: number[]; baseDelay: number }) {
  return (
    <>
      {bars.map((h, i) => (
        <S
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

      {/* ── Funnel Overview ── */}
      <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
        {/* Title */}
        <S className="h-5 w-36 mb-4" delay="0ms" />

        {/* Stat cards — 4 col (inbound default layout) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
          {[0, 80, 160, 240].map((d, i) => (
            <StatCardSkeleton key={i} delay={`${d}ms`} accent={i < 3} />
          ))}
        </div>

        {/* FunnelAreaChart — SVG area chart placeholder */}
        <div className="mt-6 relative h-[180px] sm:h-[220px]">
          {/* Fake area fills */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sk-g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--muted))" stopOpacity="0.6" />
                <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <path d="M0,80 C200,60 400,40 600,50 C800,60 900,55 1000,40 L1000,180 L0,180 Z" fill="url(#sk-g1)" />
          </svg>
          {/* Shimmer overlay strip */}
          <S className="absolute bottom-8 left-0 right-0 h-1 rounded-full opacity-40" delay="200ms" />
          {/* X-axis label ghosts */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <S key={i} className="h-2.5 w-8" delay={`${300 + i * 40}ms`} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Sales Performance ── */}
      <div className="space-y-4">
        <S className="h-5 w-36" delay="80ms" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-4 shadow-sm flex flex-col items-center">
              <S className="h-5 w-5 rounded-full mb-1.5" delay={`${90 + i * 30}ms`} />
              <S className="h-7 w-16 mb-1" delay={`${100 + i * 30}ms`} />
              <S className="h-3 w-20" delay={`${110 + i * 30}ms`} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
            <S className="h-4 w-36 mb-4" delay="200ms" />
            <div className="h-[250px] flex items-end gap-2 pt-4">
              <Bars bars={[60, 45, 75, 50]} baseDelay={220} />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
            <S className="h-4 w-32 mb-4" delay="300ms" />
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <S className="h-2.5 w-2.5 rounded-full" delay={`${320 + i * 30}ms`} />
                    <S className="h-3 w-16" delay={`${330 + i * 30}ms`} />
                  </div>
                  <S className="h-3 w-24" delay={`${340 + i * 30}ms`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Three charts row ── */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        {/* VelocityChart — bar chart */}
        <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
          <S className="h-4 w-28 mb-1" delay="100ms" />
          <S className="h-3 w-40 mb-4" delay="120ms" />
          <div className="h-[200px] flex items-end gap-2 pt-4">
            <Bars bars={[65, 45, 80, 55, 70, 40, 60]} baseDelay={140} />
          </div>
        </div>

        {/* CumulativeBookingsChart — bar chart */}
        <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
          <S className="h-4 w-40 mb-1" delay="200ms" />
          <S className="h-3 w-32 mb-4" delay="220ms" />
          <div className="h-[200px] flex items-end gap-2 pt-4">
            <Bars bars={[20, 30, 35, 50, 55, 65, 75, 85]} baseDelay={240} />
          </div>
        </div>

        {/* LeadsRadarChart — radar/spider placeholder */}
        <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
          <S className="h-4 w-24 mb-1" delay="300ms" />
          <S className="h-3 w-36 mb-4" delay="320ms" />
          <div className="h-[200px] flex items-center justify-center">
            <S className="h-40 w-40 rounded-full" delay="340ms" />
          </div>
        </div>
      </div>

      {/* ── DailyVolumeChart ── */}
      <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
        <S className="h-4 w-32 mb-1" delay="400ms" />
        <S className="h-3 w-56 mb-4" delay="420ms" />
        <div className="h-[250px] flex items-end gap-1 pt-4">
          <Bars
            bars={[40, 55, 30, 70, 60, 45, 80, 35, 65, 50, 75, 42, 58, 68, 38, 72, 48, 62, 52, 44]}
            baseDelay={440}
          />
        </div>
      </div>

      {/* ── StageAgingTable ── */}
      <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
        <S className="h-5 w-44 mb-1" delay="500ms" />
        <S className="h-3 w-64 mb-5" delay="520ms" />
        <div className="space-y-5">
          {[
            { pills: [3, 2, 4, 2] },
            { pills: [2, 3, 2] },
            { pills: [4, 2, 3, 2, 3] },
          ].map((group, g) => (
            <div key={g}>
              {/* Stage name + count badge */}
              <div className="flex items-center justify-between mb-2">
                <S className="h-4 w-20" delay={`${540 + g * 60}ms`} />
                <S className="h-5 w-16 rounded-full" delay={`${550 + g * 60}ms`} />
              </div>
              {/* Contact pills */}
              <div className="flex flex-wrap gap-2">
                {group.pills.map((pw, p) => (
                  <S
                    key={p}
                    className={`h-6 rounded-md`}
                    style={{ width: `${pw * 14 + 24}px` }}
                    delay={`${560 + g * 60 + p * 25}ms`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
