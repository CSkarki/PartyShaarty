# Utsavé — Pre-Launch Security & Readiness Review
### Updated: February 2026 (Sprint 4 Complete)
> *Previously reviewed as "PartyShaarty" — now rebranded to Utsavé*

---

## Executive Summary

Utsavé is a multi-tenant SaaS platform purpose-built for the Indian diaspora celebration lifecycle — from pre-event planning through ceremony-day photo sharing to post-event memories. The platform has grown significantly since the original February 2026 review.

**This document supersedes the original `PartyShaarty-PreLaunch-Review` dated February 2026.**

### Progress Since Original Review

All 5 critical issues from the original review have been resolved. Sprint 4 added post-event memory infrastructure, a full event lifecycle (draft → live → deletion), gallery redesign, and upload safety improvements.

| Category | Original | Now |
|---|---|---|
| Critical issues | 5 open | **0 open** ✅ |
| High issues | 7 open | 3 resolved, 4 remain |
| Medium issues | 8 open | 2 resolved, 6 remain |
| Sprint 3 features | — | QR Code, Slideshow, Guest Upload, Per-Function RSVP |
| Sprint 4 features | — | Memory Page, Event Lifecycle, Gallery Redesign, Upload Safety |
| Architecture | Single-event | **Multi-event, multi-type** ✅ |

---

## Part 1 — Architecture Overview

