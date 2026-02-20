import { createSupabaseServerClient, requireHostProfile } from "../../../../../../../lib/supabase-server";
import { getAlbum } from "../../../../../../../lib/gallery-store";
import { copyPhotoBetweenAlbums, movePhotoBetweenAlbums } from "../../../../../../../lib/supabase";

export async function POST(request, { params }) {
  const supabase = createSupabaseServerClient();
  let profile;
  try {
    ({ profile } = await requireHostProfile(supabase));
  } catch (res) {
    return res;
  }

  const { albumId } = params;
  const { sourcePath, targetAlbumId, copy } = await request.json();

  if (!sourcePath || !targetAlbumId) {
    return Response.json({ error: "sourcePath and targetAlbumId are required" }, { status: 400 });
  }

  try {
    const sourceAlbum = await getAlbum(albumId, profile.id);
    if (!sourceAlbum) return Response.json({ error: "Source album not found" }, { status: 404 });

    // Validate path belongs to this host's album
    if (!sourcePath.startsWith(`${profile.id}/${sourceAlbum.slug}/`)) {
      return Response.json({ error: "Invalid source path" }, { status: 400 });
    }

    const targetAlbum = await getAlbum(targetAlbumId, profile.id);
    if (!targetAlbum) return Response.json({ error: "Target album not found" }, { status: 404 });

    const filename = sourcePath.split("/").pop();
    const newPath = `${profile.id}/${targetAlbum.slug}/${filename}`;

    if (copy) {
      await copyPhotoBetweenAlbums(sourcePath, profile.id, targetAlbum.slug, filename);
    } else {
      await movePhotoBetweenAlbums(sourcePath, profile.id, targetAlbum.slug, filename);
    }

    return Response.json({ ok: true, newPath });
  } catch (err) {
    console.error("Move/copy error:", err.message);
    return Response.json({ error: "Operation failed: " + err.message }, { status: 500 });
  }
}
