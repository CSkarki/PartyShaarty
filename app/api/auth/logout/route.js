import { createSupabaseServerClient } from "../../../../lib/supabase-server";

export async function POST() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  return Response.json({ ok: true });
}
