import { createSupabaseServerClient, requireHostProfile } from "../../../../lib/supabase-server";
import { listRsvps, listRsvpsByEvent } from "../../../../lib/rsvp-store";
import { getEvent } from "../../../../lib/event-store";

export async function GET(request) {
  const supabase = createSupabaseServerClient();
  let profile;
  try {
    ({ profile } = await requireHostProfile(supabase));
  } catch (res) {
    return res;
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  try {
    if (eventId) {
      // Verify the event belongs to this host before returning its RSVPs
      const event = await getEvent(eventId, profile.id);
      if (!event) return Response.json({ error: "Event not found" }, { status: 404 });
      const rows = await listRsvpsByEvent(eventId);
      return Response.json(rows);
    }
    // No eventId: return all RSVPs across all events for this host
    const rows = await listRsvps(profile.id);
    return Response.json(rows);
  } catch (err) {
    console.error("RSVP list error:", err.message);
    return Response.json({ error: "Failed to load RSVPs" }, { status: 500 });
  }
}
