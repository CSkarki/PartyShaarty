import { createSupabaseServerClient, requireHostProfile } from "../../../../lib/supabase-server";
import { listEvents, createEvent } from "../../../../lib/event-store";

export async function GET() {
  const supabase = createSupabaseServerClient();
  let profile;
  try {
    ({ profile } = await requireHostProfile(supabase));
  } catch (res) {
    return res;
  }

  try {
    const events = await listEvents(profile.id);
    return Response.json(events);
  } catch (err) {
    console.error("List events error:", err.message);
    return Response.json({ error: "Failed to load events" }, { status: 500 });
  }
}

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

  const { event_name, event_date, event_location, event_message } = body;
  if (!event_name || !String(event_name).trim()) {
    return Response.json({ error: "event_name is required" }, { status: 400 });
  }

  try {
    const event = await createEvent({ event_name, event_date, event_location, event_message }, profile.id);
    return Response.json(event, { status: 201 });
  } catch (err) {
    console.error("Create event error:", err.message);
    return Response.json({ error: err.message || "Failed to create event" }, { status: 500 });
  }
}
