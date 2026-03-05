-- Onboarding intake: captures leads from the landing page "Get Started" flow.
-- These are NOT tied to a specific event — they represent general inquiries
-- from visitors who register via the landing page help CTA.

CREATE TABLE IF NOT EXISTS onboarding_intakes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID,                          -- links to auth.users.id (nullable for forward compat)
  intake_mode       TEXT NOT NULL DEFAULT 'light', -- 'light' | 'full'
  event_type        TEXT,
  event_date        TEXT,
  guest_count_range TEXT,
  venue_type        TEXT,
  investment_range  TEXT,
  experience_vibes  TEXT[],
  essentials        TEXT[],
  memories_priority TEXT,
  contact_email     TEXT,
  contact_phone     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for admin listing (most recent first)
CREATE INDEX IF NOT EXISTS onboarding_intakes_created_at_idx
  ON onboarding_intakes (created_at DESC);
