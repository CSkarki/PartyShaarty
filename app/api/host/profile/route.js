import { createSupabaseServerClient, requireHostProfile } from "../../../../lib/supabase-server";
import { uploadCoverImage, getCoverImageUrl } from "../../../../lib/supabase";
import { validateFileSize, validateImageBuffer, stripExifAndReencode } from "../../../../lib/upload-utils";

export async function GET() {
  const supabase = createSupabaseServerClient();
  let profile;
  try {
    ({ profile } = await requireHostProfile(supabase));
  } catch (res) {
    return res;
  }

  // Include a fresh signed URL so the dashboard can preview the cover image
  let event_image_url = null;
  if (profile.event_image_path) {
    event_image_url = await getCoverImageUrl(profile.event_image_path);
  }

  return Response.json({ ...profile, event_image_url });
}

export async function PATCH(request) {
  const supabase = createSupabaseServerClient();
  let user, profile;
  try {
    ({ user, profile } = await requireHostProfile(supabase));
  } catch (res) {
    return res;
  }

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

    // Handle cover image upload.
    // Next.js App Router may return a Blob instead of a File from formData(),
    // so avoid instanceof File — just check it has a size.
    const coverFile = formData.get("cover_image");
    console.log("[PATCH] coverFile:", coverFile ? `size=${coverFile.size} type=${coverFile.type}` : "null/missing");
    if (coverFile && typeof coverFile.arrayBuffer === "function" && coverFile.size > 0) {
      // Fix 1: check declared size before allocating buffer
      const sizeCheck = validateFileSize(coverFile);
      if (!sizeCheck.ok) {
        return Response.json({ error: sizeCheck.error }, { status: sizeCheck.status });
      }

      const rawBuffer = Buffer.from(await coverFile.arrayBuffer());

      // Fix 5: validate actual image bytes via sharp
      const imageCheck = await validateImageBuffer(rawBuffer);
      if (!imageCheck.ok) {
        return Response.json({ error: imageCheck.error }, { status: imageCheck.status });
      }

      // Strip EXIF and re-encode; derive ext/mimeType from real format
      const buffer = await stripExifAndReencode(rawBuffer, imageCheck.metadata.format);
      const ext = imageCheck.metadata.format === "jpeg" ? "jpg" : imageCheck.metadata.format;
      const mimeType = `image/${imageCheck.metadata.format}`;
      const imagePath = await uploadCoverImage(buffer, profile.id, ext, mimeType);
      console.log("[PATCH] uploaded imagePath:", imagePath);
      fields.event_image_path = imagePath;
    } else {
      console.log("[PATCH] skipping upload — no valid cover file");
    }
  } else {
    fields = await request.json();
  }

  // Only allow updating safe event fields
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

  updates.updated_at = new Date().toISOString();

  console.log("[PATCH] updates:", JSON.stringify(updates));

  const { data: updatedRows, error } = await supabase
    .from("host_profiles")
    .update(updates)
    .eq("id", profile.id)
    .select();

  console.log("[PATCH] result rows:", updatedRows?.length, "| BBBBdb event_image_path:", updatedRows?.[0]?.event_image_path, "| error:", error?.message ?? "none");

  if (error) {
    console.error("Profile update error:", error.message);
    return Response.json({ error: "Failed to update profile" }, { status: 500 });
  }

  if (!updatedRows?.length) {
    console.error("[PATCH] UPDATE affected 0 rows — RLS or filter issue");
    return Response.json({ error: "Update failed: no rows matched. Check RLS policy." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
