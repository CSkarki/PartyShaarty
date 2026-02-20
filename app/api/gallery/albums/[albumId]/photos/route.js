import { createSupabaseServerClient, requireHostProfile, createSupabaseAdminClient } from "../../../../../../lib/supabase-server";
import { requireGuest } from "../../../../../../lib/guest-auth";
import { getAlbum, listAlbumsForEmail } from "../../../../../../lib/gallery-store";
import { listPhotosInAlbum, getSignedUrlsForPaths, uploadPhotoToAlbum, deletePhotoByPath } from "../../../../../../lib/supabase";

export async function GET(request, { params }) {
  const { albumId } = params;
  const { searchParams } = new URL(request.url);
  const hostSlug = searchParams.get("hostSlug");

  // Try guest auth first
  const guest = requireGuest(request, hostSlug || undefined);

  if (guest.ok) {
    // Guest access: resolve host from cookie's hostSlug
    const slug = hostSlug || guest.hostSlug;
    if (!slug) return Response.json({ error: "Host not specified" }, { status: 400 });

    const admin = createSupabaseAdminClient();
    const { data: hostProfile } = await admin
      .from("host_profiles")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!hostProfile) return Response.json({ error: "Event not found" }, { status: 404 });

    const album = await getAlbum(albumId, hostProfile.id);
    if (!album) return Response.json({ error: "Album not found" }, { status: 404 });

    // Verify album is shared with this guest
    const allowed = await listAlbumsForEmail(guest.email, hostProfile.id);
    if (!allowed.find((a) => a.id === albumId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    return servePhotos(hostProfile.id, album);
  }

  // Try host auth
  const supabase = createSupabaseServerClient();
  let profile;
  try {
    ({ profile } = await requireHostProfile(supabase));
  } catch (res) {
    return res;
  }

  const album = await getAlbum(albumId, profile.id);
  if (!album) return Response.json({ error: "Album not found" }, { status: 404 });

  return servePhotos(profile.id, album);
}

async function servePhotos(hostProfileId, album) {
  try {
    const files = await listPhotosInAlbum(hostProfileId, album.slug);
    if (!files.length) return Response.json([]);

    const paths = files.map((f) => f.path);
    const signed = await getSignedUrlsForPaths(paths);

    const photos = files.map((f, i) => ({
      name: f.name,
      path: f.path,
      url: signed[i]?.signedUrl || "",
      size: f.metadata?.size || 0,
      createdAt: f.created_at || "",
    }));

    return Response.json(photos);
  } catch (err) {
    console.error("Album photos error:", err.message);
    return Response.json({ error: "Failed to load photos" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const supabase = createSupabaseServerClient();
  let profile;
  try {
    ({ profile } = await requireHostProfile(supabase));
  } catch (res) {
    return res;
  }

  const { albumId } = params;
  const album = await getAlbum(albumId, profile.id);
  if (!album) return Response.json({ error: "Album not found" }, { status: 404 });

  try {
    const formData = await request.formData();
    const files = formData.getAll("photos");
    if (!files.length) return Response.json({ error: "No files uploaded" }, { status: 400 });

    const results = [];
    for (const file of files) {
      if (!(file instanceof File)) continue;
      if (!file.type.startsWith("image/")) {
        results.push({ name: file.name, status: "skipped", error: "Not an image" });
        continue;
      }

      const ext = file.name.split(".").pop() || "jpg";
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      await uploadPhotoToAlbum(buffer, profile.id, album.slug, filename, file.type);
      results.push({ name: filename, path: `${profile.id}/${album.slug}/${filename}`, originalName: file.name, status: "uploaded" });
    }

    const uploaded = results.filter((r) => r.status === "uploaded").length;
    return Response.json({ uploaded, results });
  } catch (err) {
    console.error("Album upload error:", err.message);
    return Response.json({ error: "Upload failed: " + err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const supabase = createSupabaseServerClient();
  let profile;
  try {
    ({ profile } = await requireHostProfile(supabase));
  } catch (res) {
    return res;
  }

  const { albumId } = params;
  const { path } = await request.json();
  if (!path || typeof path !== "string") {
    return Response.json({ error: "Photo path is required" }, { status: 400 });
  }

  const album = await getAlbum(albumId, profile.id);
  if (!album) return Response.json({ error: "Album not found" }, { status: 404 });

  // Validate path belongs to this host's album
  if (!path.startsWith(`${profile.id}/${album.slug}/`)) {
    return Response.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    await deletePhotoByPath(path);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Album photo delete error:", err.message);
    return Response.json({ error: "Delete failed: " + err.message }, { status: 500 });
  }
}
