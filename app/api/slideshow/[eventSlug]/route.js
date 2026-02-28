import { createSupabaseAdminClient } from "../../../../lib/supabase-server";
import { listAlbumsByEvent } from "../../../../lib/gallery-store";
import { listPhotosInAlbum, getSignedUrlsForPaths } from "../../../../lib/supabase";

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
    const albums = await listAlbumsByEvent(ev.id);
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

    const paths = allPhotos.map((p) => p.path);
    const signed = await getSignedUrlsForPaths(paths);

    const photos = allPhotos.map((p, i) => ({
      url: signed[i]?.signedUrl || "",
      albumName: p.albumName,
      albumId: p.albumId,
    })).filter((p) => p.url);

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
