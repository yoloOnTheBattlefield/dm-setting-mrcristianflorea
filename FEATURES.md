# Features

## Telegram Notification on AI Follow-Up

Sends a Telegram notification whenever the DM Assistant marks an outbound lead with a follow-up. Two triggers:

1. **New Follow-Up created** — AI analyzes a thread for a lead that doesn't yet have a `FollowUp` doc and creates one (any status).
2. **Transition to `follow_up_later`** — existing follow-up moves into `follow_up_later` (conversation stalled / 3 follow-ups exhausted).

Each notification includes the lead username, full name, status, IG sender account, and a link to the prospect's Instagram profile.

### Files (backend — `quddify-crm`)

- `services/telegramNotifier.js` — `notifyAiFollowUp(account, { lead, status, reason, outboundAccount })`
- `services/dmAssistantService.js` — `upsertLeadAndFollowUp` reads the prior FollowUp state, then fires the notification on new-creation or transition into `follow_up_later`
- `services/telegramNotifier.test.js` — Unit tests for both notification reasons

### API Routes

- None (triggered automatically by the DM Assistant analysis path)

## Telegram Notification on Campaign Completion

Sends a Telegram notification when a campaign completes because there are no more leads to send. The notification includes the campaign name and final stats (sent, delivered, replied, failed, skipped).

### Files

- `services/telegramNotifier.js` — Added `notifyCampaignCompleted()` function
- `services/campaignScheduler.js` — Calls `notifyCampaignCompleted()` when a campaign has no remaining pending/queued leads

### API Routes

- None (triggered automatically by the campaign scheduler)

## GHL Inbound DM Conversation Storage

Receives and stores the full AI chatbot conversation (`chat_memory`) from GoHighLevel workflows via webhook. The conversation is parsed into User/Bot messages and displayed as a chat thread on the inbound lead detail page.

### Files

- `models/Lead.js` — Added `chat_memory` field to store raw GHL conversation text
- `routes/ghl-webhook.js` — `POST /api/ghl/conversation` webhook endpoint
- `routes/leads.js` — `GET /leads/:id/ghl-conversation` endpoint (parses chat_memory into messages)
- `src/hooks/useGhlConversation.ts` — Frontend hook to fetch parsed GHL conversation
- `src/pages/LeadDetail.tsx` — Displays GHL conversation as chat bubbles when no IG conversation is linked

### API Routes

- `POST /api/ghl/conversation` — Webhook for GHL to POST chat_memory (open, no auth)
- `GET /leads/:id/ghl-conversation` — Returns parsed User/Bot messages from chat_memory

## Outbound Lead Detail Page

Detail page for outbound leads with contact info, pipeline stepper, IG DM conversation, notes, and deal info. Accessible by clicking any row in the outbound leads table.

### Files

- `src/pages/OutboundLeadDetail.tsx` — Main detail page with sidebar (contact, bio, deal) and right panel (notes composer, outbound DM, conversation, notes list)
- `src/hooks/useOutboundLeadDetail.ts` — Hook to fetch/update a single outbound lead via `GET/PATCH /outbound-leads/:id`
- `src/routes/outboundRoutes.tsx` — Route `/outbound-leads/:id`
- `src/pages/OutboundLeads.tsx` — Table rows and mobile cards made clickable to navigate to detail

### API Routes

- `GET /outbound-leads/:id` — Fetch single outbound lead
- `PATCH /outbound-leads/:id` — Update outbound lead fields
- `GET /api/ig-conversations/by-lead/:id` — Fetch IG conversation by outbound lead ID

## Telegram Integration

Telegram connection card in Settings > Integrations. Users provide a Bot Token and Chat ID to receive lead notifications.

### Files

- `src/pages/Integrations.tsx` — Telegram state management and connect/disconnect handlers
- `src/components/integrations/ConnectionsSection.tsx` — Telegram card UI with bot token and chat ID inputs

## Midnight Telegram Daily Report

Automated daily report sent at midnight UTC via Telegram to all accounts with Telegram configured. Includes outbound stats (DMs sent, replies, booked), inbound stats (new leads, booked, closed), total bookings, and revenue.

### Files

- `services/midnightReportScheduler.js` — Cron job that queries daily stats and sends Telegram message
- `services/midnightReportScheduler.test.js` — Unit tests

### Cron Schedule

- Runs at `0 0 * * *` (midnight UTC) via `node-cron`
- Registered in `index.js` alongside other schedulers

## Infrastructure & DX Improvements

Cross-cutting improvements to frontend and backend quality, security, performance, and developer experience.

### TypeScript Strict Mode (Frontend)

Enabled `strictNullChecks` and `noImplicitAny` in `tsconfig.app.json` for stronger type safety across the entire frontend.

- **Location:** `tsconfig.app.json`

### Helmet Security Headers (Backend)

Added `helmet` middleware for automatic HTTP security headers (XSS protection, content-type sniffing prevention, clickjacking protection).

- **Location:** `index.js` (middleware registration)

### Centralized Error Handler (Backend)

Express error-handling middleware that catches thrown/nexted errors from routes. Routes can simply `throw` or call `next(error)` instead of repeating try/catch blocks.

- **Location:** `middleware/errorHandler.js`
- **Tests:** `middleware/errorHandler.test.js`

### Request Logging Middleware (Backend)

Pino-based HTTP request logger that automatically logs method, URL, status code, and response time for every request with structured JSON output.

- **Location:** `middleware/requestLogger.js`
- **Tests:** `middleware/requestLogger.test.js`

### Zod Schema Hardening (Backend)

Replaced `.passthrough()` with `.strip()` across all 13 Zod validation schemas. Updated the `validate` middleware to replace `req.body/query/params` with parsed values so unknown fields are actually stripped.

- **Location:** `schemas/*.js`, `middleware/validate.js`

### Route Splitting (Frontend)

Split 40+ route definitions from `App.tsx` into feature-based modules: `coreRoutes`, `outboundRoutes`, `researchRoutes`, `settingsRoutes`, `publicRoutes`. Each route module has per-feature `Suspense` boundaries.

- **Location:** `src/routes/*.tsx`

### Login Form with react-hook-form + Zod (Frontend)

Refactored `LoginForm` to use `react-hook-form` with `@hookform/resolvers/zod` for declarative validation. Shared schema in `src/lib/schemas.ts` mirrors backend `schemas/accounts.js`.

- **Location:** `src/components/login-form.tsx`, `src/lib/schemas.ts`

### Optimistic UI Updates (Frontend)

Added optimistic create/delete for lead notes. New notes appear instantly in the UI; deletions are removed from cache immediately. Rollback on error.

- **Location:** `src/hooks/useLeadNotes.ts`
- **Tests:** `src/hooks/useLeadNotes.test.ts`

### WebSocket Reconnection & Auth Refresh (Frontend)

SocketContext now passes JWT token via `socket.auth`, handles reconnection with exponential backoff, detects auth errors (401) to force re-login, and supports server-initiated token refresh events.

- **Location:** `src/contexts/SocketContext.tsx`

### Controller Layer (Backend)

Introduced `controllers/` directory with `leadController.js` as the reference implementation. Business logic separated from route definitions for testability.

- **Location:** `controllers/leadController.js`

### Standardized Response Envelope (Backend)

Response helpers (`ok`, `created`, `paginated`, `deleted`) ensure consistent `{ data }` / `{ data, meta }` envelope across all endpoints.

- **Location:** `utils/response.js`
- **Tests:** `utils/response.test.js`

### Redis Caching Layer (Backend)

Redis client singleton with no-op stub fallback. Used by rate limiter for persistence across deploys. Gracefully degrades to in-memory when `REDIS_URL` is not set.

- **Location:** `services/redis.js`, `middleware/rateLimiter.js`

---

## Reels Insights (Research)

Shows how many Instagram Reels the current account has posted since the start of the month. Accessible from the Research section. Automatically uses the logged-in user's `account_id` — no client picker needed. Fetches from the IG Graph API using the account's stored OAuth page access token, filters for `media_product_type === "REELS"`, and lists each reel with its timestamp and permalink.

### Location

- **Page:** `src/pages/research/ReelsInsights.tsx`
- **Hook:** `src/hooks/useMonthlyReels.ts`
- **Nav:** Research → "Reels" (`/research/reels`)

### API Routes

- `GET /api/instagram/reels/monthly/:accountId` — returns `{ month, since, ig_username, count, reels[] }`. Users can only fetch their own account; admins can fetch any.

---

## Lead DM Conversation Panel

Displays the stored Instagram DM conversation directly on the lead detail page. Fetches the conversation thread for the lead from the database and renders messages in a chat-bubble UI (outbound right, inbound left), ordered oldest to newest.

### Location

- **Hook:** `src/hooks/useLeadConversation.ts`
- **Displayed in:** `src/pages/LeadDetail.tsx` (right panel, above Activity Feed)
- **Types:** `src/lib/types.ts` (`IgConversation`, `IgMessage`, `IgConversationResponse`)

### API Routes

- `GET /api/ig-conversations/by-lead/:leadId` — returns conversation + messages for a given lead ID

---

## useDebounce Hook

Shared debounce hook that eliminates duplicated `useState + useEffect + setTimeout` patterns across pages.

### Location

- **Hook:** `src/hooks/useDebounce.ts`
- **Tests:** `src/hooks/useDebounce.test.ts`
- **Used in:** `src/pages/OutboundAccounts.tsx`, `src/pages/AllContacts.tsx`, `src/pages/OutboundLeads.tsx`

---

## Shimmer Loading Screens

Polished shimmer loading skeletons for every page. Uses a gradient shimmer animation instead of plain gray pulse, with staggered animation delays and layouts that mirror the actual page content.

### Reusable Building Blocks

- `Shimmer` — base shimmer block with delay
- `TableSkeleton` — configurable rows/cols/widths for any table
- `StatCardsSkeleton` — grid of stat card placeholders
- `StatsBarSkeleton` — horizontal inline stats bar
- `FormCardSkeleton` — card with label + input field placeholders
- `ChartCardSkeleton` — bar chart or pie chart placeholder
- `KanbanColumnSkeleton` — kanban column with card placeholders
- `DetailPageSkeleton` — full detail page (header + cards + table)

### Location

- **Skeleton component:** `src/components/ui/skeleton.tsx` (added `shimmer` prop)
- **Reusable skeletons:** `src/components/skeletons.tsx`
- **Dashboard skeleton:** `src/components/dashboard/DashboardSkeleton.tsx`
- **Page-level skeleton:** `src/components/PageSkeleton.tsx`
- **Shimmer CSS animation:** `src/index.css` (`animate-shimmer` keyframes)

### Pages Updated

- Dashboard (Index) — shimmer stat cards, chart bars, radar circle, table
- All Contacts — shimmer stats bar + contacts table/kanban
- EOD Report — shimmer stat cards (replaced "—" placeholders)
- Comment Post — shimmer table (replaced "Loading tasks..." text)
- Campaign Edit — shimmer form cards (replaced mismatched DashboardSkeleton)
- Client Detail — shimmer detail page (replaced "Loading..." text)
- Clients Overview — shimmer table (replaced mismatched DashboardSkeleton)
- Lead Detail — shimmer detail page (replaced mismatched DashboardSkeleton)
- Outbound Leads — shimmer table rows + mobile cards
- Outbound Accounts — shimmer table (replaced spinner + "Loading..." text)
- Inbound Analytics — spinner for post performance section

