import { createSupabaseServerClient, requireHostProfile } from "../../../../lib/supabase-server";
import { listRsvps } from "../../../../lib/rsvp-store";

export async function GET() {
  const supabase = createSupabaseServerClient();
  let profile;
  try {
    ({ profile } = await requireHostProfile(supabase));
  } catch (res) {
    return res;
  }

  try {
    const rows = await listRsvps(profile.id);
    return Response.json(rows);
  } catch (err) {
    console.error("RSVP list error:", err.message);
    return Response.json({ error: "Failed to load RSVPs" }, { status: 500 });
  }
}
