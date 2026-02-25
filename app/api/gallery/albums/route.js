import { createSupabaseServerClient, requireHostProfile } from "../../../../lib/supabase-server";
import { createAlbum, listAlbums, createAlbumForEvent, listAlbumsByEvent } from "../../../../lib/gallery-store";
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
      const event = await getEvent(eventId, profile.id);
      if (!event) return Response.json({ error: "Event not found" }, { status: 404 });
      const albums = await listAlbumsByEvent(eventId);
      return Response.json(albums);
    }
    const albums = await listAlbums(profile.id);
    return Response.json(albums);
  } catch (err) {
    console.error("List albums error:", err.message);
    return Response.json({ error: "Failed to list albums" }, { status: 500 });
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

  const body = await request.json();
  const { name, eventId } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return Response.json({ error: "Album name is required" }, { status: 400 });
  }
  if (name.trim().length > 100) {
    return Response.json({ error: "Album name too long" }, { status: 400 });
  }

  try {
    if (eventId) {
      const event = await getEvent(eventId, profile.id);
      if (!event) return Response.json({ error: "Event not found" }, { status: 404 });
      const album = await createAlbumForEvent(name, eventId, profile.id);
      return Response.json(album, { status: 201 });
    }
    const album = await createAlbum(name, profile.id);
    return Response.json(album, { status: 201 });
  } catch (err) {
    console.error("Create album error:", err.message);
    return Response.json({ error: "Failed to create album" }, { status: 500 });
  }
}
