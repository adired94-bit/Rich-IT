# Rich IT Solutions — CRM & Service Management

An AI-powered, bilingual (Hebrew/Russian) all-in-one CRM and field-service
platform for a solo IT infrastructure & cybersecurity engineer. Built as an
installable Progressive Web App with a dark, high-tech "command center"
design.

## Highlights

- **Client CRM** — directory, tabbed client file (overview, history,
  calendar, retainers, vault, documents), AES-256-GCM encrypted credentials
  vault, monthly hours-bank retainers with usage tracking.
- **Service catalog** — six pre-seeded Rich IT Solutions categories (network,
  server/virtualization, cybersecurity, physical security, low-voltage,
  managed IT), hourly/fixed/retainer/hardware-markup billing models.
- **Calendar** — month/week/day/agenda views, drag-and-drop rescheduling,
  client filtering, and a signed public ICS feed for Google Calendar
  subscription (no OAuth needed).
- **AI voice engine** — record a work log in Hebrew or Russian; Whisper
  transcribes it, Claude extracts a structured work order (client match,
  catalog-matched line items, custom pricing, bilingual summary, next steps)
  for the engineer to review and edit before saving.
- **Work orders** — catalog-linked item editor, discounts, VAT, retainer-hour
  deduction, status lifecycle (draft → sent → viewed → signed/cancelled).
- **Documents** — Hebrew/Russian/dual-language PDF generation
  (`@react-pdf/renderer`, embedded Rubik font, correct RTL text shaping), a
  public token-based e-signature approval portal, WhatsApp dispatch, and a
  document event timeline.
- **Dashboard** — billed-this-month, pending signatures, active retainers,
  revenue trend, recent work orders, upcoming events.
- **PWA** — installable, offline-capable (Serwist/Workbox service worker),
  Web Push notifications (a signed document being viewed or signed notifies
  the engineer's device).
- **i18n** — full Hebrew (RTL) and Russian (LTR) UI via `next-intl`, switchable
  from the header.

## Tech stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Radix UI ·
TanStack Query · Zustand · Supabase (Postgres + Auth + Storage) · Drizzle ORM ·
Anthropic Claude · OpenAI Whisper · `@react-pdf/renderer` ·
`react-signature-canvas` · Serwist (PWA) · `next-intl`.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/migrations/0001_init.sql`. It creates
   every table, enum, index, Row Level Security policy, the three storage
   buckets (`audio`, `documents`, `signatures`), and the work-order numbering
   sequence.
3. Under **Authentication**, create the one user account you (the engineer)
   will sign in with — this is a single-tenant app.
4. Copy the project URL, anon key, service role key, and the pooled
   `DATABASE_URL` connection string (Project Settings → Database →
   Connection pooling, **Transaction** mode — required for the app's
   server-side Postgres client).

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection pooling |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) — powers the AI work-order extraction |
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) — powers Whisper speech-to-text |
| `VAULT_ENCRYPTION_KEY` | `openssl rand -base64 32` — encrypts the client credentials vault |
| `APPROVAL_LINK_SECRET` | any random string — protects the ICS calendar feed |
| `NEXT_PUBLIC_APP_URL` | your deployed URL (or `http://localhost:3000` in dev) |
| `COMPANY_*`, `ENGINEER_NAME` | shown on generated PDFs and in the app |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | optional — `npx web-push generate-vapid-keys`, enables push notifications |

The app degrades gracefully when optional keys are missing: without AI keys,
voice processing shows a clear error instead of crashing; without VAPID keys,
push notifications are simply disabled in Settings.

### 4. Seed the service catalog

```bash
npm run db:seed
```

(Or use the "Load default catalog" button on the Catalog or Settings page
after first login — same effect, safe to re-run.)

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with the
Supabase user you created, and you're in.

### Production build

```bash
npm run build
npm run start
```

## Project structure

```
src/
  app/                 Routes (App Router): dashboard, clients, catalog,
                        calendar, work-orders, settings, login, the public
                        /approve/[token] portal, and API routes
  features/            UI feature modules (one folder per domain area)
  server/
    actions/           Server Actions (mutations)
    queries/           Server-only read queries
  db/                  Drizzle schema, seed data, DB client
  lib/                 crypto, AI clients, PDF generation, utils
  components/ui/       Design-system primitives (Radix + Tailwind)
supabase/migrations/   SQL schema mirroring src/db/schema.ts
messages/              he.json / ru.json translation catalogs
```

## Notes on scope

- **Google Calendar integration** is implemented as a signed, read-only ICS
  subscription feed (Settings → ICS feed link) rather than the Google
  Calendar OAuth API — it gives the same "see your visits in Google
  Calendar" outcome without needing a Google Cloud project or OAuth consent
  screen for a single-user tool.
- **Dual-language PDFs** stack a full Hebrew section and a full Russian
  section in one document. The Russian summary is pulled from the AI
  voice-extraction result when available; manually created work orders show
  the same summary text in both sections.
