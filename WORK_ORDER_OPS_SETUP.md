# Work Order Ops Workflow — Setup & Testing Guide

This document describes how to deploy and test the new operational status workflow for Rich-IT work orders.

## ✅ Product Rules (Adir-Approved)

1. **Ops toggles AFTER signature only** — Visible only when work order status = `signed`
2. **Clear visual display** — Done+unpaid items show warning badge (high priority)
3. **«שולמו» folder = BOTH done AND paid** — Requires `isCompleted=true AND isPaid=true`
4. **Morning PWA push only** — Targets unpaid, prioritizes done+unpaid, no email/WhatsApp
5. **Draft PR, no merge** — Vercel settings untouched

## Features Implemented

### 1. Completion & Payment Toggles (After Signature)
- Ops Status card appears ONLY when work order `status = 'signed'`
- **בוצע / לא בוצע** toggle (Completed / Not Completed) with checkbox icon
- **שולם / לא שולם** toggle (Paid / Not Paid) with dollar icon
- Timestamps shown when status changes
- Independent booleans track operational status separately from document lifecycle

### 2. Paid Folder (BOTH Required)
- New route: `/work-orders/paid`
- Navigation buttons on work orders list page
- Shows ONLY work orders where **`is_completed = true AND is_paid = true`**
- Items must be fully complete to enter folder
- Clear visual badges distinguish fully complete vs done+unpaid
- Full Hebrew/Russian i18n support

### 3. Morning Push Notification (Unpaid Focus)
- Vercel Cron job: `0 5 * * *` (05:00 UTC)
  - **IDT** (daylight, ~Mar-Oct, UTC+3): **08:00** local ✅
  - **IST** (standard, ~Nov-Feb, UTC+2): **07:00** local
- Targets signed work orders where `is_paid = false`
- **Prioritizes done+unpaid** (work finished, payment pending)
- Message: "יש X שבוצעו ולא שולמו, ועוד Y שטרם שולמו"
- Deep-links to `/work-orders` (warning badges visible on done+unpaid)
- PWA device push only (no email, no WhatsApp)
- **Auth**: Fail-closed with `CRON_SECRET` (returns 401 if missing/invalid)
- Uses existing Serwist/Web Push infrastructure

## Database Migration

### Option A: Supabase SQL Editor
1. Open Supabase dashboard → SQL Editor
2. Paste and run:

```sql
alter table work_orders
  add column is_completed boolean not null default false,
  add column completed_at timestamptz,
  add column is_paid boolean not null default false,
  add column paid_at timestamptz;

create index work_orders_is_paid_idx on work_orders (is_paid);

comment on column work_orders.is_completed is 'Ops: work has been completed (בוצע)';
comment on column work_orders.completed_at is 'Timestamp when work was marked completed';
comment on column work_orders.is_paid is 'Ops: payment has been received (שולם)';
comment on column work_orders.paid_at is 'Timestamp when payment was marked received';
```

### Option B: psql CLI
```bash
psql $DATABASE_URL -f supabase/migrations/0002_add_work_order_ops_fields.sql
```

### Verify Migration
```sql
-- Check columns exist
\d work_orders

-- Should show:
-- is_completed     | boolean                     | not null default false
-- completed_at     | timestamp with time zone    |
-- is_paid          | boolean                     | not null default false
-- paid_at          | timestamp with time zone    |
```

## Environment Variables

### Required for Cron Job (Production Only)

Add to Vercel project settings (Settings → Environment Variables):

```bash
CRON_SECRET=<generate-secure-random-string>
```

**IMPORTANT:** The cron endpoint is **fail-closed**. If `CRON_SECRET` is missing or empty, the endpoint returns 401 Unauthorized and refuses to execute. Never deploy to production without setting this variable.

Generate a secure secret:
```bash
openssl rand -base64 32
# Example output: k8fJ2mN9pQ7rS1tU3vW5xY0zA1bC2dE4fG6hI8jK0lM=
```

