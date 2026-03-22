import type { RouteObject } from "react-router-dom";
import { lazyRetry, protectedPage } from "./routeHelpers";

const ResearchOverview = lazyRetry(() => import("@/pages/research/ResearchOverview"));
const ResearchCompetitors = lazyRetry(() => import("@/pages/research/Competitors"));
const ResearchCompetitorDetail = lazyRetry(() => import("@/pages/research/CompetitorDetail"));
const ResearchPostsLibrary = lazyRetry(() => import("@/pages/research/PostsLibrary"));
const CommentsIntel = lazyRetry(() => import("@/pages/research/CommentsIntel"));
const LeadMagnetTracker = lazyRetry(() => import("@/pages/research/LeadMagnetTracker"));
const IdeasBank = lazyRetry(() => import("@/pages/research/IdeasBank"));
const ResearchAlerts = lazyRetry(() => import("@/pages/research/Alerts"));
const ResearchReports = lazyRetry(() => import("@/pages/research/Reports"));
const ReelsInsights = lazyRetry(() => import("@/pages/research/ReelsInsights"));

export const researchRoutes: RouteObject[] = [
  { path: "/research", element: protectedPage(ResearchOverview) },
  { path: "/research/competitors", element: protectedPage(ResearchCompetitors) },
  { path: "/research/competitors/:id", element: protectedPage(ResearchCompetitorDetail) },
  { path: "/research/posts", element: protectedPage(ResearchPostsLibrary) },
  { path: "/research/comments", element: protectedPage(CommentsIntel) },
  { path: "/research/lead-magnets", element: protectedPage(LeadMagnetTracker) },
  { path: "/research/ideas", element: protectedPage(IdeasBank) },
  { path: "/research/alerts", element: protectedPage(ResearchAlerts) },
  { path: "/research/reports", element: protectedPage(ResearchReports) },
  { path: "/research/reels", element: protectedPage(ReelsInsights) },
];
