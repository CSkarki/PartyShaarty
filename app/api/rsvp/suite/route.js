import { createSupabaseAdminClient } from "../../../../lib/supabase-server";
import { addRsvp } from "../../../../lib/rsvp-store";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { responses, name, email, phone, message } = body;

  if (!name || !email) {
    return Response.json({ error: "Name and email are required" }, { status: 400 });
  }
  if (!Array.isArray(responses) || responses.length === 0) {
    return Response.json({ error: "responses array is required" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  let created = 0;
  const errors = [];

  for (const { slug, attending } of responses) {
    if (!slug || !attending) continue;

    // Resolve event + host from slug
    const { data: rows } = await admin.rpc("get_event_by_slug", { p_slug: slug });
    if (!rows?.length) {
      errors.push({ slug, reason: "Event not found" });
      continue;
    }
    const ev = rows[0];

    try {
      await addRsvp(
        { name, email, phone: phone || null, attending, message: message || "" },
        ev.host_id,
        ev.id
      );
      created++;
    } catch (err) {
      errors.push({ slug, reason: err.message });
    }
  }

  return Response.json({ created, errors });
}
