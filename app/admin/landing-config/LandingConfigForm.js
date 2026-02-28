"use client";

import { useState } from "react";
import styles from "./page.module.css";

const THEME_LABELS = {
  wedding:       "Weddings & Marriage Events",
  festival:      "Festivals (Holi, Diwali, Navratri)",
  puja:          "Religious / Puja Events",
  anniversary:   "Marriage Anniversary (25th / 50th)",
  birthday_kid:  "Kid's Birthday (1st Birthday)",
  birthday_adult:"Adult Milestone Birthday (50th)",
};

const ALL_EVENT_TYPE_KEYS = [
  { key: "wedding",     label: "Wedding Suite" },
  { key: "birthday",   label: "Birthday Bash" },
  { key: "diwali",     label: "Diwali Party" },
  { key: "puja",       label: "Puja & Ceremony" },
  { key: "namkaran",   label: "Namkaran" },
  { key: "godh_bharai",label: "Godh Bharai" },
  { key: "graduation", label: "Graduation" },
  { key: "holi",       label: "Holi Celebration" },
  { key: "navratri",   label: "Navratri / Garba" },
  { key: "anniversary",label: "Anniversary" },
];

export default function LandingConfigForm({ themes, activeTheme }) {
  // ── Panel A: Active theme switcher ──────────────────────────────────────
  const [activatingId, setActivatingId] = useState(null);
  const [activateMsg, setActivateMsg] = useState(null);

  async function handleActivate(themeId) {
    if (!themeId) return;
    setActivatingId(themeId);
    setActivateMsg(null);
    try {
      const res = await fetch(`/api/admin/landing-themes/${themeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to activate");
      setActivateMsg({ type: "success", text: "Theme activated! Visit / to see it live." });
    } catch (err) {
      setActivateMsg({ type: "error", text: err.message });
    } finally {
      setActivatingId(null);
    }
  }

  // ── Panel B: Theme config editor ────────────────────────────────────────
  const [editingThemeId, setEditingThemeId] = useState(activeTheme?.id || (themes[0]?.id ?? ""));
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  // Hero fields
  const [badge,       setBadge]       = useState(activeTheme?.hero?.badge       || "");
  const [headline,    setHeadline]    = useState(activeTheme?.hero?.headline     || "");
  const [subheadline, setSubheadline] = useState(activeTheme?.hero?.subheadline || "");
  const [ctaText,     setCtaText]     = useState(activeTheme?.hero?.ctaText     || "");
  const [ctaHref,     setCtaHref]     = useState(activeTheme?.hero?.ctaHref     || "/auth/register");
  const [photo0,      setPhoto0]      = useState(activeTheme?.hero?.photos?.[0]?.src || "");
  const [photo1,      setPhoto1]      = useState(activeTheme?.hero?.photos?.[1]?.src || "");
  const [photo2,      setPhoto2]      = useState(activeTheme?.hero?.photos?.[2]?.src || "");

  // Palette fields
  const [pAccent,     setPAccent]     = useState(activeTheme?.palette?.accent     || "#c9941a");
  const [pHover,      setPHover]      = useState(activeTheme?.palette?.accentHover|| "#a87a14");
  const [pDim,        setPDim]        = useState(activeTheme?.palette?.accentDim  || "rgba(201,148,26,0.12)");
  const [pBg,         setPBg]         = useState(activeTheme?.palette?.bg         || "#faf7f2");
  const [pDeep,       setPDeep]       = useState(activeTheme?.palette?.accentDeep || "#8b4513");

  // CTA banner fields
  const [ctaBannerHeadline, setCtaBannerHeadline] = useState(activeTheme?.ctaBanner?.headline || "");
  const [ctaBannerSub,      setCtaBannerSub]      = useState(activeTheme?.ctaBanner?.sub      || "");
  const [ctaBannerCta,      setCtaBannerCta]      = useState(activeTheme?.ctaBanner?.cta      || "");
  const [ctaBannerHref,     setCtaBannerHref]     = useState(activeTheme?.ctaBanner?.href     || "/auth/register");

  // Event type multi-select
  const [eventTypeKeys, setEventTypeKeys] = useState(activeTheme?.eventTypeKeys || []);

  function toggleEventType(key) {
    setEventTypeKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!editingThemeId) return;
    setSaving(true);
    setSaveMsg(null);
    const config = {
      hero: {
        badge, headline, subheadline, ctaText, ctaHref,
        photos: [
          { src: photo0, alt: "" },
          { src: photo1, alt: "" },
          { src: photo2, alt: "" },
        ].filter((p) => p.src),
      },
      palette: { accent: pAccent, accentHover: pHover, accentDim: pDim, bg: pBg, accentDeep: pDeep },
      ctaBanner: { headline: ctaBannerHeadline, sub: ctaBannerSub, cta: ctaBannerCta, href: ctaBannerHref },
      eventTypeKeys,
    };
    try {
      const res = await fetch(`/api/admin/landing-themes/${editingThemeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSaveMsg({ type: "success", text: "Config saved! Changes are live immediately." });
    } catch (err) {
      setSaveMsg({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.formWrap}>

      {/* ── Panel A: Activate Theme ── */}
      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Active Theme</h2>
        <p className={styles.panelDesc}>
          The active theme is shown at <strong>/</strong>. Only one theme can be active at a time.
        </p>
        <div className={styles.themeGrid}>
          {themes.map((t) => (
            <div key={t.id} className={`${styles.themeCard} ${t.is_active ? styles.themeCardActive : ""}`}>
              <div className={styles.themeCardName}>{THEME_LABELS[t.name] || t.display_name}</div>
              <div className={styles.themeCardSlug}>{t.name}</div>
              {t.is_active && <span className={styles.activeBadge}>Active</span>}
              <div className={styles.themeCardActions}>
                <button
                  className={styles.activateBtn}
                  disabled={t.is_active || activatingId === t.id}
                  onClick={() => handleActivate(t.id)}
                >
                  {activatingId === t.id ? "Activating…" : t.is_active ? "Active" : "Activate"}
                </button>
                <a
                  href={`/landing/${t.name}`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.previewLink}
                >
                  Preview ↗
                </a>
              </div>
            </div>
          ))}
        </div>
        {activateMsg && (
          <p className={activateMsg.type === "success" ? styles.msgSuccess : styles.msgError}>
            {activateMsg.text}
          </p>
        )}
      </section>

      {/* ── Panel B: Edit Theme Config ── */}
      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Edit Theme Content</h2>
        <p className={styles.panelDesc}>
          Changes take effect immediately — no redeploy needed.
          Fields left blank fall back to the built-in defaults for that theme.
        </p>

        <div className={styles.field}>
          <label className={styles.label}>Theme to edit</label>
          <select
            className={styles.select}
            value={editingThemeId}
            onChange={(e) => setEditingThemeId(e.target.value)}
          >
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {THEME_LABELS[t.name] || t.display_name}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={handleSave}>
          {/* Hero section */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Hero Section</legend>
            <div className={styles.field}>
              <label className={styles.label}>Badge text</label>
              <input className={styles.input} value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="e.g. Built for Indian weddings" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Headline (use \n for line breaks)</label>
              <textarea className={styles.textarea} rows={3} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder={"Every function.\nEvery memory.\nOne place."} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Subheadline</label>
              <textarea className={styles.textarea} rows={3} value={subheadline} onChange={(e) => setSubheadline(e.target.value)} placeholder="A sentence about this theme…" />
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>CTA Button text</label>
                <input className={styles.input} value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="Begin your celebration →" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>CTA Button href</label>
                <input className={styles.input} value={ctaHref} onChange={(e) => setCtaHref(e.target.value)} placeholder="/auth/register" />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Hero photo 1 (main) — URL</label>
              <input className={styles.input} value={photo0} onChange={(e) => setPhoto0(e.target.value)} placeholder="/assets/celebrations/photos/wedding/pexels-…jpg" />
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Hero photo 2 (top-right)</label>
                <input className={styles.input} value={photo1} onChange={(e) => setPhoto1(e.target.value)} placeholder="/assets/celebrations/photos/…" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Hero photo 3 (bottom-left)</label>
                <input className={styles.input} value={photo2} onChange={(e) => setPhoto2(e.target.value)} placeholder="/assets/celebrations/photos/…" />
              </div>
            </div>
          </fieldset>

          {/* Palette section */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Colour Palette</legend>
            <div className={styles.paletteGrid}>
              {[
                { label: "Accent (primary)",   val: pAccent,  set: setPAccent },
                { label: "Accent hover",       val: pHover,   set: setPHover },
                { label: "Accent dim (alpha)", val: pDim,     set: setPDim, wide: true },
                { label: "Background",         val: pBg,      set: setPBg },
                { label: "Accent deep",        val: pDeep,    set: setPDeep },
              ].map(({ label, val, set, wide }) => (
                <div key={label} className={`${styles.field} ${wide ? styles.fieldWide : ""}`}>
                  <label className={styles.label}>{label}</label>
                  <div className={styles.colorRow}>
                    <input type="color" className={styles.colorSwatch}
                      value={val.startsWith("rgba") ? "#cccccc" : val}
                      onChange={(e) => set(e.target.value)}
                    />
                    <input className={styles.input} value={val} onChange={(e) => set(e.target.value)} placeholder="#c9941a" />
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          {/* Event types */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Featured Event Types (shown in the grid)</legend>
            <div className={styles.checkGrid}>
              {ALL_EVENT_TYPE_KEYS.map(({ key, label }) => (
                <label key={key} className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={eventTypeKeys.includes(key)}
                    onChange={() => toggleEventType(key)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          {/* CTA Banner */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>CTA Banner (bottom of page)</legend>
            <div className={styles.field}>
              <label className={styles.label}>Headline</label>
              <input className={styles.input} value={ctaBannerHeadline} onChange={(e) => setCtaBannerHeadline(e.target.value)} placeholder="Your next celebration deserves Utsavé." />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Sub-text</label>
              <input className={styles.input} value={ctaBannerSub} onChange={(e) => setCtaBannerSub(e.target.value)} placeholder="Free to start. No credit card required." />
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Button text</label>
                <input className={styles.input} value={ctaBannerCta} onChange={(e) => setCtaBannerCta(e.target.value)} placeholder="Begin your celebration →" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Button href</label>
                <input className={styles.input} value={ctaBannerHref} onChange={(e) => setCtaBannerHref(e.target.value)} placeholder="/auth/register" />
              </div>
            </div>
          </fieldset>

          {saveMsg && (
            <p className={saveMsg.type === "success" ? styles.msgSuccess : styles.msgError}>
              {saveMsg.text}
            </p>
          )}

          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </section>
    </div>
  );
}
