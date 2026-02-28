import { createSupabaseServerClient } from "../../../../../lib/supabase-server";
import { adminDeleteEvent, dismissDeletionRequest } from "../../../../../lib/event-store";
import { listAlbumsByEvent } from "../../../../../lib/gallery-store";
import { listPhotosInAlbum, deletePhotoByPath } from "../../../../../lib/supabase";

async function requireSuperAdmin(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL?.trim()) {
    return null;
  }
  return user;
}

// DELETE /api/admin/events/[eventId] — force-delete regardless of status
export async function DELETE(request, { params }) {
  const { eventId } = params;
  const supabase = createSupabaseServerClient();
  const user = await requireSuperAdmin(supabase);
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });

  // Clean up storage first (best-effort)
  try {
    const albums = await listAlbumsByEvent(eventId);
    for (const album of albums) {
      // listPhotosInAlbum needs hostProfileId; for admin use the album's host_id
      const photos = await listPhotosInAlbum(album.host_id, album.slug);
      for (const photo of photos) {
        await deletePhotoByPath(photo.path).catch(() => {});
      }
    }
  } catch (err) {
    console.error("Admin delete — storage cleanup error:", err.message);
  }

  try {
    await adminDeleteEvent(eventId);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Admin delete event error:", err.message);
    return Response.json({ error: "Failed to delete event" }, { status: 500 });
  }
}

// PATCH /api/admin/events/[eventId] — dismiss deletion request
export async function PATCH(request, { params }) {
  const { eventId } = params;
  const supabase = createSupabaseServerClient();
  const user = await requireSuperAdmin(supabase);
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });

  try {
    await dismissDeletionRequest(eventId);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Dismiss deletion request error:", err.message);
    return Response.json({ error: "Failed to dismiss request" }, { status: 500 });
  }
}
