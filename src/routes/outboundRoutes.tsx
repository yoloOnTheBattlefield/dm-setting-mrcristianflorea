import type { RouteObject } from "react-router-dom";
import { lazyRetry, outboundPage } from "./routeHelpers";

const OutboundLeads = lazyRetry(() => import("@/pages/OutboundLeads"));
const ImportOutboundLeads = lazyRetry(() => import("@/pages/ImportOutboundLeads"));
const UploadXlsx = lazyRetry(() => import("@/pages/UploadXlsx"));
const Prompts = lazyRetry(() => import("@/pages/Prompts"));
const Campaigns = lazyRetry(() => import("@/pages/Campaigns"));
const CampaignDetail = lazyRetry(() => import("@/components/campaigns/CampaignDetail"));
const CampaignAddLeads = lazyRetry(() => import("@/pages/CampaignAddLeads"));
const CampaignEdit = lazyRetry(() => import("@/pages/CampaignEdit"));
const FollowUps = lazyRetry(() => import("@/pages/FollowUps"));
const OutboundAccounts = lazyRetry(() => import("@/pages/OutboundAccounts"));
const OutboundAnalytics = lazyRetry(() => import("@/pages/OutboundAnalytics"));
const Scraper = lazyRetry(() => import("@/pages/Scraper"));
const DeepScraper = lazyRetry(() => import("@/pages/DeepScraper"));
const CommentPost = lazyRetry(() => import("@/pages/CommentPost"));
const OutboundLeadDetail = lazyRetry(() => import("@/pages/OutboundLeadDetail"));

export const outboundRoutes: RouteObject[] = [
  { path: "/contacts/upload", element: outboundPage(UploadXlsx) },
  { path: "/outbound-leads", element: outboundPage(OutboundLeads) },
  { path: "/outbound-leads/import", element: outboundPage(ImportOutboundLeads) },
  { path: "/outbound-leads/:id", element: outboundPage(OutboundLeadDetail) },
  { path: "/follow-ups", element: outboundPage(FollowUps) },
  { path: "/prompts", element: outboundPage(Prompts) },
  { path: "/outbound-accounts", element: outboundPage(OutboundAccounts) },
  { path: "/analytics/outbound", element: outboundPage(OutboundAnalytics) },
  { path: "/campaigns", element: outboundPage(Campaigns) },
  { path: "/campaigns/:id/edit", element: outboundPage(CampaignEdit) },
  { path: "/campaigns/:id/add-leads", element: outboundPage(CampaignAddLeads) },
  { path: "/campaigns/:id", element: outboundPage(CampaignDetail) },
  { path: "/scraper", element: outboundPage(Scraper) },
  { path: "/deep-scraper", element: outboundPage(DeepScraper) },
  { path: "/comment-post", element: outboundPage(CommentPost) },
];
