import { createSupabaseServerClient, requireHostProfile, createSupabaseAdminClient } from "../../../../lib/supabase-server";
import { uploadCoverImage } from "../../../../lib/supabase";

export async function GET() {
  const supabase = createSupabaseServerClient();
  let profile;
  try {
    ({ profile } = await requireHostProfile(supabase));
  } catch (res) {
    return res;
  }
  return Response.json(profile);
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

    // Handle cover image upload
    const coverFile = formData.get("cover_image");
    if (coverFile && coverFile instanceof File && coverFile.size > 0) {
      const ext = coverFile.name.split(".").pop() || "jpg";
      const buffer = Buffer.from(await coverFile.arrayBuffer());
      const imagePath = await uploadCoverImage(buffer, profile.id, ext, coverFile.type);
      fields.event_image_path = imagePath;
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

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("host_profiles")
    .update(updates)
    .eq("id", profile.id);

  if (error) {
    console.error("Profile update error:", error.message);
    return Response.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
