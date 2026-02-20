import { createSupabaseAdminClient } from "./supabase-server";

function db() {
  return createSupabaseAdminClient();
}

/** List RSVPs for a specific host. Each row: { timestamp, name, email, phone, attending, message }. */
export async function listRsvps(hostId) {
  const { data, error } = await db()
    .from("invite_rsvps")
    .select("id, created_at, name, email, phone, attending, message")
    .eq("host_id", hostId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data || []).map((r) => ({
    timestamp: r.created_at ? new Date(r.created_at).toISOString() : "",
    name: r.name ?? "",
    email: r.email ?? "",
    phone: r.phone ?? "",
    attending: r.attending ?? "",
    message: r.message ?? "",
  }));
}

/** Add one RSVP for a specific host. */
export async function addRsvp({ name, email, phone, attending, message }, hostId) {
  const { error } = await db()
    .from("invite_rsvps")
    .insert({
      host_id: hostId,
      name: String(name).trim(),
      email: String(email).trim(),
      phone: phone ? String(phone).trim() : null,
      attending: String(attending).trim(),
      message: message != null ? String(message).trim() : "",
    });

  if (error) throw new Error(error.message);
}
