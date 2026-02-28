import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase-server";
import { listThemes, getThemeById } from "../../../lib/landing-store";
import { DEFAULT_THEMES } from "../../components/landing/themes/defaults";
import LandingConfigForm from "./LandingConfigForm";
import styles from "./page.module.css";

export const metadata = { title: "Landing Config — Utsavé Admin" };

export default async function LandingConfigPage() {
  // Super admin gate
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/admin/landing-config");
  }

  if (user.email !== process.env.SUPER_ADMIN_EMAIL?.trim()) {
    redirect("/dashboard");
  }

  // Fetch all theme rows (lightweight — no config merge needed for the list)
  const themes = await listThemes().catch(() => []);

  // Fetch full merged config for the active theme (or wedding default)
  const activeRow = themes.find((t) => t.is_active);
  const activeTheme = activeRow
    ? await getThemeById(activeRow.id).catch(() => null)
    : DEFAULT_THEMES.wedding;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a href="/" style={{ textDecoration: "none" }}>
            <span className={styles.logo}>Utsavé</span>
          </a>
          <span className={styles.headerLabel}>Super Admin — Landing Config</span>
          <a
            href="/admin/events"
            style={{ marginLeft: "auto", fontSize: "0.825rem", color: "#5c5c5c", textDecoration: "none" }}
          >
            Event Requests →
          </a>
        </div>
      </header>

      <main className={styles.main}>
        <LandingConfigForm themes={themes} activeTheme={activeTheme} />
      </main>
    </div>
  );
}
