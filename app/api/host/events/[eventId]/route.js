import { createSupabaseServerClient, requireHostProfile } from "../../../../../lib/supabase-server";
import { getEvent, updateEvent, deleteEvent, launchEvent, requestDeletion } from "../../../../../lib/event-store";
import { sendEmail } from "../../../../../lib/mailer";
import { uploadEventCoverImage, getCoverImageUrl, getSignedUrlsForPaths } from "../../../../../lib/supabase";
import { validateFileSize, validateImageBuffer, stripExifAndReencode } from "../../../../../lib/upload-utils";
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
  let user, profile;
  try {
    ({ user, profile } = await requireHostProfile(supabase));
  } catch (res) {
    return res;
  }

  const event = await getEvent(eventId, profile.id);
  if (!event) return Response.json({ error: "Event not found" }, { status: 404 });

  const contentType = request.headers.get("content-type") || "";

  // ── JSON actions (launch, request_deletion) ──────────────────────────────
  if (!contentType.includes("multipart/form-data")) {
    const body = await request.json().catch(() => ({}));

    if (body.action === "launch") {
      if (event.status === "active") {
        return Response.json({ error: "Event is already live." }, { status: 400 });
      }
      try {
        await launchEvent(eventId, profile.id);
        return Response.json({ ok: true });
      } catch (err) {
        return Response.json({ error: "Failed to launch event." }, { status: 500 });
      }
    }

    if (body.action === "request_deletion") {
      if (event.status !== "active") {
        return Response.json({ error: "Only live events need a deletion request. Delete draft events directly." }, { status: 400 });
      }
      try {
        await requestDeletion(eventId, profile.id, body.reason);

        // Notify admin by email (best-effort — don't fail the request if email fails)
        const adminEmail = process.env.SUPER_ADMIN_EMAIL?.trim();
        if (adminEmail) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          sendEmail({
            to: adminEmail,
            subject: `Deletion request — "${event.event_name}"`,
            html: `
              <p>A host has requested deletion of a live event.</p>
              <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
                <tr><td style="padding:4px 12px 4px 0;color:#666">Event</td><td><strong>${event.event_name}</strong></td></tr>
                <tr><td style="padding:4px 12px 4px 0;color:#666">Host</td><td>${user.email}</td></tr>
                <tr><td style="padding:4px 12px 4px 0;color:#666">Invite URL</td><td><a href="${appUrl}/${event.slug}/invite">${appUrl}/${event.slug}/invite</a></td></tr>
                <tr><td style="padding:4px 12px 4px 0;color:#666">Reason</td><td>${body.reason?.trim() || "(no reason given)"}</td></tr>
              </table>
              <p style="margin-top:16px">
                <a href="${appUrl}/admin/events" style="background:#dc2626;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none">Review in Admin Panel</a>
              </p>
            `,
          }).catch((err) => console.error("Admin deletion email failed:", err.message));
        }

        return Response.json({ ok: true });
      } catch (err) {
        return Response.json({ error: "Failed to submit deletion request." }, { status: 500 });
      }
    }

    // Regular settings update — blocked when live
    if (event.status === "active") {
      return Response.json({ error: "Event is live. Settings cannot be changed." }, { status: 403 });
    }

    const fields = body;
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

  // ── Multipart form data (cover image upload + settings) ──────────────────
  if (event.status === "active") {
    return Response.json({ error: "Event is live. Settings cannot be changed." }, { status: 403 });
  }

  const formData = await request.formData();
  const fields = {
    event_name: formData.get("event_name"),
    event_date: formData.get("event_date"),
    event_location: formData.get("event_location"),
    event_message: formData.get("event_message"),
  };

  const coverFile = formData.get("cover_image");
  if (coverFile && typeof coverFile.arrayBuffer === "function" && coverFile.size > 0) {
    const sizeCheck = validateFileSize(coverFile);
    if (!sizeCheck.ok) {
      return Response.json({ error: sizeCheck.error }, { status: sizeCheck.status });
    }
    const rawBuffer = Buffer.from(await coverFile.arrayBuffer());
    const imageCheck = await validateImageBuffer(rawBuffer);
    if (!imageCheck.ok) {
      return Response.json({ error: imageCheck.error }, { status: imageCheck.status });
    }
    const buffer = await stripExifAndReencode(rawBuffer, imageCheck.metadata.format);
    const ext = imageCheck.metadata.format === "jpeg" ? "jpg" : imageCheck.metadata.format;
    const mimeType = `image/${imageCheck.metadata.format}`;
    const imagePath = await uploadEventCoverImage(buffer, eventId, ext, mimeType);
    fields.event_image_path = imagePath;
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

  if (event.status === "active") {
    return Response.json(
      { error: "Live events cannot be deleted. Use 'Request Deletion' to notify the admin." },
      { status: 403 }
    );
  }

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
