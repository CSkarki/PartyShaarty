import { createSupabaseServerClient, requireHostProfile } from "../../../../lib/supabase-server";
import { listRsvps } from "../../../../lib/rsvp-store";

export async function GET() {
  const supabase = createSupabaseServerClient();
  let profile;
  try {
    ({ profile } = await requireHostProfile(supabase));
  } catch (res) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const rows = await listRsvps(profile.id);
    const raw = JSON.stringify(rows, null, 2);
    return new Response(raw, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="rsvps.json"',
      },
    });
  } catch (err) {
    console.error("Export JSON error:", err.message);
    return new Response("Export failed", { status: 500 });
  }
}
