import { createSupabaseServerClient } from "../../lib/supabase-server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard — Utsavé",
};

export default async function DashboardLayout({ children }) {
  let user = null;
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    user = u;
  } catch {
    // Invalid/expired session (e.g. refresh token not found)
  }
  if (!user) redirect("/auth/login?next=/dashboard");
  return <>{children}</>;
}
