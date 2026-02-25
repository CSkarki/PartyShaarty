-- ============================================================
-- PartyShaarty Multi-Event Migration
-- Run in the Supabase SQL Editor in order.
-- Prerequisites: supabase-saas-migration.sql must already be applied.
-- ============================================================

-- ============================================================
-- 1. Create events table
--    One row per event. Hosts can have many events.
--    slug is globally unique and used in guest URLs: /{slug}/invite
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id          UUID NOT NULL REFERENCES host_profiles(id) ON DELETE CASCADE,
  slug             TEXT NOT NULL,
  event_name       TEXT NOT NULL DEFAULT 'You''re Invited',
  event_date       TEXT,
  event_location   TEXT,
  event_message    TEXT,
  event_image_path TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS events_slug_key ON events(slug);
CREATE INDEX        IF NOT EXISTS events_host_id_idx ON events(host_id);

-- ============================================================
-- 2. Add event_id to invite_rsvps (nullable first for backfill)
-- ============================================================
ALTER TABLE invite_rsvps
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS invite_rsvps_event_id_idx ON invite_rsvps(event_id);

-- ============================================================
-- 3. Add event_id to gallery_albums (nullable first for backfill)
-- ============================================================
ALTER TABLE gallery_albums
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS gallery_albums_event_id_idx ON gallery_albums(event_id);

-- ============================================================
-- 4. Add event_id to otp_codes; update unique index
-- ============================================================
ALTER TABLE otp_codes
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE CASCADE;

-- Replace host+email unique index with event+email
DROP INDEX IF EXISTS otp_codes_host_email_key;
CREATE UNIQUE INDEX IF NOT EXISTS otp_codes_event_email_key ON otp_codes(event_id, LOWER(email));

-- ============================================================
-- 5. Migrate existing host_profiles → events
--    Each host gets one default event; slug = host slug,
--    preserving all existing /{hostSlug}/invite URLs.
-- ============================================================
INSERT INTO events (id, host_id, slug, event_name, event_date, event_location,
                    event_message, event_image_path, created_at, updated_at)
SELECT
  gen_random_uuid(),
  hp.id,
  hp.slug,
  COALESCE(hp.event_name, 'You''re Invited'),
  hp.event_date,
  hp.event_location,
  hp.event_message,
  hp.event_image_path,
  hp.created_at,
  hp.updated_at
FROM host_profiles hp
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 6. Backfill event_id on invite_rsvps
-- ============================================================
UPDATE invite_rsvps ir
SET event_id = e.id
FROM events e
WHERE e.host_id = ir.host_id
  AND ir.event_id IS NULL;

-- ============================================================
-- 7. Backfill event_id on gallery_albums
-- ============================================================
UPDATE gallery_albums ga
SET event_id = e.id
FROM events e
WHERE e.host_id = ga.host_id
  AND ga.event_id IS NULL;

-- ============================================================
-- 8. Backfill event_id on otp_codes
-- ============================================================
UPDATE otp_codes oc
SET event_id = e.id
FROM events e
WHERE e.host_id = oc.host_id
  AND oc.event_id IS NULL;

-- ============================================================
-- 9. Enforce NOT NULL now that backfills are complete
-- ============================================================
ALTER TABLE invite_rsvps   ALTER COLUMN event_id SET NOT NULL;
ALTER TABLE gallery_albums ALTER COLUMN event_id SET NOT NULL;

-- ============================================================
-- 10. RLS on events table
-- ============================================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select_own" ON events;
DROP POLICY IF EXISTS "events_insert_own" ON events;
DROP POLICY IF EXISTS "events_update_own" ON events;
DROP POLICY IF EXISTS "events_delete_own" ON events;

CREATE POLICY "events_select_own" ON events FOR SELECT
  USING (host_id = (SELECT id FROM host_profiles WHERE user_id = auth.uid()));

CREATE POLICY "events_insert_own" ON events FOR INSERT
  WITH CHECK (host_id = (SELECT id FROM host_profiles WHERE user_id = auth.uid()));

CREATE POLICY "events_update_own" ON events FOR UPDATE
  USING (host_id = (SELECT id FROM host_profiles WHERE user_id = auth.uid()));

CREATE POLICY "events_delete_own" ON events FOR DELETE
  USING (host_id = (SELECT id FROM host_profiles WHERE user_id = auth.uid()));

-- ============================================================
-- 11. Update RLS on invite_rsvps and gallery_albums
--     to use event_id-based ownership check
-- ============================================================
DROP POLICY IF EXISTS "rsvp_read_own"   ON invite_rsvps;
DROP POLICY IF EXISTS "rsvp_delete_own" ON invite_rsvps;

CREATE POLICY "rsvp_read_own" ON invite_rsvps FOR SELECT
  USING (
    event_id IN (
      SELECT e.id FROM events e
      WHERE e.host_id = (SELECT id FROM host_profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "rsvp_delete_own" ON invite_rsvps FOR DELETE
  USING (
    event_id IN (
      SELECT e.id FROM events e
      WHERE e.host_id = (SELECT id FROM host_profiles WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "album_all_own" ON gallery_albums;

CREATE POLICY "album_all_own" ON gallery_albums FOR ALL
  USING (
    event_id IN (
      SELECT e.id FROM events e
      WHERE e.host_id = (SELECT id FROM host_profiles WHERE user_id = auth.uid())
    )
  );

-- ============================================================
-- 12. Public RPC: look up event + host display_name by slug
--     Called by guest pages without auth.
-- ============================================================
CREATE OR REPLACE FUNCTION get_event_by_slug(p_slug TEXT)
RETURNS TABLE (
  id               UUID,
  host_id          UUID,
  slug             TEXT,
  event_name       TEXT,
  event_date       TEXT,
  event_location   TEXT,
  event_message    TEXT,
  event_image_path TEXT,
  display_name     TEXT
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT
    e.id,
    e.host_id,
    e.slug,
    e.event_name,
    e.event_date,
    e.event_location,
    e.event_message,
    e.event_image_path,
    hp.display_name
  FROM events e
  JOIN host_profiles hp ON hp.id = e.host_id
  WHERE e.slug = p_slug
  LIMIT 1;
$$;
