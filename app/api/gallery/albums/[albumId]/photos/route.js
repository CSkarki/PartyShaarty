import { createSupabaseServerClient, requireHostProfile, createSupabaseAdminClient } from "../../../../../../lib/supabase-server";
import { requireGuest } from "../../../../../../lib/guest-auth";
import { getAlbum, listAlbumsForEmail } from "../../../../../../lib/gallery-store";
import { listPhotosInAlbum, getSignedUrlsForPaths, uploadPhotoToAlbum, deletePhotoByPath } from "../../../../../../lib/supabase";
import { validateFileSize, validateImageBuffer, stripExifAndReencode } from "../../../../../../lib/upload-utils";

export async function GET(request, { params }) {
  const { albumId } = params;
  const { searchParams } = new URL(request.url);
  // Accept new eventSlug param (multi-event) and legacy hostSlug for backward compat
  const eventSlugParam = searchParams.get("eventSlug");
  const hostSlugParam = searchParams.get("hostSlug");
  const slugParam = eventSlugParam || hostSlugParam;

  // Try guest auth first (validate cookie matches this event)
  const guest = requireGuest(request, slugParam || undefined);

  if (guest.ok) {
    const slug = slugParam || guest.eventSlug;
    if (!slug) return Response.json({ error: "Host not specified" }, { status: 400 });

    const admin = createSupabaseAdminClient();

    // Resolve host_id: try event slug via RPC first, then fall back to host profile slug
    let hostProfileId;
    const { data: eventRows } = await admin.rpc("get_event_by_slug", { p_slug: slug });
    if (eventRows?.length) {
      hostProfileId = eventRows[0].host_id;
    } else {
      // Legacy: host slug lookup
      const { data: hp } = await admin
        .from("host_profiles")
        .select("id")
        .eq("slug", slug)
        .single();
      hostProfileId = hp?.id;
    }

    if (!hostProfileId) return Response.json({ error: "Event not found" }, { status: 404 });

    const album = await getAlbum(albumId, hostProfileId);
    if (!album) return Response.json({ error: "Album not found" }, { status: 404 });

    // Verify album is shared with this guest
    const allowed = await listAlbumsForEmail(guest.email, hostProfileId);
    if (!allowed.find((a) => a.id === albumId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    return servePhotos(hostProfileId, album);
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

      // Fix 1: check declared size before allocating buffer
      const sizeCheck = validateFileSize(file);
      if (!sizeCheck.ok) {
        results.push({ name: file.name, status: "skipped", error: sizeCheck.error });
        continue;
      }

      // Quick MIME pre-screen (client-supplied, but catches obvious non-images early)
      if (!file.type.startsWith("image/")) {
        results.push({ name: file.name, status: "skipped", error: "Not an image" });
        continue;
      }

      const rawBuffer = Buffer.from(await file.arrayBuffer());

      // Fix 5: validate actual image bytes via sharp (catches spoofed extensions/MIME)
      const imageCheck = await validateImageBuffer(rawBuffer);
      if (!imageCheck.ok) {
        results.push({ name: file.name, status: "skipped", error: imageCheck.error });
        continue;
      }

      // Strip EXIF (GPS, device info) and re-encode
      const buffer = await stripExifAndReencode(rawBuffer, imageCheck.metadata.format);
      const ext = imageCheck.metadata.format === "jpeg" ? "jpg" : imageCheck.metadata.format;
      const contentType = `image/${imageCheck.metadata.format}`;
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      await uploadPhotoToAlbum(buffer, profile.id, album.slug, filename, contentType);
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
