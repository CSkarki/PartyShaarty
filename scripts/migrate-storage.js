/**
 * scripts/migrate-storage.js
 *
 * One-time script to migrate existing Supabase Storage files from the
 * OLD path structure:
 *   event-photos/{albumSlug}/{filename}
 *
 * to the NEW multi-tenant path structure:
 *   event-photos/{hostProfileId}/{albumSlug}/{filename}
 *
 * Prerequisites:
 *   1. Run supabase-saas-migration.sql in Supabase SQL Editor
 *   2. Backfill host_id in gallery_albums:
 *        UPDATE gallery_albums SET host_id = '<your-host-profile-id>' WHERE host_id IS NULL;
 *   3. Set environment variables (or create a .env.local and load it):
 *        SUPABASE_URL=...
 *        SUPABASE_SERVICE_ROLE_KEY=...
 *
 * Usage:
 *   node scripts/migrate-storage.js [--dry-run]
 *
 * Options:
 *   --dry-run   Print what would be moved without actually moving anything.
 *   --host-id   Scope migration to a single host profile ID.
 *               node scripts/migrate-storage.js --host-id=<uuid>
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// ── Load .env.local if present ──────────────────────────────────────────────
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
  console.log("Loaded .env.local");
}

// ── Parse CLI args ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const hostIdArg = args.find((a) => a.startsWith("--host-id="))?.split("=")[1];

if (DRY_RUN) console.log("*** DRY RUN — no files will be moved ***\n");

// ── Supabase admin client ────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const BUCKET = "event-photos";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function listAllFiles(prefix = "") {
  const files = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`list(${prefix}): ${error.message}`);
    if (!data || data.length === 0) break;

    for (const item of data) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.metadata) {
        // It's a file (has metadata)
        files.push(fullPath);
      } else {
        // It's a folder — recurse
        const nested = await listAllFiles(fullPath);
        files.push(...nested);
      }
    }

    if (data.length < limit) break;
    offset += limit;
  }
  return files;
}

async function copyFile(sourcePath, destPath) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .copy(sourcePath, destPath);
  if (error) throw new Error(`copy(${sourcePath} → ${destPath}): ${error.message}`);
}

async function deleteFile(path) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path]);
  if (error) throw new Error(`remove(${path}): ${error.message}`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Fetching host profiles from database...");

  const query = supabase.from("host_profiles").select("id, slug, display_name");
  if (hostIdArg) query.eq("id", hostIdArg);

  const { data: hosts, error: hostsErr } = await query;
  if (hostsErr) {
    console.error("Failed to fetch host_profiles:", hostsErr.message);
    process.exit(1);
  }
  if (!hosts || hosts.length === 0) {
    console.log("No host profiles found. Nothing to migrate.");
    return;
  }

  console.log(`Found ${hosts.length} host(s).\n`);

  let totalMoved = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const host of hosts) {
    console.log(`\n── Host: ${host.display_name} (id=${host.id}, slug=${host.slug})`);

    // Fetch this host's albums
    const { data: albums, error: albumsErr } = await supabase
      .from("gallery_albums")
      .select("id, slug")
      .eq("host_id", host.id);

    if (albumsErr) {
      console.error(`  ERROR fetching albums: ${albumsErr.message}`);
      totalErrors++;
      continue;
    }

    if (!albums || albums.length === 0) {
      console.log("  No albums — skipping.");
      continue;
    }

    for (const album of albums) {
      const oldPrefix = album.slug;          // OLD: {albumSlug}/
      const newPrefix = `${host.id}/${album.slug}`;  // NEW: {hostId}/{albumSlug}/

      console.log(`\n  Album: ${album.slug}`);
      console.log(`    OLD prefix: ${oldPrefix}/`);
      console.log(`    NEW prefix: ${newPrefix}/`);

      // List files in old location
      let oldFiles;
      try {
        oldFiles = await listAllFiles(oldPrefix);
      } catch (err) {
        console.error(`    ERROR listing: ${err.message}`);
        totalErrors++;
        continue;
      }

      const photoFiles = oldFiles.filter((f) => {
        // Exclude files that are already under a UUID-like prefix (already migrated)
        const parts = f.split("/");
        return parts.length === 2; // {albumSlug}/{filename}
      });

      if (photoFiles.length === 0) {
        console.log("    No files to migrate in old location.");
        continue;
      }

      console.log(`    Files to migrate: ${photoFiles.length}`);

      for (const oldPath of photoFiles) {
        const filename = oldPath.split("/").pop();
        const newPath = `${newPrefix}/${filename}`;

        // Check if file already exists at new location
        const { data: existCheck } = await supabase.storage
          .from(BUCKET)
          .list(newPrefix, { search: filename });

        if (existCheck && existCheck.some((f) => f.name === filename)) {
          console.log(`    SKIP (already exists): ${newPath}`);
          totalSkipped++;
          continue;
        }

        console.log(`    MOVE: ${oldPath} → ${newPath}`);

        if (!DRY_RUN) {
          try {
            await copyFile(oldPath, newPath);
            await deleteFile(oldPath);
            totalMoved++;
          } catch (err) {
            console.error(`    ERROR: ${err.message}`);
            totalErrors++;
          }
        } else {
          totalMoved++;
        }
      }
    }
  }

  // Also handle covers directory: covers/{hostProfileId}/cover.ext
  // These are new-format already, nothing to migrate.

  console.log("\n──────────────────────────────────────");
  console.log(`Migration complete${DRY_RUN ? " (DRY RUN)" : ""}:`);
  console.log(`  Moved:   ${totalMoved} files`);
  console.log(`  Skipped: ${totalSkipped} files`);
  console.log(`  Errors:  ${totalErrors} files`);

  if (DRY_RUN) {
    console.log("\nRe-run without --dry-run to perform the actual migration.");
  } else if (totalMoved > 0) {
    console.log("\nNext steps:");
    console.log("  1. Verify your gallery works correctly in the app.");
    console.log("  2. Backfill host_id columns if not already done:");
    console.log("       UPDATE gallery_albums SET host_id = '<id>' WHERE host_id IS NULL;");
    console.log("       UPDATE invite_rsvps SET host_id = '<id>' WHERE host_id IS NULL;");
    console.log("  3. Then set NOT NULL constraints:");
    console.log("       ALTER TABLE gallery_albums ALTER COLUMN host_id SET NOT NULL;");
    console.log("       ALTER TABLE invite_rsvps ALTER COLUMN host_id SET NOT NULL;");
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