### Stack
- **Framework**: Next.js 14 App Router (server + client components, API routes)
- **Database**: Supabase Postgres (multi-tenant via `host_profiles`)
- **Storage**: Supabase Storage (`event-photos` bucket, path: `{hostProfileId}/{albumSlug}/{filename}`)
- **Auth**: Supabase Auth (host login) + HMAC-signed guest session cookies
- **Email**: Nodemailer/Gmail SMTP *(see Issue #H1 below)*
- **Rate limiting**: Upstash Redis + `@upstash/ratelimit` (sliding window)
- **Image processing**: `sharp` (validation + EXIF stripping)
- **HTML safety**: `he` package (XSS-safe escaping)

### Data Model (Current)
```
host_profiles
  └── events (global slug, event_type, event_group_id?)
        └── invite_rsvps
        └── gallery_albums
              └── album_guest_access (shares album with email)

event_groups (links Wedding Suite functions)
```

### Key Supabase RPCs
- `get_event_by_slug(p_slug)` — public, SECURITY DEFINER, returns event + host_id
- `get_group_events_by_event_slug(p_slug)` — public, SECURITY DEFINER, returns all events in same Wedding Suite group *(Sprint 3 — must be run from `supabase-sprint3-migration.sql`)*

---

## Part 2 — Security Review

### ✅ Critical Issues (All Resolved)

#### C1. File Upload — No Size or Type Validation *(FIXED)*
**Original**: No limits on upload size or file type — memory exhaustion risk.

**Current (`lib/upload-utils.js`)**:
- `validateFileSize(file)` — checks declared size against `MAX_UPLOAD_SIZE_MB` env var (default: 10 MB). Rejects before allocating buffer.
- Quick MIME pre-screen — rejects non-`image/*` at declaration level.
- `validateImageBuffer(buffer)` — uses `sharp` to decode actual bytes. Catches spoofed extensions and fake MIME types.
- `stripExifAndReencode(buffer, format)` — strips all EXIF metadata (GPS, device info), auto-orients, re-encodes.

**Applied in**: `/api/gallery/albums/[albumId]/photos` (host upload) AND `/api/gallery/guest-upload` (guest upload, Sprint 3).

**Status**: ✅ Fully resolved. Both host and guest upload paths protected.

---

#### C2. XSS in Email Templates *(FIXED)*
**Original**: Guest-supplied message content was injected raw into HTML email bodies.

**Current (`lib/html-utils.js`)**:
- `escapeHtml(text)` — uses `he.escape()` — correctly handles all HTML entities including `'`, `"`, `<`, `>`, `&`, and Unicode edge cases.
- `linkify(escapedText)` — URL detection runs *after* escaping, so URLs can't inject HTML.
- `formatMessageHtml(text)` — full pipeline: escape → linkify → newlines to `<br>`.

**Applied in**: `app/api/reminders/send/route.js`, `app/api/thankyou/send/route.js`.

**Status**: ✅ Resolved. Verified in both email routes.

---

#### C3. Guest Session Secret — Insecure Fallback *(FIXED)*
**Original**: `lib/guest-auth.js` fell back to `"change-me"` if `GUEST_SESSION_SECRET` was not set in environment — meaning all guest sessions in misconfigured deployments were trivially forgeable.

**Current (`lib/guest-auth.js`)**:
- `getSecret()` throws `Error("GUEST_SESSION_SECRET is not set")` immediately if the env var is missing.
- No fallback. Deployment fails loudly rather than silently.
- `.env.example` documents: `GUEST_SESSION_SECRET="replace-with-openssl-rand-base64-32-output"`

**Status**: ✅ Resolved. Fail-fast enforced.

---

#### C4. No Rate Limiting on Public Endpoints *(FIXED)*
**Original**: `/api/rsvp` and `/api/gallery/verify` had no rate limiting — trivially spammable.

**Current (`lib/rate-limit.js` + `middleware.js`)**:
- RSVP submit (`POST /api/rsvp`): 10 requests per IP per minute (sliding window)
- Gallery OTP verify (`POST /api/gallery/verify`): 5 requests per IP per 10 minutes
- Implemented via `@upstash/ratelimit` sliding window + Upstash Redis
- Graceful degradation: if `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` not set, returns `{ limited: false }` (no crash)
- 429 responses include `Retry-After` header
- Applied in `middleware.js` before requests reach route handlers

**Note**: `/api/rsvp/suite` (Suite RSVP, Sprint 3) is not yet covered by rate limiting. Should mirror the existing `/api/rsvp` limit.

**Status**: ✅ Core endpoints protected. ⚠️ `/api/rsvp/suite` needs rate limit added.

---

#### C5. Image Content Validation — Magic Bytes Not Checked *(FIXED)*
**Original**: Only checked `file.type` (client-supplied, easily spoofed). A `evil.exe` renamed to `evil.jpg` would be stored.

**Current**: `validateImageBuffer(buffer)` in `lib/upload-utils.js` calls `sharp(buffer).metadata()`. Sharp reads actual image headers — rejects any file that cannot be decoded as a valid image regardless of declared type.

**Status**: ✅ Resolved. Magic bytes validated via sharp on all upload paths.

---

### ⚠️ High Priority Issues (Remaining)

#### H1. Email Provider — Gmail SMTP *(Still Open)*
**Risk**: Gmail SMTP (nodemailer) has a 500 emails/day cap. For an event with 500 guests, one reminder blast exhausts the daily quota.

**Current**: `lib/mailer.js` still uses `nodemailer` with Gmail SMTP. The `resend` package (`^6.9.2`) is present in `package.json` but **not wired up**.

**Required action**:
1. Create Resend account, get API key
2. Rewrite `lib/mailer.js` to use `resend.emails.send()`
3. Add `RESEND_API_KEY` to `.env.example` and Vercel env vars
4. Verify SPF/DKIM records for sending domain

**Impact**: High. Must resolve before any event with >200 guests uses reminders.

---

#### H2. No Privacy Policy or Terms of Service *(Still Open)*
**Risk**: Illegal in most jurisdictions (GDPR, CCPA, Indian IT Act) to collect personal data (name, email, phone) without a published privacy policy. Violates app store / hosting provider ToS.

**Required action**:
- `/legal/privacy` — Privacy Policy (data collected, storage location, retention, deletion rights, contact)
- `/legal/terms` — Terms of Service (user responsibilities, host obligations, disclaimers)
- Link both in: registration page footer, invite page footer, gallery verification page footer

---

#### H3. No Unsubscribe Mechanism in Emails *(Still Open)*
**Risk**: CAN-SPAM (US) and GDPR (EU) require a clear unsubscribe option in all bulk/commercial email. Failure = fines up to €20M under GDPR.

**Required action**:
- Add `Unsubscribe` link to all reminder and thank-you emails
- Implement a simple `POST /api/unsubscribe?token=...` endpoint
- Store unsubscribe status on `invite_rsvps` (e.g., `unsubscribed_at` column)
- Skip unsubscribed guests in reminder/thank-you send loops

---

#### H4. No Account Deletion Flow *(Still Open)*
**Risk**: GDPR Article 17 (Right to Erasure). Users must be able to delete their account and all associated data on request.

**Required action**:
- Add "Delete Account" button in host profile/settings
- Cascade delete: `host_profiles` → `events` → `invite_rsvps` + `gallery_albums` → Supabase Storage files
- Confirm prompt ("This will permanently delete all your events and cannot be undone")
- Consider 30-day grace period with soft-delete flag

---

### ⚠️ Medium Priority Issues (Remaining)

#### M1. No Email Validation Before Sending *(Still Open)*
**Risk**: Malformed email strings (e.g. `<script>`, excessively long strings) reach nodemailer — can cause unexpected behavior or injection in SMTP headers.

**Required action**: Add email format validation in `/api/rsvp/route.js` and `/api/rsvp/suite/route.js` before storing. A simple regex or `validator.js` `isEmail()` check is sufficient.

---

#### M2. No CSP (Content Security Policy) Headers *(Still Open)*
**Risk**: Without CSP headers, any XSS vector (e.g. in user-generated album names) that bypasses escaping can execute arbitrary scripts.

**Required action**: Add to `next.config.js`:
```javascript
headers: [{ source: '/(.*)', headers: [
  { key: 'Content-Security-Policy', value: "default-src 'self'; img-src 'self' data: blob: *.supabase.co; ..." }
]}]
```

---

#### M3. No Per-Host Upload Quotas *(Still Open)*
**Risk**: A single host can upload unlimited photos, consuming arbitrary Supabase Storage (cost risk).

**Required action**: Track total storage per `host_profile`. Enforce soft quota (e.g. 2 GB free tier). Display usage in dashboard.

---

#### M4. No Pagination on Photo Listing *(Still Open)*
**Risk**: `listPhotosInAlbum()` returns all files in one call. An album with 1,000 photos will generate 1,000 signed URLs in one request — potential timeout and memory spike.

**Required action**: Implement cursor-based pagination in `listPhotosInAlbum()` and update gallery UI to load more on scroll.

---

#### M5. No Image Content Moderation *(Still Open)*
**Risk**: Guest photo upload allows guests to upload any image that passes sharp validation. No check for explicit/offensive content.

**Required action**: Consider integration with Google Cloud Vision SafeSearch or AWS Rekognition. At minimum, add host-side moderation queue (photos pending approval before appearing in gallery).

---

#### M6. `/api/rsvp/suite` Not Rate Limited *(New, Open)*
**Risk**: The new suite RSVP endpoint (Sprint 3) is public and has no rate limiting, unlike `/api/rsvp` which is protected by middleware.

**Required action**: Add `/api/rsvp/suite` to `middleware.js` matcher and rate limit check (mirror existing `/api/rsvp` limits: 10 req/min/IP).

---

## Part 3 — Feature Completeness Review

### ✅ Core Features (Production-Ready)

| Feature | Status | Notes |
|---|---|---|
| Host registration / login | ✅ Ready | Supabase Auth, redirect flow |
| Multi-event management | ✅ Ready | Events table, global slugs |
| Event settings + cover image | ✅ Ready | `/dashboard/events/[eventId]/settings` |
| 8 cultural event types | ✅ Ready | Wedding, Birthday, Puja, Festival, etc. |
| Wedding Suite (5 linked events) | ✅ Ready | `event_groups` table, grouped dashboard |
| Event lifecycle (draft → live → deletion) | ✅ Ready | Sprint 4; draft deletable, live requires admin |
| Guest invite page | ✅ Ready | `/{eventSlug}/invite` |
| Single-event RSVP | ✅ Ready | `/api/rsvp` + rate limiting |
| Per-function RSVP (Wedding Suite) | ✅ Ready | `/api/rsvp/suite` *(SQL migration required)* |
| RSVP list (dashboard) | ✅ Ready | Per-event filtering |
| CSV import | ✅ Ready | `/api/rsvp/import` |
| CSV export | ✅ Ready | `/api/export` |
| Email reminders | ✅ Ready | Gmail (quota limited — see H1) |
| WhatsApp reminders | ✅ Ready | `lib/messenger.js` |
| Thank-you messages | ✅ Ready | Email + WhatsApp |
| Private photo gallery | ✅ Ready | OTP-gated, `/{eventSlug}/gallery` — royal heritage redesign (Sprint 4) |
| Album management | ✅ Ready | Host creates/manages albums |
| Host photo upload | ✅ Ready | EXIF-stripped, size-validated; 4 MB client-side guard (Sprint 4) |
| Guest photo upload | ✅ Ready | Sprint 3, `/{eventSlug}/gallery` panel |
| QR code (invite URL) | ✅ Ready | Sprint 3, dashboard download |
| Live slideshow | ✅ Ready | Sprint 3, `/{eventSlug}/slideshow` |
| Event Memory Page | ✅ Ready | Sprint 4; `/{eventSlug}/memory`, auto-redirect 48 h post-event |
| Gallery album deep-links from memory page | ✅ Ready | Sprint 4; album chips → `/{eventSlug}/gallery?album={id}` |

---

### 🟡 Pending Features (Post-Launch)

| Feature | Priority | Notes |
|---|---|---|
| Seating chart (drag-and-drop) | Medium | Phase 3 |
| Gift/shagun tracker | Medium | Phase 3 |
| Premium invite designer | Medium | Branded card templates |
| Stripe integration + feature gating | High | Monetization |
| Account deletion flow | High | GDPR compliance (see H4) |
| Privacy Policy + ToS pages | High | Legal compliance (see H2) |

---

## Part 4 — Sprint 3 Feature Details

### A. QR Code *(Complete)*
- Dashboard: "QR Code" button per event → generates `/{eventSlug}/invite` QR via `qrcode` npm package
- Styled with Utsavé brand colors (dark gold on warm ivory)
- "Download QR" exports PNG via canvas `toDataURL` → anchor download
- **Usage**: Print for table cards, venue signage, WhatsApp sharing

### B. Guest Photo Upload *(Complete)*
- After OTP verification, guests see a "Share Your Photos" panel on the gallery page
- File picker: `accept="image/*"`, multiple, max 5 files per upload
- Server-side: `POST /api/gallery/guest-upload` — validates session cookie, validates/strips images, creates "Guest Contributions" album, auto-shares album with uploading guest's email
- Host sees all guest photos in "Guest Contributions" album in their dashboard
- EXIF data stripped on all guest uploads (same pipeline as host uploads)

### C. Live Venue Slideshow *(Complete)*
- Public URL: `/{eventSlug}/slideshow` — designed for projector/TV
- Fullscreen dark background, photos cycle every 6 seconds with fade transition
- Polls `/api/slideshow/{eventSlug}` every 30 seconds for new photos (picks up guest uploads in near-real-time)
- Keyboard controls: Arrow keys (manual nav), `F` (fullscreen toggle)
- Counter bottom-right, event name top-left, album name bottom-left
- Slideshow link in host dashboard (opens new tab)

### D. Per-Function RSVP *(Complete — requires DB migration)*
**Setup required**: Run `supabase-sprint3-migration.sql` in Supabase SQL Editor to create the `get_group_events_by_event_slug` RPC.

- Wedding Suite invite pages detect linked events and show per-function toggles
- Guest sees each function (Mehndi, Haldi, Sangeet, Wedding, Reception) with "Attending" / "Can't make it" buttons
- Single submit → creates one RSVP row per function via `/api/rsvp/suite`
- Host dashboard shows per-function RSVP counts

---

## Part 4b — Sprint 4 Feature Details

### E. Event Memory Page *(Complete)*
- Public route: `/{eventSlug}/memory` — no auth required (same security model as invite + slideshow)
- **Automatic redirect**: `/{eventSlug}/invite/page.js` checks `event_date`; if 48+ hours past → `redirect(/memory)`. Robust date parsing handles IST/timezone suffixes and ordinal numbers (e.g. "21st Feb").
- **Memory page guard**: Redirects to invite only if date is clearly in the future (>2 hours away). Past events, undated events, and unparseable dates all show the memory page.
- **Design**: Indian celebration palette — deep maroon (`#6b1a1a`) → saffron (`#c9511b`) hero, antique parchment background, gold accents. DM Serif Display + Outfit fonts.
- **Sections**: Nav, hero banner, display-only invite card (no RSVP form), masonry photo gallery with lightbox, album filter chips.
- **Album filter chips** link to `/{eventSlug}/gallery?album={albumId}` — landing directly in the specific album (gallery handles OTP auth and the `?album=` deep-link).
- **Photos**: Fetched client-side via `/api/slideshow/{eventSlug}` (force-dynamic, proven working). Response now includes `albumId` per photo to enable deep-linking.
- **Host preview**: "Memories ✦" link in Event Dashboard nav always visible for host preview at any time.

### F. Event Lifecycle *(Complete)*
- **Draft** (default): Fully editable. Host can delete at any time from Event Dashboard (cascades storage files + DB rows).
- **Live** (after Launch): Settings locked. Delete button hidden. "Request Deletion" sends admin email with event name, host email, invite URL, and reason.
- **Launch Event** button on dashboard: calls `PATCH /api/host/events/{id}` with `{ action: "launch" }` → sets `status = "active"`.
- **Request Deletion** button: calls `PATCH` with `{ action: "request_deletion", reason }` → sets status to pending, emails `SUPER_ADMIN_EMAIL`.
- **Admin panel** (`/admin/events`) lists live events and deletion requests.

### G. Gallery Royal Heritage Redesign *(Complete)*
- **Design theme**: Antique parchment background, gold-maroon-gold gradient edge strips, DM Serif Display headings.
- **Album cards**: Leather book-cover style — deep maroon gradient with dark spine, gold inner frame, `✦ ❁ ✦` ornament, album name in parchment-white. Hover: lifts with slight tilt.
- **Photo grid**: Polaroid scatter style — white border bottom, alternating rotations per `nth-child`. Hover: snaps straight + scales up with enlarged shadow.
- **Lightbox**: Dark wood-toned frame with gold corner ornaments (`✦`), ornate prev/next nav buttons, album + index label.
- **Verification card**: Invitation envelope style — maroon header, gold divider, "Unlock & View Photos" CTA.
- **Single return architecture**: All views (loading, verify, album grid, photo grid) rendered in one `return` with conditional content — shared nav, decorative strips, and lightbox.

### H. Upload Safety Improvements *(Complete)*
- **Client-side 4 MB guard**: Added to `handleFileChange` (device upload) and `pickLibraryPhoto` (library pick) in Event Settings. Blocks oversized files before the request is sent.
- **Defensive JSON parsing**: `handleSave` wraps `res.json()` in try/catch. Vercel infrastructure 413 responses (plain-text "Request Entity Too Large") now show: *"Image too large for upload. Please use an image under 4 MB."* instead of a cryptic JSON parse crash.
- **Root cause**: Vercel serverless function body limit is 4.5 MB. Server-side `validateFileSize` (up to 10 MB env default) never runs when Vercel rejects at infrastructure level.

---

## Part 5 — Environment Variables Reference

All required variables. Deployment will fail or degrade without these:

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Required | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Required | Supabase anon/public key |
| `DATABASE_URL` | ✅ Required | Pooled connection (port 6543, `?pgbouncer=true`) |
| `GUEST_SESSION_SECRET` | ✅ Required | 32-byte base64 secret. Hard error if missing. Generate: `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | ✅ Required | Production URL (e.g. `https://utsave.app`) |
| `UPSTASH_REDIS_REST_URL` | ⚠️ Strongly recommended | Rate limiting. Graceful degradation if missing (no rate limits!) |
| `UPSTASH_REDIS_REST_TOKEN` | ⚠️ Strongly recommended | Rate limiting |
| `MAX_UPLOAD_SIZE_MB` | Optional | Default: 10 |
| `PEXELS_API_KEY` | Optional | Asset fetcher script only |
| `UNSPLASH_ACCESS_KEY` | Optional | Asset fetcher script only |
| `RESEND_API_KEY` | 🔜 Needed (Sprint 4) | Once Gmail SMTP is replaced |

---

## Part 6 — Database Migration Checklist

Before full production deployment, run these SQL migrations in order:

| Migration | File | Status |
|---|---|---|
| Multi-event schema | `supabase-multi-event-migration.sql` | ✅ Should be applied |
| Sprint 3 RPCs | `supabase-sprint3-migration.sql` | ⚠️ **Must apply before testing per-function RSVP** |

The Sprint 3 migration creates:
```sql
get_group_events_by_event_slug(p_slug TEXT)
```
— granted to `anon` and `authenticated` roles.

---

## Part 7 — Pre-Launch Checklist

### Must-Do Before Any Public Promotion
- [ ] Run `supabase-sprint3-migration.sql` in Supabase SQL Editor
- [ ] Switch email to Resend (resolve H1 — Gmail 500/day cap)
- [ ] Publish Privacy Policy at `/legal/privacy`
- [ ] Publish Terms of Service at `/legal/terms`
- [ ] Add `GUEST_SESSION_SECRET` to Vercel/production environment
- [ ] Add `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` to production (rate limiting)
- [ ] Verify `NEXT_PUBLIC_APP_URL` is set to production URL (not localhost)
- [ ] Test RSVP flow end-to-end on production domain
- [ ] Test gallery OTP flow on production domain
- [ ] Test guest upload on production (mobile device)
- [ ] Test slideshow page on external display / TV browser
- [ ] Test Memory Page redirect: create event with past date, visit `/invite`, confirm redirect to `/memory`
- [ ] Test Memory Page photos: upload photos, visit `/memory`, confirm grid loads
- [ ] Test album chip deep-link: click album chip on Memory Page, verify OTP gate then album opens
- [ ] Test event lifecycle: create event → launch → confirm settings locked → test delete (draft) and request deletion (live)
- [ ] Verify cover image size check works on mobile (upload photo >4 MB, confirm friendly error)

### Should-Do Before First Paid User
- [ ] Add email validation in `/api/rsvp` and `/api/rsvp/suite`
- [ ] Add rate limiting to `/api/rsvp/suite` in middleware
- [ ] Add unsubscribe link to reminder and thank-you emails
- [ ] Add account deletion flow
- [ ] Set up error monitoring (Sentry or equivalent)
- [ ] Configure CSP headers in `next.config.js`
- [ ] Load test RSVP and gallery endpoints (target: 500 concurrent guests)

### Nice-to-Have (Sprint 4)
- [ ] Per-host storage quota + dashboard usage indicator
- [ ] Photo pagination (cursor-based, for albums >100 photos)
- [ ] Image content moderation (Google Vision SafeSearch or host approval queue)
- [ ] Stripe integration for Celebration Packs

---

## Part 8 — Known Technical Debt

1. **`get_event_by_slug` RPC does not return `event_group_id` or `event_type`**. Code that needs these fields (e.g. `app/[eventSlug]/invite/page.js`) queries the `events` table directly in addition to the RPC. If the RPC is updated to include these columns, the direct table queries can be removed.

2. **Backward compatibility**: Both `eventSlug` and `hostSlug` are accepted in query params and request bodies. Legacy `hostSlug` can be removed in a future sprint once all integrations are confirmed to use `eventSlug`.

3. **Gmail SMTP in `lib/mailer.js`**: `resend` package is installed but not wired. When switching to Resend, the `transporter.sendMail()` call and nodemailer import can be removed entirely.

4. **No image CDN**: Photos are served via Supabase signed URLs (1hr expiry). For large events with many gallery viewers, consider Cloudflare R2 or a CDN layer in front of Supabase Storage.

---

## Appendix — File Map (Key Files)

| What | File |
|---|---|
| Landing page | `app/page.js` |
| Global styles + CSS vars | `app/globals.css` |
| Root layout + meta | `app/layout.js` |
| Dashboard (events list) | `app/dashboard/page.js` |
| Per-event dashboard | `app/dashboard/events/[eventId]/page.js` |
| Event settings | `app/dashboard/events/[eventId]/settings/page.js` |
| Album management (host) | `app/dashboard/events/[eventId]/gallery/page.js` |
| Guest invite page | `app/[eventSlug]/invite/page.js` |
| Invite form (client) | `app/[eventSlug]/invite/InviteForm.js` |
| Guest gallery | `app/[eventSlug]/gallery/page.js` |
| Live slideshow | `app/[eventSlug]/slideshow/page.js` |
| Event Memory Page (server) | `app/[eventSlug]/memory/page.js` |
| Event Memory Page (client) | `app/[eventSlug]/memory/MemoryPage.js` |
| RSVP API | `app/api/rsvp/route.js` |
| Suite RSVP API | `app/api/rsvp/suite/route.js` |
| Slideshow API | `app/api/slideshow/[eventSlug]/route.js` |
| Guest upload API | `app/api/gallery/guest-upload/route.js` |
| Album photos API | `app/api/gallery/albums/[albumId]/photos/route.js` |
| Gallery OTP verify | `app/api/gallery/verify/route.js` |
| Email | `lib/mailer.js` |
| WhatsApp | `lib/messenger.js` |
| HTML safety | `lib/html-utils.js` |
| Rate limiting | `lib/rate-limit.js` |
| Upload validation | `lib/upload-utils.js` |
| Guest auth | `lib/guest-auth.js` |
| Event store | `lib/event-store.js` |
| RSVP store | `lib/rsvp-store.js` |
| Gallery store | `lib/gallery-store.js` |
| Supabase Storage helpers | `lib/supabase.js` |
| Supabase SSR helpers | `lib/supabase-server.js` |
| Edge middleware | `middleware.js` |
| Multi-event migration | `supabase-multi-event-migration.sql` |
| Sprint 3 migration | `supabase-sprint3-migration.sql` |

---

*Generated February 2026 — Utsavé Platform Review v2.1 (Sprint 4)*
