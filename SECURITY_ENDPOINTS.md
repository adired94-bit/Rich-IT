# Security Endpoint Documentation

This document catalogs all public endpoints in the Rich-IT application and explains their security mechanisms.

## Authentication Model

- **Protected Endpoints**: Require an authenticated Supabase session via `requireUser()` helper
- **Public Endpoints**: Accessible without authentication, but protected by other mechanisms (tokens, secrets)

## Public Endpoints

### 1. Health Check
**Route**: `GET /api/health`  
**File**: `src/app/api/health/route.ts`  
**Protection**: None (intentionally public)  
**Purpose**: Standard health check endpoint for monitoring/uptime services  
**Security Notes**: Returns only minimal status info, no sensitive data

### 2. Cron Job - Morning Digest
**Route**: `GET /api/cron/morning-digest`  
**File**: `src/app/api/cron/morning-digest/route.ts`  
**Protection**: `CRON_SECRET` environment variable (fail-closed)  
**Validation**:
```typescript
const authHeader = request.headers.get("authorization");
const cronSecret = process.env.CRON_SECRET;
if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```
**Security Notes**: 
- Rejects requests if `CRON_SECRET` is not configured (fail-closed)
- Validates Bearer token matches secret
- Designed for Vercel Cron or similar scheduled services

### 3. Calendar ICS Feed
**Route**: `GET /api/calendar/ics?token=<token>`  
**File**: `src/app/api/calendar/ics/route.ts`  
**Protection**: Token verification via `verifyIcsFeedToken()`  
**Validation**:
```typescript
const token = request.nextUrl.searchParams.get("token") ?? "";
if (!verifyIcsFeedToken(token)) {
  return NextResponse.json({ error: "Invalid or missing token" }, { status: 401 });
}
```
**Token Generation**: HMAC-SHA256 based stable token
```typescript
// src/lib/crypto.ts
export function icsFeedToken(): string {
  const secret = process.env.APPROVAL_LINK_SECRET ?? process.env.VAULT_ENCRYPTION_KEY ?? "dev-secret";
  return createHmac("sha256", secret).update("calendar-ics-feed").digest("base64url").slice(0, 32);
}
```
**Security Notes**:
- Token is stable (same token always works)
- Uses timing-safe comparison
- Purpose: Allow phone calendar apps (Google Calendar, Apple Calendar) to subscribe to feed

### 4. Customer Approval Page
**Route**: `GET /approve/[token]`  
**File**: `src/app/approve/[token]/page.tsx`  
**Protection**: Work order approval token  
**Validation**: Queries database for work order with matching `approvalToken`  
**Security Notes**:
- Customers view and sign work orders without logging in
- Each work order has unique approval token
- Token is part of URL sent to customer

### 5. Customer Approval PDF
**Route**: `GET /api/approve/[token]/pdf`  
**File**: `src/app/api/approve/[token]/pdf/route.tsx`  
**Protection**: Work order approval token  
**Validation**:
```typescript
const { token } = await params;
const workOrder = await getWorkOrderByApprovalToken(token);
if (!workOrder || workOrder.status === "cancelled") {
  return NextResponse.json({ error: "not_found" }, { status: 404 });
}
```
**Security Notes**:
- Downloads PDF of work order for customer
- Token validation same as approval page
- Returns 404 if token invalid or work order cancelled

### 6. Customer Approval Actions
**File**: `src/server/actions/approval.ts`  
**Functions**:
- `markWorkOrderViewedAction(token: string)`
- `signWorkOrderAction(token: string, signerName: string, signatureDataUrl: string)`

**Protection**: Work order approval token  
**Validation**: Each action queries database via `getWorkOrderByApprovalToken(token)`  
**Security Notes**:
- Intentionally public server actions
- Allow customers to view and sign without authentication
- Status changes only allowed for valid tokens
- Document header clearly marks these as "INTENTIONALLY PUBLIC"

## Protected Endpoints

### Authenticated API Routes

#### Voice Processing
**Route**: `POST /api/ai/process-voice`  
**File**: `src/app/api/ai/process-voice/route.ts`  
**Protection**: Explicit `requireUser()` check  
**Validation**:
```typescript
export async function POST(request: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // ... rest of handler
}
```
**Security Notes**:
- Processes voice recordings with OpenAI Whisper and Anthropic Claude
- Requires authentication before accepting audio uploads
- Returns 401 if no valid session

#### Work Order PDF (Authenticated)
**Route**: `GET /api/work-orders/[id]/pdf`  
**File**: `src/app/api/work-orders/[id]/pdf/route.tsx`  
**Protection**: `requireUser()` check  
**Security Notes**:
- Internal PDF generation for authenticated users
- Different from customer approval PDF (which uses token)

### Authenticated Server Actions

All server actions in the following files require authentication via `requireUser()`:

- `src/server/actions/push.ts` - Push notification subscriptions
- `src/server/actions/calendar.ts` - Calendar/event CRUD operations
- `src/server/actions/clients.ts` - Client, vault, retainer, interaction CRUD
- `src/server/actions/catalog.ts` - Service catalog management
- `src/server/actions/work-orders.ts` - Work order CRUD operations
- `src/server/actions/settings.ts` - Company settings, AI keys, signatures

Each action calls `await requireUser()` at the start, which:
1. Gets the current Supabase session
2. Throws `"UNAUTHENTICATED"` error if no session exists
3. Returns the authenticated user object if valid

## Security Verification Checklist

- [x] All mutating server actions require authentication
- [x] All reading server actions require authentication
- [x] Public endpoints document their security mechanism
- [x] Token validation uses timing-safe comparison
- [x] CRON_SECRET uses fail-closed logic (rejects if not configured)
- [x] Approval tokens query database (no JWT signature validation needed)
- [x] `/api/ai/process-voice` has explicit session check
- [x] Login form prevents open redirect attacks (validates `next` parameter)
- [x] Login form prevents stuck loading state (try/finally blocks)

## Open Redirect Protection

The login form validates the `next` redirect parameter:

```typescript
const next = params.get("next") ?? "/";
const safeNext = next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") && !next.includes("\\") ? next : "/";
router.push(safeNext);
```

**Rules**:
- Only relative paths starting with `/` are allowed
- Paths starting with `//` are rejected (protocol-relative URLs)
- Paths starting with `/\` are rejected (some browsers treat this like `//`)
- Any path containing backslashes is rejected (prevents encoding tricks)
- Invalid paths default to `/`
- Prevents redirecting to external sites after login

## Testing Recommendations

### Manual Testing

1. **Verify public endpoints work without auth**:
   - `curl https://rich-it-phi.vercel.app/api/health`
   - `curl https://rich-it-phi.vercel.app/api/calendar/ics?token=<valid-token>`
   - Visit `/approve/<valid-token>` in browser

2. **Verify protected endpoints reject without auth**:
   - Try calling any server action without session
   - POST to `/api/ai/process-voice` without cookies
   - Expected: 401 or "UNAUTHENTICATED" error

3. **Verify open redirect protection**:
   - Try login with `?next=//evil.com`
   - Try login with `?next=/\\evil.com`
   - Try login with `?next=/path\\evil`
   - Try login with `?next=https://evil.com`
   - Expected: Redirects to `/` instead

4. **Verify no stuck loading state**:
   - Try login with wrong password
   - Try login with network error (throttle network)
   - Expected: Button returns to normal state after error

### Automated Testing (Future)

Consider adding integration tests for:
- Server action auth checks
- Token validation functions
- Open redirect validation logic
- Stuck state prevention in forms
