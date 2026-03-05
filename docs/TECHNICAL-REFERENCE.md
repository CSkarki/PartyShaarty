# Utsavé — Technical Reference Guide
**For Internal Engineering & Support Teams**
*Last updated: March 2026*

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture & Codebase Layout](#3-architecture--codebase-layout)
4. [Database Schema](#4-database-schema)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Landing Page & Theme System](#6-landing-page--theme-system)
7. [Host Dashboard & Event Management](#7-host-dashboard--event-management)
8. [RSVP System](#8-rsvp-system)
9. [Photo Gallery & Albums](#9-photo-gallery--albums)
10. [Intake Forms (Event & Onboarding)](#10-intake-forms-event--onboarding)
11. [Messaging (WhatsApp & Email)](#11-messaging-whatsapp--email)
12. [Live Features (Slideshow, QR Code)](#12-live-features-slideshow-qr-code)
13. [Super Admin Panel](#13-super-admin-panel)
14. [API Route Reference](#14-api-route-reference)
15. [Environment Variables](#15-environment-variables)
16. [Key Workflows — End to End](#16-key-workflows--end-to-end)
17. [Common Issues & Troubleshooting](#17-common-issues--troubleshooting)
18. [Rate Limiting & Security](#18-rate-limiting--security)

---

## 1. System Overview

**Utsavé** is a multi-tenant SaaS platform for the Indian diaspora to plan, manage, and celebrate events. It is primarily a **B2C product** where event hosts (paying users) create events, manage guests, share photo albums, and communicate via WhatsApp and email.

### Who Uses It

| User Type | What They Do |
|-----------|-------------|
| **Host** | Creates events, manages RSVPs, uploads photos, sends reminders |
| **Guest** | Fills out the invite/RSVP form, views photo albums, uploads photos |
| **Super Admin** | Controls landing page themes, views all intakes, manages deletion requests |
| **Call Center / Support** | Handles inquiries from hosts and guests; may escalate DB issues |

### Core Value Proposition

- Beautiful invite pages with unique slugs (e.g., `https://utsave.com/sharma-wedding-2025/invite`)
- Real-time RSVP tracking with guest count (adults + kids)
- Private photo albums with OTP-gated guest access
- WhatsApp and email reminders and thank-you messages
- Wedding Suite: Link multiple functions (Sangeet, Mehndi, Pheras, Reception) under one umbrella
- Live venue slideshow (auto-rotating gallery for event screens)
- Intake questionnaire: helps the team plan events with guest preferences

---

## 2. Technology Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 — App Router (Server + Client Components) |
| **Language** | JavaScript (no TypeScript) |
| **Styling** | CSS Modules (`.module.css` per component) |
| **Database** | Supabase (Postgres) — row-level security enabled |
| **Auth** | Supabase Auth (email/password, magic link supported) |
| **Storage** | Supabase Storage — bucket: `event-photos` |
| **Email** | Gmail SMTP via Nodemailer (`GMAIL_USER` + `GMAIL_APP_PASSWORD`) |
| **WhatsApp** | Meta Cloud API (WhatsApp Business Platform) |
| **Photo Search** | Pexels API (server-side proxy — key never exposed to browser) |
| **Rate Limiting** | Upstash Redis (REST API, edge-compatible) |
| **Image Processing** | `sharp` — EXIF stripping, re-encoding, validation |
| **QR Codes** | `qrcode` npm package — `QRCode.toDataURL()` |
| **Deployment** | Vercel (assumed) |

### Key Next.js Concepts Used

- **Server Components**: Pages that fetch DB data server-side (landing page, admin panels)
- **Client Components**: Interactive pages with state (`"use client"` directive)
- **Route Handlers**: API endpoints (`route.js` files under `/app/api/`)
- **Middleware**: Auth guard and rate limiting (`middleware.js` at project root)
- **`export const dynamic = "force-dynamic"`**: Forces a page to re-fetch from DB on every request — used on the landing page and theme preview pages to prevent stale theme caching

---

## 3. Architecture & Codebase Layout

```
PartyShaarty/
├── app/                          # Next.js App Router
│   ├── page.js                   # Landing page (theme-driven, force-dynamic)
│   ├── layout.js                 # Root layout (fonts, global CSS)
│   │
│   ├── [eventSlug]/              # Public guest-facing pages
│   │   ├── invite/               # RSVP / invite form
│   │   ├── gallery/              # Guest photo gallery (OTP-gated)
│   │   ├── slideshow/            # Live fullscreen slideshow
│   │   └── memory/               # Memories page
│   │
│   ├── auth/                     # Auth pages (login, register, verify-email)
│   │
│   ├── dashboard/                # Host-only pages (middleware protected)
│   │   ├── page.js               # Events list + create event
│   │   ├── events/[eventId]/     # Per-event dashboard
│   │   │   ├── page.js           # RSVP list, QR, stats, lifecycle
│   │   │   ├── settings/         # Event details + cover image + Pexels
│   │   │   ├── gallery/          # Album management
│   │   │   └── intake/           # Celebration intake form
│   │   ├── reminders/            # WhatsApp/email reminder UI
│   │   └── thankyou/             # Thank-you message UI
│   │
│   ├── onboarding/
│   │   └── intake/               # Post-registration intake form (light & full)
│   │
│   ├── admin/                    # Super-admin only
│   │   ├── page.js               # Admin hub
│   │   ├── events/               # Event deletion requests
│   │   ├── intakes/              # All intake submissions (event + onboarding)
│   │   └── landing-config/       # Theme switcher + content editor
│   │
│   ├── landing/[theme]/          # Public theme preview (/landing/festival)
│   │
│   ├── api/                      # Route handlers
│   │   ├── auth/callback/        # Supabase email confirmation redirect
│   │   ├── host/events/          # Event CRUD
│   │   ├── rsvp/                 # RSVP submit, list, import, export
│   │   ├── gallery/              # Albums, photos, guest access
│   │   ├── slideshow/            # Slideshow data API
│   │   ├── reminders/            # WhatsApp/email reminders
│   │   ├── thankyou/             # Thank-you messages
│   │   ├── export/               # CSV/Excel export
│   │   ├── pexels/search/        # Pexels photo search proxy
│   │   ├── admin/                # Super-admin APIs
│   │   └── onboarding/intake/    # Onboarding intake POST
│   │
│   └── components/
│       └── landing/
│           ├── LandingTemplate.js        # Server component — renders themed landing
│           ├── LandingTemplate.module.css
│           └── themes/defaults.js        # 6 hardcoded theme configs
│
├── lib/                          # Shared server-side utilities
│   ├── event-store.js            # Event CRUD operations
│   ├── rsvp-store.js             # RSVP read/write
│   ├── gallery-store.js          # Album & photo operations
│   ├── guest-auth.js             # HMAC cookie sessions for guests
│   ├── supabase-server.js        # Server + admin Supabase clients
│   ├── supabase-browser.js       # Browser Supabase client
│   ├── supabase.js               # Storage helpers (upload, signed URLs)
│   ├── landing-store.js          # Theme read/write from DB
│   ├── admin-intakes.js          # Admin intake queries
│   ├── mailer.js                 # Gmail SMTP email sender
│   ├── messenger.js              # WhatsApp Cloud API
│   ├── rate-limit.js             # Upstash Redis rate limiting
│   ├── html-utils.js             # HTML escaping, linkify, formatting
│   └── upload-utils.js           # File validation, EXIF stripping
│
├── middleware.js                 # Auth guard + rate limiting (Edge)
│
└── supabase-*-migration.sql      # 11 SQL migration files (run in order)
```

---

## 4. Database Schema

All tables live in Supabase (Postgres). Row-Level Security (RLS) is enabled; the service-role key bypasses it.

### Core Tables

#### `host_profiles`
Created automatically when a user confirms their email via `/api/auth/callback`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `auth.users.id` |
| `slug` | TEXT | Unique, URL-friendly (e.g., `sharma-a8f2`) |
| `display_name` | TEXT | Host's name |
| `event_name` | TEXT | Default event name (legacy) |
| `created_at` | TIMESTAMPTZ | Auto |

#### `events`
Each row is one celebration.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `host_id` | UUID | FK → `host_profiles.id` |
| `event_name` | TEXT | Display name of the event |
| `slug` | TEXT | Global unique slug for invite URL |
| `event_type` | TEXT | `wedding`, `birthday`, `diwali`, `puja`, etc. |
| `event_date` | TEXT | ISO date string |
| `event_location` | TEXT | Venue/location text |
| `custom_message` | TEXT | Personalized invite message |
| `event_image_path` | TEXT | Storage path `covers/events/{eventId}/cover.{ext}` |
| `status` | TEXT | `active` or `draft` |
| `event_group_id` | UUID | FK → `event_groups.id` (wedding suite) |
| `created_at` | TIMESTAMPTZ | Auto |

#### `invite_rsvps`
One row per guest RSVP.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `host_id` | UUID | FK → `host_profiles.id` |
| `event_id` | UUID | FK → `events.id` |
| `guest_name` | TEXT | |
| `guest_phone` | TEXT | |
| `guest_email` | TEXT | |
| `attending` | BOOLEAN | null = pending, true = yes, false = no |
| `adults_count` | INTEGER | Adults (13+) attending |
| `kids_count` | INTEGER | Kids attending |
| `message` | TEXT | Guest's note |
| `created_at` | TIMESTAMPTZ | Auto |

#### `event_groups`
Wedding suite container.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `host_id` | UUID | FK → `host_profiles.id` |
| `name` | TEXT | Suite name (e.g., "Singh-Sharma Wedding") |
| `created_at` | TIMESTAMPTZ | Auto |

#### `gallery_albums`
Photo albums linked to events.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `host_id` | UUID | FK → `host_profiles.id` |
| `event_id` | UUID | FK → `events.id` (nullable) |
| `name` | TEXT | Album name |
| `slug` | TEXT | URL-friendly identifier |
| `is_public` | BOOLEAN | Public or OTP-gated |
| `created_at` | TIMESTAMPTZ | Auto |

#### `gallery_photos`
Individual photo references in storage.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `album_id` | UUID | FK → `gallery_albums.id` |
| `storage_path` | TEXT | Path in Supabase Storage bucket `event-photos` |
| `created_at` | TIMESTAMPTZ | Auto |

#### `gallery_shares`
OTP-gated album access records.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `album_id` | UUID | FK → `gallery_albums.id` |
| `email` | TEXT | Guest's email |
| `otp` | TEXT | One-time code (hashed) |
| `verified` | BOOLEAN | Whether OTP was confirmed |
| `created_at` | TIMESTAMPTZ | Auto |

#### `landing_themes`
Controls the public marketing landing page.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `name` | TEXT | Slug: `wedding`, `festival`, `puja`, `anniversary`, `birthday_kid`, `birthday_adult` |
| `display_name` | TEXT | Human-readable name |
| `is_active` | BOOLEAN | Only ONE can be true (enforced by DB partial unique index) |
| `config` | JSONB | Deep-merged over code defaults; admin-editable |
| `created_at` | TIMESTAMPTZ | Auto |
| `updated_at` | TIMESTAMPTZ | Auto |

**Important:** The DB partial unique index `WHERE is_active = true` ensures only one active theme at a time. `setActiveTheme()` first sets all rows to `false`, then sets the target to `true`.

#### `celebration_intake`
Preferences captured inside the event dashboard ("Design your celebration").

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `event_id` | UUID | FK → `events.id` |
| `guest_count_range` | TEXT | e.g., "40–100" |
| `venue_type` | TEXT | e.g., "Banquet Hall" |
| `investment_range` | TEXT | e.g., "$5,000–$15,000" |
| `involvement_level` | TEXT | Deprecated — was removed from steps |
| `contact_email` | TEXT | Required |
| `contact_phone` | TEXT | Required |
| `created_at` | TIMESTAMPTZ | Auto |
| `updated_at` | TIMESTAMPTZ | Auto |

#### `celebration_preferences`
Multi-value preferences linked to celebration_intake.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `intake_id` | UUID | FK → `celebration_intake.id` |
| `category` | TEXT | `experience_vibe`, `essential`, `memory_priority` |
| `value` | TEXT | The selected chip value |

#### `onboarding_intakes`
Submissions from landing page "Get Started" intake form.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `auth.users.id` |
| `intake_mode` | TEXT | `light` or `full` |
| `event_type` | TEXT | e.g., "Wedding", "Festival" |
| `event_date` | TEXT | Free-text date description |
| `guest_count_range` | TEXT | Chip selection |
| `venue_type` | TEXT | Full-mode only |
| `investment_range` | TEXT | Budget range |
| `experience_vibes` | TEXT[] | Postgres array |
| `essentials` | TEXT[] | Postgres array |
| `memories_priority` | TEXT | Full-mode only |
| `contact_email` | TEXT | **Required** |
| `contact_phone` | TEXT | |
| `created_at` | TIMESTAMPTZ | Auto |

### Supabase RPC (Stored Procedure)

#### `get_event_by_slug(p_slug TEXT)`
- **Security:** `SECURITY DEFINER` — runs with elevated privileges
- **Returns:** Single row joining `events` + `host_profiles`
- **Used by:** Public invite page to look up events without exposing host data
- **Important:** Does NOT return `event_group_id` or `event_type` — query `events` table directly for those

### Storage

- **Bucket:** `event-photos` (private, requires signed URLs)
- **Cover images:** `covers/events/{eventId}/cover.{ext}`
- **Album photos:** `{hostProfileId}/{albumSlug}/{filename}`
- **Signed URL expiry:** 1 hour

---

## 5. Authentication & Authorization

### Auth System

Utsavé uses Supabase Auth with email/password. No OAuth providers configured.

### Registration Flow

```
Visitor fills /auth/register
  ↓
supabase.auth.signUp() with emailRedirectTo
  • If coming from landing page "Get Started": emailRedirectTo includes ?returnTo=/onboarding/intake?mode=light|full
  • Otherwise: emailRedirectTo = /api/auth/callback (returns to /dashboard)
  ↓
Supabase sends confirmation email
  ↓
User clicks email link → browser opens /api/auth/callback?code=...&returnTo=...
  ↓
Callback handler:
  1. exchangeCodeForSession(code) — creates session
  2. Checks if host_profiles row exists for user
  3. If not: generates unique slug (displayName + 4-char random suffix), inserts host_profiles row
  4. Reads returnTo param — redirects to /dashboard or /onboarding/intake?mode=...
```

### Session Management

- Sessions stored in cookies (handled by `@supabase/ssr`)
- `createSupabaseServerClient()` — reads session from cookies (Server Components, API routes)
- `createSupabaseBrowserClient()` — reads/writes session from localStorage + cookies (Client Components)
- Session refresh handled by middleware on every request

### Authorization Tiers

| Tier | How It Works |
|------|-------------|
| **Unauthenticated** | Public pages: `/`, `/[eventSlug]/invite`, `/[eventSlug]/gallery` (OTP-gated), `/landing/[theme]` |
| **Authenticated Host** | `middleware.js` checks session; redirects to `/auth/login` if missing. All `/dashboard/*` and `/api/host/*` routes |
| **Super Admin** | Pages check `user.email === process.env.SUPER_ADMIN_EMAIL`. Set `SUPER_ADMIN_EMAIL` in `.env`. Both page and API are checked independently |
| **Guest** | HMAC-signed cookie `guest_session` (no Supabase auth needed). Created when guest accesses OTP-verified gallery. Verified on subsequent requests via `verifyGuestSession()` |

### Guest Session (Cookie-Based)

Guests don't have Supabase accounts. They access galleries via OTP email verification:

1. Guest provides email → receives OTP code by email
2. `POST /api/gallery/verify` validates OTP → creates `guest_session` cookie
3. Cookie payload: `{ email, eventSlug, t }` — HMAC-signed with `GUEST_SESSION_SECRET`
4. Expiry: 2 hours (`MAX_AGE_SEC = 7200`)
5. `verifyGuestSession()` checks signature + expiry on every protected guest request

---

## 6. Landing Page & Theme System

### Architecture

The landing page at `/` is a **Server Component** that:
1. Checks for `?theme=` URL override (for preview/testing without DB change)
2. Queries `landing_themes` table for the active theme
3. Falls back to hardcoded `DEFAULT_THEMES.anniversary` if DB is unreachable
4. Renders `<LandingTemplate theme={theme} />`

**Critical:** `export const dynamic = "force-dynamic"` is set on both `app/page.js` and `app/landing/[theme]/page.js`. Without this, Next.js caches the Supabase fetch calls and the landing page never reflects DB changes (the #1 cause of "theme not updating" bugs).

### Theme Structure

Each theme object has these fields:

```javascript
{
  // Identity
  name: "festival",              // DB slug
  displayName: "Festival",

  // Color palette (applied as CSS variables on wrapper div)
  palette: {
    accent:      "#e85d04",      // --accent
    accentHover: "#c44d03",      // --accent-hover
    accentDim:   "rgba(232,93,4,0.12)", // --accent-dim
    bg:          "#fff9f5",      // --bg
    accentDeep:  "#7c2d02",      // --accent-deep
  },

  // Hero section content
  hero: {
    badge:        "Built for Indian festivals",
    headline:     "Light the diyas.\nThrow the colors.\nWe'll handle the rest.",
    subheadline:  "Your family spans continents...",
    ctaText:      "Start planning your festival →",
    ctaHref:      "/auth/register",
    photos:       [{ src: "https://...", alt: "..." }, ...] // 3 photos
  },

  // Event type grid (subset of ALL_EVENT_TYPES)
  eventTypeKeys: ["diwali", "holi", "navratri", "puja", "birthday", "wedding"],

  // Bottom CTA banner
  ctaBanner: {
    headline: "Your next celebration deserves Utsavé.",
    sub:      "Free to start. No credit card required.",
    cta:      "Begin your celebration →",
    href:     "/auth/register",
  },

  // Intake mode for "Get Started" button in help section
  intakeMode: "light",           // "light" | "full"

  // "We're here for you" help section
  helpCta: {
    enabled:     true,
    headline:    "Want help planning your celebration?",
    sub:         "Let our team design, plan and execute your event — end to end.",
    email:       "contact@utsav-events.com",
    phone:       "571-908-9101",
    buttonText:  "Get Started →",
  }
}
```

### Theme Merging (DB vs Code)

`mergeWithDefault(dbRow)` in `lib/landing-store.js`:
1. Starts with hardcoded default for that theme name
2. Shallow-merges DB `config` JSONB on top (DB wins field by field)
3. Deep-merges nested sections: `palette`, `hero`, `ctaBanner`, `helpCta`

This means admins can override specific fields without losing defaults.

### 6 Default Themes

| Theme Name | Display Name | Accent Color | intakeMode |
|-----------|-------------|-------------|------------|
| `wedding` | Weddings | `#c9941a` (warm gold) | `full` |
| `anniversary` | Anniversary | `#9d6b9e` (amethyst) | `full` |
| `festival` | Festivals | `#e85d04` (vibrant orange) | `light` |
| `puja` | Puja & Religious | `#b5451b` (saffron/maroon) | `light` |
| `birthday_kid` | Kid's Birthday | `#2d9cdb` (sky blue) | `light` |
| `birthday_adult` | Adult Birthday | `#1b4f72` (navy) | `light` |

### Admin Theme Management

Located at `/admin/landing-config` (SUPER_ADMIN_EMAIL required).

**Panel A — Activate Theme:**
- Shows all 6 themes as cards
- One-click activate (deactivates others atomically)
- "Preview ↗" link opens `/landing/{name}` in new tab

**Panel B — Edit Theme Content:**
- Select which theme to edit
- Edit: Hero (badge, headline, subheadline, CTA text, 3 photos)
- Edit: Colour palette (5 colour pickers)
- Edit: Featured event types (checkboxes)
- Edit: CTA Banner (headline, sub-text, button)
- Edit: **Help CTA section** — show/hide toggle, intake mode (Light/Full radio), contact email, phone, button text
- Config saved to `config` JSONB column in DB; live immediately

### Theme Preview Without Changing Active Theme

Any theme can be previewed without affecting the live site:
- Direct URL: `/?theme=festival` — shows festival theme for that request only
- Admin preview: `/landing/festival` — public URL, always shows that theme from DB

---

## 7. Host Dashboard & Event Management

### Event Lifecycle

```
Host creates event (draft status)
  ↓
Fills in details (name, date, location, cover photo)
  ↓
[Optional] Completes "Design your celebration" intake questionnaire
  ↓
Clicks "Launch Event" → status = "active"
  ↓
Shares invite link: https://utsave.com/{eventSlug}/invite
  ↓
Guests RSVP
  ↓
Host manages guest list, sends reminders
  ↓
Host sends thank-you messages after event
  ↓
Host requests deletion (approved by super admin)
```

### Event Types

Events can be one of these types:

| Key | Display | Notes |
|-----|---------|-------|
| `wedding` | Wedding | |
| `birthday` | Birthday | |
| `diwali` | Diwali Party | |
| `puja` | Puja & Ceremony | |
| `namkaran` | Namkaran | |
| `godh_bharai` | Godh Bharai | |
| `graduation` | Graduation | |
| `holi` | Holi Celebration | |
| `navratri` | Navratri / Garba | |
| `anniversary` | Anniversary | |

### Wedding Suite (Event Group)

A **Wedding Suite** links multiple functions under one container:
- Host creates suite: names it (e.g., "Singh-Sharma Wedding 2025")
- Adds 2–5 functions with individual names and dates (Sangeet, Mehndi, Pheras, Reception)
- Each function is a separate `events` row with the same `event_group_id`
- Each function gets its own invite URL and independent RSVP list
- Per-function RSVP: guests can indicate which functions they'll attend

### Event Slugs

- Auto-generated from event name + 4-char random suffix
- Examples: `sharma-wedding-a8f2`, `diwali-2025-x3k9`
- **Global unique** across all hosts
- Used in all public URLs: invite, gallery, slideshow, memory

### Cover Image

- Upload from device (browser file picker)
- Search Pexels live (server-side proxy via `/api/pexels/search`)
  - Pre-filtered by event type (e.g., wedding events default to wedding photos)
  - Host searches, picks photo → downloaded server-side, saved to storage
- Stored in Supabase Storage: `covers/events/{eventId}/cover.{ext}`
- Path stored in `events.event_image_path`

### Event Settings Page (`/dashboard/events/[eventId]/settings`)

Hosts can edit:
- Event name, date, location, custom message
- Cover photo (upload or Pexels search)
- View current invite URL

### RSVP List & Stats (Event Dashboard)

Per event:
- **Total RSVPs**: all submissions
- **Attending**: `attending = true`
- **Declining**: `attending = false`
- **Pending**: `attending = null`
- **Adults / Kids counts**: summed from `adults_count` + `kids_count` fields
- **% Accepted**: `(attending / total) * 100`
- Filter: All / Attending / Declining / Pending
- CSV Import: Bulk import from CSV template
- Excel Export: Download guest list as spreadsheet

---

## 8. RSVP System

### Public RSVP Flow

```
Guest opens /{eventSlug}/invite
  ↓
InviteForm.js renders (client component):
  - Event name, date, location, cover image, custom message
  - Guest fills: name, email, phone, attending (yes/no/maybe)
  - If wedding suite: per-function attendance checkboxes
  - Adults (13+) count, Kids count
  ↓
POST /api/rsvp
  - Rate limited: 10 per minute per IP (Upstash Redis)
  - Validates required fields
  - Creates row in invite_rsvps
  - If wedding suite: POST /api/rsvp/suite (separate route for per-function)
  ↓
Confirmation message shown to guest
```

### Rate Limiting on RSVP

- **Limit:** 10 requests per minute per IP address
- **Store:** Upstash Redis (edge-compatible)
- **Key format:** `rsvp:{ip}`
- **Exceeded response:** HTTP 429 with `Retry-After` header

### RSVP Import (CSV)

- Host downloads template from `/api/rsvp/template`
- Template columns: `Name`, `Phone`, `Email`, `Attending` (yes/no/maybe)
- Uploads filled CSV to `/api/rsvp/import`
- Server parses, validates, inserts rows
- Returns: `{ imported, errors }`

### RSVP Export

- `GET /api/export` — returns XLSX file
- `GET /api/export/json` — returns JSON array
- Can filter by `?eventId=` for per-event export

---

## 9. Photo Gallery & Albums

### Album Architecture

- Each host can have multiple albums
- Albums are linked to a specific event via `event_id`
- Albums can be public or OTP-gated (`is_public`)
- One special album per event: **"Guest Contributions"** (auto-created on first guest upload)

### Storage Structure

```
event-photos/                          (Supabase bucket)
  covers/
    events/
      {eventId}/
        cover.jpg                      (event cover image)
  {hostProfileId}/
    {albumSlug}/
      {uuid}-{filename}.jpg            (album photos)
```

### Image Processing Pipeline

All uploads go through:
1. **Size validation** — max 10 MB (`MAX_UPLOAD_SIZE_MB`)
2. **Image validation** — `sharp` checks it's a valid image
3. **EXIF stripping** — removes GPS coordinates, device info, timestamps via `stripExifAndReencode()`
4. **Re-encoding** — output as JPEG or WebP

### Accessing Photos

- Photos require **signed URLs** (1-hour expiry) from Supabase Storage
- `getSignedUrlsForPaths(paths)` batches multiple paths
- Guest access: OTP verification via email → `gallery_shares` table

### OTP Gallery Access Flow

```
Guest visits /{eventSlug}/gallery
  ↓
Enters email address
  ↓
POST /api/gallery/verify (rate limited: 5 per 10 min per IP)
  - Generates OTP code
  - Sends to guest email via Gmail SMTP
  - Stores in gallery_shares table
  ↓
Guest enters OTP code
  ↓
POST /api/gallery/verify (verify action)
  - Validates OTP
  - Creates guest_session cookie (HMAC-signed, 2h expiry)
  ↓
Guest can now view album photos and upload their own
```

### Guest Photo Upload

- Available on `/{eventSlug}/gallery` page
- Requires `guest_session` cookie (2h expiry)
- `POST /api/gallery/guest-upload`
  - Validates guest session
  - Validates + EXIF-strips image
  - Creates "Guest Contributions" album if it doesn't exist
  - Stores photo in storage

---

## 10. Intake Forms (Event & Onboarding)

There are **two separate intake systems**:

### A. Celebration Intake (Inside Dashboard)

**Path:** `/dashboard/events/[eventId]/intake`
**Purpose:** Capture event preferences to help the Utsavé team plan the celebration
**Access:** Host only (authenticated)

**6-Step Flow:**
| Step | What's Captured |
|------|----------------|
| 1 | Experience vibes (up to 2 of 6 options) |
| 2 | Guest count range + venue type |
| 3 | Support priorities (multi-select: photography, décor, DJ, etc.) |
| 4 | Memories priority (single select) |
| 5 | Investment/budget range |
| 6 | Contact email + phone (required) |

**Data Storage:**
- Main fields → `celebration_intake` table
- Multi-value fields (vibes, essentials, memories) → `celebration_preferences` table (category + value rows)

**API:** `GET/POST /api/host/events/[eventId]/intake`

### B. Onboarding Intake (Landing Page → Registration)

**Path:** `/onboarding/intake?mode=light|full`
**Purpose:** Capture interest from landing page "Get Started" visitors
**Access:** Must be authenticated (auth check on page load)

#### Light Mode (Single Page)
For small/casual events (festivals, birthdays, puja):
- Event type chips
- Approximate date (free text)
- Guest count chips (Under 50 / 50-150 / 150-350 / 350+)
- Budget range chips
- Contact email (pre-filled from auth) + phone (both required)
- Single "Submit" button

#### Full Mode (6 Steps)
For large events (weddings, anniversaries):
- Same 5 steps as celebration intake + contact step
- Mirrors the event dashboard intake UX

**API:** `POST /api/onboarding/intake` (requires auth, inserts to `onboarding_intakes` table)

**Intake Mode Routing:**
```
Landing page "Get Started" button
  href = /auth/register?intake={theme.intakeMode}
  ↓
Register page reads ?intake=light|full
  emailRedirectTo includes returnTo=/onboarding/intake?mode=light|full
  ↓
After email confirmation → /api/auth/callback?returnTo=...
  ↓
Callback redirects to /onboarding/intake?mode=light|full
```

**Theme-to-Mode Mapping:**
- `wedding`, `anniversary` → `intakeMode: "full"` (6 steps)
- `festival`, `birthday_kid`, `birthday_adult`, `puja` → `intakeMode: "light"` (single page)
- Super admin can override per-theme in `/admin/landing-config`

---

## 11. Messaging (WhatsApp & Email)

### WhatsApp Integration

**Library:** Meta Cloud API (direct REST calls, no third-party SDK)
**Config:** `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`

**Two message types:**

| Type | Function | When Used |
|------|----------|-----------|
| Free-form | `sendWhatsApp(to, message)` | Reminders within 24h window |
| Template | `sendWhatsAppTemplate(to, template, params)` | After 24h window; must be pre-approved by Meta |

**Reminder Flow:**
- Host goes to `/dashboard/reminders`
- Selects guests (filter: not yet responded, all attending, etc.)
- Writes custom message or uses template
- `POST /api/reminders/send` → loops through guest list → calls `sendWhatsApp()`

**Webhook:**
- `POST /api/whatsapp/webhook` receives status updates and inbound messages from Meta
- Verify token: `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

### Email Integration

**Library:** Nodemailer
**Provider:** Gmail SMTP
**Config:** `GMAIL_USER`, `GMAIL_APP_PASSWORD` (app-specific password, not regular Gmail password)

**Used For:**
- Gallery OTP codes to guests
- Thank-you messages to guests
- Album share invitations

**`sendEmail()` signature:**
```javascript
sendEmail({
  to: "guest@example.com",
  subject: "Your OTP code",
  html: "<p>Your code is <strong>123456</strong></p>",
  replyTo: "host@example.com",  // optional
  attachments: []               // optional
})
```

---

## 12. Live Features (Slideshow, QR Code)

### Live Venue Slideshow

**URL:** `/{eventSlug}/slideshow`
**Purpose:** Fullscreen auto-rotating gallery for event screens/projectors

- **Polling:** Client polls `GET /api/slideshow/{eventSlug}` every 30 seconds for new photos
- **Rotation:** Advances to next photo every 6 seconds (client-side timer)
- **Auth:** None required — fully public
- **Data:** Returns all photos across all albums for the event, sorted by upload time

### QR Code

- Generated client-side using `qrcode` npm package
- `QRCode.toDataURL(inviteUrl)` → returns a base64 PNG
- Displayed in a panel on the event dashboard
- Hosts can download or screenshot it
- Points to: `https://utsave.com/{eventSlug}/invite`

---

## 13. Super Admin Panel

**URL:** `/admin`
**Access:** Email must match `SUPER_ADMIN_EMAIL` environment variable. Checked both in the page (`user.email !== process.env.SUPER_ADMIN_EMAIL`) and in API routes.

### Admin Hub (`/admin`)

Links to all sub-panels:
- Events (deletion requests)
- Intakes
- Landing config

### Events Panel (`/admin/events`)

- Lists all events that have requested deletion
- Shows: event name, host, reason provided
- Admin can approve deletion (hard-deletes from DB + storage)
- `DELETE /api/admin/events/[eventId]` — deletes event + all RSVPs + photos

### Intakes Panel (`/admin/intakes`)

**Two sections:**

**Onboarding Inquiries** (top section):
- From landing page "Get Started" flow
- Shows: event type, intake mode (Light/Full badge), guest count, budget, email, phone
- Expandable: shows date, venue, memories priority, experience vibes, priorities

**Celebration Intakes** (bottom section):
- From event dashboard intake forms
- Shows: event name, host name, invite link, email, phone, date submitted
- Expandable: shows guest count, venue, budget, all preference categories

### Landing Config (`/admin/landing-config`)

**Panel A — Active Theme:**
- 6 theme cards
- One-click activate (live immediately — no redeploy)
- Preview ↗ link per theme

**Panel B — Edit Theme Content:**
- Select theme to edit from dropdown
- Hero section: badge, headline (supports `\n` for line breaks), subheadline, CTA text/href, 3 photo URLs
- Colour palette: 5 colour pickers with text input fallback
- Event type grid: checkboxes for 10 event types
- CTA Banner: headline, sub-text, button text/href
- **Help CTA section:**
  - Show/Hide checkbox
  - Intake mode radio: Light (single-page) / Full (6-step)
  - Headline, sub-text, contact email, contact phone, button text
- Save → instant DB update → live on next page load

---

## 14. API Route Reference

### Public Routes (No Auth Required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/slideshow/[eventSlug]` | Slideshow photos for event |
| `POST` | `/api/rsvp` | Submit guest RSVP (rate-limited: 10/min/IP) |
| `POST` | `/api/gallery/verify` | Gallery OTP verify (rate-limited: 5/10min/IP) |

### Auth Callback

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/auth/callback` | Supabase email confirmation handler |
| `POST` | `/api/auth/logout` | Clear session cookies |

### Host Routes (Requires `host_profiles` row)

| Method | Path | Description |
|--------|------|-------------|
| `GET/POST` | `/api/host/events` | List / create events |
| `GET/PATCH/DELETE` | `/api/host/events/[eventId]` | Event CRUD |
| `GET/POST` | `/api/host/events/[eventId]/intake` | Read / submit celebration intake |
| `POST` | `/api/host/event-groups` | Create wedding suite |
| `GET` | `/api/host/profile` | Host profile data |
| `GET` | `/api/rsvp/list` | RSVP list (with `?eventId=`) |
| `POST` | `/api/rsvp/import` | Bulk import RSVPs from CSV |
| `GET` | `/api/rsvp/template` | Download CSV template |
| `POST` | `/api/rsvp/suite` | Per-function RSVP (wedding suite) |
| `GET/POST` | `/api/gallery/albums` | List / create albums |
| `GET/PATCH/DELETE` | `/api/gallery/albums/[albumId]` | Album CRUD |
| `POST` | `/api/gallery/albums/[albumId]/photos` | Upload photo to album |
| `POST` | `/api/gallery/albums/[albumId]/photos/move` | Move photo |
| `GET/POST` | `/api/gallery/albums/[albumId]/shares` | Album sharing |
| `GET` | `/api/gallery/albums/guest` | Guest-accessible albums |
| `POST` | `/api/gallery/guest-upload` | Guest photo upload (needs `guest_session` cookie) |
| `GET` | `/api/export` | Export guest list (XLSX) |
| `GET` | `/api/export/json` | Export guest list (JSON) |
| `POST` | `/api/reminders/send` | Send WhatsApp reminders |
| `POST` | `/api/thankyou/send` | Send thank-you messages |
| `GET` | `/api/pexels/search` | Search Pexels photos |
| `GET` | `/api/image` | Image proxy |
| `POST` | `/api/onboarding/intake` | Submit onboarding intake |

### Admin Routes (Requires SUPER_ADMIN_EMAIL)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/intakes` | List all intakes |
| `GET/DELETE` | `/api/admin/events/[eventId]` | View / hard-delete event |
| `GET/POST` | `/api/admin/landing-themes` | List / create themes |
| `GET/PATCH` | `/api/admin/landing-themes/[id]` | Get / update theme config or activate |

---

## 15. Environment Variables

| Variable | Required | Used By | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Browser + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Browser + Server | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server only | Bypasses RLS — **NEVER expose to browser** |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Auth callbacks | Production URL (e.g., `https://utsave.com`) |
| `SUPER_ADMIN_EMAIL` | ✅ | Admin pages + API | Email for super admin access |
| `GUEST_SESSION_SECRET` | ✅ | Guest auth | HMAC secret for `guest_session` cookie |
| `GMAIL_USER` | ✅ | Mailer | Gmail address for sending |
| `GMAIL_APP_PASSWORD` | ✅ | Mailer | App-specific password (not regular password) |
| `WHATSAPP_ACCESS_TOKEN` | ✅ | Messenger | Permanent Meta token |
| `WHATSAPP_PHONE_NUMBER_ID` | ✅ | Messenger | Meta phone number ID |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Optional | Webhook | Verify incoming webhook requests |
| `PEXELS_API_KEY` | ✅ | Pexels proxy | API key — server-side only, never exposed |
| `UPSTASH_REDIS_REST_URL` | ✅ | Rate limiting | Upstash Redis endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Rate limiting | Upstash Redis token |

---

## 16. Key Workflows — End to End

### Workflow 1: New Host Onboarding via Landing Page

```
1. Visitor lands on utsave.com (sees active theme, e.g., festival)
2. Clicks "Get Started →" in the help section
3. Goes to /auth/register?intake=light (festival theme → light intake)
4. Fills registration form (name, email, password)
5. Supabase sends confirmation email with link to:
   /api/auth/callback?returnTo=%2Fonboarding%2Fintake%3Fmode%3Dlight
6. User clicks email link
7. Callback: exchanges code, creates host_profiles row, redirects to:
   /onboarding/intake?mode=light
8. Single-page light intake form (pre-filled email from auth)
9. User selects event type, date, guest count, budget, adds phone
10. Submits → POST /api/onboarding/intake → stored in onboarding_intakes
11. Thank-you screen with "Go to Dashboard →" link
12. Admin sees new inquiry at /admin/intakes → "Onboarding inquiries" section
```

### Workflow 2: Host Creates and Launches an Event

```
1. Host logs in → /dashboard
2. Clicks "Create new celebration"
3. Selects event type → fills name, date, location
4. Event created with status = "draft"
5. Redirected to /dashboard/events/{eventId}
6. Goes to Settings → uploads cover photo (file or Pexels search)
7. [Optional] Completes "Design your celebration" intake form
8. Clicks "Launch Event" → confirms → status = "active"
9. Copies invite link: https://utsave.com/{eventSlug}/invite
10. Shares via WhatsApp, email, etc.
```

### Workflow 3: Guest RSVPs

```
1. Guest opens invite link: /{eventSlug}/invite
2. Event details displayed (name, date, location, cover photo, message)
3. Guest fills: name, email, phone, attending (yes/no/maybe)
   If wedding suite: sees function checkboxes
   Fills adults (13+) and kids count
4. Clicks "Submit" → POST /api/rsvp
5. Rate limit checked (10/min/IP via Upstash Redis)
6. Row inserted into invite_rsvps
7. Confirmation shown to guest
8. Host's dashboard updates with new RSVP count
```

### Workflow 4: Photo Gallery Access

```
1. Host creates album in /dashboard/events/{eventId}/gallery
2. Uploads photos (goes through EXIF stripping pipeline)
3. Shares album with guest emails (sends OTP email via Gmail)

Guest flow:
4. Guest receives email with gallery link
5. Opens /{eventSlug}/gallery
6. Enters email → receives OTP code
7. POST /api/gallery/verify → rate limited (5/10min/IP)
8. Enters OTP → session cookie created (2h expiry)
9. Guest views photos (signed URLs, 1h expiry)
10. Guest uploads own photos → stored in "Guest Contributions" album
```

### Workflow 5: Admin Changes Active Theme

```
1. Super admin logs in with SUPER_ADMIN_EMAIL account
2. Navigates to /admin/landing-config
3. Panel A: clicks "Activate" on desired theme
4. PATCH /api/admin/landing-themes/{id} with { is_active: true }
5. DB: setActiveTheme() — sets all is_active=false, then target=true
6. Page refreshes (router.refresh()) to update Active badge
7. Visit / → landing page shows new theme
   (force-dynamic ensures fresh DB fetch, no caching)
```

---

## 17. Common Issues & Troubleshooting

### Issue: Landing page shows wrong/stale theme

**Symptom:** Admin changed active theme but homepage still shows old theme.

**Cause:** Next.js data cache is serving stale Supabase fetch results.

**Fix applied:** `export const dynamic = "force-dynamic"` added to `app/page.js`. If still occurring:
1. Confirm the line is present in `app/page.js`
2. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R) to bypass browser cache
3. Check Vercel deployment — a new deployment clears the data cache

---

### Issue: Onboarding intake always shows full form (6 steps) instead of light

**Symptom:** Clicking "Get Started" from festival/birthday theme leads to full 6-step intake.

**Root cause:** Theme caching (see above) — the anniversary fallback theme has `intakeMode: "full"`, causing the "Get Started" button to link to `?intake=full`.

**Fix:** Same as above — `force-dynamic` on the landing page ensures correct `intakeMode` from DB.

**Verify:** Check the URL when clicking "Get Started" — it should be `/auth/register?intake=light` for festival theme.

---

### Issue: Guest cannot access gallery (OTP email not received)

**Check:**
1. `GMAIL_USER` and `GMAIL_APP_PASSWORD` env vars are set correctly
2. App-specific password is used (not the regular Gmail password)
3. Less-secure app access not needed — app-specific password handles this
4. Check spam folder
5. Rate limit: 5 OTP requests per 10 minutes per IP — guest may be hitting limit

---

### Issue: WhatsApp messages not sending

**Check:**
1. `WHATSAPP_ACCESS_TOKEN` — token may have expired (use permanent token, not temporary)
2. `WHATSAPP_PHONE_NUMBER_ID` — must match the phone number in Meta Business Suite
3. Guest phone number format: must include country code (e.g., `+15555551234`)
4. Free-form messages only work within 24h of guest interaction; use templates after
5. Meta API response error codes — check server logs for specific error

---

### Issue: RSVP import fails

**Check:**
1. CSV columns match template exactly: `Name`, `Phone`, `Email`, `Attending`
2. `Attending` values: only `yes`, `no`, `maybe` accepted (case-insensitive)
3. File encoding: UTF-8 only
4. Max row limit: check server logs for memory/timeout issues

---

### Issue: Cover image not showing on invite page

**Check:**
1. `event_image_path` is set on the event row in DB
2. Supabase Storage bucket `event-photos` exists and is accessible
3. Signed URLs expire after 1 hour — old links in cached pages may fail
4. Image was uploaded successfully (check for upload errors in settings page)

---

### Issue: Admin panel shows "Unauthorized" or redirects to dashboard

**Check:**
1. `SUPER_ADMIN_EMAIL` in `.env` matches the logged-in user's email exactly (trimmed, case-sensitive)
2. User must be logged in with that specific email
3. Both the page AND the API check this — ensure both are using the same env var

---

### Issue: Event intake form doesn't save

**Check:**
1. Both `contact_email` and `contact_phone` must be filled — they're required
2. `POST /api/host/events/{eventId}/intake` — check for auth errors (401/404)
3. `requireHostProfile()` — host profile must exist; created during email confirmation

---

### Issue: Guest session expired (gallery access denied after 2 hours)

**Expected behavior** — `MAX_AGE_SEC = 7200` (2 hours).
Guest must re-verify with OTP. Rate limit applies: 5 per 10 minutes.

---

## 18. Rate Limiting & Security

### Rate Limits

| Endpoint | Limit | Window | Key |
|----------|-------|--------|-----|
| `POST /api/rsvp` | 10 requests | 1 minute | Per IP |
| `POST /api/gallery/verify` | 5 requests | 10 minutes | Per IP |

**Backend:** Upstash Redis (REST API, edge-compatible, serverless-friendly)
**Response when limited:** HTTP 429 with `Retry-After` header (seconds until reset)

### Security Measures

| Measure | Implementation |
|---------|---------------|
| **Auth** | Supabase session cookies (httpOnly, secure) |
| **Guest Auth** | HMAC-signed `guest_session` cookie — tampering detectable |
| **EXIF Stripping** | All uploaded images re-encoded through `sharp` — GPS/device metadata removed |
| **XSS Prevention** | `html-utils.js` — `escapeHtml()` before rendering user content |
| **Admin Gate** | Double-checked: both page redirect AND API return 401 for non-admin |
| **Service Role** | `SUPABASE_SERVICE_ROLE_KEY` only in server code, never in `NEXT_PUBLIC_` vars |
| **Pexels Key** | Server-side only proxy (`/api/pexels/search`) — key never sent to browser |
| **Redirect Safety** | Auth callback validates `returnTo` starts with `/` and not `//` |
| **RLS** | Supabase Row-Level Security enabled on all tables |
| **Input Validation** | Required field checks at API boundary; file type + size validation on upload |

### Data Privacy Considerations

- Guest phone numbers and emails are stored in `invite_rsvps` — hosts have access
- EXIF stripping removes GPS data from all photos before storage
- Gallery shares are OTP-gated — guests must verify email to access private albums
- Onboarding intakes contain contact info — visible only to super admin in `/admin/intakes`
- Guest sessions expire after 2 hours; no persistent guest accounts

---

*End of Technical Reference Guide*

*For issues not covered here, check server logs (Vercel function logs), Supabase logs, and the project repository history.*
