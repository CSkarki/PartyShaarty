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

/** List all events for a host, oldest first. */
export async function listEvents(hostId) {
  const { data, error } = await db()
    .from("events")
    .select("id, slug, event_name, event_date, event_location, event_image_path, created_at, updated_at")
    .eq("host_id", hostId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
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
export async function createEvent({ event_name, event_date, event_location, event_message }, hostId) {
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
