-- ─────────────────────────────────────────────────────────────────────────────
-- Utsavé Sprint 2 Migration: Event Types + Wedding Suite Groups
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add event_type column to events
--    Values: wedding_function | birthday | diwali | puja | namkaran |
--            godh_bharai | graduation | other
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS event_type TEXT NOT NULL DEFAULT 'other';

-- 2. Create event_groups table
--    One row per Wedding Suite (or future multi-function bundle)
CREATE TABLE IF NOT EXISTS event_groups (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id      UUID        NOT NULL REFERENCES host_profiles(id) ON DELETE CASCADE,
  group_name   TEXT        NOT NULL,
  group_type   TEXT        NOT NULL DEFAULT 'wedding',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Add event_group_id FK to events
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS event_group_id UUID REFERENCES event_groups(id) ON DELETE SET NULL;

-- 4. Enable RLS on event_groups
ALTER TABLE event_groups ENABLE ROW LEVEL SECURITY;

-- 5. RLS policy: hosts see only their own groups
DROP POLICY IF EXISTS "host_own_groups" ON event_groups;
CREATE POLICY "host_own_groups" ON event_groups
  FOR ALL USING (
    host_id IN (
      SELECT id FROM host_profiles WHERE user_id = auth.uid()
    )
  );

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_event_type    ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_group_id      ON events(event_group_id);
CREATE INDEX IF NOT EXISTS idx_event_groups_host_id ON event_groups(host_id);
