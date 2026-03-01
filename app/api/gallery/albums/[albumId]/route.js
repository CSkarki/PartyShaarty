import { createSupabaseServerClient, requireHostProfile } from "../../../../../lib/supabase-server";
import { getAlbum, renameAlbum, updateAlbumSlideshowEnabled, deleteAlbumRecord } from "../../../../../lib/gallery-store";
import { listPhotosInAlbum, deletePhotoByPath } from "../../../../../lib/supabase";

export async function PATCH(request, { params }) {
  const supabase = createSupabaseServerClient();
  let profile;
  try {
    ({ profile } = await requireHostProfile(supabase));
  } catch (res) {
    return res;
  }

  const { albumId } = params;
  const body = await request.json();

  try {
    const album = await getAlbum(albumId, profile.id);
    if (!album) return Response.json({ error: "Album not found" }, { status: 404 });

    if (typeof body.slideshow_enabled === "boolean") {
      await updateAlbumSlideshowEnabled(albumId, body.slideshow_enabled, profile.id);
      return Response.json({ ok: true });
    }

    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return Response.json({ error: "Album name is required" }, { status: 400 });
    }
    await renameAlbum(albumId, body.name, profile.id);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Update album error:", err.message);
    return Response.json({ error: "Failed to update album" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const supabase = createSupabaseServerClient();
  let profile;
  try {
    ({ profile } = await requireHostProfile(supabase));
  } catch (res) {
    return res;
  }

  const { albumId } = params;

  try {
    const album = await getAlbum(albumId, profile.id);
    if (!album) return Response.json({ error: "Album not found" }, { status: 404 });

    // Delete all storage files in this album folder
    const files = await listPhotosInAlbum(profile.id, album.slug);
    for (const file of files) {
      await deletePhotoByPath(file.path);
    }

    await deleteAlbumRecord(albumId, profile.id);
    return Response.json({ ok: true, deletedPhotos: files.length });
  } catch (err) {
    console.error("Delete album error:", err.message);
    return Response.json({ error: "Failed to delete album" }, { status: 500 });
  }
}
