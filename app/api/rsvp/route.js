import { addRsvp } from "../../../lib/rsvp-store";
import { createSupabaseAdminClient } from "../../../lib/supabase-server";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, phone, attending, message, hostSlug } = body;
  if (!name || typeof name !== "string" || !email || typeof email !== "string" || !attending) {
    return Response.json(
      { error: "Name, email, and attending are required" },
      { status: 400 }
    );
  }
  if (!hostSlug) {
    return Response.json({ error: "Host not specified" }, { status: 400 });
  }

  // Resolve host_id from slug
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("host_profiles")
    .select("id")
    .eq("slug", hostSlug)
    .single();

  if (!profile) {
    return Response.json({ error: "Event not found" }, { status: 404 });
  }

  try {
    await addRsvp({ name, email, phone, attending, message }, profile.id);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("RSVP API error:", err.message);
    return Response.json(
      { error: err.message || "Failed to save RSVP" },
      { status: 500 }
    );
  }
}
