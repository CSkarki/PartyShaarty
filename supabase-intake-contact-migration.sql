-- Add contact fields to celebration_intake for Step 6 (summary + reach-out).
-- Run in Supabase SQL Editor after supabase-intake-migration.sql.

ALTER TABLE celebration_intake
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text;