## Error Boundary

Catches runtime errors in any React component and shows a friendly fallback UI instead of crashing the entire app. Users can retry or reload.

### Location

- **Component:** `src/components/ErrorBoundary.tsx`
- **Wired in:** `src/App.tsx` (wraps the router inside `<BrowserRouter>`)
- **Test:** `src/components/ErrorBoundary.test.tsx`

## Email Invitation Flow

Invite new clients or team members via email. Recipients click a link to set their own password and join the platform — no admin-set passwords needed.

### How It Works

1. **Admin sends invite** from `/clients/new` (Invite via Email tab) or from a client's detail page (Invite via Email button)
2. **Email delivered** via Resend with a 7-day expiry link
3. **Recipient clicks link** → `/invite/:token` page loads with pre-filled name fields
4. **Recipient sets password** → account/membership created, auto-logged in

### Invite Types

- **Client invite**: Creates a new Account + User + AccountUser (owner role). GHL ID is optional.
- **Team member invite**: Creates a User and links them to an existing account with configurable outbound access.

### Location

- **Frontend pages:** `src/pages/NewClient.tsx` (Invite via Email tab), `src/pages/ClientDetail.tsx` (Invite via Email button), `src/pages/AcceptInvite.tsx` (public accept page)
- **Frontend hook:** `src/hooks/useInvitations.ts` (`useInviteClient`, `useInviteTeamMember`)
- **Frontend route:** `src/App.tsx` (`/invite/:token`)
- **Backend model:** `quddify-crm/models/Invitation.js`
- **Backend route:** `quddify-crm/routes/invitations.js`
- **Backend wiring:** `quddify-crm/index.js` (registered before auth middleware for public endpoints)

### API Routes

- **`POST /api/invitations`** (auth, admin only) — Body: `{ email, first_name?, last_name?, type: "client"|"team_member", ghl?, account_id?, has_outbound?, has_research? }`. Creates invitation, sends email via Resend. Returns `{ _id, email, type, status }`.
- **`GET /api/invitations/:token`** (public) — Validates token, returns `{ email, first_name, last_name, type }`.
- **`POST /api/invitations/:token/accept`** (public) — Body: `{ password, first_name?, last_name? }`. Creates user/account, marks invitation accepted, returns JWT token for auto-login.

### Environment Variables

- `RESEND_API_KEY` — Resend API key for sending emails
- `FRONTEND_URL` — Base URL for invite links (e.g., `https://quddify-app.app`)

### Tests

- `src/pages/AcceptInvite.test.tsx` — 4 tests: loading state, error state, pre-filled form, form fields
- `quddify-crm/routes/invitations.test.js` — 12 tests: create client/team invites, duplicate detection, token validation, accept flow, expiry, password validation

---

## Move Pending Leads Between Campaigns

Select pending leads in a campaign and move them to another campaign in bulk. Only leads with `status: "pending"` are eligible to move. Stats are updated on both the source and target campaigns. Duplicate leads already in the target campaign are skipped.

### Location

- **Frontend component:** `src/components/campaigns/CampaignDetail.tsx` (Move button in bulk actions, Move modal)
- **Frontend hook:** `src/hooks/useCampaigns.ts` (`useMoveLeads`)
- **Backend route:** `quddify-crm/routes/campaigns.js` (`POST /api/campaigns/:id/leads/move`)

### API

- **`POST /api/campaigns/:id/leads/move`** — Body: `{ lead_ids: string[], target_campaign_id: string }`. Moves pending CampaignLead records from source to target campaign and updates stats on both. Returns `{ moved, duplicates_skipped }`.

---

## Post/Reel Likers Scraping

Scrape users who liked an Instagram post or reel via Apify (`datadoping/instagram-likes-scraper`). Users can select "Commenters", "Likers", or both via checkboxes when creating a deep scrape job. Likers are merged with commenters into the same profile enrichment and qualification pipeline.

### Location

- **Frontend dialog:** `src/components/deep-scraper/NewDeepScrapeDialog.tsx` (checkbox UI for lead sources)
- **Frontend page:** `src/pages/DeepScraper.tsx` (state wiring, status badge, progress display)
- **Frontend types:** `src/lib/types.ts` (`scrape_comments`, `scrape_likers`, `scraping_likers` status, likers stats)
- **Frontend hooks:** `src/hooks/useDeepScrapeJobs.ts` (mutation body updated)
- **Backend model:** `quddify-crm/models/DeepScrapeJob.js` (`scrape_comments`, `scrape_likers`, `scraping_likers` status, likers stats)
- **Backend service:** `quddify-crm/services/deepScraper.js` (`LIKER_SCRAPER` actor, likers pipeline step)
- **Backend route:** `quddify-crm/routes/deep-scrape.js` (accepts new fields)
- **Backend schema:** `quddify-crm/schemas/deep-scrape.js` (Zod validation)

### API

- **New fields on POST `/api/deep-scrape/start`:** `scrape_comments` (boolean, default `true`), `scrape_likers` (boolean, default `false`)
- **New stats:** `likers_scraped`, `unique_likers`
- **New status:** `scraping_likers`

## Seed Account Followers Scraping

Scrape followers of seed Instagram accounts via Apify (`scraping_solutions/instagram-scraper-followers-following-no-cookies`). Users can select "Followers" alongside "Commenters" and "Likers" via checkboxes when creating a deep scrape job. Followers are scraped per-seed (not per-post) and go through the same profile enrichment and qualification pipeline.

### Location

- **Frontend dialog:** `src/components/deep-scraper/NewDeepScrapeDialog.tsx` (Followers checkbox in Lead Sources)
- **Frontend page:** `src/pages/DeepScraper.tsx` (state wiring, status badge, progress display)
- **Frontend types:** `src/lib/types.ts` (`scrape_followers`, `scraping_followers` status, `followers_scraped` stat)
- **Frontend hooks:** `src/hooks/useDeepScrapeJobs.ts` (mutation body updated)
- **Backend model:** `quddify-crm/models/DeepScrapeJob.js` (`scrape_followers`, `scraping_followers` status, `followers_scraped` stat, `followers_scraped_seeds` checkpoint)
- **Backend service:** `quddify-crm/services/deepScraper.js` (`FOLLOWERS_SCRAPER` actor, followers pipeline step per-seed)
- **Backend route:** `quddify-crm/routes/deep-scrape.js` (accepts `scrape_followers`)
- **Backend schema:** `quddify-crm/schemas/deep-scrape.js` (Zod validation)

### API

- **New field on POST `/api/deep-scrape/start`:** `scrape_followers` (boolean, default `false`)
- **New stat:** `followers_scraped`
- **New status:** `scraping_followers`

## Skip Wait Time in VA Mode

Allows manual (VA mode) campaigns to skip the cooldown delay between messages. When enabled, the VA can send messages back-to-back without waiting for the configured min/max delay to elapse.

### Location

- **Frontend toggle (edit page):** `src/pages/CampaignEdit.tsx`
- **Frontend toggle (create/edit dialog):** `src/components/campaigns/CampaignCreateEditDialog.tsx`
- **Frontend type:** `src/hooks/useCampaigns.ts` (`CampaignSchedule.skip_wait_time`)
- **Backend model:** `quddify-crm/models/Campaign.js` (`schedule.skip_wait_time`)
- **Backend route:** `quddify-crm/routes/manual-campaigns.js` (cooldown check skipped when enabled)

### API

- **Field:** `schedule.skip_wait_time` (boolean, default `false`)
- **Affected endpoint:** `GET /api/manual-campaigns/next` — when `skip_wait_time` is `true`, the cooldown check is bypassed and the next lead is returned immediately.

## Skip Active Hours (Send 24/7)

Allows campaigns to bypass the active hours window and send messages at any time. When enabled, the scheduler ignores the active_hours_start/end check and the "Outside active hours" status is no longer shown.

### Location

- **Frontend toggle (edit page):** `src/pages/CampaignEdit.tsx`
- **Frontend toggle (create/edit dialog):** `src/components/campaigns/CampaignCreateEditDialog.tsx`
- **Frontend type:** `src/hooks/useCampaigns.ts` (`CampaignSchedule.skip_active_hours`)
- **Backend model:** `quddify-crm/models/Campaign.js` (`schedule.skip_active_hours`)
- **Backend scheduler:** `quddify-crm/services/campaignScheduler.js` (active hours check skipped)
- **Backend route:** `quddify-crm/routes/campaigns.js` (next-send endpoint respects flag)

### API

- **Field:** `schedule.skip_active_hours` (boolean, default `false`)
- **Affected endpoints:**
  - `GET /api/campaigns/:id/next-send` — no longer returns "Outside active hours" reason when enabled
  - Scheduler `processTick` — skips `isWithinActiveHours` check when enabled

## Direct URL Deep Scrape

Scrape comments from a specific Instagram reel or post by providing its URL directly, bypassing the seed account + reel discovery phase.

### Location

- **Frontend:** `src/pages/DeepScraper.tsx` (source toggle, URL textarea in new job dialog)
- **Hooks:** `src/hooks/useDeepScrapeJobs.ts` (`useStartDeepScrape` accepts `direct_urls`)
- **Types:** `src/lib/types.ts` (`DeepScrapeJob.direct_urls`)
- **Backend model:** `quddify-crm/models/DeepScrapeJob.js` (`direct_urls` field)
- **Backend route:** `quddify-crm/routes/deep-scrape.js` (POST `/api/deep-scrape/start`)
- **Backend service:** `quddify-crm/services/deepScraper.js` (direct URL pipeline in `processJob`)

### API

- **POST `/api/deep-scrape/start`** — now accepts `direct_urls: string[]` as an alternative to `seed_usernames`. Provide one or both. Invalid URLs are filtered out.

### Tests

- `src/pages/DeepScraper.test.tsx` — 6 tests covering source toggle, conditional UI, and validation

## Integrations Page UX Overhaul

Restructured the Integrations page with visual grouping, consistent status indicators, and improved layout.

### Changes

- **Section grouping:** Integrations organized into labeled sections — AI Models, Data Acquisition, Tracking, Connections
- **AI Models grid:** OpenAI, Claude, Gemini displayed in a responsive 3-column grid
- **Consistent status badges:** Every integration card shows a status badge (Connected, Server Default, Enabled/Disabled, Ready/Setup Required, Not Connected)
- **ManyChat full-width:** Moved out of cramped 3-column grid into full-width card with 2-column inner layout for Webhook URL and API Key
- **Apify delete confirmation:** AlertDialog confirmation before removing a token
- **Website Tracking context:** Shows helper text when tracking is disabled
- **Friendlier empty states:** "No API key found" → "No API key generated"

### Location

- **Frontend:** `src/pages/Integrations.tsx`

### Tests

- `src/pages/Integrations.test.tsx` — tests for section headings, status badges, delete confirmation, and layout

## Disqualified Checkbox for Outbound Leads

Adds a "DQ" (disqualified) checkbox to the outbound leads table, allowing users to mark leads as disqualified directly from the list view. Uses the existing `qualified` field on OutboundLead (setting it to `false` for disqualified, `null` to unmark).

### Location

