import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Client-side Supabase client. Use in Client Components ('use client').
 * Returns null if Supabase env vars are not set (e.g. missing .env.local).
 */
export function createSupabaseBrowserClient() {
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}
