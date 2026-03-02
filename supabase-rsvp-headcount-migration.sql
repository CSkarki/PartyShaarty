-- Migration: Add adults_count and kids_count to invite_rsvps
-- Run this in the Supabase SQL editor

alter table invite_rsvps
  add column if not exists adults_count integer,
  add column if not exists kids_count integer;
