import { createSupabaseAdminClient } from "../../../../lib/supabase-server";
import { requireGuest } from "../../../../lib/guest-auth";
import { listAlbumsByEvent, createAlbumForEvent, shareAlbumWithEmails } from "../../../../lib/gallery-store";
import { uploadPhotoToAlbum } from "../../../../lib/supabase";
import { validateFileSize, validateImageBuffer, stripExifAndReencode } from "../../../../lib/upload-utils";

const GUEST_ALBUM_NAME = "Guest Contributions";
const MAX_FILES = 5;

export async function POST(request) {
  // Require a valid guest session (any event)
  const guest = requireGuest(request);
  if (!guest.ok) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { eventSlug } = guest;
  const admin = createSupabaseAdminClient();

  // Resolve event from slug
  const { data: eventRows, error: eventError } = await admin.rpc("get_event_by_slug", { p_slug: eventSlug });
  if (eventError || !eventRows?.length) {
    return Response.json({ error: "Event not found" }, { status: 404 });
  }
  const ev = eventRows[0];

  // Find or create the "Guest Contributions" album
  let guestAlbum;
  const albums = await listAlbumsByEvent(ev.id);
  guestAlbum = albums.find((a) => a.name === GUEST_ALBUM_NAME);
  if (!guestAlbum) {
    guestAlbum = await createAlbumForEvent(GUEST_ALBUM_NAME, ev.id, ev.host_id);
  }

  // Share album with uploader so they can view their photos in the gallery
  try {
    await shareAlbumWithEmails(guestAlbum.id, [guest.email], ev.host_id);
  } catch {
    // Non-fatal: share failure should not block upload
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("photos").slice(0, MAX_FILES);
    if (!files.length) {
      return Response.json({ error: "No files uploaded" }, { status: 400 });
    }

    const results = [];
    for (const file of files) {
      if (!(file instanceof File)) continue;

      const sizeCheck = validateFileSize(file);
      if (!sizeCheck.ok) {
        results.push({ name: file.name, status: "skipped", error: sizeCheck.error });
        continue;
      }

      if (!file.type.startsWith("image/")) {
        results.push({ name: file.name, status: "skipped", error: "Not an image" });
        continue;
      }

      const rawBuffer = Buffer.from(await file.arrayBuffer());

      const imageCheck = await validateImageBuffer(rawBuffer);
      if (!imageCheck.ok) {
        results.push({ name: file.name, status: "skipped", error: imageCheck.error });
        continue;
      }

      const buffer = await stripExifAndReencode(rawBuffer, imageCheck.metadata.format);
      const ext = imageCheck.metadata.format === "jpeg" ? "jpg" : imageCheck.metadata.format;
      const contentType = `image/${imageCheck.metadata.format}`;
      const filename = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      await uploadPhotoToAlbum(buffer, ev.host_id, guestAlbum.slug, filename, contentType);
      results.push({ name: filename, status: "uploaded" });
    }

    const uploaded = results.filter((r) => r.status === "uploaded").length;
    return Response.json({ uploaded, results });
  } catch (err) {
    console.error("Guest upload error:", err.message);
    return Response.json({ error: "Upload failed: " + err.message }, { status: 500 });
  }
}