### Required for Push Notifications (if not already set)

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BK...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:info@rich-it.co.il
```

Generate VAPID keys if needed:
```bash
npx web-push generate-vapid-keys
```

## Testing Checklist

### ✅ Test Ops Toggles (After Signature)

**Prerequisites:** Work order must have `status = 'signed'` (client approved/signed)

1. Navigate to a **signed** work order: `/work-orders/[id]`
2. If status is NOT "signed", ops status card should NOT appear
3. Once signed, locate the "סטטוס תפעולי" / "Операционный статус" card
4. Click "לא בוצע" button
   - Should toggle to "בוצע" with green checkmark
   - Should show "בוצע ב-[timestamp]" below
5. Click "בוצע" button again
   - Should toggle back to "לא בוצע" with empty circle
   - Timestamp should disappear
6. Click "לא שולם" button
   - Should toggle to "שולם" with green badge
   - Should show "שולם ב-[timestamp]" below
7. Click "שולם" button again
   - Should toggle back to "לא שולם"
   - Timestamp should disappear

### ✅ Test Paid Folder (BOTH Required)

1. Create test scenario:
   - Work order A: signed, `isCompleted=true`, `isPaid=true` ✅
   - Work order B: signed, `isCompleted=true`, `isPaid=false` ❌
   - Work order C: signed, `isCompleted=false`, `isPaid=true` ❌
2. Navigate to `/work-orders` main page
3. Should see two folder buttons:
   - "דפי שירות" (All work orders)
   - "שולמו" (Completed AND paid)
4. Click "שולמו" button
   - URL should change to `/work-orders/paid`
   - List should show ONLY work order A (both conditions true)
   - Work orders B and C should NOT appear
5. Click "דפי שירות" button
   - Should return to `/work-orders`
   - List should show all work orders

### ✅ Test Visual Display (Done+Unpaid Priority)

1. Create work order: signed, mark "בוצע" but NOT "שולם"
2. View in main work orders list
3. Should show **warning "לא שולם" badge** (orange/yellow)
4. This visually highlights high-priority items (work done, payment pending)
5. Mark as "שולם"
6. Badge should change to green "שולם"
7. Item should now appear in "שולמו" folder

### ✅ Test Morning Digest (Local)

**Prerequisites:** 
- VAPID keys configured
- At least one push subscription active (enable in Settings → Push notifications)
- At least one **signed** work order where `isPaid = false`

**Setup test scenario:**
- Work order A: signed, `isCompleted=true`, `isPaid=false` (done+unpaid = high priority)
- Work order B: signed, `isCompleted=false`, `isPaid=false` (not done, unpaid)

**Manual trigger:**
```bash
# Local development
curl http://localhost:3000/api/cron/morning-digest

# With CRON_SECRET (simulating Vercel)
curl -H "Authorization: Bearer your-secret-here" \
  http://localhost:3000/api/cron/morning-digest
```

**Expected response:**
```json
{
  "ok": true,
  "sent": true,
  "doneUnpaid": 1,
  "notDoneUnpaid": 1,
  "totalUnpaid": 2
}
```

**Expected behavior:**
- Push notification should appear on device/browser
- Title: "Rich IT — בוקר טוב"
- Body: "יש 1 דפי שירות שבוצעו ולא שולמו, ועוד 1 שטרם שולמו"
  - OR (if only done+unpaid): "יש X דפי שירות שבוצעו וממתינים לתשלום"
  - OR (if only not-done+unpaid): "יש X דפי שירות שטרם שולמו"
- Clicking notification should open app to `/work-orders`
- Warning badges should be visible on done+unpaid items

### ✅ Test Morning Digest (Production)

After deploying to Vercel with cron configured:

1. Wait for next 08:00 Asia/Jerusalem (05:00 UTC), OR
2. Trigger manually via Vercel dashboard:
   - Functions → Crons → morning-digest → "Trigger"
3. Check Vercel logs to verify execution
4. Check device for push notification

### ✅ Test No-Op When VAPID Missing

1. Remove VAPID keys from environment
2. Trigger cron: `curl http://localhost:3000/api/cron/morning-digest`
3. Should return success but skip push silently:
```json
{
  "ok": true,
  "sent": true,
  "notCompleted": 0,
  "notPaid": 0,
  "total": 0
}
```
4. No errors in console

## Vercel Cron Configuration

The `vercel.json` file configures the cron schedule:

```json
{
  "crons": [
    {
      "path": "/api/cron/morning-digest",
      "schedule": "0 5 * * *"
    }
  ]
}
```

- **Schedule**: `0 5 * * *` = Every day at 05:00 UTC (08:00 Asia/Jerusalem)
- **Timezone**: UTC (Vercel crons always run in UTC)
- **Security**: Vercel automatically sends `Authorization: Bearer $CRON_SECRET` header
- **Availability**: Hobby/Pro plans support 1+ daily crons

### Monitoring Cron Execution

**Via Vercel Dashboard:**
1. Project → Functions → Crons
2. View execution history, logs, and trigger manually
3. Check for errors or failures

**Via CLI:**
```bash
vercel logs --follow
# Filter for morning-digest
vercel logs --follow | grep morning-digest
```

## Architecture Overview

### Database Schema Changes
```
work_orders table:
+ is_completed      boolean    not null default false
+ completed_at      timestamptz
+ is_paid           boolean    not null default false
+ paid_at           timestamptz
+ index: work_orders_is_paid_idx
```

### API Endpoints
- `POST /api/work-orders/toggle-completed` (via server action)
- `POST /api/work-orders/toggle-paid` (via server action)
- `GET /api/cron/morning-digest` (Vercel cron)

