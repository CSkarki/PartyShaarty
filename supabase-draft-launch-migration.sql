-- Migration: Event lifecycle — draft / active states
-- Run this in the Supabase SQL Editor

-- 1. Status column: 'draft' (default) or 'active' (launched)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active'));

-- 2. Deletion-request columns (for live events)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS deletion_requested      BOOLEAN    NOT NULL DEFAULT false;
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS deletion_requested_at   TIMESTAMPTZ;
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS deletion_reason         TEXT;

-- 3. Helpful index for admin queries
CREATE INDEX IF NOT EXISTS events_deletion_requested_idx
  ON events (deletion_requested)
  WHERE deletion_requested = true;
