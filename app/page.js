import Link from "next/link";
import styles from "./page.module.css";

export const metadata = {
  title: "PartyShaarty — Your Personal Event RSVP & Gallery",
  description:
    "Create your own event invite page, collect RSVPs, share photos, and send thank-you emails — all in one place.",
};

const FEATURES = [
  {
    icon: "✉️",
    title: "Beautiful Invite Pages",
    desc: "Share a personal link with your guests. They RSVP in seconds — no app download needed.",
  },
  {
    icon: "📸",
    title: "Private Photo Gallery",
    desc: "Upload your event photos and share albums with guests via one-time email verification.",
  },
  {
    icon: "🔔",
    title: "Reminders & Thank-Yous",
    desc: "Send event reminders and heartfelt thank-you emails to your guest list with one click.",
  },
  {
    icon: "📋",
    title: "RSVP Dashboard",
    desc: "See who's coming at a glance. Export your guest list as CSV or JSON anytime.",
  },
];

const STEPS = [
  { n: "1", label: "Sign up", desc: "Create your free account with just an email." },
  { n: "2", label: "Set up your event", desc: "Add event details, a date, location, and a cover photo." },
  { n: "3", label: "Share your link", desc: "Send guests your personal invite URL — they RSVP instantly." },
  { n: "4", label: "Manage everything", desc: "Track RSVPs, share galleries, send reminders and thank-yous from your dashboard." },
];

export default function LandingPage() {
  return (
    <div className={styles.landing}>
      {/* Nav */}
      <nav className={styles.nav}>
        <span className={styles.navLogo}>PartyShaarty</span>
        <div className={styles.navLinks}>
          <Link href="/auth/login" className={styles.navLogin}>
            Log in
          </Link>
          <Link href="/auth/register" className={styles.navCta}>
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.heroBadge}>Event invites, reimagined</p>
          <h1 className={styles.heroTitle}>
            Your party.<br />Your page.<br />Your memories.
          </h1>
          <p className={styles.heroSub}>
            PartyShaarty gives you a personal invite link, an RSVP tracker, a
            private photo gallery, and guest communication tools — all in one place.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/auth/register" className={styles.btnPrimary}>
              Create your event
            </Link>
            <Link href="/auth/login" className={styles.btnSecondary}>
              Sign in
            </Link>
          </div>
        </div>

        <div className={styles.heroDecor} aria-hidden="true">
          <div className={styles.heroDecorCard}>
            <div className={styles.heroDecorLine} />
            <div className={styles.heroDecorLine} style={{ width: "60%" }} />
            <div className={styles.heroDecorLine} style={{ width: "40%" }} />
          </div>
          <div className={styles.heroDecorBubble}>✉️</div>
          <div className={styles.heroDecorBubble2}>📸</div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features} id="features">
        <h2 className={styles.sectionTitle}>Everything you need to host</h2>
        <p className={styles.sectionSub}>
          From the first invite to the last thank-you — PartyShaarty has you covered.
        </p>
        <div className={styles.featureGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className={styles.howItWorks}>
        <h2 className={styles.sectionTitle}>How it works</h2>
        <div className={styles.steps}>
          {STEPS.map((s) => (
            <div key={s.n} className={styles.step}>
              <div className={styles.stepNum}>{s.n}</div>
              <div>
                <div className={styles.stepLabel}>{s.label}</div>
                <div className={styles.stepDesc}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className={styles.ctaBanner}>
        <h2 className={styles.ctaTitle}>Ready to throw the perfect party?</h2>
        <p className={styles.ctaSub}>Free to start. No credit card required.</p>
        <Link href="/auth/register" className={styles.btnPrimary}>
          Create your event for free
        </Link>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <span className={styles.footerLogo}>PartyShaarty</span>
        <span className={styles.footerMuted}>© {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
