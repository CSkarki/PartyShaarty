import { createSupabaseServerClient, createSupabaseAdminClient, requireHostProfile } from "../../../../../../lib/supabase-server";

export async function GET(_request, { params }) {
  const supabase = createSupabaseServerClient();
  let profile;
  try {
    ({ profile } = await requireHostProfile(supabase));
  } catch (res) {
    return res;
  }

  const { eventId } = params;
  const admin = createSupabaseAdminClient();

  // Verify the event belongs to this host
  const { data: event } = await admin
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("host_id", profile.id)
    .single();

  if (!event) {
    return Response.json({ error: "Event not found" }, { status: 404 });
  }

  try {
    const { data: intake, error: intakeErr } = await admin
      .from("celebration_intake")
      .select("*")
      .eq("event_id", eventId)
      .single();

    // Table doesn't exist yet or no row found — treat as no intake
    if (intakeErr || !intake) {
      return Response.json({ intake: null });
    }

    const { data: prefs } = await admin
      .from("celebration_preferences")
      .select("category, value")
      .eq("intake_id", intake.id);

    // Group preferences by category
    const grouped = {};
    (prefs || []).forEach(({ category, value }) => {
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(value);
    });

    return Response.json({ intake, preferences: grouped });
  } catch {
    return Response.json({ intake: null });
  }
}

export async function POST(request, { params }) {
  const supabase = createSupabaseServerClient();
  let profile;
  try {
    ({ profile } = await requireHostProfile(supabase));
  } catch (res) {
    return res;
  }

  const { eventId } = params;
  const admin = createSupabaseAdminClient();

  // Verify event ownership
  const { data: event } = await admin
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("host_id", profile.id)
    .single();

  if (!event) {
    return Response.json({ error: "Event not found" }, { status: 404 });
  }

  const body = await request.json();
  const {
    event_type,
    experience_vibes,
    guest_count_range,
    venue_type,
    essentials,
    memories_priority,
    investment_range,
    involvement_level,
    contact_email,
    contact_phone,
  } = body;

  try {
    // Upsert scalar fields into celebration_intake
    const { data: intake, error: intakeErr } = await admin
      .from("celebration_intake")
      .upsert(
        {
          event_id: eventId,
          event_type,
          guest_count_range,
          venue_type,
          investment_range,
          involvement_level,
          contact_email: contact_email?.trim() || null,
          contact_phone: contact_phone?.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "event_id" }
      )
      .select()
      .single();

    if (intakeErr) throw new Error(intakeErr.message);

    // Delete old preferences for this intake, then insert new ones
    await admin
      .from("celebration_preferences")
      .delete()
      .eq("intake_id", intake.id);

    const prefRows = [];
    (experience_vibes || []).forEach((v) =>
      prefRows.push({ intake_id: intake.id, category: "experience_vibe", value: v })
    );
    (essentials || []).forEach((v) =>
      prefRows.push({ intake_id: intake.id, category: "essential", value: v })
    );
    if (memories_priority) {
      prefRows.push({ intake_id: intake.id, category: "memory_priority", value: memories_priority });
    }

    if (prefRows.length > 0) {
      const { error: prefErr } = await admin
        .from("celebration_preferences")
        .insert(prefRows);
      if (prefErr) throw new Error(prefErr.message);
    }

    return Response.json({ ok: true, intakeId: intake.id });
  } catch (err) {
    console.error("Intake save error:", err.message);
    return Response.json({ error: "Failed to save intake" }, { status: 500 });
  }
}
