import { Shimmer } from "@/components/skeletons";

export function PageSkeleton() {
  return (
    <div className="flex flex-1 flex-col p-6 space-y-4 animate-in fade-in duration-300">
      <Shimmer className="h-8 w-48" delay="0ms" />
      <Shimmer className="h-4 w-72" delay="80ms" />
      <Shimmer className="h-[400px] w-full rounded-lg" delay="160ms" />
    </div>
  );
}
