import { createSupabaseAdminClient } from "./supabase-server";

function db() {
  return createSupabaseAdminClient();
}

function mapRsvp(r) {
  return {
    timestamp: r.created_at ? new Date(r.created_at).toISOString() : "",
    name: r.name ?? "",
    email: r.email ?? "",
    phone: r.phone ?? "",
    attending: r.attending ?? "",
    adults_count: r.adults_count ?? null,
    kids_count: r.kids_count ?? null,
    message: r.message ?? "",
  };
}

/** List RSVPs for a specific host (all events combined). */
export async function listRsvps(hostId) {
  const { data, error } = await db()
    .from("invite_rsvps")
    .select("id, created_at, name, email, phone, attending, adults_count, kids_count, message")
    .eq("host_id", hostId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map(mapRsvp);
}

/** List RSVPs for a specific event. */
export async function listRsvpsByEvent(eventId) {
  const { data, error } = await db()
    .from("invite_rsvps")
    .select("id, created_at, name, email, phone, attending, adults_count, kids_count, message")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map(mapRsvp);
}

/** Add one RSVP. Pass eventId for per-event tracking (required for new events). */
export async function addRsvp({ name, email, phone, attending, message, adults_count, kids_count }, hostId, eventId = null) {
  const row = {
    host_id: hostId,
    name: String(name).trim(),
    email: String(email).trim(),
    phone: phone ? String(phone).trim() : null,
    attending: String(attending).trim(),
    message: message != null ? String(message).trim() : "",
    adults_count: adults_count != null ? parseInt(adults_count, 10) || null : null,
    kids_count: kids_count != null ? parseInt(kids_count, 10) || null : null,
  };
  if (eventId) row.event_id = eventId;

  const { error } = await db().from("invite_rsvps").insert(row);
  if (error) throw new Error(error.message);
}
