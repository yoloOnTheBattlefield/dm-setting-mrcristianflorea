# Features

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
