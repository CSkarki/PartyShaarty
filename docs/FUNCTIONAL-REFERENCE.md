# Utsavé — Functional Reference Guide
**For Functional Analysts, Business Analysts & Product Teams**
*Last updated: March 2026*

---

## Table of Contents

1. [Product Vision & Mission](#1-product-vision--mission)
2. [User Personas & Roles](#2-user-personas--roles)
3. [Platform Feature Map](#3-platform-feature-map)
4. [Event Lifecycle — End to End](#4-event-lifecycle--end-to-end)
5. [Landing Page & Theme System](#5-landing-page--theme-system)
6. [Host Registration & Onboarding](#6-host-registration--onboarding)
7. [Event Creation & Configuration](#7-event-creation--configuration)
8. [Invite & RSVP System](#8-invite--rsvp-system)
9. [Guest Experience](#9-guest-experience)
10. [Photo Gallery & Albums](#10-photo-gallery--albums)
11. [Wedding Suite (Multi-Function Events)](#11-wedding-suite-multi-function-events)
12. [Messaging & Communications](#12-messaging--communications)
13. [Live Event Features](#13-live-event-features)
14. [Intake & Planning Questionnaires](#14-intake--planning-questionnaires)
15. [Admin & Operations Panel](#15-admin--operations-panel)
16. [Business Rules & Constraints](#16-business-rules--constraints)
17. [Data, Privacy & Guest Rights](#17-data-privacy--guest-rights)
18. [Key Business Workflows](#18-key-business-workflows)
19. [Metrics & Reporting Concepts](#19-metrics--reporting-concepts)
20. [Glossary](#20-glossary)

---

## 1. Product Vision & Mission

### Who We Are

**Utsavé** (from the Sanskrit word *utsava*, meaning celebration or festival) is a purpose-built celebration management platform for the **Indian diaspora**. It combines digital invites, RSVP management, photo sharing, and WhatsApp communications into a single cohesive product tuned specifically for South Asian cultural events.

### Mission Statement

> *"Every celebration, elevated."*
>
> We help families across the Indian diaspora plan, share, and remember their most cherished moments — from intimate pujas to grand weddings — with the cultural sensitivity, warmth, and attention to detail those occasions deserve.

### The Problem We Solve

Traditional event planning tools (Evite, Paperless Post, Google Forms, WhatsApp groups) are fragmented and culturally agnostic. Indian families managing multi-day, multi-function celebrations need:

- A single URL to share with all guests
- RSVP tracking that accounts for whole-family responses (adults + children)
- Photo albums organized per event function
- Reminders via **WhatsApp** (the primary communication channel in the community)
- Invite pages that feel festive and culturally resonant — not generic corporate

### Target Market

| Segment | Description |
|---------|-------------|
| **Primary** | Indian-American and Indian-Canadian families planning weddings, anniversaries, festivals |
| **Secondary** | South Asian diaspora in the UK, Australia, UAE |
| **Adjacent** | Second-generation hosts who want a modern digital experience for traditional events |

---

## 2. User Personas & Roles

### 2.1 The Host (Core Paying User)

The **Host** is the person (or couple) who creates events on Utsavé. They own the account, configure the event, manage the guest list, and communicate with attendees.

**Who they are:**
- Ages 28–55, tech-comfortable but not tech-savvy
- Planning a personal life event (wedding, anniversary, birthday, puja)
- May be planning on behalf of a parent or elder family member
- Primarily based in USA/Canada/UK

**What they need:**
- A shareable invite URL to send over WhatsApp
- Real-time RSVP counts (how many adults, how many kids are coming)
- A private gallery to share ceremony photos after the event
- Automated WhatsApp reminders so they don't have to chase guests manually
- A record of who said yes/no/maybe

**Account limits:**
- One host account per email address
- Can create multiple events under one account (e.g., separate events for Mehndi, Pheras, Reception)
- Can group events into a "Wedding Suite" to share as a unified experience

---

### 2.2 The Guest (End Consumer, No Account Required)

The **Guest** visits the invite link, fills out the RSVP form, and may return later to view the photo gallery.

**Who they are:**
- Family members or friends of the host
- Age range 15–80+ (must be accessible to less tech-savvy users)
- May access the invite on a mobile browser via a WhatsApp link

**What they need:**
- A simple, clear RSVP form (their name, whether they're attending, how many adults + kids)
- Optional: viewing and uploading photos to the gallery post-event
- No account creation required — access is via OTP (one-time password sent to phone)

**Guest authentication:**
- Guests do NOT have Utsavé accounts
- Gallery access is unlocked by entering their phone number and an OTP SMS code
- Once authenticated, a session cookie persists for the browser session

---

### 2.3 The Super Admin (Internal Utsavé Team)

The **Super Admin** is a single trusted internal operator who manages platform-level settings.

**Responsibilities:**
- Sets the active landing page theme (which marketing campaign is live)
- Previews all available themes
- Reviews all planning intake questionnaires submitted by hosts and prospects
- Can configure per-theme intake settings (Light vs Full questionnaire)
- Can toggle the "Need help?" help section on the landing page per theme

**Access:**
- Protected by email address match (only the configured `SUPER_ADMIN_EMAIL` can access)
- Accessed at `/admin` in the dashboard navigation

---

### 2.4 Support / Call Center Agent

**Responsibilities:**
- Responds to inbound host and guest inquiries (email, phone)
- Uses Utsavé admin panel to look up intake submissions
- Escalates technical issues to engineering

**Access:**
- Read-only visibility into intake submissions via admin panel
- No ability to modify host accounts or event data directly

---

## 3. Platform Feature Map

### Features Available to Hosts

| Feature | Where | Description |
|---------|-------|-------------|
| Event creation | Dashboard | Create event with name, date, venue, cover image |
| Custom invite URL | Dashboard | Unique slug like `sharma-wedding-2025` |
| RSVP tracking | Dashboard | Live count of Yes/No/Maybe + adult/kid counts |
| Guest list export | Dashboard | Download RSVP data as CSV |
| Photo albums | Dashboard / Gallery | Create multiple albums, upload photos |
| QR code | Dashboard | Downloadable QR linking to invite page |
| WhatsApp reminders | Dashboard | Send reminders to all guests via WhatsApp |
| Email reminders | Dashboard | Send reminders via email |
| Thank-you messages | Dashboard | Post-event thank-you via WhatsApp/email |
| Wedding Suite | Dashboard | Link multiple functions under one suite page |
| Per-function RSVP | Dashboard | Guests indicate attendance per function |
| Event settings | Settings | Edit event details, change cover image |
| Planning intake | Intake tab | 6-step questionnaire for event planning help |
| Live slideshow | Event settings | Fullscreen rotating gallery for venue screens |

### Features Available to Guests

| Feature | Where | Description |
|---------|-------|-------------|
| Invite page | `/{slug}/invite` | View event details, RSVP |
| RSVP form | Invite page | Submit attendance, adult + kid count |
| Per-function RSVP | Invite page (Suite) | Indicate which functions they'll attend |
| Gallery view | `/{slug}/gallery` | View all albums after OTP auth |
| Guest photo upload | Gallery | Upload photos from their own device |
| Suite overview | `/suite/{suiteSlug}/invite` | See all functions in one place |

### Features Available to Super Admin

| Feature | Where | Description |
|---------|-------|-------------|
| Theme management | `/admin/landing-config` | Set active theme, edit all theme content |
| Theme preview | `/landing/{themeName}` | Preview any theme without activating it |
| Intake review | `/admin/intakes` | View all onboarding and event planning intakes |
| Help CTA config | Landing config | Toggle contact section, set intake mode |

---

## 4. Event Lifecycle — End to End

The typical journey from idea to post-event looks like this:

```
[1] Host registers
       ↓
[2] Host creates event
       ↓
[3] Host customizes: name, date, venue, cover image
       ↓
[4] Host shares invite URL via WhatsApp / social
       ↓
[5] Guests RSVP (RSVP window open)
       ↓
[6] Host monitors RSVP count in real time
       ↓
[7] Host sends WhatsApp / email reminders
       ↓
[8] Event Day: QR code displayed, live slideshow running
       ↓
[9] Post-event: Host uploads photos to gallery
       ↓
[10] Host sends gallery link + thank-you message
       ↓
[11] Guests authenticate via OTP to view gallery
       ↓
[12] Guests optionally upload their own photos
```

---

## 5. Landing Page & Theme System

### What the Landing Page Is

The Utsavé landing page (`utsave.com`) is the primary marketing surface. It is **not a static page** — it is fully configurable by the Super Admin and can be switched between themes to match seasonal campaigns or target different event types.

### Themes

Six themes exist, each designed for a different celebration category:

| Theme Name | Target Event Type | Palette Style |
|------------|-------------------|---------------|
| `wedding` | Weddings, Shaadi | Gold + deep rose |
| `festival` | Holi, Diwali, Navratri | Vibrant saffron + violet |
| `puja` | Religious ceremonies, Pooja | Warm earth tones |
| `anniversary` | Marriage anniversaries | Burgundy + champagne gold |
| `birthday_kid` | Children's birthdays | Bright, playful, rainbow |
| `birthday_adult` | Milestone adult birthdays | Elegant navy + gold |

### Theme Components

Each theme controls:
- **Palette**: Primary color, accent color, background, text color, button color
- **Hero section**: Headline text, supporting tagline, CTA button text
- **Event type pills**: Which event categories are highlighted (e.g., "Weddings · Sangeet · Reception")
- **How It Works section**: Step-by-step walkthrough cards
- **Help CTA section**: Contact information, "Get Started" button, intake mode
- **CTA Banner**: Bottom call-to-action strip

### Active Theme

At any moment, exactly **one theme is "active"** — this is what visitors see at the homepage. The Super Admin switches the active theme from the admin panel. Changes take effect immediately (no deployment needed).

### Theme Preview

The Super Admin (or anyone with the URL) can preview any theme at `/landing/{themeName}` without affecting the live homepage. This is useful for reviewing changes before activation.

### Intake Mode per Theme

Each theme is configured with an **intake mode** that determines which questionnaire new users fill out after registering:

| Intake Mode | Best For | Format |
|-------------|----------|--------|
| **Light** | Festivals, birthdays, smaller events | Single-page form, ~5 fields |
| **Full** | Weddings, anniversaries, large events | 6-step detailed questionnaire |

Default assignments:
- `wedding`, `anniversary` → **Full**
- `festival`, `puja`, `birthday_kid`, `birthday_adult` → **Light**

---

## 6. Host Registration & Onboarding

### Registration Flow

1. Visitor lands on the Utsavé homepage
2. Clicks **"Get Started"** button (in either the hero or the "Need help?" section)
3. Directed to `/auth/register`
4. Enters email + password
5. Receives a **verification email** (automated, from Supabase Auth)
6. Clicks the verification link in email
7. Redirected to the **Onboarding Intake** form
8. Completes the intake questionnaire
9. Lands on their **Host Dashboard**

### The "Need Help?" Section

The landing page contains a dedicated help section ("We're here for you") that shows:
- A descriptive headline and sub-text explaining the concierge service
- **Direct email**: `contact@utsav-events.com`
- **Direct phone**: `571-908-9101`
- A **"Get Started →"** button that takes the visitor to registration

This section is visible by default on all themes and can be hidden per-theme by the Super Admin.

### Email Verification

- Verification emails are sent by Supabase Auth automatically
- The verification link is only valid for **1 hour** (Supabase default)
- After clicking the link, the user is brought directly to the onboarding intake (for new registrations via "Get Started") or the dashboard (for direct registrations)

### Onboarding Intake

After email verification, new users land on `/onboarding/intake` with one of two forms:

**Light Intake** (single page):
| Field | Options |
|-------|---------|
| Event type | Wedding, Birthday, Festival, Puja, Anniversary, Other |
| Approximate event date | Free text |
| Expected guest count | Under 50 / 50–150 / 150–350 / 350+ |
| Budget range | Under $5k / $5k–$15k / $15k–$30k / $30k+ |
| Contact email | Pre-filled from registration |
| Contact phone | Free text (required) |

**Full Intake** (6 steps):

| Step | Title | What It Captures |
|------|-------|-----------------|
| 1 | Experience Vibes | Mood/style preferences (Traditional, Modern Fusion, Intimate, Grand, etc.) |
| 2 | Scale & Setting | Guest count range, venue type preference (banquet hall, outdoor, destination, etc.) |
| 3 | Support Priorities | What they need help with most (décor, catering, coordination, photography, etc.) |
| 4 | Memories | Most important memory to capture (first dance, family portrait, etc.) |
| 5 | Investment | Total event budget range |
| 6 | Contact | Email (pre-filled) + phone number |

All intake submissions are stored and visible to the Super Admin and support team in the admin panel.

---

## 7. Event Creation & Configuration

### Creating an Event

From the host dashboard, clicking **"New Event"** opens a creation modal:

| Field | Required | Notes |
|-------|----------|-------|
| Event name | Yes | e.g., "Sharma Wedding" |
| Event date | Yes | Date picker |
| Venue name | No | e.g., "Marriott Marquis" |
| Event slug | Auto | Generated from event name (e.g., `sharma-wedding-2025`), editable |

The slug becomes the unique URL segment: `utsave.com/sharma-wedding-2025/invite`

### Slug Rules

- Must be globally unique across all events on the platform
- Only lowercase letters, numbers, and hyphens
- Cannot be changed after guests have already RSVP'd (their session is tied to the slug)
- If a conflict exists, the system suggests an alternative (e.g., appends the year)

### Cover Image

Hosts can set a cover image for their event from:
1. **Upload from device** — drag & drop or file picker (JPG/PNG, up to 10 MB)
2. **Pexels stock photos** — built-in search powered by Pexels API (free, licensed)

The cover image appears prominently on the invite page and the gallery.

### Event Settings

After creation, hosts can edit all event details from the **Settings** tab within their event dashboard:
- Event name, date, venue
- Cover image (replace or remove)
- Invite page description/note

---

## 8. Invite & RSVP System

### The Invite Page

Each event has a public invite URL: `/{eventSlug}/invite`

This page shows:
- Event name, date, venue
- Cover photo
- Host's personal welcome note (optional)
- The RSVP form

No login is required for guests to view the invite page or submit an RSVP.

### RSVP Form Fields

| Field | Type | Required |
|-------|------|----------|
| Guest name | Text | Yes |
| Attending? | Yes / No / Maybe | Yes |
| Number of adults (13+) | Number | If attending = Yes |
| Number of kids (under 13) | Number | If attending = Yes |
| Message to host | Text area | No |

### RSVP Behavior

- **One RSVP per submission** — the form does not prevent duplicate submissions by the same person (a guest who RSVPs twice will appear twice in the list)
- **Real-time dashboard** — as guests submit, the host's dashboard updates with new totals
- **No email confirmation to guest** — guests do not receive a confirmation email; they see a thank-you screen

### RSVP Dashboard View

The host sees:
- **Total RSVPs**: Count of submissions
- **Total Attending**: Sum of Yes responses
- **Total Adults**: Sum of adult counts
- **Total Kids**: Sum of kid counts
- **Individual list**: Each RSVP with name, response, adult count, kid count, message, timestamp
- **Export as CSV**: Download the full guest list

### RSVP Status Badge

Each RSVP is tagged:
- **Yes** — green badge
- **No** — red badge
- **Maybe** — yellow badge

---

## 9. Guest Experience

### Guest Journey (RSVP)

```
Receives WhatsApp/text link from host
       ↓
Opens utsave.com/{slug}/invite in mobile browser
       ↓
Views event details and cover photo
       ↓
Fills out RSVP form (name, attendance, headcount)
       ↓
Clicks Submit
       ↓
Sees thank-you screen with event date and venue
```

### Guest Journey (Gallery)

```
Receives gallery link from host (post-event)
       ↓
Opens utsave.com/{slug}/gallery
       ↓
Prompted to enter mobile phone number
       ↓
Receives OTP via SMS
       ↓
Enters OTP → session established
       ↓
Views all photo albums
       ↓
Can upload their own photos to "Guest Contributions" album
```

### OTP Authentication Details

- Guests enter their phone number (no account needed)
- A 6-digit OTP is sent via SMS
- OTP is valid for **10 minutes**
- After entering the correct OTP, a session cookie is stored in the browser
- The session remains active for the browser session (closes when browser is closed)
- Each phone number gets a fresh OTP on each login attempt

### Guest Upload

Once authenticated, guests can upload photos:
- Accepted formats: JPG, PNG, HEIC (converted automatically)
- Max file size: 10 MB per photo
- Photos go into a dedicated **"Guest Contributions"** album (automatically created if not present)
- Uploaded photos are visible to all gallery viewers immediately

---

## 10. Photo Gallery & Albums

### Album Structure

Each event can have **multiple albums**. Common album patterns:
- "Getting Ready"
- "Ceremony"
- "Reception"
- "Guest Contributions" (auto-created for guest uploads)

Albums are ordered by creation date. The host can create, rename, and delete albums.

### Photo Storage

- Photos are stored in **Supabase Storage** (similar to AWS S3)
- Original photos are stored as uploaded; EXIF metadata (GPS, device info) is stripped for privacy
- Photos are served via **signed URLs** that expire after 1 hour — this prevents direct hotlinking or unauthorized sharing

### Album Access Rules

| Action | Who Can Do It |
|--------|--------------|
| Create albums | Host only |
| Upload to albums | Host (any album); Guests (Guest Contributions only) |
| View albums | Authenticated guests (OTP) and host |
| Delete photos | Host only |
| Delete albums | Host only |

### Gallery Page

The gallery page (`/{slug}/gallery`) shows:
- Cover image at top
- Album grid with thumbnail previews
- Click album → full photo lightbox viewer
- Download individual photos
- "Add photos" button (guest uploads)

---

## 11. Wedding Suite (Multi-Function Events)

### What Is a Suite?

A **Wedding Suite** is a grouping of multiple events under one umbrella. It is designed for Indian weddings where multiple ceremonies happen across 2–4 days:
- Mehndi / Haldi
- Sangeet
- Wedding / Pheras
- Reception

Rather than sharing four separate invite links, the host creates one **Suite** with a single URL that shows all functions and allows guests to RSVP to each one they plan to attend.

### Suite URL

`/suite/{suiteSlug}/invite`

### Per-Function RSVP

When a guest opens the suite invite, they see:
- All functions listed with dates, times, venues
- A toggle/checkbox per function: "I'll attend Sangeet", "I'll attend Reception", etc.
- One combined form submission covers all their choices
- Adult + kid headcount is specified per function

### Suite Dashboard

The host views RSVP data per function:
- Total attending each function
- Guest list filtered by function
- The ability to export per-function CSV

### Creating a Suite

From the host dashboard:
1. Open any event → find the "Invite Group" panel
2. Create or join a suite
3. Add other events to the suite
4. Suite invite link is auto-generated

---

## 12. Messaging & Communications

### Communication Channels

Utsavé supports two outbound communication channels:

| Channel | Use Cases |
|---------|-----------|
| **WhatsApp** | RSVP reminders, thank-you messages, gallery share |
| **Email** | RSVP reminders, gallery share, event updates |

### WhatsApp Messaging

WhatsApp is the **primary channel** for the Indian diaspora community. Utsavé sends messages via **WhatsApp Business API**.

**Message types:**
- **RSVP Reminder**: "Hi [Name], you're invited to [Event]. RSVP here: [link]"
- **Thank You**: "Thank you for celebrating with us! View photos: [link]"
- **Gallery Share**: "Photos from [Event] are ready! View here: [link]"

**Sending flow:**
1. Host opens the "Send Reminders" panel in their dashboard
2. Selects message type and channel (WhatsApp, Email, or both)
3. Reviews the message preview
4. Clicks Send
5. Messages are dispatched to all guests with phone numbers (for WhatsApp) or all RSVP submitters (for email)

**Note:** Only guests who provided a phone number during RSVP will receive WhatsApp messages. Email reminders go to all who provided an email address.

### Message Timing

There is no automated scheduling — all messages are triggered manually by the host. Common usage patterns:
- **Pre-event reminder**: 2–3 days before the event
- **Day-of reminder**: Morning of the event
- **Post-event thank-you + gallery**: 1–2 days after the event

---

## 13. Live Event Features

### QR Code

Every event has a **QR code** that links directly to the invite page. The host can:
- View the QR code in the event dashboard
- Download it as a PNG for printing or digital display

Common use cases:
- Printed on table cards at the venue
- Displayed on a screen at the entrance
- Shared in digital invitations alongside the URL

### Live Slideshow

The **live slideshow** is a fullscreen, auto-rotating photo display designed to run on screens at the venue (TV, projector, tablet).

**How it works:**
- Accessed at `/{slug}/slideshow` — no login required
- Displays all photos from all event albums
- Rotates through photos every **6 seconds**
- Refreshes the photo list every **30 seconds** (so newly uploaded photos appear automatically)
- Fullscreen layout, no UI chrome — just photos

**Intended use:**
- Host sets up a tablet or laptop at the venue
- Opens the slideshow URL in fullscreen mode
- Guests see a rotating gallery of photos as the event unfolds (especially useful for receptions and sangeet nights)

---

## 14. Intake & Planning Questionnaires

There are two types of intake forms in the system:

### 14.1 Event Planning Intake (Existing Hosts)

Found in the **Intake tab** of each event's dashboard. This is a detailed 6-step questionnaire filled out by hosts who want planning assistance for a specific event.

**Steps:**
1. **Experience Vibes**: Mood and style preferences
2. **Scale & Setting**: Guest count and venue preference
3. **Priorities**: What support is most needed
4. **Memories**: Key moments to capture
5. **Investment**: Budget range
6. **Contact**: Email and phone (pre-filled from profile)

**What happens after submission:**
- Submission is stored in the `intakes` table
- Visible to the Super Admin and support team in the admin panel under "Celebration Intakes"
- Support team reviews and reaches out to the host

### 14.2 Onboarding Intake (New Registrants)

Filled out by new users immediately after email verification. Two modes:

**Light Intake** (single page — for festivals, birthdays, smaller events):
- Event type, date, guest count, budget, contact info
- Best for casual/smaller celebrations

**Full Intake** (6 steps — for weddings, anniversaries, large events):
- Same structure as the event planning intake above
- Best for complex multi-day events

**What happens after submission:**
- Stored in the `onboarding_intakes` table
- Visible in admin panel under "Onboarding Inquiries" section
- Support team uses this to prioritize outreach to high-value prospects
- The host is then taken to their dashboard

### 14.3 Admin View of Intakes

The Super Admin can see all intake submissions at `/admin/intakes`:

**Onboarding Inquiries section:**
- Shows: event type, intake mode badge (Light/Full), guest count, budget range, contact email/phone
- Expandable row for full details

**Celebration Intakes section:**
- Shows: event name, vibes, scale, priorities, investment range, contact info
- Sorted by most recent first

---

## 15. Admin & Operations Panel

The Super Admin panel is accessible at `/admin` from the dashboard navigation (only visible to the super admin email address).

### Admin Sections

| Section | URL | Purpose |
|---------|-----|---------|
| Dashboard | `/admin` | Overview and navigation |
| Intakes | `/admin/intakes` | All planning and onboarding intake submissions |
| Landing Config | `/admin/landing-config` | Theme editor and activation |

### Landing Config Panel

This is the primary operational tool for managing the marketing website. It allows the Super Admin to:

**Theme Selection:**
- See all 6 available themes in a card grid
- Click "Activate" to make any theme the live homepage
- Click "Edit" to customize theme content

**Theme Editor** (per theme):
- Edit hero headline, tagline, CTA button text
- Toggle the "Need Help?" help section on/off
- Configure help section: headline, sub-text, contact email, contact phone, button text
- Set intake mode (Light or Full) for that theme
- Edit event type pills (which celebration types are shown in the feature row)
- Edit the "How It Works" step cards
- Edit the CTA Banner text

**Save flow:**
- Changes are saved to the database immediately
- Saved changes persist even if the theme is not currently active
- If the theme is already active, changes are visible on the homepage instantly (next page load)

---

## 16. Business Rules & Constraints

### Identity & Uniqueness

| Rule | Detail |
|------|--------|
| One host account per email | Cannot have two accounts with the same email |
| Globally unique event slugs | Two events cannot share a URL slug |
| One active landing theme | Only one theme can be "active" at a time |

### RSVP Rules

| Rule | Detail |
|------|--------|
| No duplicate prevention | Guests can submit multiple RSVPs (counted separately) |
| Headcount only when attending | Adult/kid count fields only appear if attendance = "Yes" |
| No RSVP editing | Guests cannot go back and change their RSVP (they must resubmit) |
| No cutoff date | RSVP form remains open indefinitely unless host closes/deletes the event |

### Gallery Rules

| Rule | Detail |
|------|--------|
| OTP required for gallery | Guests must authenticate via phone OTP to view gallery |
| Session-based auth | Guest gallery sessions expire when browser is closed |
| 10 MB upload limit | Per-photo file size limit |
| EXIF stripped | GPS and device metadata removed from all uploaded photos |
| Signed URLs | All photo URLs expire after 1 hour (cannot be bookmarked/shared directly) |

### Communication Rules

| Rule | Detail |
|------|--------|
| Manual sending only | No automated scheduled messages; host triggers all sends |
| WhatsApp requires phone | Only guests with a phone number on file receive WhatsApp messages |
| Email requires email | Only guests with an email on file receive email messages |

### Auth Rules

| Rule | Detail |
|------|--------|
| Email verification required | Hosts must verify email before accessing dashboard |
| Guest OTP expiry | OTP valid for 10 minutes only |
| Super admin by email | Super admin access determined by a single environment variable |

---

## 17. Data, Privacy & Guest Rights

### What Data We Collect

**From Hosts:**
- Email address and password (hashed, never stored in plain text)
- Event details (name, date, venue)
- Photos uploaded to event albums

**From Guests (via RSVP):**
- Name (provided by guest)
- Attendance response and headcount
- Phone number (optional, for WhatsApp reminders)
- Email address (optional, for email reminders)
- Personal message to host (optional)

**From Planning Intake:**
- Event preferences, budget range, contact info (email + phone)
- Voluntarily provided; used only for service outreach

### Data Ownership

- Event data (RSVPs, photos) belongs to the host
- The host controls access to their event gallery
- Guests do not have accounts and cannot request data deletion through the platform UI — they must contact support

### Photo Privacy

- All gallery photos are behind OTP authentication
- Photos are served via expiring signed URLs (1-hour expiry)
- Direct links to photos become invalid after 1 hour
- EXIF metadata (GPS location, device model) is stripped from all uploaded photos before storage

### Data Deletion

- Hosts can delete their events, which cascades to delete RSVPs and album metadata
- Photos in storage must be separately removed (engineering task for full deletion)
- Guest data deletion requests are handled by the support team

---

## 18. Key Business Workflows

### Workflow 1: Host Creates and Launches an Event

```
1. Host logs in to dashboard
2. Clicks "New Event"
3. Fills: name, date, venue, slug
4. Uploads or selects cover image
5. Copies invite URL
6. Shares URL via WhatsApp group / SMS
7. Monitors RSVPs in real time on dashboard
```

### Workflow 2: Host Sends Pre-Event Reminders

```
1. Host opens event dashboard
2. Navigates to "Messaging" or "Send Reminders" panel
3. Selects message type: RSVP Reminder
4. Selects channel: WhatsApp and/or Email
5. Reviews preview of message
6. Clicks Send
7. System dispatches messages to all eligible guests
```

### Workflow 3: Host Shares Post-Event Photos

```
1. Host opens event dashboard after the event
2. Navigates to Gallery tab
3. Creates album(s): "Ceremony", "Reception", etc.
4. Uploads photos (drag & drop or file picker)
5. Returns to main dashboard
6. Sends gallery link via WhatsApp / email to all guests
7. Guests receive link, authenticate via OTP, view photos
```

### Workflow 4: Prospect Inquires via Landing Page

```
1. Visitor lands on utsave.com
2. Sees "We're here for you" section with email and phone
3. Option A: Calls/emails support directly → support team receives inquiry
4. Option B: Clicks "Get Started" → /auth/register?intake={mode}
5. Registers and verifies email
6. Lands on Onboarding Intake form (Light or Full based on theme)
7. Fills intake → submission stored in onboarding_intakes
8. Super admin / support team sees submission in admin panel
9. Support team reaches out to qualified lead
```

### Workflow 5: Super Admin Changes Landing Theme

```
1. Super Admin logs in to dashboard
2. Navigates to Admin → Landing Config
3. Sees 6 theme cards
4. Clicks "Preview" to review any theme at /landing/{themeName}
5. Clicks "Edit" to customize content if needed (saves automatically)
6. Clicks "Activate" on desired theme
7. Homepage (utsave.com) immediately shows the new theme
```

### Workflow 6: Wedding Suite Setup

```
1. Host creates 4 events: Mehndi, Sangeet, Pheras, Reception
2. Opens one event dashboard → finds "Invite Group" section
3. Clicks "Create Suite" → enters suite name and slug
4. Adds other 3 events to the suite
5. Suite invite URL is generated: /suite/{slug}/invite
6. Host shares the single suite URL
7. Guests see all functions and RSVP to each individually
8. Host views per-function RSVP counts in suite dashboard
```

### Workflow 7: Guest Uploads Photos at Event

```
1. Host displays QR code at venue or shares slideshow URL
2. Guest opens gallery on their phone
3. Authenticates via OTP (phone number + SMS code)
4. Clicks "Add Photos" button
5. Selects photos from their device camera roll
6. Photos upload to "Guest Contributions" album
7. Photos appear in the gallery (and the live slideshow) within 30 seconds
```

---

## 19. Metrics & Reporting Concepts

### Dashboard Metrics (Per Event)

| Metric | How Calculated |
|--------|---------------|
| Total RSVPs | Count of all RSVP submissions |
| Total Attending | Count of RSVPs with status = "Yes" |
| Total Adults | Sum of `adults` field across all "Yes" RSVPs |
| Total Kids | Sum of `kids` field across all "Yes" RSVPs |
| Total Headcount | Adults + Kids |
| No / Maybe counts | Count of RSVPs with respective status |

### Admin Operational Metrics (Intake Panel)

| Metric | Source |
|--------|--------|
| New onboarding inquiries | `onboarding_intakes` table (sorted by created_at) |
| New event planning intakes | `intakes` table (sorted by created_at) |
| Intake mode distribution | Light vs Full count from `onboarding_intakes.intake_mode` |
| Budget range distribution | `investment_range` field across intakes |

### Business Intelligence Signals

From intake data, the team can derive:
- **Demand by event type**: Which event types are most frequently submitted
- **Budget segmentation**: How prospects distribute across budget tiers
- **Guest volume expectations**: Average expected guest counts
- **Geographic signals**: Not captured yet (phone area code could be used as proxy)
- **Conversion funnel**: Landing page visits → Registrations → Intake completions → Event creations

---

## 20. Glossary

| Term | Definition |
|------|------------|
| **Host** | A registered user who creates and manages events on Utsavé |
| **Guest** | A person who receives an invite and RSVPs; has no Utsavé account |
| **Event** | A single celebration (e.g., Sangeet, Reception, Birthday Party) with its own invite page |
| **Suite** | A collection of related events (functions) under one umbrella invite page; used for multi-day weddings |
| **Slug** | The unique URL-friendly identifier for an event (e.g., `sharma-wedding-2025`) |
| **RSVP** | "Répondez s'il vous plaît" — guest's response to an invitation (Yes/No/Maybe) with headcount |
| **OTP** | One-Time Password — 6-digit code sent via SMS used to authenticate guests for gallery access |
| **Theme** | A complete landing page configuration including colors, copy, and settings |
| **Active Theme** | The theme currently displayed on the public homepage (utsave.com) |
| **Intake** | A planning questionnaire filled out by the host (event intake) or a new prospect (onboarding intake) |
| **Light Intake** | A short, single-page intake form for smaller/simpler events |
| **Full Intake** | A detailed, 6-step intake form for complex events like weddings |
| **Help CTA** | The "We're here for you" contact section on the landing page with email, phone, and a "Get Started" button |
| **QR Code** | A scannable code that links directly to an event's invite page; downloadable from the dashboard |
| **Live Slideshow** | A fullscreen, auto-rotating photo display for venue screens, accessed via `/{slug}/slideshow` |
| **Guest Contributions** | A dedicated gallery album where authenticated guests can upload their own photos |
| **Signed URL** | A time-limited photo URL that expires after 1 hour to prevent unauthorized sharing |
| **EXIF** | Metadata embedded in photo files (GPS location, camera model, timestamp); stripped by Utsavé on upload |
| **Wedding Suite** | See "Suite" — named specifically for multi-function South Asian weddings |
| **Per-Function RSVP** | In a Suite, guests indicate attendance separately for each function (Sangeet, Reception, etc.) |
| **Super Admin** | The single internal Utsavé operator account with access to the admin panel |
| **Call Center / Support** | Internal or outsourced team that handles host and guest support inquiries |
| **Intake Mode** | The questionnaire format assigned to a theme: Light (5-field single page) or Full (6-step) |
| **WhatsApp Business API** | The official WhatsApp channel used by Utsavé to send reminders and thank-you messages to guests |
| **Host Profile** | The host's internal account record linked to their email; required before creating events |
| **PKCE** | Proof Key for Code Exchange — the secure OAuth flow used for Utsavé's email verification |
| **Diaspora** | The global community of people of Indian origin living outside India |

---

*For technical implementation details, see [TECHNICAL-REFERENCE.md](./TECHNICAL-REFERENCE.md).*
*For engineering onboarding and infrastructure, see the main README.*
