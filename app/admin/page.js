import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "../../lib/supabase-server";
import styles from "./dashboard.module.css";

export const metadata = { title: "Super Admin — Utsavé" };

const LINKS = [
  {
    href: "/admin/intakes",
    title: "Celebration intakes",
    description: "View host preferences, contact email & phone. Reach out to help them plan.",
    icon: "✦",
  },
  {
    href: "/admin/events",
    title: "Event deletion requests",
    description: "Review and approve or dismiss event deletion requests.",
    icon: "🗑",
  },
  {
    href: "/admin/landing-config",
    title: "Landing config",
    description: "Manage landing page themes and active theme.",
    icon: "◇",
  },
  {
    href: "/dashboard",
    title: "Host dashboard",
    description: "Open your host dashboard (events, invites, gallery).",
    icon: "◈",
  },
  {
    href: "/",
    title: "Public site",
    description: "View the public landing and marketing pages.",
    icon: "○",
  },
];

export default async function AdminDashboardPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/admin");
  if (user.email !== process.env.SUPER_ADMIN_EMAIL?.trim()) redirect("/dashboard");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logoLink}>
            <span className={styles.logo}>Utsavé</span>
          </Link>
          <span className={styles.badge}>Super Admin</span>
        </div>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>Admin dashboard</h1>
        <p className={styles.subtitle}>
          Manage intakes, event requests, and landing config. Use the links below to jump to each area.
        </p>

        <nav className={styles.grid} aria-label="Admin sections">
          {LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.card}
            >
              <span className={styles.cardIcon}>{item.icon}</span>
              <h2 className={styles.cardTitle}>{item.title}</h2>
              <p className={styles.cardDesc}>{item.description}</p>
              <span className={styles.cardCta}>
                {item.href.startsWith("/admin") ? "Open →" : "Go →"}
              </span>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