### Key Files Modified
- `src/db/schema.ts` — Added ops fields to workOrders table
- `src/server/actions/work-orders.ts` — Toggle actions
- `src/server/queries/work-orders.ts` — Added isPaid filter
- `src/features/work-orders/work-order-detail.tsx` — Ops status card UI
- `src/features/work-orders/work-orders-list.tsx` — Folder navigation
- `src/app/(app)/work-orders/paid/page.tsx` — Paid folder route
- `src/app/api/cron/morning-digest/route.ts` — Morning digest endpoint
- `messages/he.json`, `messages/ru.json` — i18n labels

### Push Notification Flow
```
Vercel Cron (08:00 IL)
    ↓
/api/cron/morning-digest
    ↓
Query: work_orders where status='signed' AND isPaid=false
    ↓
Count: doneUnpaid (priority) + notDoneUnpaid
    ↓
Build message prioritizing done+unpaid
    ↓
sendPushToAll({ title, body, url: "/work-orders" })
    ↓
web-push library → push_subscriptions
    ↓
Service Worker receives push
    ↓
Shows notification with data.url
    ↓
User clicks → SW opens /work-orders
    ↓
Warning badges visible on done+unpaid items
```

## Key Product Rules

### ✅ Rule 1: Ops Toggles After Signature
Toggles appear ONLY when `status = 'signed'`. This ensures:
- Price/work is client-approved before operational tracking
- Clear separation: document lifecycle → ops workflow
- No premature status tracking on drafts/sent documents

### ✅ Rule 2: Paid Folder = BOTH Conditions
`«שולמו»` requires `isCompleted=true AND isPaid=true`. This ensures:
- Folder represents truly finished business (done + paid)
- Prevents incomplete items from appearing as "closed"
- Clear milestone: work finished, payment received, case closed

### ✅ Rule 3: Visual Hierarchy
- ✅ Green "שולם" badge: Fully complete (done + paid)
- ⚠️ Warning "לא שולם" badge: Done but unpaid (high priority)
- No badge: Not done yet (normal workflow)

### ✅ Rule 4: Morning Push Priority
Focus on **unpaid signed work orders**, especially done+unpaid:
- Priority 1: Work finished, payment pending (done+unpaid)
- Priority 2: Work and payment both pending
- Message highlights done+unpaid count first
- PWA device push only (no email, no WhatsApp)

## Rollback Plan

If issues occur, revert the migration:

```sql
alter table work_orders
  drop column if exists is_completed,
  drop column if exists completed_at,
  drop column if exists is_paid,
  drop column if exists paid_at;

drop index if exists work_orders_is_paid_idx;
```

Then redeploy previous commit:
```bash
git revert HEAD
git push
```

## FAQ

**Q: Does this change existing work order behavior?**  
A: No. The document lifecycle (draft → sent → signed) is unchanged. Ops toggles are independent additions that appear AFTER signature.

**Q: Why don't ops toggles show on draft/sent work orders?**  
A: Per Adir's product rules: toggles only appear after client signature. This ensures price/work is approved before operational tracking begins.

**Q: What happens if VAPID keys are missing?**  
A: The cron runs successfully but silently skips sending push (same as current behavior).

**Q: Can I disable the morning digest?**  
A: Yes. Remove the cron entry from `vercel.json` and redeploy. Or set a bogus CRON_SECRET to block execution.

**Q: What timezone is the cron in?**  
A: UTC (Vercel crons are UTC-only). The schedule `0 5 * * *` equals:
- 08:00 during IDT (daylight time, ~Mar-Oct, UTC+3) ✅
- 07:00 during IST (standard time, ~Nov-Feb, UTC+2)
The 05:00 UTC slot was chosen to hit 08:00 during the business-heavy season.

**Q: Does the paid folder show cancelled work orders?**  
A: No. Only signed work orders with BOTH `isCompleted=true AND isPaid=true` appear in the folder.

**Q: Can a work order be in the paid folder if only payment is received?**  
A: No. The folder requires BOTH completed AND paid. Items with only one status do NOT appear.

**Q: Why do some work orders show a warning badge?**  
A: Warning "לא שולם" badge appears when work is completed but payment is pending (high priority for follow-up).

**Q: Does the morning push include all unpaid items?**  
A: Yes, but the message prioritizes done+unpaid (work finished, payment pending) to highlight urgent items.

## Support

For issues or questions:
1. Check Vercel logs: `vercel logs --follow`
2. Check Supabase logs: Dashboard → Logs → Postgres
3. Test cron manually: `curl /api/cron/morning-digest`
4. Verify migration: `\d work_orders` in psql

## Deployment Checklist

Before merging to production:

- [ ] Database migration applied and verified
- [ ] CRON_SECRET added to Vercel environment variables
- [ ] VAPID keys configured (if enabling push)
- [ ] Manual cron test successful (local and staging)
- [ ] Ops toggles tested on work order detail page
- [ ] Paid folder navigation tested
- [ ] Push notification received and deep-link works
- [ ] Hebrew/Russian UI labels verified
- [ ] No errors in browser console
- [ ] No errors in Vercel logs

---

**Questions?** Tag @adired94-bit in the PR.
