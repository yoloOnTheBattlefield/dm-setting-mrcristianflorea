import { type ComponentType, lazy, Suspense } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageSkeleton } from "@/components/PageSkeleton";

/** Retry dynamic imports once on chunk load failure (stale deploy) */
export function lazyRetry(factory: () => Promise<{ default: ComponentType<object> }>) {
  return lazy(() =>
    factory().catch(() => {
      window.location.reload();
      return new Promise<{ default: ComponentType<object> }>(() => {});
    }),
  );
}

/** Wrap a page component in ProtectedRoute + DashboardLayout + Suspense */
export function protectedPage(Component: ComponentType) {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Suspense fallback={<PageSkeleton />}>
          <Component />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
