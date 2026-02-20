import { createSupabaseServerClient, createSupabaseAdminClient } from "../../../../lib/supabase-server";
import { NextResponse } from "next/server";

function generateSlug(displayName) {
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${base}-${rand}`;
}

/**
 * Supabase calls this route after the user clicks the email confirmation link.
 * We exchange the code for a session and bootstrap the host_profiles row.
 */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/auth/login?error=invalid_code`);
  }

  const user = data.session.user;

  // Create host_profiles row if this is a new user
  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from("host_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    const displayName = user.user_metadata?.display_name || user.email.split("@")[0];
    let slug = generateSlug(displayName);

    // Retry slug generation on collision (very unlikely but safe)
    for (let i = 0; i < 5; i++) {
      const { data: collision } = await admin
        .from("host_profiles")
        .select("id")
        .eq("slug", slug)
        .single();
      if (!collision) break;
      slug = generateSlug(displayName);
    }

    await admin.from("host_profiles").insert({
      user_id: user.id,
      slug,
      display_name: displayName,
      event_name: "You're Invited",
    });
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
