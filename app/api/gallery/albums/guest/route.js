import { requireGuest } from "../../../../../lib/guest-auth";
import { listAlbumsForEmailByEvent } from "../../../../../lib/gallery-store";
import { createSupabaseAdminClient } from "../../../../../lib/supabase-server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  // Accept eventSlug (new) or hostSlug (legacy)
  const eventSlug = searchParams.get("eventSlug") || searchParams.get("hostSlug");

  const guest = requireGuest(request, eventSlug || undefined);
  if (!guest.ok) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = eventSlug || guest.eventSlug;
  if (!slug) {
    return Response.json({ error: "Event not specified" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!event) {
    return Response.json({ error: "Event not found" }, { status: 404 });
  }

  try {
    const albums = await listAlbumsForEmailByEvent(guest.email, event.id);
    return Response.json(albums);
  } catch (err) {
    console.error("Guest albums error:", err.message);
    return Response.json({ error: "Failed to load albums" }, { status: 500 });
  }
}
