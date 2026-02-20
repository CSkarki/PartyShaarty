import { requireGuest } from "../../../../../lib/guest-auth";
import { listAlbumsForEmail } from "../../../../../lib/gallery-store";
import { createSupabaseAdminClient } from "../../../../../lib/supabase-server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const hostSlug = searchParams.get("hostSlug");

  const guest = requireGuest(request, hostSlug || undefined);
  if (!guest.ok) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Resolve host_id from slug (use cookie's hostSlug if not in query)
  const slug = hostSlug || guest.hostSlug;
  if (!slug) {
    return Response.json({ error: "Host not specified" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("host_profiles")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!profile) {
    return Response.json({ error: "Event not found" }, { status: 404 });
  }

  try {
    const albums = await listAlbumsForEmail(guest.email, profile.id);
    return Response.json(albums);
  } catch (err) {
    console.error("Guest albums error:", err.message);
    return Response.json({ error: "Failed to load albums" }, { status: 500 });
  }
}
