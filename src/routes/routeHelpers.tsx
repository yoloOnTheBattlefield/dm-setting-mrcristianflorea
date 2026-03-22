import { type ReactNode, type ComponentType, lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useAuth } from "@/contexts/AuthContext";

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

/** Wrap a page in ProtectedRoute + RequireOutbound + DashboardLayout + Suspense */
export function outboundPage(Component: ComponentType) {
  return (
    <ProtectedRoute>
      <RequireOutbound>
        <DashboardLayout>
          <Suspense fallback={<PageSkeleton />}>
            <Component />
          </Suspense>
        </DashboardLayout>
      </RequireOutbound>
    </ProtectedRoute>
  );
}

export function RequireOutbound({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user?.has_outbound) return <Navigate to="/" replace />;
  return <>{children}</>;
}
