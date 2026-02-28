import Image from "next/image";
import Link from "next/link";
import styles from "./LandingTemplate.module.css";
import { ALL_EVENT_TYPES } from "./themes/defaults";

/* ─── Universal data (same across all themes) ──────────────────────────────── */

const GALLERY_PHOTOS = [
  { src: "/assets/celebrations/photos/sangeet/pexels-30215310.jpg", alt: "Couple dancing at sangeet night", label: "Sangeet", tall: true },
  { src: "/assets/celebrations/photos/diwali/pexels-7686304.jpg",   alt: "Family celebrating Diwali with sparklers", label: "Diwali" },
  { src: "/assets/celebrations/photos/mehndi/pexels-27151466.jpg",  alt: "Intricate henna on bride's hands", label: "Mehndi" },
  { src: "/assets/celebrations/photos/haldi/pexels-30672289.jpg",   alt: "Joyful Indian bride at Haldi ceremony", label: "Haldi" },
  { src: "/assets/celebrations/photos/puja/pexels-7685983.jpg",     alt: "Mother and daughter at Puja ceremony", label: "Puja" },
];

const LIFECYCLE = [
  {
    phase: "Before", tagline: "Set the stage", icon: "📬",
    items: ["Beautiful invite pages", "RSVP collection & tracking", "Bulk guest import (CSV)", "WhatsApp & email reminders"],
  },
  {
    phase: "On the Day", tagline: "Capture every moment", icon: "✨",
    items: ["Private photo gallery", "Share albums with guests", "Guest check-in  ✦ coming soon", "Live venue slideshow  ✦ coming soon"],
    highlight: true,
  },
  {
    phase: "After", tagline: "Keep the memories alive", icon: "🎁",
    items: ["Heartfelt thank-you messages", "WhatsApp thank-you blasts", "Export full guest list", "Memory page  ✦ coming soon"],
  },
];

const FEATURES = [
  { icon: "💍", title: "Built for Indian celebrations", desc: "Wedding Suite, Diwali, Namkaran, Godh Bharai, Puja — every event type your family celebrates, with templates to match." },
  { icon: "📲", title: "WhatsApp-native", desc: "Send invites, reminders, and thank-yous via WhatsApp — the way your family actually communicates." },
  { icon: "📸", title: "Capture every memory — beautifully organized in one private space your family will treasure.", desc: "Upload event photos and share private albums with guests via one-time email verification." },
  { icon: "📋", title: "Full guest management", desc: "Track RSVPs across hundreds of guests. Import via CSV, export to Excel, filter by function." },
];

const STEPS = [
  { n: "1", label: "Choose your celebration", desc: "Pick your event type — Wedding Suite, Birthday, Diwali, or any family occasion." },
  { n: "2", label: "Set up in minutes", desc: "Add details, date, location, a cover photo, and your personal message to guests." },
  { n: "3", label: "Share via WhatsApp", desc: "Send your invite link through WhatsApp or email — guests RSVP instantly, no app needed." },
  { n: "4", label: "Manage everything", desc: "Track RSVPs, share photo albums, send reminders and thank-yous — all from one dashboard." },
];

const PLANS = [
  {
    name: "Free", price: "$0", period: "forever",
    desc: "Perfect for small gatherings",
    features: ["1 active celebration", "Up to 50 RSVPs", "1 photo album", "Email reminders"],
    cta: "Get started free", href: "/auth/register",
  },
  {
    name: "Celebration Pack", price: "$29", period: "per celebration",
    desc: "For any Indian celebration", highlight: true,
    features: ["Unlimited RSVPs", "Unlimited photo uploads", "WhatsApp messaging", "All event types", "Guest gallery access", "CSV import & Excel export"],
    cta: "Start celebrating", href: "/auth/register",
  },
  {
    name: "Wedding Suite", price: "$79", period: "per wedding",
    desc: "The complete wedding experience",
    features: ["Everything in Celebration Pack", "5 linked functions", "Per-function RSVPs", "Seating chart  ✦ coming soon", "Digital invite designer  ✦ coming soon", "2-year memory archive  ✦ coming soon"],
    cta: "Plan your wedding", href: "/auth/register",
  },
];

