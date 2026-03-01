import { createSupabaseAdminClient } from "./supabase-server";

function makeSlug(name) {
  const base = (name || "event")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base}-${rand}`;
}

function db() {
  return createSupabaseAdminClient();
}

/** List all events for a host, oldest first. Includes group metadata and RSVP counts. */
export async function listEvents(hostId) {
  const supabase = db();
  const { data, error } = await supabase
    .from("events")
    .select(`
      id, slug, event_name, event_date, event_location, event_image_path,
      event_type, event_group_id, status, created_at, updated_at,
      event_groups ( group_name, group_type )
    `)
    .eq("host_id", hostId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const events = (data || []).map((e) => ({
    ...e,
    group_name: e.event_groups?.group_name ?? null,
    group_type: e.event_groups?.group_type ?? null,
    event_groups: undefined,
  }));

  if (events.length === 0) return events;

  // Fetch RSVP counts for all events in a single query, then aggregate in JS
  const eventIds = events.map((e) => e.id);
  const { data: rsvpRows } = await supabase
    .from("invite_rsvps")
    .select("event_id, attending")
    .in("event_id", eventIds);

  const countMap = {};
  (rsvpRows || []).forEach(({ event_id, attending }) => {
    if (!countMap[event_id]) countMap[event_id] = { total: 0, attending: 0, declined: 0 };
    countMap[event_id].total++;
    if (attending) countMap[event_id].attending++;
    else countMap[event_id].declined++;
  });

  return events.map((e) => ({
    ...e,
    rsvp_total: countMap[e.id]?.total ?? 0,
    rsvp_attending: countMap[e.id]?.attending ?? 0,
    rsvp_declined: countMap[e.id]?.declined ?? 0,
  }));
}

/** Get a single event by id, scoped to a host. Returns null if not found. */
export async function getEvent(eventId, hostId) {
  const { data } = await db()
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("host_id", hostId)
    .single();
  return data || null;
}

/** Create a new event for a host. Returns the created row. */
export async function createEvent(
  { event_name, event_date, event_location, event_message, event_type, event_group_id },
  hostId
) {
  const slug = makeSlug(event_name);
  const { data, error } = await db()
    .from("events")
    .insert({
      host_id: hostId,
      slug,
      event_name: (event_name || "You're Invited").trim(),
      event_date: event_date?.trim() || null,
      event_location: event_location?.trim() || null,
      event_message: event_message?.trim() || null,
      event_type: event_type || "other",
      event_group_id: event_group_id || null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Update allowed event fields. Caller must pass only safe keys. */
export async function updateEvent(eventId, hostId, updates) {
  const { error } = await db()
    .from("events")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", eventId)
    .eq("host_id", hostId);
  if (error) throw new Error(error.message);
}

/** Delete an event. RSVPs and albums are cascade-deleted via FK. */
export async function deleteEvent(eventId, hostId) {
  const { error } = await db()
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("host_id", hostId);
  if (error) throw new Error(error.message);
}

/** Set event status to 'active' (launch). */
export async function launchEvent(eventId, hostId) {
  const { error } = await db()
    .from("events")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", eventId)
    .eq("host_id", hostId);
  if (error) throw new Error(error.message);
}

/** Record a deletion request on a live event. */
export async function requestDeletion(eventId, hostId, reason) {
  const { error } = await db()
    .from("events")
    .update({
      deletion_requested: true,
      deletion_requested_at: new Date().toISOString(),
      deletion_reason: reason?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .eq("host_id", hostId);
  if (error) throw new Error(error.message);
}

/** List all events with a pending deletion request (admin use). */
export async function listDeletionRequests() {
  const { data, error } = await db()
    .from("events")
    .select(`
      id, slug, event_name, event_date, event_location,
      deletion_requested_at, deletion_reason, host_id,
      host_profiles ( display_name )
    `)
    .eq("deletion_requested", true)
    .order("deletion_requested_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map((e) => ({
    ...e,
    host_display_name: e.host_profiles?.display_name ?? null,
    host_profiles: undefined,
  }));
}

/** Force-delete an event regardless of status (admin use). */
export async function adminDeleteEvent(eventId) {
  const { error } = await db()
    .from("events")
    .delete()
    .eq("id", eventId);
  if (error) throw new Error(error.message);
}

/** Dismiss a deletion request without deleting the event (admin use). */
export async function dismissDeletionRequest(eventId) {
  const { error } = await db()
    .from("events")
    .update({
      deletion_requested: false,
      deletion_requested_at: null,
      deletion_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);
  if (error) throw new Error(error.message);
}

/**
 * Create a Wedding Suite:
 *   1. Insert a row into event_groups
 *   2. Insert N events linked to that group
 * Returns { group, events }.
 */
export async function createWeddingSuite({ group_name, group_type = "wedding", functions }, hostId) {
  const supabase = db();

  // 1. Create the group
  const { data: group, error: groupError } = await supabase
    .from("event_groups")
    .insert({ host_id: hostId, group_name: group_name.trim(), group_type })
    .select()
    .single();
  if (groupError) throw new Error(groupError.message);

  // 2. Build event rows — each gets a unique slug
  const eventRows = functions.map((fn) => ({
    host_id: hostId,
    slug: makeSlug(fn.event_name || group_name),
    event_name: (fn.event_name || group_name).trim(),
    event_date: fn.event_date?.trim() || null,
    event_type: "wedding_function",
    event_group_id: group.id,
  }));

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .insert(eventRows)
    .select();
  if (eventsError) throw new Error(eventsError.message);

  return { group, events };
}
