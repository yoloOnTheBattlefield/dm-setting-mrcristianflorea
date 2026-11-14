import type { RouteObject } from "react-router-dom";
import { lazyRetry, protectedPage } from "./routeHelpers";

const UserSettings = lazyRetry(() => import("@/pages/UserSettings"));
const Integrations = lazyRetry(() => import("@/pages/Integrations"));
const TeamMembers = lazyRetry(() => import("@/pages/TeamMembers"));

export const settingsRoutes: RouteObject[] = [
  { path: "/settings", element: protectedPage(UserSettings) },
  { path: "/settings/integrations", element: protectedPage(Integrations) },
  { path: "/settings/team", element: protectedPage(TeamMembers) },
];
