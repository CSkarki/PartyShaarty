import { addRsvp } from "../../../lib/rsvp-store";
import { createSupabaseAdminClient } from "../../../lib/supabase-server";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Accept eventSlug (new) or hostSlug (legacy) for backward compat
  const { name, email, phone, attending, message, eventSlug, hostSlug } = body;
  const slug = eventSlug || hostSlug;

  if (!name || typeof name !== "string" || !email || typeof email !== "string" || !attending) {
    return Response.json(
      { error: "Name, email, and attending are required" },
      { status: 400 }
    );
  }
  if (!slug) {
    return Response.json({ error: "Event not specified" }, { status: 400 });
  }

  // Resolve event from slug
  const admin = createSupabaseAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("id, host_id")
    .eq("slug", slug)
    .single();

  if (!event) {
    return Response.json({ error: "Event not found" }, { status: 404 });
  }

  try {
    await addRsvp({ name, email, phone, attending, message }, event.host_id, event.id);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("RSVP API error:", err.message);
    return Response.json(
      { error: err.message || "Failed to save RSVP" },
      { status: 500 }
    );
  }
}
