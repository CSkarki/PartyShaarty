-- Landing Themes Migration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS landing_themes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  config       JSONB NOT NULL DEFAULT '{}',
  is_active    BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Enforce only ONE active theme at a time using a partial unique index
-- (cheaper than a trigger; DB rejects any second row with is_active = true)
CREATE UNIQUE INDEX IF NOT EXISTS landing_themes_one_active
  ON landing_themes (is_active)
  WHERE is_active = true;

-- Seed the 6 default themes (all inactive — activate one via the admin panel)
INSERT INTO landing_themes (name, display_name) VALUES
  ('wedding',       'Weddings & Marriage Events'),
  ('festival',      'Festivals (Holi, Diwali, Navratri)'),
  ('puja',          'Religious / Puja Events'),
  ('anniversary',   'Marriage Anniversary (25th / 50th)'),
  ('birthday_kid',  'Kid''s Birthday (1st Birthday)'),
  ('birthday_adult','Adult Milestone Birthday (50th)')
ON CONFLICT (name) DO NOTHING;

-- Activate the wedding theme as the default
UPDATE landing_themes SET is_active = true WHERE name = 'wedding';
