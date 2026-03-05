import { createSupabaseServerClient, requireHostProfile, createSupabaseAdminClient } from "../../../../lib/supabase-server";

export async function POST(request) {
  const supabase = createSupabaseServerClient();
  let profile;
  try {
    ({ profile } = await requireHostProfile(supabase));
  } catch (res) {
    return res;
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    intake_mode,
    event_type,
    event_date,
    guest_count_range,
    venue_type,
    investment_range,
    experience_vibes,
    essentials,
    memories_priority,
    contact_email,
    contact_phone,
  } = body;

  if (!contact_email?.trim()) {
    return Response.json({ error: "contact_email is required" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("onboarding_intakes").insert({
    user_id: profile.user_id,
    intake_mode: intake_mode || "light",
    event_type: event_type || null,
    event_date: event_date || null,
    guest_count_range: guest_count_range || null,
    venue_type: venue_type || null,
    investment_range: investment_range || null,
    experience_vibes: experience_vibes || null,
    essentials: essentials || null,
    memories_priority: memories_priority || null,
    contact_email: contact_email.trim(),
    contact_phone: contact_phone?.trim() || null,
  });

  if (error) {
    console.error("Onboarding intake insert error:", error.message);
    return Response.json({ error: "Failed to save intake" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