- **Frontend:** `src/pages/OutboundLeads.tsx` (desktop table column + mobile card checkbox)
- **Backend model field:** `OutboundLead.qualified` (already existed — `true` = qualified, `false` = disqualified, `null` = unset)
- **Backend route:** `PATCH /api/outbound-leads/:id` (already supports patching `qualified`)

## Outbound Leads — Close CRM-Inspired UI Redesign

Redesigned the Outbound Leads table inspired by Close CRM's UX philosophy: reduced visual noise, richer data density, and faster stage transitions from the row itself.

### Changes

**Funnel Stats Bar:**
- Added conversion rate percentages between each stage (e.g., "23.7% of total", "7.8% reply rate", "12.5% close rate")
- Rates displayed as sub-labels under each card value with `FunnelArrow` connector showing the step-to-step conversion

**Desktop Table (13 → 9 columns):**
- **Lead column:** Combined avatar (colored initials circle) + `@username` + full name (truncated with `title` tooltip on hover) — replaces separate Username and Name columns
- **Status badge:** Single color-coded pipeline pill per row derived from boolean fields: DQ (red) › Converted (green) › Replied (blue) › Link Sent (cyan) › Messaged (amber) › New (slate) — replaces 5 separate checkbox columns
- **Last Activity column:** Relative time ("2d ago", "5h ago") from `updatedAt` / `dmDate` / `createdAt`
- **Row actions dropdown:** Note, DM, and `...` menu on hover per row. Dropdown surfaces all stage toggles (Mark Messaged, Mark Replied, Mark Link Sent, Mark Converted, Disqualify / Clear DQ) + Open IG Profile

**Mobile Cards:**
- Replaced checkbox status ticks with a single status badge matching desktop
- Added colored initials avatar before username
- Last Activity shown in expanded details
- Expanded quick-action buttons for Messaged / Replied / Converted replacing inline checkboxes

### Location

- **Frontend page:** `src/pages/OutboundLeads.tsx`
- **Funnel component:** `src/components/outbound-leads/FunnelStatsBar.tsx`

## Outbound Leads & Campaign Detail UI Polish

Comprehensive UI improvements across the Outbound Leads table and Campaign Detail (DM Pipeline) pages.

### Changes

**Outbound Leads Page:**
- Wider search field with responsive grid layout to prevent truncation
- Status columns (Messaged, Replied, Link Sent, Converted) use check/dash icons instead of checkbox inputs
- Column order: Link Sent moved after Replied for logical funnel flow
- Name column truncated with tooltip to prevent row height overflow
- Contract placeholder changed from "-" to "None" for clarity
- Funnel stat cards use unified muted icon colors with subtle chevron separators

**Campaign Detail Page:**
- Auto/Manual badge shows tooltip explaining the mode
- Secondary stat cards match primary card layout (consistent sizing/spacing)
- Recalc button styled as outline button instead of ghost text
- Status bar info broken into labeled groups with vertical separators
- Issues badge shows tooltip listing each sender's issue on hover
- Remove Pending button styled with destructive color to indicate risk
- Senders modal health column: issue text shown inside badge directly (no redundant badge + text)

**Sidebar:**
- Research section now has a proper "Research" label like other sections

### Location

- **Outbound Leads:** `src/pages/OutboundLeads.tsx`
- **Campaign Detail:** `src/components/campaigns/CampaignDetail.tsx`
- **Sidebar nav:** `src/hooks/useNavSections.ts`

## Component Extraction Refactor

Large page components split into smaller, focused subcomponents for maintainability.

### Extracted Components

- **DeepScraper** (2307 → 1536 lines): `NewDeepScrapeDialog`, `TargetPickerDialog`, `EditJobDialog`, `TargetAnalyticsPanel` → `src/components/deep-scraper/`
- **OutboundLeads**: `OutboundLeadsFilters`, `FunnelStatsBar`, `SelectionActionBar`, `DmEditDialog`, `OutboundLeadsPagination` → `src/components/outbound-leads/`
- **Integrations**: `AITokenCard`, `AIModelsSection`, `ApifyTokensCard`, `TrackingCard`, `ConnectionsSection`, `CalendlyTokenModal` → `src/components/integrations/`
- **OutboundAccounts**: `AddEditAccountDialog`, `DeleteConfirmDialog`, `WarmupDialog` → `src/components/outbound-accounts/`

## TypeScript Strict Mode

Enabled full `"strict": true` in `tsconfig.app.json` (was previously disabled). Also enabled `noFallthroughCasesInSwitch`.

### Location

- **Config:** `tsconfig.app.json`

## Structured Logging (Backend)

Replaced all `console.log/error/warn` calls across the backend with structured pino logging. Each module creates a child logger with a `module` label for traceability.

### Location

- **Logger utility:** `quddify-crm/utils/logger.js`
- **All route, service, and middleware files** now use `logger.info/error/warn` instead of `console.*`
- **Dev:** Uses `pino-pretty` for colorized output
- **Production:** Outputs structured JSON for log aggregation

## API Rate Limiting

Rate limiting middleware (`express-rate-limit`) applied across all endpoints to prevent abuse.

### Tiers

- **Auth routes** (`/login`, `/register`): 20 requests / 15 min per IP
- **Authenticated API routes**: 200 requests / min per IP
- **Webhooks** (Instagram, ManyChat, Calendly): 120 requests / min per IP

### Location

- **Middleware:** `quddify-crm/middleware/rateLimiter.js`
- **Wired in:** `quddify-crm/index.js`

## Regex DoS Protection

All MongoDB `$regex` queries using user-supplied search input now escape special regex characters via `escapeRegex()` to prevent ReDoS attacks.

### Location

- **Utility:** `quddify-crm/utils/escapeRegex.js`
- **Applied in:** 8 route files (outbound-leads, campaigns, accounts, leads, prompts, sender-accounts, outbound-accounts, research, tasks)

### Tests

- `quddify-crm/utils/escapeRegex.test.js`

## Input Validation (Zod)

Server-side request validation using Zod schemas on critical API routes.

### Validated Routes

- `POST /login`, `POST /register` — email + password required
- `POST /outbound-leads/bulk-delete`, `PATCH /outbound-leads/:id`
- `POST /api/campaigns`, `PATCH /api/campaigns/:id` — name, schedule constraints
- `POST /api/deep-scrape/start` — requires seed_usernames or direct_urls
- `POST /api/manychat/webhook` — ig_username required

### Location

- **Middleware:** `quddify-crm/middleware/validate.js`
- **Schemas:** `quddify-crm/schemas/` (accounts, outbound-leads, campaigns, deep-scrape, manychat, leads, prompts, ai-prompts)

### Tests

- `quddify-crm/middleware/validate.test.js` — 28 tests

## API Key Encryption at Rest

Sensitive API tokens stored in the Account model are encrypted using AES-256-GCM before being saved to MongoDB.

### Encrypted Fields

`openai_token`, `claude_token`, `gemini_token`, `apify_token`, `calendly_token`, `ig_oauth.access_token`, `ig_oauth.page_access_token`

### How It Works

- Encryption key read from `ENCRYPTION_KEY` env var (64-char hex = 32 bytes)
- Each value encrypted with random IV, stored as `iv:authTag:ciphertext`
- Graceful fallback: if `ENCRYPTION_KEY` is not set, values stored/read as plaintext
- Backwards compatible: decrypt detects plaintext and returns it unchanged

### Location

- **Utility:** `quddify-crm/utils/crypto.js`
- **Model methods:** `Account.encryptField()`, `Account.decryptField()`
- **Routes modified:** accounts.js, campaigns.js, instagram-oauth.js, instagram-webhook.js, calendly.js

### Tests

- `quddify-crm/utils/crypto.test.js` — 16 tests

### Setup

Generate key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
Set `ENCRYPTION_KEY` in your environment (Railway, .env, etc.)

## Unit Test Coverage

Foundational unit tests across backend utilities, middleware, services, and frontend logic.

### Backend Tests (quddify-crm)

**Utilities & Services:**
- **`utils/normalize.test.js`** — toNumber, toDate, toBoolean conversion functions (edge cases, type coercion, whitespace)
- **`utils/computeDailyLimit.test.js`** — Daily DM cap calculation per account status and warmup schedule
- **`utils/columnMapping.test.js`** — XLSX column mapping: field normalization, type conversion, username sanitization
- **`utils/escapeRegex.test.js`** — Regex special character escaping, ReDoS prevention
- **`utils/crypto.test.js`** — AES-256-GCM encrypt/decrypt, round-trip, fallback without key, backwards compatibility
- **`middleware/validate.test.js`** — Zod validation middleware, schema tests for all validated routes (28 tests)
- **`services/campaignScheduler.test.js`** — Pure functions: resolveTemplate, isWithinActiveHours, getEffectiveDailyLimit, isAccountResting
- **`middleware/auth.test.js`** — JWT auth, API key auth (qd_), browser token auth (oat_), disabled/deleted accounts, membership checks, token generation

**Route Integration Tests:**
- **`routes/accounts.test.js`** — Registration, login (single/multi-account), password change, duplicate email, wrong credentials
- **`routes/outbound-accounts.test.js`** — Full CRUD, filtering, search, pagination, sender enrichment, token generation/revocation, tenant isolation
- **`routes/leads.test.js`** — CRUD, search, pagination, date range filtering, sort order
- **`routes/manychat.test.js`** — Webhook lead creation, @ stripping, upsert dedup, name parsing, post_url, cross-channel linking
- **`routes/campaigns.test.js`** — Full CRUD, list/filter/paginate, start/pause lifecycle, schedule validation, stats, add leads, recalc-stats
- **`routes/outbound-leads.test.js`** — List with filters (messaged, replied, qualified, followers), search, pagination, sources, stats, CRUD, auto-timestamps, CampaignLead sync, bulk-delete
- **`routes/sender-accounts.test.js`** — Full CRUD, heartbeat, search, filter, pagination, outbound account enrichment, upcoming task enrichment, tenant isolation
- **`routes/deep-scrape.test.js`** — Start (seeds + direct URLs), list/filter/paginate, get, leads, pause/cancel/resume lifecycle, edit config, delete, Apify token validation
- **`routes/prompts.test.js`** — CRUD, search, pagination, default prompt management, filter persistence
- **`routes/warmup.test.js`** — Warmup status/start/stop lifecycle, checklist toggle, automation blocking, audit logs, pagination
- **`routes/tracking.test.js`** — Settings get/update, event listing, limit parameter
- **`routes/tracking-public.test.js`** — Script serving, config endpoint, event ingestion, first_visit/conversion lead updates, deduplication, validation
- **`routes/analytics.test.js`** — Dashboard sections, funnel metrics, date range filtering, outbound/inbound analytics, campaign/message/sender analytics, daily activity, response speed, trends
- **`routes/health.test.js`** — Health check, debug info, stats aggregation
- **`routes/research.test.js`** — Overview KPIs, engagement trend, top posts, competitors, posts pagination/filtering, commenters aggregation

### Frontend Tests (src/)

**Libraries:**
- **`src/lib/column-mapping.test.ts`** — autoSuggestMapping (synonyms, deduplication), validateMapping (identifier requirement), MAPPABLE_FIELDS
- **`src/lib/analytics.test.ts`** — calculateFunnelMetrics, calculateVelocityMetrics, calculateGhostingBuckets, calculateFupEffectiveness, calculateCumulativeBookings

