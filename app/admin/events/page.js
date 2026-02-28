import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase-server";
import { listDeletionRequests } from "../../../lib/event-store";
import DeletionRequestsPanel from "./DeletionRequestsPanel";
import styles from "../landing-config/page.module.css";

export const metadata = { title: "Event Deletion Requests — Utsavé Admin" };

export default async function AdminEventsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/admin/events");
  if (user.email !== process.env.SUPER_ADMIN_EMAIL?.trim()) redirect("/dashboard");

  const requests = await listDeletionRequests().catch(() => []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a href="/" style={{ textDecoration: "none" }}>
            <span className={styles.logo}>Utsavé</span>
          </a>
          <span className={styles.headerLabel}>Super Admin — Events</span>
          <a
            href="/admin/landing-config"
            style={{ marginLeft: "auto", fontSize: "0.825rem", color: "#5c5c5c", textDecoration: "none" }}
          >
            ← Landing Config
          </a>
        </div>
      </header>

      <main className={styles.main} style={{ maxWidth: 780 }}>
        <DeletionRequestsPanel requests={requests} />
      </main>
    </div>
  );
}
