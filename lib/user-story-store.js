import { createSupabaseAdminClient } from "./supabase-server";

const BUCKET = "User Story";

export async function listUserStoryPhotos() {
  const admin = createSupabaseAdminClient();

  // Recursively collect file paths — handles both flat uploads and per-event subfolders
  async function listPaths(prefix = "") {
    const { data, error } = await admin.storage
      .from(BUCKET)
      .list(prefix, { limit: 100, sortBy: { column: "name", order: "asc" } });
    if (error || !data) return [];

    const paths = [];
    for (const item of data) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.metadata) {
        // It's a file
        paths.push(fullPath);
      } else {
        // It's a folder — recurse one level
        const sub = await listPaths(fullPath);
        paths.push(...sub);
      }
    }
    return paths;
  }

  const paths = await listPaths();
  if (!paths.length) return [];

  // 24-hour signed URLs (landing page is public but bucket is private)
  const { data: signed } = await admin.storage
    .from(BUCKET)
    .createSignedUrls(paths, 86400);

  return (signed || []).map((s) => s.signedUrl).filter(Boolean);
}