**Hooks:**
- **`src/hooks/usePersistedState.test.ts`** — readPersisted/writePersisted: missing keys, stored values, invalid JSON fallback, overwrites
- **`src/hooks/useLeadSelection.test.ts`** — Manual toggle, select-all mode, exclude toggle, getCount, clearSelection

**Pages:**
- **`src/pages/Campaigns.test.tsx`** — Page header, stat line, campaign name rendering
- **`src/pages/OutboundLeads.test.tsx`** — Page header, search inputs, import button

## Playwright E2E Tests

End-to-end integration tests using Playwright with stubbed API calls (`page.route()`). Tests run against the Vite dev server (auto-started via `webServer` config) without requiring a backend. Uses chromium only for speed.

### Location

- **Config:** `playwright.config.ts`
- **Helpers:** `e2e/helpers.ts` (login helper that sets localStorage via `addInitScript`)
- **Tests:**
  - `e2e/outbound-leads.spec.ts` — Table rendering, search, pagination, bulk delete, lead status updates
  - `e2e/campaigns.spec.ts` — Campaign list, create dialog, detail navigation, start/pause/delete lifecycle
  - `e2e/deep-scraper.spec.ts` — Job list, create with seeds/URLs, pause/cancel/delete jobs

### Scripts

- `npm run e2e` — Run all E2E tests headlessly
- `npm run e2e:ui` — Open Playwright UI mode

## MongoDB Indexes

Compound indexes added to Lead and OutboundLead models for common query patterns.

### Lead Indexes

- `{ account_id: 1, date_created: -1 }` — default sort
- `{ account_id: 1, link_sent_at: -1 }` — funnel filtering
- `{ account_id: 1, booked_at: -1 }` — funnel filtering
- `{ ig_username: 1, account_id: 1 }` — cross-channel linking

### OutboundLead Indexes (added)

- `{ account_id: 1, createdAt: -1 }` — default sort
- `{ account_id: 1, isMessaged: 1 }` — messaged filter
- `{ account_id: 1, replied: 1 }` — replied filter

### Location

- `quddify-crm/models/Lead.js`
- `quddify-crm/models/OutboundLead.js`

## Analytics Response Caching

All `/analytics/*` endpoints return `Cache-Control: private, max-age=120` to reduce repeated expensive aggregation queries.

### Location

- `quddify-crm/routes/analytics.js` (router-level middleware)

## Request Correlation IDs

Every request gets a unique UUID (`x-request-id` header). If the client sends one, it's preserved; otherwise a new one is generated. Returned in response headers for end-to-end tracing.

### Location

- **Middleware:** `quddify-crm/middleware/requestId.js`
- **Wired in:** `quddify-crm/index.js`

## Environment Configuration

### .env.example files

Both repos include `.env.example` documenting all required environment variables.

- `quddify-crm/.env.example` — MONGO_URI, JWT_SECRET, ENCRYPTION_KEY, IG/Meta secrets, Redis, etc.
- `dm-setting-mrcristianflorea/.env.example` — VITE_API_URL

### Configurable API URL (Frontend)

`src/lib/api.ts` reads `VITE_API_URL` env var, falling back to localhost (dev) or production URL.

## Route-Based Code Splitting

All page components are lazy-loaded via `React.lazy()` with a `Suspense` fallback, so the browser only downloads the JS for the page the user navigates to. Reduces initial bundle size significantly — each page is now a separate chunk.

### Location

- **App router:** `src/App.tsx` (lazy imports + `<Suspense>` wrapper)
- **Fallback skeleton:** `src/components/PageSkeleton.tsx`

## Socket Event Throttling

High-frequency socket.io events (scrape progress, deep-scrape progress, job row progress, campaign task updates) are throttled to prevent excessive React re-renders during real-time operations.

### Location

- **Throttle utility:** `src/lib/throttle.ts`
- **Scrape progress:** `src/hooks/useScrapeJobs.ts` (`scrape:progress` — 500ms)
- **Deep scrape progress:** `src/hooks/useDeepScrapeJobs.ts` (`deep-scrape:progress` — 500ms)
- **Job row progress:** `src/hooks/useJobProgress.ts` (`job:progress` — 500ms)
- **Campaign task updates:** `src/pages/Campaigns.tsx` (`task:completed/failed/new` — 2s, batches rapid DM sends into single query invalidation)

## Inbound-to-Outbound Lead Linking (Auto-suggest + Manual)

Links inbound leads to outbound leads. On page load, auto-searches outbound leads by the inbound lead's name and shows a confirmation banner with matches. The user can confirm a match with one click or dismiss and search manually.

### Location

- **Frontend UI:** `src/pages/LeadDetail.tsx` (OutboundLeadLinker component)
- **Frontend types:** `src/lib/types.ts` (`ApiLead.outbound_lead_id`, `ig_username`, `source`)
- **Frontend test:** `src/pages/LeadDetail.test.tsx`

### API

- **Link:** `PATCH /leads/:id` with `{ outbound_lead_id: "<outbound_lead_id>" }`
- **Unlink:** `PATCH /leads/:id` with `{ outbound_lead_id: null }`
- **Auto-search on load:** `GET /outbound-leads?search=<lead_name>&limit=5&page=1`
- **Manual search:** `GET /outbound-leads?search=<query>&limit=10&page=1`

---

## AI-Powered Analytics Report

On-demand AI analytics report that uses Claude Opus to analyze outreach data and generate actionable insights. Compares sender accounts, message strategies, industries/niches (via bio keyword extraction), campaigns, and timing patterns. Analyzes all conversation transcripts from replied leads in the date range (from IG messages and GHL chat_memory) to identify common objections, positive conversion patterns, and negative patterns that lose leads. Generates a structured report with executive summary, per-section analysis, conversation analysis, and prioritized action items. Includes PDF export via print-to-PDF with styled HTML output.

### Location

- **Frontend tab:** `src/components/outbound-analytics/AIReportTab.tsx` (report display, generate button, past reports list)
- **Frontend hooks:** `src/hooks/useAIReports.ts` (`useGenerateAIReport`, `useAIReports`, `useAIReport`)
- **Frontend page:** `src/pages/OutboundAnalytics.tsx` (new "AI Report" tab)
- **Backend model:** `quddify-crm/models/AnalyticsReport.js` (report storage with status tracking)
- **Backend service:** `quddify-crm/services/analyticsReportGenerator.js` (data aggregation + Claude analysis)
- **Backend routes:** `quddify-crm/routes/analytics.js` (3 new endpoints)

### API

- **`POST /api/analytics/outbound/ai-report`** — Body: `{ start_date?, end_date?, campaign_id? }`. Creates a report asynchronously. Returns `{ report_id, status: "generating" }`.
- **`GET /api/analytics/outbound/ai-reports`** — Query: `limit` (default 10). Lists past reports with summaries, sorted by generated_at desc.
- **`GET /api/analytics/outbound/ai-reports/:id`** — Returns full report document. Multi-tenant isolated by account_id.

---

## AI Badge on Campaign Edit Outbound Accounts

Shows a purple sparkles icon next to each outbound account on the campaign edit page when that account is connected to an AI setter (`isConnectedToAISetter`).

### Location

- **Frontend page:** `src/pages/CampaignEdit.tsx` (Outbound Accounts section)
- **Frontend type:** `src/hooks/useOutboundAccounts.ts` (`OutboundAccount.isConnectedToAISetter`)
- **Backend model:** `quddify-crm/models/OutboundAccount.js` (`isConnectedToAISetter`)

---

## Deep Scrape Apify Token Guard

When a user opens the Deep Scrape page, checks if any active Apify token exists. If none are configured (no tokens, or all are `disabled`/`limit_reached`), shows an `AlertDialog` explaining an Apify token is required and redirects the user to `/settings/integrations` when dismissed or when they click "Go to Integrations".

### Location

- **Frontend page:** `src/pages/DeepScraper.tsx` (guard effect + `AlertDialog`)
- **Frontend hook:** `src/hooks/useApifyTokens.ts` (`useApifyTokens`)
- **Tests:** `src/pages/DeepScraper.test.tsx` (`DeepScraper — Apify token guard`)

---

## Deep Scrape Qualification Preflight (OpenAI key + prompt)

When a user clicks "Start Deep Scrape" in outbound mode (which runs lead qualification with AI), runs two preflight checks before submitting the job:

1. **OpenAI key check** — if `accounts/me.openai_token` is not set, shows an `AlertDialog` ("OpenAI API Key Required") and redirects to `/settings/integrations`.
2. **Prompt check** — if the user has no classification prompts, shows an `AlertDialog` ("No Classification Prompt Set") and redirects to `/prompts`.

Research-mode scrapes skip these checks since they don't qualify leads.

On the Prompts page, an inline warning card ("OpenAI API Key Missing") lets the user save an OpenAI API key directly without navigating away. The card is hidden once a key is configured.

### Location

- **Frontend pages:** `src/pages/DeepScraper.tsx` (preflight + 2 `AlertDialog`s), `src/pages/Prompts.tsx` (inline OpenAI key banner)
- **Frontend hook:** `src/hooks/useAccountMe.ts` (`useAccountMe`, `useUpdateAccountTokens`)
- **Tests:** `src/pages/DeepScraper.test.tsx` (`DeepScraper — Qualification preflight`), `src/pages/Prompts.test.tsx` (`Prompts — OpenAI key inline banner`)

### API

- **`GET /accounts/me`** — Returns current account including `openai_token`, `claude_token`, `gemini_token`.
- **`PATCH /accounts/:id`** — Body: `{ openai_token?: string | null }` to set/clear the per-account OpenAI API key.

---

## Add Deep Scrape Leads to Campaign

Adds an "Add to Campaign" button on each completed deep scrape job that has qualified leads. Opens a dialog where the user can either pick an existing campaign or create a new draft campaign on the fly (just a name is required). The qualified leads from that job are then bulk-added to the chosen/created campaign. Duplicates already in the campaign are skipped.

### Location

- **Frontend page:** `src/pages/DeepScraper.tsx` (Add to Campaign button + dialog)
- **Frontend hook:** `src/hooks/useDeepScrapeJobs.ts` (`useAddDeepScrapeLeadsToCampaign`)
- **Backend route:** `quddify-crm/routes/deep-scrape.js`

### API

- **`POST /api/deep-scrape/:id/add-to-campaign`** — Body: `{ campaign_id: string }`. Finds all qualified OutboundLeads linked to the job and bulk-inserts them as CampaignLeads. Returns `{ added, duplicates_skipped, total_qualified }`.

---

## Posts Library UI Overhaul

Comprehensive UI improvements to the Research Posts Library page (`/research/posts`).

### Changes

**Filter Section:**
- Replaced Card wrapper with a lighter container (white bg, border, rounded-lg, shadow-sm)
- Added labeled dropdowns with small gray labels: Competitor, Type, Topic, Hook Style, CTA, Engagement, Sort By
- Search input promoted to full-width primary filter above dropdowns
- "Any" renamed to "Any Engagement" on the lead magnet dropdown
- Reset button styled as ghost variant instead of outline

**Results Table:**
- New "Plays" column (playsCount) after Likes with comma-formatted numbers
- New "Link" column with ExternalLink icon opening reelUrl in new tab
- Sortable column headers for Comments, Likes, Plays (client-side asc/desc toggle with chevron icons)
- Null Hook Style / CTA values styled as italic muted "—" instead of plain dashes
- Empty captions show "No caption" in italic muted text
- Caption expanded to 2-line clamp (line-clamp-2) instead of 60-char truncation
- Row hover state (bg-muted/40, cursor-pointer)
- Type badges color-coded: reel (blue), carousel (purple), image (green)
- Account handle is a clickable Instagram profile link with ExternalLink icon

