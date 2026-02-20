import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client that reads/writes the user's session via cookies.
 * Use in Server Components, Route Handlers, and Server Actions.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component — the middleware will handle refresh
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Same as above
          }
        },
      },
    }
  );
}

/**
 * Service-role admin client — bypasses RLS.
 * NEVER expose this to the browser. Use only in API routes / server code.
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Resolve the authenticated user and their host_profile in one call.
 * Returns { user, profile } or throws a Response with status 401/404.
 */
export async function requireHostProfile(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("host_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    throw Response.json({ error: "Host profile not found" }, { status: 404 });
  }

  return { user, profile };
}
