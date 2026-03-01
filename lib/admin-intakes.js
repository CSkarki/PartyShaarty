import { createSupabaseAdminClient } from "./supabase-server";

/**
 * List all celebration intakes with event and host info and preferences.
 * For super-admin use only (caller must enforce SUPER_ADMIN_EMAIL).
 */
export async function listIntakesForAdmin() {
  const admin = createSupabaseAdminClient();

  const { data: rows, error } = await admin
    .from("celebration_intake")
    .select(`
      id,
      event_id,
      contact_email,
      contact_phone,
      guest_count_range,
      venue_type,
      investment_range,
      involvement_level,
      created_at,
      updated_at,
      events (
        event_name,
        slug,
        host_id,
        host_profiles ( display_name )
      )
    `)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  const intakeIds = (rows || []).map((r) => r.id);
  let prefsByIntake = {};
  if (intakeIds.length > 0) {
    const { data: prefs } = await admin
      .from("celebration_preferences")
      .select("intake_id, category, value")
      .in("intake_id", intakeIds);
    (prefs || []).forEach(({ intake_id, category, value }) => {
      if (!prefsByIntake[intake_id]) prefsByIntake[intake_id] = {};
      if (!prefsByIntake[intake_id][category]) prefsByIntake[intake_id][category] = [];
      prefsByIntake[intake_id][category].push(value);
    });
  }

  return (rows || []).map((r) => {
    const event = Array.isArray(r.events) ? r.events[0] : r.events;
    const host = event?.host_profiles;
    const hostName = Array.isArray(host) ? host[0]?.display_name : host?.display_name;
    return {
      id: r.id,
      event_id: r.event_id,
      event_name: event?.event_name ?? null,
      slug: event?.slug ?? null,
      host_name: hostName ?? null,
      contact_email: r.contact_email ?? null,
      contact_phone: r.contact_phone ?? null,
      guest_count_range: r.guest_count_range ?? null,
      venue_type: r.venue_type ?? null,
      investment_range: r.investment_range ?? null,
      involvement_level: r.involvement_level ?? null,
      updated_at: r.updated_at ?? null,
      preferences: prefsByIntake[r.id] || {},
    };
  });
}