**Results Header:**
- Post count displayed inline next to "Results" heading with muted dot separator

**Pagination:**
- Page number buttons with ellipsis (max 5 visible at a time)
- "Rows per page" selector (10, 25, 50) resets to page 1 on change
- Previous/Next buttons retained alongside numbered pages

### Location

- **Frontend page:** `src/pages/research/PostsLibrary.tsx`
- **Type update:** `src/lib/research-types.ts` (`playsCount` added to `ResearchPost`)

---

## Admin Password Reset

Allows role 0 (admin) users to reset any team member's password without knowing the current one. Non-admin users still need to provide their current password to change their own.

### Location

- **Frontend page:** `src/pages/TeamMembers.tsx` (Reset Password dialog with KeyRound icon button)
- **Frontend hook:** `src/hooks/useTeamMembers.ts` (`useResetPassword` mutation)
- **Backend route:** `quddify-crm/routes/accounts.js` (`POST /api/accounts/:id/password`)

### API

- **`POST /api/accounts/:id/password`** — Body: `{ new_password }` (admin) or `{ current_password, new_password }` (non-admin). Admin (role 0) skips current password verification. Password must be at least 6 characters.

---

## Lead Detail Page — CRM Workspace Redesign

Complete redesign of the `/lead/:id` page from a passive data record into an active sales workspace, inspired by Close CRM.

### Changes

**Header with Pipeline Stepper:**
- Avatar + lead name + contact info (IG handle as clickable link, email, source, created date)
- Horizontal pipeline stepper: New → Link Sent → Follow Up → Booked → Closed. Completed stages are color-filled, current stage has ring indicator. Reps can advance the stage by clicking a future stage.
- Ghosted shown as a separate destructive badge (can be toggled on/off)
- Removed duplicate "Mark as Converted" / "Mark as Closed" buttons — pipeline stepper handles all stage transitions

**Quick-Action Bar:**
- Always-visible buttons: `+ Note` · `Follow-Up` · `Task` · `Mark Ghosted`
- Each button opens an inline form (note textarea, follow-up datetime picker, task title + due date) that submits without page navigation

**Two-Panel Layout (Close-style):**
- **Left sidebar (280px):** Details card (source, email, IG, score as 5-star rating, contract value with `$` prefix), Outbound Lead linker (only if `has_outbound`), Tasks card with checkbox toggle + due dates + completed collapsible
- **Right main area:** Summary/Q&A card (collapsed when empty), Activity Feed

**Activity Feed:**
- Chronological timeline combining: notes (with author + delete), stage transitions (from date fields), completed tasks
- Vertical line connector with color-coded dots per event type
- Relative timestamps ("2h ago", "3d ago")
- Empty state prompts user to add a note or advance the pipeline

**Notes System (new):**
- Backend model `LeadNote` (lead_id, account_id, author_id, author_name, content, timestamps)
- CRUD routes: `GET /api/lead-notes?lead_id=`, `POST /api/lead-notes`, `DELETE /api/lead-notes/:id`
- Frontend hook: `useLeadNotes`, `useCreateLeadNote`, `useDeleteLeadNote`

**Tasks System (new):**
- Backend model `LeadTask` (lead_id, account_id, author_id, author_name, title, due_date, completed_at, timestamps)
- CRUD routes: `GET /api/lead-tasks?lead_id=`, `POST /api/lead-tasks`, `PATCH /api/lead-tasks/:id`, `DELETE /api/lead-tasks/:id`
- Frontend hook: `useLeadTasks`, `useCreateLeadTask`, `useUpdateLeadTask`, `useDeleteLeadTask`
- Overdue tasks highlighted in red

**Score as Visual Element:**
- Replaced dropdown with 5-star rating (maps to 1–10 scale: each star = 2 points)
- Filled amber stars for scored, muted for unscored
- Click to set/clear

### Location

- **Frontend page:** `src/pages/LeadDetail.tsx`
- **Frontend hooks:** `src/hooks/useLeadNotes.ts`, `src/hooks/useLeadTasks.ts`
- **Frontend tests:** `src/pages/LeadDetail.test.tsx`
- **Nav hook:** `src/hooks/useNavSections.ts`
- **Backend models:** `quddify-crm/models/LeadNote.js`, `quddify-crm/models/LeadTask.js`
- **Backend routes:** `quddify-crm/routes/lead-notes.js`, `quddify-crm/routes/lead-tasks.js`
- **Backend wiring:** `quddify-crm/index.js`

### API

- **`GET /api/lead-notes?lead_id=`** — List notes for a lead (newest first)
- **`POST /api/lead-notes`** — Body: `{ lead_id, content }`. Creates a note with author from JWT.
- **`DELETE /api/lead-notes/:id`** — Delete a note (tenant-isolated)
- **`GET /api/lead-tasks?lead_id=`** — List tasks for a lead (open first, then by due date)
- **`POST /api/lead-tasks`** — Body: `{ lead_id, title, due_date? }`. Creates a task.
- **`PATCH /api/lead-tasks/:id`** — Body: `{ title?, due_date?, completed_at? }`. Toggle completion or edit.
- **`DELETE /api/lead-tasks/:id`** — Delete a task (tenant-isolated)

### Tests

- `src/pages/LeadDetail.test.tsx` — 7 tests: header/pipeline rendering, action bar, contact info, outbound linking, note input, task input

---

## Lead Detail Page — Close CRM-Inspired UX Improvements

Additional UX enhancements to the Lead Detail page inspired by Close CRM.

### Changes

**Inline Communication Compose Box:**
- Persistent, always-visible tabbed compose bar at the top of the activity section
- Tabs between Note, DM, Follow-Up, and Task modes
- Note tab: textarea with Ctrl+Enter submit
- DM tab: direct link to Instagram DM
- Follow-Up tab: preset buttons (Today, Tomorrow, In 3 days) + custom datetime picker
- Task tab: title + due date + add button

**Pipeline Stage Visual Stepper:**
- Replaced tag-style stage buttons with a horizontal progress stepper with connecting lines between stages
- Shows how many days the lead has been in the current stage
- Orange "stuck" warning indicator when no activity for 5+ days

**Contact Panel Quick Actions:**
- Added quick-action icon row: copy email, open Instagram profile, send DM
- Added "Last Contacted" field showing last outbound DM timestamp

**Lead Score Visual Badge:**
- Colored badge in the header: green (7-10), amber (4-6), red (1-3)
- Shows star icon + score immediately visible on page open

**Smart "Next Action" Banner:**
- Banner below the stage stepper showing next scheduled follow-up or task
- Overdue follow-ups shown in red with "Send DM" CTA
- Yellow nudge when no follow-up is scheduled: "No follow-up scheduled — add one now" with quick Schedule button

**Follow-Up Scheduling UX:**
- Quick date-picker popover on the Follow-Up button with presets: Today, Tomorrow, In 3 days, Custom
- Follow-up date shown as a badge in the lead header (amber for upcoming, red for overdue)

**Lead Navigation Context:**
- Updated counter to show "X of Y Leads" format
- Added J/K keyboard shortcuts for navigating between leads (in addition to existing arrow keys)
- Tooltips on nav buttons showing keyboard shortcuts

**"Mark Ghosted" Overflow Menu:**
- Moved "Mark Ghosted" out of the header into a ... overflow dropdown menu
- When triggered, shows AlertDialog asking: "Schedule a re-engagement follow-up in 30 days?"
- Options: Cancel, Just Ghost, Ghost + Schedule Follow-Up

**General UX:**
- Relative timestamps with absolute datetime tooltips on hover throughout (activity feed, DM messages, task due dates, created date)
- Keyboard shortcut hints: N for note, F for follow-up, T for task (shown in overflow menu)

### Location

- **Frontend page:** `src/pages/LeadDetail.tsx`

---

## Virality Score Algorithm

Per-post virality score that measures how much a post outperforms its account's baseline engagement. Uses per-competitor averages as the baseline so a small account going viral is scored the same as a large account going viral.

### Formula

```
viralityScore = 0.5 × (views / avgViews) + 0.3 × (likes / avgLikes) + 0.2 × (comments / avgComments)
```

Where averages are computed per-competitor across all their tracked posts. Score of ~1.0 = normal, 2–3 = strong performer, 3+ = viral.

### Changes

- Backend computes per-competitor averages via aggregation, returns `viralityScore` with each post
- `sort_by=virality` sorts all matching posts by score (computed in-memory) with proper pagination
- Default sort changed from "newest" to "Most Viral"
- Virality column in table with color-coded badges: gray (<1.5×), amber (1.5–3×), red with flame icon (3×+)
- Column header is sortable (client-side asc/desc toggle)

### Location

- **Backend route:** `quddify-crm/routes/research.js` (`GET /api/research/posts`)
- **Frontend page:** `src/pages/research/PostsLibrary.tsx`
- **Frontend type:** `src/lib/research-types.ts` (`viralityScore` added to `ResearchPost`, `"virality"` added to `PostSortBy`)
- **Frontend hook:** `src/hooks/useResearchPosts.ts` (`virality` → `virality` mapping)

---

## Advisory Module — Frontend

Client management and session tracking for advisory/coaching clients. Includes a dashboard with aggregate metrics, individual client detail pages with session logs and monthly metrics history.

### Routes

- `/advisory` — Advisory dashboard with stat cards, client grid, search, filters, and pagination
- `/advisory/clients/:id` — Client detail page with info card, latest metrics, session history, and metrics table

### API Endpoints Consumed

- `GET /api/advisory/clients` — Paginated client list with search, status, and health filters
- `GET /api/advisory/clients/:id` — Single client with populated latest_session and latest_metric
- `POST /api/advisory/clients` — Create a new client
- `PATCH /api/advisory/clients/:id` — Update a client
- `DELETE /api/advisory/clients/:id` — Soft delete a client
- `GET /api/advisory/sessions` — Paginated session list, filterable by client_id
- `GET /api/advisory/sessions/:id` — Single session
- `POST /api/advisory/sessions` — Create a session with action items
- `PATCH /api/advisory/sessions/:id` — Update a session (including action item toggles)
- `DELETE /api/advisory/sessions/:id` — Delete a session
- `GET /api/advisory/metrics` — Metrics list, filterable by client_id
- `GET /api/advisory/metrics/summary` — Aggregate summary (total MRR, cash collected, avg show/close rate)
- `POST /api/advisory/metrics` — Upsert monthly metrics for a client
- `PATCH /api/advisory/metrics/:id` — Update a metric

### Location

- **Types:** `src/lib/advisory-types.ts`
- **Hooks:** `src/hooks/useAdvisoryClients.ts`, `src/hooks/useAdvisorySessions.ts`, `src/hooks/useAdvisoryMetrics.ts`
- **Components:** `src/components/advisory/` — ClientHealthBadge, ConstraintBadge, ClientCard, ActionItemList, SessionCard, MetricInputRow, CreateClientDialog, CreateSessionDialog, UpsertMetricDialog
- **Pages:** `src/pages/AdvisoryDashboard.tsx`, `src/pages/AdvisoryClientDetail.tsx`
- **Routing:** `src/App.tsx` (lazy-loaded routes)
- **Sidebar:** `src/hooks/useNavSections.ts` (Advisory section with Clients item)

