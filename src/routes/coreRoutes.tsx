import type { RouteObject } from "react-router-dom";
import { lazyRetry, protectedPage } from "./routeHelpers";

const Index = lazyRetry(() => import("@/pages/Index"));
const AllContacts = lazyRetry(() => import("@/pages/AllContacts"));
const LeadDetail = lazyRetry(() => import("@/pages/LeadDetail"));
const InboundAnalytics = lazyRetry(() => import("@/pages/InboundAnalytics"));
const Bookings = lazyRetry(() => import("@/pages/Bookings"));
const BookingAnalytics = lazyRetry(() => import("@/pages/BookingAnalytics"));
const EodReport = lazyRetry(() => import("@/pages/EodReport"));
const Import = lazyRetry(() => import("@/pages/Import"));
const DataMigration = lazyRetry(() => import("@/pages/DataMigration"));
const ClientsOverview = lazyRetry(() => import("@/pages/ClientsOverview"));
const ClientDetail = lazyRetry(() => import("@/pages/ClientDetail"));
const NewClient = lazyRetry(() => import("@/pages/NewClient"));

export const coreRoutes: RouteObject[] = [
  { path: "/", element: protectedPage(Index) },
  { path: "/clients", element: protectedPage(ClientsOverview) },
  { path: "/clients/new", element: protectedPage(NewClient) },
  { path: "/clients/:id", element: protectedPage(ClientDetail) },
  { path: "/contacts/all", element: protectedPage(AllContacts) },
  { path: "/lead/:contactId", element: protectedPage(LeadDetail) },
  { path: "/analytics/inbound", element: protectedPage(InboundAnalytics) },
  { path: "/bookings", element: protectedPage(Bookings) },
  { path: "/analytics/bookings", element: protectedPage(BookingAnalytics) },
  { path: "/eod-report", element: protectedPage(EodReport) },
  { path: "/import", element: protectedPage(Import) },
  { path: "/data-migration", element: protectedPage(DataMigration) },
];
