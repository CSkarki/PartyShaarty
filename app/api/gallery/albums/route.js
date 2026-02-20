import { createSupabaseServerClient, requireHostProfile } from "../../../../lib/supabase-server";
import { createAlbum, listAlbums } from "../../../../lib/gallery-store";

export async function GET() {
  const supabase = createSupabaseServerClient();
  let profile;
  try {
    ({ profile } = await requireHostProfile(supabase));
  } catch (res) {
    return res;
  }

  try {
    const albums = await listAlbums(profile.id);
    return Response.json(albums);
  } catch (err) {
    console.error("List albums error:", err.message);
    return Response.json({ error: "Failed to list albums" }, { status: 500 });
  }
}

export async function POST(request) {
  const supabase = createSupabaseServerClient();
  let profile;
  try {
    ({ profile } = await requireHostProfile(supabase));
  } catch (res) {
    return res;
  }

  const { name } = await request.json();
  if (!name || typeof name !== "string" || !name.trim()) {
    return Response.json({ error: "Album name is required" }, { status: 400 });
  }
  if (name.trim().length > 100) {
    return Response.json({ error: "Album name too long" }, { status: 400 });
  }

  try {
    const album = await createAlbum(name, profile.id);
    return Response.json(album, { status: 201 });
  } catch (err) {
    console.error("Create album error:", err.message);
    return Response.json({ error: "Failed to create album" }, { status: 500 });
  }
}
