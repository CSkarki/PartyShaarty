-- ============================================================
-- PartyShaarty SaaS Migration
-- Run this in the Supabase SQL Editor in order.
-- ============================================================

-- ============================================================
-- 1. host_profiles — one row per registered SaaS host
--    Linked to Supabase auth.users via user_id.
--    slug is used in guest URLs: /{slug}/invite, /{slug}/gallery
-- ============================================================
CREATE TABLE IF NOT EXISTS host_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug             TEXT NOT NULL UNIQUE,
  display_name     TEXT NOT NULL,
  event_name       TEXT NOT NULL DEFAULT 'You''re Invited',
  event_date       TEXT,
  event_location   TEXT,
  event_image_path TEXT,
  event_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS host_profiles_user_id_key ON host_profiles(user_id);
CREATE INDEX IF NOT EXISTS host_profiles_slug_idx ON host_profiles(slug);

-- ============================================================
-- 2. Add host_id to invite_rsvps (nullable first for backfill)
-- ============================================================
ALTER TABLE invite_rsvps
  ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES host_profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS invite_rsvps_host_id_idx ON invite_rsvps(host_id);
CREATE INDEX IF NOT EXISTS invite_rsvps_email_lower_idx ON invite_rsvps(LOWER(email));

-- ============================================================
-- 3. Add host_id to gallery_albums (nullable first for backfill)
-- ============================================================
ALTER TABLE gallery_albums
  ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES host_profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS gallery_albums_host_id_idx ON gallery_albums(host_id);

-- ============================================================
-- 4. otp_codes — replaces the in-memory Map() in gallery/verify
--    Stores hashed OTPs scoped per host + email.
-- ============================================================
CREATE TABLE IF NOT EXISTS otp_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id     UUID NOT NULL REFERENCES host_profiles(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  code_hash   TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS otp_codes_host_email_key ON otp_codes(host_id, LOWER(email));
CREATE INDEX IF NOT EXISTS otp_codes_expires_at_idx ON otp_codes(expires_at);

-- ============================================================
-- 5. Enable RLS on all tables
-- ============================================================
ALTER TABLE host_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_rsvps         ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_albums       ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_album_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes            ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. RLS Policies
-- ============================================================

-- host_profiles: each host manages only their own row
DROP POLICY IF EXISTS "hp_read_own"   ON host_profiles;
DROP POLICY IF EXISTS "hp_insert_own" ON host_profiles;
DROP POLICY IF EXISTS "hp_update_own" ON host_profiles;

CREATE POLICY "hp_read_own"   ON host_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "hp_insert_own" ON host_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "hp_update_own" ON host_profiles FOR UPDATE USING (auth.uid() = user_id);

-- invite_rsvps: host sees only their RSVPs; guest INSERTs go via service_role
DROP POLICY IF EXISTS "rsvp_read_own"   ON invite_rsvps;
DROP POLICY IF EXISTS "rsvp_delete_own" ON invite_rsvps;

CREATE POLICY "rsvp_read_own" ON invite_rsvps FOR SELECT
  USING (host_id = (SELECT id FROM host_profiles WHERE user_id = auth.uid()));

CREATE POLICY "rsvp_delete_own" ON invite_rsvps FOR DELETE
  USING (host_id = (SELECT id FROM host_profiles WHERE user_id = auth.uid()));

-- gallery_albums: host manages only their own albums
DROP POLICY IF EXISTS "album_all_own" ON gallery_albums;

CREATE POLICY "album_all_own" ON gallery_albums FOR ALL
  USING (host_id = (SELECT id FROM host_profiles WHERE user_id = auth.uid()));

-- gallery_album_shares: host manages shares for albums they own
DROP POLICY IF EXISTS "shares_own" ON gallery_album_shares;

CREATE POLICY "shares_own" ON gallery_album_shares FOR ALL
  USING (
    album_id IN (
      SELECT id FROM gallery_albums
      WHERE host_id = (SELECT id FROM host_profiles WHERE user_id = auth.uid())
    )
  );

-- otp_codes: block all direct access; all ops via service_role in API routes
DROP POLICY IF EXISTS "otp_deny_all" ON otp_codes;

CREATE POLICY "otp_deny_all" ON otp_codes FOR ALL USING (false);

-- ============================================================
-- 7. Public helper function: look up safe event fields by slug
--    Called by guest pages without requiring auth.
--    SECURITY DEFINER so anon callers cannot see sensitive columns.
-- ============================================================
CREATE OR REPLACE FUNCTION get_host_profile_by_slug(p_slug TEXT)
RETURNS TABLE (
  id               UUID,
  slug             TEXT,
  display_name     TEXT,
  event_name       TEXT,
  event_date       TEXT,
  event_location   TEXT,
  event_image_path TEXT,
  event_message    TEXT
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT
    id, slug, display_name,
    event_name, event_date, event_location,
    event_image_path, event_message
  FROM host_profiles
  WHERE slug = p_slug
  LIMIT 1;
$$;

-- ============================================================
-- 8. MIGRATION STEPS (run manually after registering your host account)
--
-- a) Register via /auth/register in the app — this creates auth.users
--    and host_profiles rows automatically.
--
-- b) Get your host_profiles.id UUID from:
--    SELECT id FROM host_profiles WHERE slug = 'your-slug';
--
-- c) Backfill existing RSVPs and albums:
--
--    UPDATE invite_rsvps
--      SET host_id = '{your-host-profile-id}'
--      WHERE host_id IS NULL;
--
--    UPDATE gallery_albums
--      SET host_id = '{your-host-profile-id}'
--      WHERE host_id IS NULL;
--
-- d) After backfill, enforce NOT NULL:
--
--    ALTER TABLE invite_rsvps  ALTER COLUMN host_id SET NOT NULL;
--    ALTER TABLE gallery_albums ALTER COLUMN host_id SET NOT NULL;
-- ============================================================
