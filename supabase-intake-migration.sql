-- ─── Celebration Intake Tables ──────────────────────────────────────────────
-- Run this in Supabase SQL Editor

-- NOTE: user_id stores host_profiles.id (not auth.users.id),
-- so we keep it as a plain uuid column with no FK constraint.

CREATE TABLE IF NOT EXISTS celebration_intake (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid,                          -- host_profiles.id (no FK needed)
  event_id          uuid REFERENCES events(id) ON DELETE CASCADE,
  event_type        text,
  guest_count_range text,
  venue_type        text,
  investment_range  text,
  involvement_level text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  UNIQUE(event_id)
);

CREATE TABLE IF NOT EXISTS celebration_preferences (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id  uuid REFERENCES celebration_intake(id) ON DELETE CASCADE,
  category   text,   -- 'experience_vibe' | 'essential' | 'memory_priority'
  value      text,
  created_at timestamptz DEFAULT now()
);

-- ─── Fix for anyone who already ran the old migration with the wrong FK ──────
-- (safe no-op if the constraint doesn't exist)
ALTER TABLE celebration_intake
  DROP CONSTRAINT IF EXISTS celebration_intake_user_id_fkey;

-- ─── Seed: insert sample intake for the first event found ───────────────────
-- (safe to re-run — upserts on event_id, replaces preferences)

DO $$
DECLARE
  v_event_id  uuid;
  v_host_id   uuid;
  v_intake_id uuid;
BEGIN
  SELECT id, host_id INTO v_event_id, v_host_id
  FROM events
  LIMIT 1;

  IF v_event_id IS NULL THEN
    RAISE NOTICE 'No events found — skipping seed.';
    RETURN;
  END IF;

  INSERT INTO celebration_intake
    (user_id, event_id, event_type, guest_count_range, venue_type, investment_range, involvement_level)
  VALUES
    (v_host_id, v_event_id,
     'Wedding / Pre-Wedding',
     '100-250',
     'Hotel Ballroom',
     '$15,000 - $30,000',
     'Some guidance would help')
  ON CONFLICT (event_id) DO UPDATE SET
    event_type        = EXCLUDED.event_type,
    guest_count_range = EXCLUDED.guest_count_range,
    venue_type        = EXCLUDED.venue_type,
    investment_range  = EXCLUDED.investment_range,
    involvement_level = EXCLUDED.involvement_level,
    updated_at        = now()
  RETURNING id INTO v_intake_id;

  DELETE FROM celebration_preferences WHERE intake_id = v_intake_id;

  INSERT INTO celebration_preferences (intake_id, category, value) VALUES
    (v_intake_id, 'experience_vibe', 'Elegant & Classy'),
    (v_intake_id, 'experience_vibe', 'Traditional & Cultural'),
    (v_intake_id, 'essential',       'Professional Photography'),
    (v_intake_id, 'essential',       'Decor & Styling'),
    (v_intake_id, 'essential',       'Guest RSVP Tracking'),
    (v_intake_id, 'memory_priority', 'Professional coverage is a must');

  RAISE NOTICE 'Seed complete — intake id: %', v_intake_id;
END $$;
