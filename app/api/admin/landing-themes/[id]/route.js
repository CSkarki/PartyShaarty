import { createSupabaseServerClient } from "../../../../../lib/supabase-server";
import { setActiveTheme, upsertThemeConfig } from "../../../../../lib/landing-store";

function isSuperAdmin(user) {
  return user?.email && user.email === process.env.SUPER_ADMIN_EMAIL;
}

export async function PATCH(request, { params }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!isSuperAdmin(user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    if (body.is_active === true) {
      await setActiveTheme(id);
      return Response.json({ ok: true, action: "activated" });
    }

    if (body.config && typeof body.config === "object") {
      await upsertThemeConfig(id, body.config);
      return Response.json({ ok: true, action: "config_saved" });
    }

    return Response.json({ error: "Nothing to update" }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
