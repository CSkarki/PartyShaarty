import { createSupabaseServerClient } from "../../lib/supabase-server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard — PartyShaarty",
};

export default async function DashboardLayout({ children }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  return <>{children}</>;
}
