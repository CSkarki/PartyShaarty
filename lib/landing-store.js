import { createSupabaseAdminClient } from "./supabase-server";
import { DEFAULT_THEMES } from "../app/components/landing/themes/defaults";

function db() {
  return createSupabaseAdminClient();
}

/**
 * Merge DB row config on top of the in-code default for that theme name.
 * DB values take precedence — allows partial overrides.
 */
function mergeWithDefault(row) {
  if (!row) return null;
  const base = DEFAULT_THEMES[row.name] || DEFAULT_THEMES.wedding;
  const dbConfig = row.config || {};
  return {
    ...base,
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    isActive: row.is_active,
    // Deep-merge top-level config sections
    palette:    { ...base.palette,    ...(dbConfig.palette    || {}) },
    hero:       { ...base.hero,       ...(dbConfig.hero       || {}) },
    ctaBanner:  { ...base.ctaBanner,  ...(dbConfig.ctaBanner  || {}) },
    eventTypes: dbConfig.eventTypes   || base.eventTypes,
  };
}

/** Get the currently active theme, merged with its default. */
export async function getActiveTheme() {
  const { data, error } = await db()
    .from("landing_themes")
    .select("*")
    .eq("is_active", true)
    .single();
  if (error || !data) return null;
  return mergeWithDefault(data);
}

/** Get a theme by its slug name (e.g. "festival"), merged with its default. */
export async function getThemeByName(name) {
  if (!name) return null;
  const { data, error } = await db()
    .from("landing_themes")
    .select("*")
    .eq("name", name)
    .single();
  if (error || !data) {
    // Name not in DB — return the in-code default if it exists
    return DEFAULT_THEMES[name] ? { ...DEFAULT_THEMES[name], id: null, isActive: false } : null;
  }
  return mergeWithDefault(data);
}

/** List all themes for the admin panel (no config merging needed here). */
export async function listThemes() {
  const { data, error } = await db()
    .from("landing_themes")
    .select("id, name, display_name, is_active, updated_at")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

/** Get full theme row with config for the admin edit form. */
export async function getThemeById(id) {
  const { data, error } = await db()
    .from("landing_themes")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return mergeWithDefault(data);
}

/**
 * Save (merge) config changes for a theme.
 * Only the provided keys are updated; others are preserved.
 */
export async function upsertThemeConfig(id, configPatch) {
  // Fetch existing config first so we can merge
  const { data: existing } = await db()
    .from("landing_themes")
    .select("config")
    .eq("id", id)
    .single();

  const merged = { ...(existing?.config || {}), ...configPatch };

  const { error } = await db()
    .from("landing_themes")
    .update({ config: merged, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Set a theme as active. The DB partial unique index ensures
 * no two rows can have is_active = true simultaneously —
 * so we deactivate all first, then activate the target.
 */
export async function setActiveTheme(id) {
  const client = db();
  // Step 1: deactivate all
  const { error: e1 } = await client
    .from("landing_themes")
    .update({ is_active: false })
    .neq("id", "00000000-0000-0000-0000-000000000000"); // matches all rows
  if (e1) throw new Error(e1.message);

  // Step 2: activate the target
  const { error: e2 } = await client
    .from("landing_themes")
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (e2) throw new Error(e2.message);
}
