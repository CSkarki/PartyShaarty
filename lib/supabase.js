import { createClient } from "@supabase/supabase-js";

const BUCKET = "event-photos";
const SIGNED_URL_EXPIRY = 3600; // 1 hour

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }
  return createClient(url, key);
}

/** Get signed URLs for an array of full storage paths. */
export async function getSignedUrlsForPaths(paths) {
  if (!paths.length) return [];
  const supabase = getClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, SIGNED_URL_EXPIRY);
  if (error) throw new Error(error.message);
  return data || [];
}

// ---- Host-scoped helpers (paths: {hostProfileId}/{albumSlug}/{filename}) ----

/**
 * Upload a photo to a specific host + album folder.
 * Path format: {hostProfileId}/{albumSlug}/{filename}
 */
export async function uploadPhotoToAlbum(buffer, hostProfileId, albumSlug, filename, contentType) {
  const path = `${hostProfileId}/${albumSlug}/${filename}`;
  const supabase = getClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: false });
  if (error) throw new Error(error.message);
  return data;
}

/** List all photos in a specific host + album folder. */
export async function listPhotosInAlbum(hostProfileId, albumSlug) {
  const folder = `${hostProfileId}/${albumSlug}`;
  const supabase = getClient();
  const { data, error } = await supabase.storage.from(BUCKET).list(folder, {
    limit: 500,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw new Error(error.message);
  return (data || [])
    .filter((f) => f.name && f.id)
    .map((f) => ({ ...f, path: `${folder}/${f.name}` }));
}

/** Delete a photo by its full path. */
export async function deletePhotoByPath(path) {
  const supabase = getClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

/** Copy a photo between albums within the same host folder. */
export async function copyPhotoBetweenAlbums(sourcePath, hostProfileId, targetSlug, targetFilename) {
  const supabase = getClient();
  const { data, error } = await supabase.storage.from(BUCKET).download(sourcePath);
  if (error) throw new Error(error.message);
  const buffer = Buffer.from(await data.arrayBuffer());
  const contentType = data.type || "image/jpeg";
  return uploadPhotoToAlbum(buffer, hostProfileId, targetSlug, targetFilename, contentType);
}

/** Move a photo: copy then delete source. */
export async function movePhotoBetweenAlbums(sourcePath, hostProfileId, targetSlug, targetFilename) {
  await copyPhotoBetweenAlbums(sourcePath, hostProfileId, targetSlug, targetFilename);
  await deletePhotoByPath(sourcePath);
}

// ---- Cover image helpers ----

/** Upload a host's event cover image. Path: covers/{hostProfileId}/cover.{ext} */
export async function uploadCoverImage(buffer, hostProfileId, ext, contentType) {
  const path = `covers/${hostProfileId}/cover.${ext}`;
  const supabase = getClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true });
  if (error) throw new Error(error.message);
  return path;
}

/** Get a signed URL for a cover image storage path. */
export async function getCoverImageUrl(imagePath) {
  if (!imagePath) return null;
  const supabase = getClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(imagePath, SIGNED_URL_EXPIRY);
  if (error) return null;
  return data?.signedUrl || null;
}

// ---- Legacy flat-file helpers (for migration script only) ----

/** List all root-level photos (pre-SaaS, no folder prefix). */
export async function listLegacyPhotos() {
  const supabase = getClient();
  const { data, error } = await supabase.storage.from(BUCKET).list("", {
    limit: 500,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw new Error(error.message);
  return (data || []).filter((f) => f.name && f.id && !f.name.includes("/"));
}
