import { createSupabaseServerClient } from "../../../../lib/supabase-server";
import { listThemes } from "../../../../lib/landing-store";

function isSuperAdmin(user) {
  return user?.email && user.email === process.env.SUPER_ADMIN_EMAIL;
}

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!isSuperAdmin(user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const themes = await listThemes();
    return Response.json(themes);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