/* ─── Helper: resolve hero headline with line breaks ────────────────────────── */
function HeadlineWithBreaks({ text }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

/* ─── LandingTemplate ────────────────────────────────────────────────────────
 * Receives a resolved `theme` object (see lib/landing-store.js + defaults.js).
 * Applies theme palette via CSS variable overrides on the wrapper element.
 * All section content comes from theme.* — no hardcoded text.
 * ─────────────────────────────────────────────────────────────────────────── */
export default function LandingTemplate({ theme }) {
  const { palette, hero, eventTypeKeys, ctaBanner } = theme;

  // Resolve event type objects from keys
  const eventTypes = (eventTypeKeys || [])
    .map((key) => ALL_EVENT_TYPES[key])
    .filter(Boolean);

  // CSS variable overrides — cascade to all child elements
  const paletteVars = {
    "--accent":      palette.accent,
    "--accent-hover":palette.accentHover,
    "--accent-dim":  palette.accentDim,
    "--bg":          palette.bg,
    "--accent-deep": palette.accentDeep,
  };

  return (
    <div className={styles.landing} style={paletteVars}>

      {/* ── Nav ── */}
      <nav className={styles.nav}>
        <span className={styles.navLogo}>Utsavé</span>
        <div className={styles.navLinks}>
          <Link href="/auth/login" className={styles.navLogin}>Log in</Link>
          <Link href="/auth/register" className={styles.navCta}>Get started free</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.heroBadge}>{hero.badge}</p>
          <h1 className={styles.heroTitle}>
            <HeadlineWithBreaks text={hero.headline} />
          </h1>
          <p className={styles.heroSub}>{hero.subheadline}</p>
          <div className={styles.heroCtas}>
            <Link href={hero.ctaHref || "/auth/register"} className={styles.btnPrimary}>
              {hero.ctaText}
            </Link>
            <Link href="#how-it-works" className={styles.btnSecondary}>
              See how it works
            </Link>
          </div>
        </div>

        {/* Photo collage — 3 images from theme */}
        <div className={styles.heroPhotoStack} aria-hidden="true">
          <div className={styles.heroPhotoMain}>
            <Image
              src={hero.photos[0].src}
              alt={hero.photos[0].alt || ""}
              fill
              className={styles.heroPhotoCover}
              sizes="(max-width: 768px) 0px, 288px"
              priority
            />
          </div>
          {hero.photos[1] && (
            <div className={styles.heroPhotoA}>
              <Image
                src={hero.photos[1].src}
                alt={hero.photos[1].alt || ""}
                fill
                className={styles.heroPhotoCover}
                sizes="136px"
              />
            </div>
          )}
          {hero.photos[2] && (
            <div className={styles.heroPhotoB}>
              <Image
                src={hero.photos[2].src}
                alt={hero.photos[2].alt || ""}
                fill
                className={styles.heroPhotoCover}
                sizes="116px"
              />
            </div>
          )}
        </div>
      </section>

      {/* ── Event Type Photo Cards ── */}
      <section className={styles.celebrations}>
        <p className={styles.celebrationsLabel}>Every occasion your family celebrates</p>
        <div className={styles.celebGrid}>
          {eventTypes.map((e) => (
            <div key={e.name} className={styles.celebCard}>
              <Image
                src={e.photo}
                alt={e.photoAlt}
                fill
                className={styles.celebPhoto}
                sizes="(max-width: 768px) 42vw, 160px"
              />
              <div className={styles.celebOverlay} />
              <div className={styles.celebText}>
                <span className={styles.celebIcon}>{e.icon}</span>
                <span className={styles.celebName}>{e.name}</span>
                <span className={styles.celebDetail}>{e.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Lifecycle: End-to-End ── */}
      <section className={styles.lifecycle} id="how-it-works">
        <h2 className={styles.sectionTitle}>From first invite to lasting memory</h2>
        <p className={styles.sectionSub}>
          Utsavé covers the full celebration journey — before, during, and after.
        </p>
        <div className={styles.lifecycleGrid}>
          {LIFECYCLE.map((col) => (
            <div key={col.phase} className={`${styles.lifecycleCol}${col.highlight ? ` ${styles.lifecycleColHighlight}` : ""}`}>
              <div className={styles.lifecycleIcon}>{col.icon}</div>
              <div className={styles.lifecyclePhase}>{col.phase}</div>
              <div className={styles.lifecycleTagline}>{col.tagline}</div>
              <ul className={styles.lifecycleList}>
                {col.items.map((item) => (
                  <li key={item} className={item.includes("coming soon") ? styles.lifecycleItemSoon : styles.lifecycleItem}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Gallery Glimpse ── */}
      <section className={styles.galleryGlimpse}>
        <div className={styles.galleryGlimpseInner}>
          <p className={styles.galleryEyebrow}>Celebrations captured</p>
          <h2 className={styles.galleryQuote}>
            Every laugh, every ritual, every memory —<br />
            <em>saved and shared with the people who matter most.</em>
          </h2>
          <div className={styles.galleryMosaic}>
            {GALLERY_PHOTOS.map((p) => (
              <div key={p.src} className={`${styles.mosaicItem}${p.tall ? ` ${styles.mosaicItemTall}` : ""}`}>
                <Image src={p.src} alt={p.alt} fill className={styles.mosaicPhoto} sizes="(max-width: 768px) 50vw, 30vw" />
                <div className={styles.mosaicOverlay} />
                <span className={styles.mosaicLabel}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className={styles.features} id="features">
        <h2 className={styles.sectionTitle}>Everything you need to host</h2>
        <p className={styles.sectionSub}>
          One platform your entire family can use — no tech skills needed.
        </p>
        <div className={styles.featureGrid}>
          {FEATURES.map((f) => (
            <div key={f.icon} className={styles.featureCard}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className={styles.howItWorks}>
        <h2 className={styles.sectionTitle}>Up and running in minutes</h2>
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

      {/* ── Pricing ── */}
      <section className={styles.pricing} id="pricing">
        <h2 className={styles.sectionTitle}>Simple, honest pricing</h2>
        <p className={styles.sectionSub}>
          Pay once per celebration — no monthly fees, no surprises.
        </p>
        <div className={styles.pricingGrid}>
          {PLANS.map((plan) => (
            <div key={plan.name} className={`${styles.pricingCard}${plan.highlight ? ` ${styles.pricingCardHighlight}` : ""}`}>
              {plan.highlight && <div className={styles.pricingBadge}>Most popular</div>}
              <div className={styles.pricingName}>{plan.name}</div>
              <div className={styles.pricingPrice}>
                {plan.price}<span className={styles.pricingPeriod}> / {plan.period}</span>
              </div>
              <p className={styles.pricingDesc}>{plan.desc}</p>
              <ul className={styles.pricingFeatures}>
                {plan.features.map((f) => (
                  <li key={f} className={f.includes("coming soon") ? styles.pricingFeatureSoon : styles.pricingFeature}>
                    {f.includes("coming soon") ? f : `✓ ${f}`}
                  </li>
                ))}
              </ul>
              <Link href={plan.href} className={plan.highlight ? styles.btnPrimary : styles.btnSecondary}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className={styles.ctaBanner}>
        <h2 className={styles.ctaTitle}>{ctaBanner.headline}</h2>
        <p className={styles.ctaSub}>{ctaBanner.sub}</p>
        <Link href={ctaBanner.href || "/auth/register"} className={styles.btnPrimary}>
          {ctaBanner.cta}
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <span className={styles.footerLogo}>Utsavé</span>
        <span className={styles.footerMuted}>Every celebration, elevated · © {new Date().getFullYear()}</span>
      </footer>

    </div>
  );
}
