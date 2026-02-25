import * as XLSX from "xlsx";
import { createSupabaseServerClient, requireHostProfile } from "../../../lib/supabase-server";
import { listRsvps, listRsvpsByEvent } from "../../../lib/rsvp-store";
import { getEvent } from "../../../lib/event-store";

export async function GET(request) {
  const supabase = createSupabaseServerClient();
  let profile;
  try {
    ({ profile } = await requireHostProfile(supabase));
  } catch (res) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  try {
    let arr;
    if (eventId) {
      const event = await getEvent(eventId, profile.id);
      if (!event) return new Response("Event not found", { status: 404 });
      arr = await listRsvpsByEvent(eventId);
    } else {
      arr = await listRsvps(profile.id);
    }

    const head = ["Timestamp", "Name", "Email", "Attending", "Message"];
    const data = [head, ...arr.map((r) => [r.timestamp, r.name, r.email, r.attending, r.message || ""])];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "RSVPs");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new Response(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="rsvps.xlsx"',
      },
    });
  } catch (err) {
    console.error("Export error:", err.message);
    return new Response("Export failed", { status: 500 });
  }
}