### Tests

- `src/hooks/useAdvisoryClients.test.ts` — Hook tests for pagination params, search, filters, error handling
- `src/components/advisory/ClientHealthBadge.test.tsx` — Renders correct text and color for each health value
- `src/components/advisory/ActionItemList.test.tsx` — Renders items, strikethrough on completed, empty state, overdue styling
- `src/pages/AdvisoryDashboard.test.tsx` — Renders stat cards, client list, search input, New Client button

---

## Contacts List View Redesign

Redesigned the All Contacts list from a sparse 4-column table into a full CRM pipeline view with rich data density, bulk selection, and visual polish.

### Changes

- **Status column with color-coded pipeline pills** — Each row shows its pipeline stage (New / Link Sent / Follow Up / Booked / Closed / Ghosted) as a colored pill with a dot indicator, matching the colors from Lead Detail.
- **Avatar/initials column** — Colored initial circle before each name for visual scanability.
- **Last Activity column with icons** — Shows activity type icon + label + relative time (e.g. "Link sent · 1d ago", "Booked · 4h ago"). Icons are color-coded per activity type.
- **Blank cells instead of dashes** — Empty dates render as blank space instead of a wall of `—` dashes.
- **Null name guard** — Names with literal "null" values (e.g. "Divano null") are cleaned to show just the valid parts or "Unknown".
- **Row hover quick actions** — Each row reveals an "Open" button and a "..." dropdown on hover with actions: Mark Link Sent, Mark Booked, Mark Closed, Mark Ghosted, Clear Ghosted. Actions call `PATCH /leads/:id` directly.
- **Green Add Lead button** — Changed from yellow to emerald green for brand consistency.
- **Stats bar** — Labels upgraded to uppercase tracking-wide. Rate values color-coded green/amber/red. Stats are clickable: clicking "Link Sent 108" filters the table to only Link Sent leads; clicking "Total Leads" clears the filter.
- **Leaner columns** — Removed Score and Converted columns (mostly empty data) to reduce sparsity.
- **Bulk action bar** — Blue-highlighted bar appears when leads are selected. Actions: Change Status (dropdown with Link Sent, Booked, Closed, Ghosted), Export as CSV, Clear selection. Uses sequential `PATCH /leads/:id` calls.
- **CSV export** — Exports selected leads as CSV with Name, Email, Status, Created, Link Sent, Booked, Closed columns.
- **Expanded status filter** — Filter popover now includes all 6 pipeline stages with colored dots.
- **Kanban/Board view** — Toggle between List and Board views (persisted to localStorage). Board view renders 6 draggable columns (New → Link Sent → Follow Up → Booked → Closed → Ghosted) using `@dnd-kit/core`. Dragging a card between columns calls `PATCH /leads/:id` to update the stage. Each card shows avatar, name, email, score, and time since last activity.
- **View toggle** — Pill-shaped List/Board toggle next to the Add Lead button.

### Location

- **Contacts table:** `src/components/contacts-table.tsx`
- **Kanban board:** `src/components/contacts-kanban.tsx`
- **All Contacts page:** `src/pages/AllContacts.tsx`
- **Selection hook:** `src/hooks/useLeadSelection.ts` (pre-existing)

---

## Quick Note Dialog

Add and view notes on outbound leads directly from the Follow-Ups kanban board and Outbound Leads table without navigating to a detail page. Opens a dialog showing the lead's full note history with author, timestamp, and delete. Extends the existing LeadNote system to support `outbound_lead_id` as an alternative to `lead_id`.

### Location

- **Frontend component:** `src/components/QuickNoteDialog.tsx`
- **Frontend hook:** `src/hooks/useLeadNotes.ts` (`useOutboundLeadNotes`, `useCreateOutboundLeadNote`)
- **Integrated in:** `src/pages/OutboundLeads.tsx` (StickyNote icon per row)
- **Backend model:** `quddify-crm/models/LeadNote.js` (`outbound_lead_id` field added, `lead_id` made optional)
- **Backend route:** `quddify-crm/routes/lead-notes.js` (GET/POST accept `outbound_lead_id`)

### API

- **`GET /api/lead-notes?outbound_lead_id=`** — List notes for an outbound lead
- **`POST /api/lead-notes`** — Body: `{ outbound_lead_id, content }` (alternative to `lead_id`)

---

## End of Day Report

Daily summary page where team members log their end-of-day checklist completion, mood, and reflection notes. Stats (DMs sent, replies, bookings, follow-ups closed) are pulled automatically from the backend. Admins can view all team members' reports in a Team tab.

### Location

- **Frontend page:** `src/pages/EodReport.tsx`
- **Frontend hook:** `src/hooks/useEodReports.ts` (`useTodayReport`, `useTeamReports`, `useSubmitReport`, `useUpdateReport`)

### API Routes

- **`GET /api/eod-reports/today`** — Fetch the current user's report for today
- **`GET /api/eod-reports/team`** — Query: `date` (optional). List all team reports for a given date (admin only)
- **`POST /api/eod-reports`** — Body: `{ checklist?, notes?, mood? }`. Create or update today's report
- **`PATCH /api/eod-reports/:id`** — Body: `{ checklist?, notes?, mood? }`. Update an existing report

### Backend

- **Model:** `quddify-crm/models/EodReport.js`
- **Routes:** `quddify-crm/routes/eod-reports.js`
- **Wired in:** `quddify-crm/index.js`

---

## Score-based Analytics (Outbound)

Shows outbound lead performance broken down by lead score (1-5 stars). Displays sent, replied, booked, reply rate, book rate, close rate, and average revenue per score tier. Rendered as the first card in the Insights tab.

### Location

- **Frontend component:** `src/components/outbound-analytics/ScoreBreakdown.tsx`
- **Frontend hook:** `src/hooks/useOutboundAnalytics.ts` (`useScoreBreakdown`, `ScoreTierData`)
- **Integrated in:** `src/components/outbound-analytics/InsightsTab.tsx`, `src/pages/OutboundAnalytics.tsx`

### API Routes

- **`GET /api/analytics/outbound/score-breakdown`** — Query: `start_date`, `end_date`, `campaign_id` (all optional). Returns `{ tiers: ScoreTierData[] }`

### Backend

- **Model change:** `quddify-crm/models/OutboundLead.js` (`score` field added)
- **Route:** `quddify-crm/routes/analytics.js` (new endpoint)

---

## Weekly Activity Heatmap (Analytics)

A 7-day x 24-hour heatmap grid showing outbound activity patterns by day of week and hour. Supports switching between sent, replied, and booked metrics. Rendered in the funnel tab after the existing Activity Heatmap.

### Location

- **Frontend component:** `src/components/outbound-analytics/WeeklyHeatmap.tsx`
- **Frontend hook:** `src/hooks/useOutboundAnalytics.ts` (`useWeeklyHeatmap`, `WeeklyHeatmapCell`)
- **Integrated in:** `src/pages/OutboundAnalytics.tsx`

### API Routes

- **`GET /api/analytics/outbound/weekly-heatmap`** — Query: `start_date`, `end_date`, `campaign_id`, `metric` (all optional). Returns `{ cells: WeeklyHeatmapCell[] }`

### Backend

- **Route:** `quddify-crm/routes/analytics.js` (new endpoint)

---

## Inbound Analytics

Dashboard page at `/analytics/inbound` showing inbound lead funnel metrics, source attribution, post performance, and daily volume trends.

### Location

- **Frontend page:** `src/pages/InboundAnalytics.tsx`
- **Frontend hooks:** `src/hooks/useInboundAnalytics.ts` (`useInboundOverview`, `useInboundPosts`, `useInboundDaily`)
- **Frontend route:** `src/App.tsx` (`/analytics/inbound`)
- **Backend routes:** `quddify-crm/routes/analytics.js` (inbound section)

### API Routes

- **`GET /analytics/inbound`** — Overview KPIs + source breakdown. Query: `start_date`, `end_date`. Returns `{ total, booked, closed, book_rate, close_rate, revenue, cross_channel, cross_channel_rate, sources[] }`.
- **`GET /analytics/inbound/posts`** — Post performance table. Same query params. Returns `{ posts[] }` with `post_url`, totals, rates, revenue.
- **`GET /analytics/inbound/daily`** — Daily volume chart data. Same query params. Returns `{ days[] }` with date, created, booked, closed.

---

## Lead Push Notifications

Real-time push notifications when a new lead is created or an outbound lead replies via Instagram DM.

### Description

When the Instagram webhook receives an inbound DM:
- If an **OutboundLead** replies for the first time → `lead_replied` notification
- If a **Lead** (inbound pipeline) first contacts us → `new_lead` notification

Both in-app (Socket.IO toast + notification bell) and browser push (works when tab is closed) are supported. The feature can be disabled per-account in Settings.

### Location in codebase

**Backend:**
- `models/PushSubscription.js` — stores browser push subscriptions per account
- `models/Account.js` — `push_notifications_enabled` field
- `models/Notification.js` — added `new_lead`, `lead_replied` enum types
- `services/pushNotifications.js` — VAPID web-push service
- `routes/push-subscriptions.js` — save/delete subscriptions + serve VAPID public key
- `routes/notifications.js` — `GET/PATCH /api/notifications/settings`
- `routes/instagram-webhook.js` — fires `fireLeadNotification()` on reply/new lead events

**Frontend:**
- `public/sw.js` — service worker that shows browser push notifications
- `hooks/usePushNotifications.ts` — subscribe/unsubscribe to browser push
- `contexts/SocketContext.tsx` — listens for `notification:lead` Socket.IO events, shows toasts, tracks unread count
- `components/NotificationBell.tsx` — bell icon with unread badge + popover in header
- `components/DashboardLayout.tsx` — renders `<NotificationBell />`
- `pages/UserSettings.tsx` — Notifications card with enable/disable toggles

### API Routes

- **`GET /api/push-subscriptions/vapid-public-key`** — returns VAPID public key
- **`POST /api/push-subscriptions`** — save a browser push subscription
- **`DELETE /api/push-subscriptions`** — remove a browser push subscription
- **`GET /api/notifications/settings`** — get `push_notifications_enabled` for account
- **`PATCH /api/notifications/settings`** — toggle `push_notifications_enabled`

### Required env vars (backend)

```
VAPID_PUBLIC_KEY=BIpa0UnGrlsJ4s6Ueooa2OzFQlG2Cz1Dwczhly-mrPtC6Wj8rDERoPh5iKzV1lfX7xcVTKYOAT0ZObcqBEdB7y8
VAPID_PRIVATE_KEY=2Ij7qLB2H8NJ1mn0ufryWrRUVbRxG3V81E2woAT9Gg4
```

---

## Delete Inbound Leads

Remove inbound leads individually or in bulk from the All Contacts page. Each delete action requires confirmation via an AlertDialog to prevent accidental removal.

### Features

- **Single delete:** "Delete Lead" option in the per-row "..." dropdown menu with red styling and trash icon. Shows confirmation dialog before deleting.
- **Bulk delete:** "Delete" button in the bulk action bar (appears when leads are selected). Shows confirmation dialog with count of leads to be deleted.

### Location

