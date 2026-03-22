import { Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { LoginForm } from "@/components/login-form";
import { PageSkeleton } from "@/components/PageSkeleton";
import { lazyRetry } from "./routeHelpers";

const Landing = lazyRetry(() => import("@/pages/Landing"));
const AcceptInvite = lazyRetry(() => import("@/pages/AcceptInvite"));
const NotFound = lazyRetry(() => import("@/pages/NotFound"));

export const publicRoutes: RouteObject[] = [
  {
    path: "/login",
    element: (
      <div className="flex min-h-screen items-center justify-center">
        <LoginForm />
      </div>
    ),
  },
  {
    path: "/landing",
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <Landing />
      </Suspense>
    ),
  },
  {
    path: "/invite/:token",
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <AcceptInvite />
      </Suspense>
    ),
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <NotFound />
      </Suspense>
    ),
  },
];
