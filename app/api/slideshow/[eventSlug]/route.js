import { createSupabaseAdminClient } from "../../../../lib/supabase-server";
import { listAlbumsByEvent } from "../../../../lib/gallery-store";
import { listPhotosInAlbum } from "../../../../lib/supabase";

// Signed URLs expire — never cache this response at any layer
export const dynamic = "force-dynamic";
const NO_CACHE = { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" };

export async function GET(request, { params }) {
  const { eventSlug } = params;

  const admin = createSupabaseAdminClient();

  // Resolve event from slug (public RPC)
  const { data: event, error } = await admin.rpc("get_event_by_slug", { p_slug: eventSlug });
  if (error || !event?.length) {
    return Response.json({ error: "Event not found" }, { status: 404, headers: NO_CACHE });
  }
  const ev = event[0];

  try {
    const allAlbums = await listAlbumsByEvent(ev.id);
    // Only include albums the host has enabled for the slideshow
    // slideshow_enabled defaults to true; treat undefined (pre-migration) as true
    const albums = allAlbums.filter((a) => a.slideshow_enabled !== false);
    if (!albums.length) {
      return Response.json({ eventName: ev.event_name, eventDate: ev.event_date, photos: [] }, { headers: NO_CACHE });
    }

    // Collect all photos across all albums
    const allPhotos = [];
    for (const album of albums) {
      const files = await listPhotosInAlbum(ev.host_id, album.slug);
      for (const f of files) {
        allPhotos.push({ path: f.path, albumName: album.name, albumId: album.id });
      }
    }

    if (!allPhotos.length) {
      return Response.json({ eventName: ev.event_name, eventDate: ev.event_date, photos: [] }, { headers: NO_CACHE });
    }

    const photos = allPhotos.map((p) => ({
      url: `/api/image?p=${encodeURIComponent(p.path)}`,
      albumName: p.albumName,
      albumId: p.albumId,
    }));

    return Response.json({
      eventName: ev.event_name,
      eventDate: ev.event_date,
      photos,
    }, { headers: NO_CACHE });
  } catch (err) {
    console.error("Slideshow API error:", err.message);
    return Response.json({ error: "Failed to load photos" }, { status: 500, headers: NO_CACHE });
  }
}
