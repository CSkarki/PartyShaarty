-- ────────────────────────────────────────────────────────────────
-- Sprint 3 Migration — Per-Function RSVP (Wedding Suite)
-- Run this in the Supabase SQL Editor before testing per-function RSVP.
-- ────────────────────────────────────────────────────────────────

-- Public RPC: given any event slug in a Wedding Suite group,
-- return all events in that same group ordered by creation date.
CREATE OR REPLACE FUNCTION get_group_events_by_event_slug(p_slug TEXT)
RETURNS TABLE (
  event_id        UUID,
  event_slug      TEXT,
  event_name      TEXT,
  event_date      TEXT,
  event_location  TEXT,
  event_type      TEXT,
  group_id        UUID,
  group_name      TEXT
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
    SELECT
      e2.id          AS event_id,
      e2.slug        AS event_slug,
      e2.event_name  AS event_name,
      e2.event_date  AS event_date,
      e2.event_location AS event_location,
      e2.event_type  AS event_type,
      eg.id          AS group_id,
      eg.group_name  AS group_name
    FROM events e1
    JOIN event_groups eg ON e1.event_group_id = eg.id
    JOIN events e2       ON e2.event_group_id = eg.id
    WHERE e1.slug = p_slug
    ORDER BY e2.created_at ASC;
END;
$$;

-- Grant public access (anon + authenticated)
GRANT EXECUTE ON FUNCTION get_group_events_by_event_slug(TEXT) TO anon, authenticated;
