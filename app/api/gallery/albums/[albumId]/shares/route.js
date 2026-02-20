import { createSupabaseServerClient, requireHostProfile } from "../../../../../../lib/supabase-server";
import { listAlbumShares, shareAlbumWithEmails, revokeAlbumShare } from "../../../../../../lib/gallery-store";

export async function GET(request, { params }) {
  const supabase = createSupabaseServerClient();
  let profile;
  try {
    ({ profile } = await requireHostProfile(supabase));
  } catch (res) {
    return res;
  }

  const { albumId } = params;
  try {
    const shares = await listAlbumShares(albumId, profile.id);
    return Response.json(shares);
  } catch (err) {
    console.error("List shares error:", err.message);
    return Response.json({ error: "Failed to list shares" }, { status: 500 });
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
  const { emails } = await request.json();

  if (!Array.isArray(emails) || !emails.length) {
    return Response.json({ error: "emails array is required" }, { status: 400 });
  }

  try {
    await shareAlbumWithEmails(albumId, emails, profile.id);
    return Response.json({ ok: true, added: emails.length });
  } catch (err) {
    console.error("Share album error:", err.message);
    return Response.json({ error: "Failed to share album" }, { status: 500 });
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
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return Response.json({ error: "email is required" }, { status: 400 });
  }

  try {
    await revokeAlbumShare(albumId, email, profile.id);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Revoke share error:", err.message);
    return Response.json({ error: "Failed to revoke share" }, { status: 500 });
  }
}
