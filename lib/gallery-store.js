import { createSupabaseAdminClient } from "./supabase-server";

function makeSlug(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base}-${rand}`;
}

function db() {
  return createSupabaseAdminClient();
}

// ---- Albums ----

export async function createAlbum(name, hostId) {
  const slug = makeSlug(name);
  const { data, error } = await db()
    .from("gallery_albums")
    .insert({ name: name.trim(), slug, host_id: hostId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listAlbums(hostId) {
  const { data, error } = await db()
    .from("gallery_albums")
    .select("*, gallery_album_shares(email)")
    .eq("host_id", hostId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map((album) => ({
    ...album,
    share_count: album.gallery_album_shares?.length ?? 0,
    gallery_album_shares: undefined,
  }));
}

export async function listAlbumsForEmail(email, hostId) {
  // Fetch all shares for this email, then filter albums by host
  const { data: shares } = await db()
    .from("gallery_album_shares")
    .select("album_id")
    .ilike("email", email.trim());

  if (!shares?.length) return [];

  const albumIds = shares.map((s) => s.album_id);
  const { data: albums, error } = await db()
    .from("gallery_albums")
    .select("*")
    .eq("host_id", hostId)
    .in("id", albumIds)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return albums || [];
}

export async function getAlbum(albumId, hostId) {
  let query = db()
    .from("gallery_albums")
    .select("*")
    .eq("id", albumId);
  if (hostId) {
    query = query.eq("host_id", hostId);
  }
  const { data } = await query.single();
  return data || null;
}

export async function renameAlbum(albumId, newName, hostId) {
  const { error } = await db()
    .from("gallery_albums")
    .update({ name: newName.trim() })
    .eq("id", albumId)
    .eq("host_id", hostId);
  if (error) throw new Error(error.message);
}

export async function deleteAlbumRecord(albumId, hostId) {
  const { error } = await db()
    .from("gallery_albums")
    .delete()
    .eq("id", albumId)
    .eq("host_id", hostId);
  if (error) throw new Error(error.message);
}

// ---- Shares ----

export async function shareAlbumWithEmails(albumId, emails, hostId) {
  if (!emails.length) return;
  const album = await getAlbum(albumId, hostId);
  if (!album) throw new Error("Album not found");

  const rows = emails.map((e) => ({
    album_id: albumId,
    email: e.toLowerCase().trim(),
  }));

  const { error } = await db()
    .from("gallery_album_shares")
    .upsert(rows, { onConflict: "album_id,email", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
}

export async function revokeAlbumShare(albumId, email, hostId) {
  const album = await getAlbum(albumId, hostId);
  if (!album) throw new Error("Album not found");

  const { error } = await db()
    .from("gallery_album_shares")
    .delete()
    .eq("album_id", albumId)
    .ilike("email", email.trim());
  if (error) throw new Error(error.message);
}

export async function listAlbumShares(albumId, hostId) {
  const album = await getAlbum(albumId, hostId);
  if (!album) throw new Error("Album not found");

  const { data, error } = await db()
    .from("gallery_album_shares")
    .select("email, granted_at")
    .eq("album_id", albumId)
    .order("granted_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}
