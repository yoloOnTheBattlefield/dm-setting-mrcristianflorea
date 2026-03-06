# Features

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

## Unit Test Coverage

Foundational unit tests across backend utilities, middleware, services, and frontend logic.

### Backend Tests (quddify-crm)

**Utilities & Services:**
- **`utils/normalize.test.js`** — toNumber, toDate, toBoolean conversion functions (edge cases, type coercion, whitespace)
- **`utils/computeDailyLimit.test.js`** — Daily DM cap calculation per account status and warmup schedule
- **`utils/columnMapping.test.js`** — XLSX column mapping: field normalization, type conversion, username sanitization
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

## Cypress E2E Tests

End-to-end integration tests using Cypress with stubbed API calls (`cy.intercept()`). Tests run against the Vite dev server without requiring a backend.

### Location

- **Config:** `cypress.config.ts`
- **Support:** `cypress/support/commands.ts` (custom `cy.login()` command), `cypress/support/e2e.ts`
- **Tests:**
  - `cypress/e2e/outbound-leads.cy.ts` — Table rendering, search, pagination, bulk delete, lead status updates
  - `cypress/e2e/campaigns.cy.ts` — Campaign list, create dialog, detail navigation, start/pause/delete lifecycle
  - `cypress/e2e/deep-scraper.cy.ts` — Job list, create with seeds/URLs, pause/cancel/delete jobs

### Scripts

- `npm run cy:open` — Open Cypress GUI
- `npm run cy:run` — Run all E2E tests headlessly
