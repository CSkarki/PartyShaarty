import { createSupabaseServerClient, requireHostProfile } from "../../../../../lib/supabase-server";
import { getEvent, updateEvent, deleteEvent } from "../../../../../lib/event-store";
import { uploadEventCoverImage, getCoverImageUrl, getSignedUrlsForPaths } from "../../../../../lib/supabase";
import { listAlbumsByEvent } from "../../../../../lib/gallery-store";
import { listPhotosInAlbum, deletePhotoByPath } from "../../../../../lib/supabase";

export async function GET(request, { params }) {
  const { eventId } = params;
  const supabase = createSupabaseServerClient();
  let profile;
  try {
    ({ profile } = await requireHostProfile(supabase));
  } catch (res) {
    return res;
  }

  const event = await getEvent(eventId, profile.id);
  if (!event) return Response.json({ error: "Event not found" }, { status: 404 });

  let event_image_url = null;
  if (event.event_image_path) {
    event_image_url = await getCoverImageUrl(event.event_image_path);
  }

  return Response.json({ ...event, event_image_url });
}

export async function PATCH(request, { params }) {
  const { eventId } = params;
  const supabase = createSupabaseServerClient();
  let profile;
  try {
    ({ profile } = await requireHostProfile(supabase));
  } catch (res) {
    return res;
  }

  const event = await getEvent(eventId, profile.id);
  if (!event) return Response.json({ error: "Event not found" }, { status: 404 });

  const contentType = request.headers.get("content-type") || "";

  let fields;
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    fields = {
      event_name: formData.get("event_name"),
      event_date: formData.get("event_date"),
      event_location: formData.get("event_location"),
      event_message: formData.get("event_message"),
    };

    const coverFile = formData.get("cover_image");
    if (coverFile && typeof coverFile.arrayBuffer === "function" && coverFile.size > 0) {
      const rawName = typeof coverFile.name === "string" ? coverFile.name : "photo.jpg";
      const ext = rawName.includes(".") ? rawName.split(".").pop().toLowerCase() : "jpg";
      const mimeType = coverFile.type || "image/jpeg";
      const buffer = Buffer.from(await coverFile.arrayBuffer());
      const imagePath = await uploadEventCoverImage(buffer, eventId, ext, mimeType);
      fields.event_image_path = imagePath;
    }
  } else {
    fields = await request.json();
  }

  const allowed = ["event_name", "event_date", "event_location", "event_message", "event_image_path"];
  const updates = {};
  for (const key of allowed) {
    if (fields[key] !== undefined && fields[key] !== null) {
      updates[key] = String(fields[key]).trim() || null;
    }
  }

  if (!Object.keys(updates).length) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    await updateEvent(eventId, profile.id, updates);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Update event error:", err.message);
    return Response.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { eventId } = params;
  const supabase = createSupabaseServerClient();
  let profile;
  try {
    ({ profile } = await requireHostProfile(supabase));
  } catch (res) {
    return res;
  }

  const event = await getEvent(eventId, profile.id);
  if (!event) return Response.json({ error: "Event not found" }, { status: 404 });

  // Clean up storage files for all albums in this event
  try {
    const albums = await listAlbumsByEvent(eventId);
    for (const album of albums) {
      const photos = await listPhotosInAlbum(profile.id, album.slug);
      for (const photo of photos) {
        await deletePhotoByPath(photo.path).catch(() => {});
      }
    }
    // Delete cover image if present
    if (event.event_image_path) {
      await deletePhotoByPath(event.event_image_path).catch(() => {});
    }
  } catch (err) {
    console.error("Storage cleanup error:", err.message);
  }

  try {
    await deleteEvent(eventId, profile.id);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Delete event error:", err.message);
    return Response.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
