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
