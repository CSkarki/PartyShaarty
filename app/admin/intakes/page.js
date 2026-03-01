import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase-server";
import { listIntakesForAdmin } from "../../../lib/admin-intakes";
import IntakesPanel from "./IntakesPanel";
import styles from "../landing-config/page.module.css";

export const metadata = { title: "Celebration Intakes — Utsavé Admin" };

export default async function AdminIntakesPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/admin/intakes");
  if (user.email !== process.env.SUPER_ADMIN_EMAIL?.trim()) redirect("/dashboard");

  const intakes = await listIntakesForAdmin().catch(() => []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a href="/" style={{ textDecoration: "none" }}>
            <span className={styles.logo}>Utsavé</span>
          </a>
          <span className={styles.headerLabel}>Super Admin — Intakes</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: "1rem", fontSize: "0.825rem" }}>
            <a href="/admin" style={{ color: "#5c5c5c", textDecoration: "none" }}>Dashboard</a>
            <a href="/admin/events" style={{ color: "#5c5c5c", textDecoration: "none" }}>Events</a>
            <a href="/admin/landing-config" style={{ color: "#5c5c5c", textDecoration: "none" }}>Landing</a>
          </div>
        </div>
      </header>

      <main className={styles.main} style={{ maxWidth: 900 }}>
        <IntakesPanel intakes={intakes} />
      </main>
    </div>
  );
}
