# Features

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

## Follow-Up Tracker

Track and manage outbound leads who have replied to DMs. Syncs replied leads from campaigns into a dedicated follow-up pipeline with status tracking, scheduling, and notes.

### Location

- **Frontend page:** `src/pages/FollowUps.tsx`
- **Frontend hook:** `src/hooks/useFollowUps.ts`
- **Sidebar nav:** `src/hooks/useNavSections.ts` (badge showing new + contacted + hot_lead count)
- **Nav badge rendering:** `src/components/nav-main.tsx`
- **Route:** `src/App.tsx` (`/follow-ups`)
- **Backend model:** `quddify-crm/models/FollowUp.js`
- **Backend routes:** `quddify-crm/routes/follow-ups.js`

### API Routes

- **GET `/api/follow-ups`** — Paginated list with outbound lead data. Params: `page`, `limit`, `status`, `search`, `sort` (newest/oldest/follow_up_date), `outbound_account_id`
- **GET `/api/follow-ups/stats`** — Count per status + total
- **POST `/api/follow-ups/sync`** — Upsert follow-up for every replied outbound lead. Resolves outbound account via CampaignLead -> SenderAccount chain
- **PATCH `/api/follow-ups/:id`** — Update status, follow_up_date, and/or note

### Statuses

new (amber), contacted (blue), interested (green), not_interested (red), booked (purple), no_response (gray), ghosted (gray), hot_lead (orange)

### Tests

- `src/pages/FollowUps.test.tsx` — Frontend component tests
- `quddify-crm/routes/follow-ups.test.js` — Backend route tests

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

On-demand AI analytics report that uses Claude Opus to analyze outreach data and generate actionable insights. Compares sender accounts, message strategies, industries/niches (via bio keyword extraction), campaigns, and timing patterns. Generates a structured report with executive summary, per-section analysis, and prioritized action items. Includes PDF export via print-to-PDF with styled HTML output.

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

## Add Deep Scrape Leads to Campaign

Adds an "Add to Campaign" button on each completed deep scrape job that has qualified leads. Opens a dialog to pick a campaign, then bulk-adds all qualified leads from that job to the selected campaign. Duplicates already in the campaign are skipped.

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
- **Integrated in:** `src/pages/OutboundLeads.tsx` (StickyNote icon per row), `src/pages/FollowUps.tsx` (FileText icon per kanban card)
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

## Bookings Module

Manage booked calls and appointments with status tracking, sync, search, creation, and analytics. Includes a main bookings table page and a dedicated analytics page with close rate, show-up rate, and charts.

### Routes

- `/bookings` — Bookings list with status filter tabs, stat cards, search, create dialog, sync, and pagination
- `/analytics/bookings` — Booking analytics with KPI cards (close rate, show-up rate, avg cash collected), bookings-over-time bar chart, and source distribution pie chart

### API Endpoints Consumed

- `GET /api/bookings` — Paginated list with status, search, sort, source, date range, and today filters
- `GET /api/bookings/stats` — Count per status + today count
- `GET /api/bookings/analytics` — Close rate, show-up rate, avg cash collected, over-time series, source distribution
- `GET /api/bookings/:id` — Single booking
- `POST /api/bookings` — Create a booking
- `PATCH /api/bookings/:id` — Update a booking (status, cash_collected, etc.)
- `DELETE /api/bookings/:id` — Delete a booking
- `POST /api/bookings/sync` — Sync bookings from external sources

### Location

- **Hook:** `src/hooks/useBookings.ts`
- **Pages:** `src/pages/Bookings.tsx`, `src/pages/BookingAnalytics.tsx`
- **Routing:** `src/App.tsx` (lazy-loaded routes)
- **Sidebar:** `src/hooks/useNavSections.ts` (Bookings item in Outbound section, EOD Report in Workspace section)

### Backend

- **Model:** `quddify-crm/models/Booking.js`
- **Routes:** `quddify-crm/routes/bookings.js`
- **Wired in:** `quddify-crm/index.js`

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
