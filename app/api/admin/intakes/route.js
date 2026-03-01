import { createSupabaseServerClient } from "../../../../lib/supabase-server";
import { listIntakesForAdmin } from "../../../../lib/admin-intakes";

async function requireSuperAdmin(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL?.trim()) return null;
  return user;
}

/**
 * GET /api/admin/intakes — list all celebration intakes for super admin.
 * Returns event name, slug, host name, contact email/phone, and preferences.
 */
export async function GET() {
  const supabase = createSupabaseServerClient();
  const user = await requireSuperAdmin(supabase);
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });

  try {
    const intakes = await listIntakesForAdmin();
    return Response.json(intakes);
  } catch (err) {
    console.error("Admin intakes list error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