- **Contacts table:** `src/components/contacts-table.tsx` (Delete menu item + AlertDialog in RowActions)
- **All Contacts page:** `src/pages/AllContacts.tsx` (deleteLead handler, handleBulkDelete, bulk delete confirmation dialog)

### API Routes

- **`DELETE /leads/:id`** — Permanently deletes an inbound lead (pre-existing backend endpoint)

---

## Delete Lead from Lead Detail Page

Delete an inbound lead directly from the Lead Detail page via the "..." overflow menu. Shows a confirmation dialog before permanently removing the lead, then navigates back to the contacts list.

### Location

- **Frontend page:** `src/pages/LeadDetail.tsx` (Delete menu item in overflow dropdown + AlertDialog confirmation + deleteLead handler)
- **Frontend test:** `src/pages/LeadDetail.test.tsx` (delete option visibility, confirmation dialog)

### API Routes

- **`DELETE /leads/:id`** — Permanently deletes an inbound lead (pre-existing backend endpoint)

---

## Calendly Automatic Inbound Lead Creation

Calendly bookings automatically create inbound leads in the CRM. Handles three scenarios:

1. **Existing inbound lead** — matched by `contact_id` via `utm_medium`. Updates `booked_at`, email, and Q&A.
2. **contact_id present, no existing lead** — creates a new lead with the contact_id instead of returning 404.
3. **Standalone booking** (YouTube, ads, organic) — no `contact_id`. Creates a new lead with `source: "calendly"`, deduplicating by email to prevent duplicates from re-bookings.

Account resolution uses three fallbacks: `utm_source`, `?account=` query param on the webhook URL, or matching the Calendly event creator to the stored `calendly_user_uri` on the Account.

### Location

- **Webhook handler:** `quddify-crm/routes/calendly.js` (`POST /api/calendly`)
- **Webhook registration:** `quddify-crm/routes/calendly.js` (`POST /calendly/add`)
- **Account model:** `quddify-crm/models/Account.js` (`calendly_user_uri` field)
- **Tests:** `quddify-crm/routes/calendly.test.js`

### API Routes

- **`POST /api/calendly`** — Public Calendly webhook endpoint. Receives `invitee.created` events and creates/updates leads.
- **`POST /calendly/add`** — Authenticated. Registers a Calendly webhook subscription and stores the token + user URI on the account.

---

## Sales Performance Dashboard

Surfaces sales KPIs and source attribution directly on the main dashboard. Shows overall close rate, show-up rate, total revenue, and average deal value. Breaks down close rate and revenue by marketing source (utm_source: youtube, ig, email, etc.) and top mediums (utm_medium: video title, email subject, etc.).

UTM attribution flows from Calendly booking links → Lead model → Booking model. The Calendly webhook stores `utm_source` and `utm_medium` from the booking link's tracking params. The booking sync propagates these to Booking records. Outbound bookings default to `utm_source: "ig"`.

### Location

- **Component:** `src/components/dashboard/SalesOverview.tsx`
- **Types:** `src/lib/types.ts` (`SalesMetrics`, `SalesSourceMetrics`, `SalesMediumMetrics`)
- **Hook:** `src/hooks/useAnalytics.ts` (extended `AnalyticsResponse` with `sales` field)
- **Dashboard:** `src/pages/Index.tsx` (rendered after FunnelOverview)
- **Skeleton:** `src/components/dashboard/DashboardSkeleton.tsx`
- **Backend models:** `quddify-crm/models/Booking.js` (`utm_source`, `utm_medium` fields), `quddify-crm/models/Lead.js` (`utm_source`, `utm_medium` fields)
- **Backend routes:** `quddify-crm/routes/analytics.js` (sales metrics in GET /analytics), `quddify-crm/routes/calendly.js` (UTM storage + account resolution priority change), `quddify-crm/routes/bookings.js` (UTM propagation in sync/CRUD)
- **Tests:** `src/components/dashboard/SalesOverview.test.tsx`

### API Routes

- **`GET /analytics`** — Extended to return `sales` object with `total_bookings`, `overall_close_rate`, `overall_show_up_rate`, `total_revenue`, `avg_deal_value`, `by_source[]`, and `by_medium[]`.

---

## Import Data Page

Central import hub under Workspace for bringing in data from external tools. Currently supports Calendly CSV imports, with Stripe planned.

### Location

- **Page:** `src/pages/Import.tsx`
- **Nav:** Workspace → "Import" (`/import`)
- **Route:** `src/App.tsx`

---

## Calendly CSV Booking Import

Import bookings from Calendly's CSV/XLSX export. Supports drag-and-drop file upload, auto-detects column mappings using synonym matching (e.g. "Invitee Name" → Contact Name, "Start Date & Time" → Booking Date), shows a preview with mapping overrides, and bulk-imports to the database.

Supports Calendly-specific status mapping: "Active" → scheduled, "Canceled" → cancelled. Preserves UTM attribution columns (UTM Source, UTM Medium) for sales analytics.

### Location

- **Dialog:** `src/components/ImportBookingsDialog.tsx`
- **Page:** `src/pages/Import.tsx` (Calendly card)
- **Backend:** `quddify-crm/routes/bookings.js` (`POST /api/bookings/import`)
- **Tests:** `src/components/ImportBookingsDialog.test.tsx`

### API Routes

- **`POST /api/bookings/import`** — Accepts `{ rows: [...] }` JSON body with mapped booking data. Validates required fields (booking_date), maps Calendly status values, and bulk-inserts. Returns `{ imported, skipped, errors[] }`.

---

## Stripe Integration

Captures Stripe payment events (checkout, invoices, charges) via webhook and matches them to leads by email. Payments appear on the lead's timeline with amount, currency, and description. Auto-closes leads (sets `closed_at` and adds to `contract_value`) on payment match.

Supports multiple emails per lead via the `emails` array field — Stripe matching checks both primary `email` and `emails` array. Users can add/remove secondary emails from the lead detail contact card.

### Location

- **Backend route:** `quddify-crm/routes/stripe.js` (webhook, connect, disconnect, payments, import)
- **Payment model:** `quddify-crm/models/Payment.js`
- **Lead model:** `quddify-crm/models/Lead.js` (`emails` array field)
- **Account model:** `quddify-crm/models/Account.js` (`stripe_webhook_secret` encrypted field)
- **Integrations UI:** `src/components/integrations/ConnectionsSection.tsx` (Stripe card)
- **Timeline:** `src/pages/LeadDetail.tsx` (payment activity items)
- **Hook:** `src/hooks/usePayments.ts` (`useLeadPayments`)
- **Import dialog:** `src/components/ImportPaymentsDialog.tsx`
- **Import page:** `src/pages/Import.tsx` (Stripe card)
- **Types:** `src/lib/types.ts` (`Payment` interface)

### API Routes

- **`POST /api/stripe/webhook?account=GHL_ID`** — Public. Stripe signature verified. Handles `checkout.session.completed`, `invoice.paid`, `charge.succeeded`. Creates Payment record, matches to lead by email, auto-closes.
- **`POST /api/stripe/connect`** — Authenticated. Saves encrypted webhook signing secret.
- **`DELETE /api/stripe/disconnect`** — Authenticated. Removes webhook secret.
- **`GET /api/stripe/payments/:leadId`** — Authenticated. Returns payments for a lead.
- **`POST /api/stripe/import`** — Authenticated. Bulk import payments from CSV. Matches to leads, auto-closes.

---

## Voice Note DMs (Backend)

Send pre-recorded audio voice notes via Instagram DM through the Chrome extension. Voice notes are uploaded to the server, stored alongside campaigns, and delivered to the extension as tasks with a `voice_note_url` field. The extension will spoof `getUserMedia` to feed the pre-recorded audio to Instagram's voice note recorder.

### How It Works

1. User uploads an audio file via the voice notes API
2. The audio URL is stored in the campaign's `voice_notes` array
3. During campaign rotation, text messages and voice notes are interleaved — the scheduler rotates through both
4. Tasks with `voice_note_url` (instead of `message`) signal the extension to send a voice note

### Location

- **Backend model:** `quddify-crm/models/Task.js` (`voice_note_url` field)
- **Backend model:** `quddify-crm/models/Campaign.js` (`voice_notes` array with `url`, `label`, `duration_ms`, `original_filename`)
- **Backend route:** `quddify-crm/routes/voice-notes.js` (upload + delete)
- **Backend scheduler:** `quddify-crm/services/campaignScheduler.js` (voice note rotation in `processDM` + `processTick`)
- **Backend manual campaigns:** `quddify-crm/routes/manual-campaigns.js` (voice note rotation in `/next`)
- **Backend task creation:** `quddify-crm/routes/tasks.js` (accepts `voice_note_url` in task creation)
- **Backend wiring:** `quddify-crm/index.js` (`/api/voice-notes`)

### API Routes

- **`POST /api/voice-notes/upload`** — Form data: `audio` (file), `campaign_id` (optional), `duration_ms` (optional). Max 10MB, 60s. Returns `{ url, storage_key, original_filename, mime_type, file_size, duration_ms }`.
- **`DELETE /api/voice-notes`** — Body: `{ storage_key }`. Deletes the audio file. Tenant-isolated by account prefix.

## Campaign Senders Management (Modal)

Add/remove outbound accounts directly from the Campaign Senders modal on the campaign detail page (`campaigns/:id`). Available when the campaign is in draft or paused status.

### Files

- `src/components/campaigns/CampaignDetail.tsx` — Senders modal with "Edit Senders" toggle, checkbox list of outbound accounts, save/cancel
- `src/hooks/useCampaigns.ts` — `useUpdateCampaign` now invalidates `campaign-senders` query on success

### API Routes

- **`PATCH /api/campaigns/:id`** — Existing route; accepts `outbound_account_ids` to update which senders are assigned to the campaign (draft/paused only)

## Source Analytics

Shows which scraping source (seed account or import method) produces the best leads. A "Sources" tab in Outbound Analytics displays per-source funnel metrics: sent, replied, link sent, booked, revenue, reply rate, book rate, and average lead score.

### Files

- `src/pages/OutboundAnalytics.tsx` — Sources tab with sortable table
- `src/hooks/useOutboundAnalytics.ts` — `useSourceAnalytics` hook + `SourcePerformance` interface

### API Routes

- **`GET /api/analytics/outbound/sources`** — Aggregates outbound leads by `source_seeds` / `source` field, returns per-source funnel metrics. Supports `start_date`, `end_date`, `campaign_id` query params.

## Calendly Auto-Booking + Cancellation Handling

Calendly webhook now automatically creates Booking records when someone books a call (`invitee.created`), and cancels them when the invitee cancels (`invitee.canceled`). The webhook also auto-links new inbound leads to existing outbound leads by matching email or IG username from Calendly Q&A answers. UTM params (utm_source, utm_medium, utm_campaign) are propagated from Calendly to both the Lead and Booking records.

### Files

- `models/Booking.js` — Added `calendly_event_uri`, `calendly_invitee_uri`, `utm_campaign`, `fathom_recording_url`, `fathom_recording_id` fields; sparse index on `calendly_event_uri`
- `routes/calendly.js` — Refactored `resolveAccount` → `resolveAccountAndEvent` to also fetch event start time; added `upsertBooking`, `tryLinkOutboundLead`, `fetchCalendlyEvent` helpers; cancellation handler; webhook subscription now includes `invitee.canceled`

### API Routes

