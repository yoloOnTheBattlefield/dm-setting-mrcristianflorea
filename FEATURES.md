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