- **`POST /api/calendly`** — Handles `invitee.created` (creates Lead + Booking, auto-links outbound) and `invitee.canceled` (cancels Booking)
- **`POST /calendly/add`** — Now subscribes to both `invitee.created` and `invitee.canceled` events

## ClickUp Error Reporting

Automatically reports all 500-level server errors to a dedicated ClickUp list as tasks. Each task includes the HTTP method, URL, request ID, error message, and full stack trace. Errors are deduplicated within a 30-minute window to prevent flooding.

### Files

- `utils/clickupErrorReporter.js` — Fire-and-forget function that creates ClickUp tasks for server errors with deduplication
- `middleware/errorHandler.js` — Integrated ClickUp reporting for all 5xx errors
- `utils/clickupErrorReporter.test.js` — Unit tests for error reporter

### API Routes

- Uses ClickUp API: `POST https://api.clickup.com/api/v2/list/{CLICKUP_ERROR_LIST_ID}/task`

### Environment Variables

- `CLICKUP_API_TOKEN` — ClickUp personal API token
- `CLICKUP_ERROR_LIST_ID` — ClickUp list ID for error tasks (currently: 901522601770)

## Lead Detail UI Improvements (Inbound + Outbound)

Comprehensive UI polish for both lead detail pages covering pipeline stepper clarity, layout hierarchy, conversation readability, and activity feed expressiveness.

### Changes

**Pipeline Stepper (Inbound)**
- Added per-stage icons (CircleDot, Link, CalendarClock, CalendarCheck, CheckCircle) matching the outbound pattern
- Icons collapse to icon-only on mobile, label visible on `sm+`
- Improved tooltip copy: completed stages now say "click to reset to X"

**Pipeline Stepper (Outbound)**
- Added hover tooltips to each stage for discoverability

**Header — Overdue Deduplication (Inbound)**
- Removed redundant follow-up badge from header when a scheduled (non-overdue) follow-up exists — the NextActionBanner below already shows that info
- Header badge now only appears for **overdue** follow-ups as a compact "Overdue" tag

**Left Sidebar (Both)**
- Made sidebar sticky on desktop (`lg:sticky lg:top-4`) so contact/deal info stays visible while scrolling
- Increased grid gap from `gap-4` to `gap-6` for better breathing room (outbound)

**Contact Card (Inbound)**
- Hidden "Last Contacted: Never" — empty field no longer shown
- Added tooltip to Score label: "Deal priority (1-5)" with explanation

**Summary Cards (Inbound)**
- Dash-list bullet items (`- item`) now render as proper styled bullet lists with dot indicators
- Non-bullet text still renders as plain paragraphs

**DM Conversations (Both)**
- GHL AI bot messages now show a small purple "AI" badge directly on the message bubble (instead of below)
- "Showing X of Y messages" now has a clearer visual separator (border-top + centered)

**Activity Feed (Inbound)**
- Replaced plain colored dots with contextual icons in colored circular backgrounds per event type:
  - Notes → StickyNote (blue), Tasks → SquareCheckBig (green), Payments → DollarSign (green)
  - Stage events → matching pipeline icon (Link, CalendarClock, CalendarCheck, CheckCircle, Ghost)
- Removed redundant inline icons from task-completed and payment activity items

### Files

- `src/pages/LeadDetail.tsx` — All inbound improvements
- `src/pages/OutboundLeadDetail.tsx` — Outbound improvements (sticky sidebar, bot badges, tooltips, load-more CTA)

## Campaign Relaunch

Relaunch unsent leads from an existing campaign into a new versioned campaign (e.g. "My Campaign V2", "V3", etc.) with an updated AI prompt. Accessible from the AI Analytics Report tab.

### Files

- `routes/campaigns.js` — `POST /campaigns/:id/relaunch` backend endpoint
- `src/hooks/useCampaigns.ts` — `useRelaunchCampaign` mutation hook
- `src/components/outbound-analytics/RelaunchCampaignDialog.tsx` — Dialog with campaign selector, prompt editor, and pending lead count
- `src/components/outbound-analytics/AIReportTab.tsx` — Relaunch button in report header

### API Routes

- `POST /api/campaigns/:id/relaunch` — Creates a new versioned campaign with pending leads from the source and an optional updated AI prompt

## Per-Campaign AI Report

Collapsible AI Report section on the campaign detail page. Generates a report scoped to that specific campaign's data, with the same insights (message strategy, sender analysis, conversation patterns, etc.) and relaunch functionality.

### Files

- `src/components/campaigns/CampaignDetail.tsx` — Collapsible AI Report card between progress bar and leads table

## Split Report Recommendations (Message vs Operational)

AI reports now output two separate recommendation buckets:
- **Message Recommendations** — tone, structure, phrasing, opener examples. Fed into the DM-writing prompt on relaunch.
- **Operational Recommendations** — timing, sender accounts, targeting, scheduling. Displayed separately, NOT fed into the prompt.

### Files

- `services/analyticsReportGenerator.js` — Updated report schema with `message_recommendations` and `operational_recommendations` fields
- `src/hooks/useAIReports.ts` — Added TypeScript interfaces for new fields
- `src/components/outbound-analytics/AIReportTab.tsx` — Separate UI cards for message vs operational recommendations
- `src/components/outbound-analytics/RelaunchCampaignDialog.tsx` — Only uses `message_recommendations` for prompt enhancement

## Prompt History

Tracks every prompt used to generate messages on a campaign, with timestamp, lead count, and AI provider. Displayed in the AI Personalization modal — click any past prompt to reload it.

### Files

- `models/Campaign.js` — Added `prompt_history` array field
- `routes/campaigns.js` — Pushes to `prompt_history` on `POST /campaigns/:id/generate-messages`
- `src/hooks/useCampaigns.ts` — Added `PromptHistoryEntry` interface and `prompt_history` to `Campaign`
- `src/components/campaigns/CampaignDetail.tsx` — Clickable prompt history list in AI Personalization modal

## Lead Page Field Visibility

Account admins/owners can hide specific sections on the lead detail page for everyone in the account. Useful for clients who only use inbound AI + Calendly and shouldn't see Instagram DM history or outbound campaign data. Configured per-account in User Settings; persisted on the `Account` document so all members see the same view.

Currently toggleable sections:
- **Instagram DM conversations** — hides the IG DM history card, the GHL chat-memory card, and the "Link conversation" prompt
- **Outbound campaign data** — hides the Outbound Lead linker card on the lead sidebar

### Files

- `models/Account.js` — `lead_visibility: { dms, outbound }` schema (defaults true)
- `routes/accounts.js` — `PATCH /accounts/:id` accepts `lead_visibility` from admins/owners; `/accounts/me` and login responses return it
- `src/contexts/AuthContext.tsx` — `LeadVisibility` exposed on `user.lead_visibility`
- `src/pages/UserSettings.tsx` — "Lead Page Visibility" card with two switches (admin/owner only)
- `src/pages/LeadDetail.tsx` — `dmsVisible` derived flag gates the DM cards; outbound section gated by `user.lead_visibility.outbound`

### API Routes

- `PATCH /accounts/:id` with body `{ lead_visibility: { dms, outbound } }` — admins/owners only

---

## CSV Support for Lead Uploads

Both lead upload pages now accept `.csv` files in addition to `.xlsx`. The SheetJS library already parses CSV natively, so no parser changes were needed — only UI acceptance filters and backend filename validation were updated.

### Location

- **Upload page (scrape jobs):** `src/pages/UploadXlsx.tsx` — accepts `.xlsx` and `.csv`, filename regex updated
- **Import page (outbound leads):** `src/pages/ImportOutboundLeads.tsx` — accepts `.xlsx`, `.xls`, and `.csv`
- **Column mapping lib:** `src/lib/column-mapping.ts` — `parseXlsxPreview()` works for both formats via SheetJS
- **Backend service:** `quddify-crm/services/uploadService.js` — `FILENAME_REGEX` updated to accept `.csv`

## Editable Team Member Role

The client detail page (`/clients/:id`) now allows admins/owners to change a team member's role inline via a dropdown. Roles available: Owner (1) and Team Member (2). Users cannot change their own role to avoid lockout.

### Location

- **Frontend:** `src/pages/ClientDetail.tsx` — Role column replaced with `<Select>` dropdown calling `handleChangeRole`; `useTeamMembers.ts` update body now accepts `role?: number`
- **Backend:** `quddify-crm/routes/accounts.js` — `PATCH /accounts/:id` now accepts `role` in `membershipUpdates`; only global admins (user.role === 0) or account owners (membership.role === 1) can change it; self-edits rejected; role validated to be 0/1/2

### API

- **`PATCH /api/accounts/:id`** — Body now optionally accepts `role: 0|1|2`. Returns 403 if caller is not admin/owner; 400 for invalid role or self-edit.

## Bulk Import Outbound Accounts

Upload a CSV or XLSX file to create outbound accounts in bulk. The dialog parses the file client-side, auto-maps column headers to account fields using synonym matching, shows a preview, and then sends the mapped rows to a bulk endpoint. Duplicate usernames (both within the file and against existing accounts) are skipped with a count.

### Location

- **Dialog component:** `src/components/outbound-accounts/BulkImportAccountsDialog.tsx` — 3-step flow (upload → map columns → result)
- **Hook:** `src/hooks/useOutboundAccounts.ts` — `useBulkImportOutboundAccounts()` mutation
- **Page integration:** `src/pages/OutboundAccounts.tsx` — "Bulk Import" button in header bar

### API

- **`POST /api/outbound-accounts/bulk`** — Accepts `{ accounts: Array<{ username, password?, email?, emailPassword?, proxy?, status?, assignedTo?, notes?, twoFA?, hidemyacc_profile_id? }> }`. Max 5000 rows. Returns `{ created, duplicates, errors }`. Deduplicates within batch and against existing DB records. Uses `insertMany({ ordered: false })` for partial-failure tolerance.

## AI API Key Usage Tracking

Shows how much of each AI API key's credits/budget has been used, directly in the Integrations page. Fetches usage data from OpenAI, Anthropic (Claude), and Google (Gemini) APIs when a custom key is connected. Displays monthly spend, credit balance, and token counts depending on the provider.

- **OpenAI**: Shows monthly cost (via org costs endpoint) or credit grant balance (granted/used/remaining with progress bar)
- **Anthropic**: Shows monthly spend and input/output token counts (requires admin API key)
- **Gemini**: Notes that Google AI does not provide a billing API for API keys

### Files (backend — `quddify-crm`)

- `routes/ai-usage.js` — `GET /api/ai-usage` fetches usage from each provider using decrypted tokens
- `index.js` — Registers route at `/api/ai-usage`

### Files (frontend — `dm-setting`)

- `src/hooks/useAIUsage.ts` — React Query hook to fetch usage data
- `src/components/integrations/AITokenCard.tsx` — Updated to accept and display usage info (progress bars, token counts, error messages)
- `src/components/integrations/AIModelsSection.tsx` — Passes usage data to each AITokenCard
- `src/pages/Integrations.tsx` — Calls `useAIUsage` hook and passes data to AIModelsSection

### API

- **`GET /api/ai-usage`** — Returns `{ openai?: AIProviderUsage, claude?: AIProviderUsage, gemini?: AIProviderUsage }`. Each provider object contains usage metrics or an error message if the API key lacks billing permissions.
