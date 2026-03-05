"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

const PEXELS_QUERIES = {
  wedding:        "Indian wedding ceremony celebration",
  festival:       "Diwali Holi Navratri festival India celebration",
  puja:           "Hindu puja ceremony family",
  anniversary:    "wedding anniversary couple celebration",
  birthday_kid:   "baby first birthday party celebration",
  birthday_adult: "50th birthday party milestone celebration",
};

export default function LandingConfigForm({ themes, activeTheme }) {
  const router = useRouter();
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
      router.refresh(); // refetch theme list so Active badge updates
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

  // Pexels picker for hero photos (slot 0=main, 1=top-right, 2=bottom-left)
  const [pexelsSlot, setPexelsSlot] = useState(null);
  const [pexelsQuery, setPexelsQuery] = useState("");
  const [pexelsPhotos, setPexelsPhotos] = useState([]);
  const [pexelsLoading, setPexelsLoading] = useState(false);
  const [pexelsPage, setPexelsPage] = useState(1);
  const [pexelsTotalResults, setPexelsTotalResults] = useState(0);

  // Intake mode + help CTA
  const [intakeMode,      setIntakeMode]      = useState(activeTheme?.intakeMode || "light");
  const [helpEnabled,     setHelpEnabled]     = useState(activeTheme?.helpCta?.enabled !== false);
  const [helpHeadline,    setHelpHeadline]    = useState(activeTheme?.helpCta?.headline || "");
  const [helpSub,         setHelpSub]         = useState(activeTheme?.helpCta?.sub || "");
  const [helpEmail,       setHelpEmail]       = useState(activeTheme?.helpCta?.email || "");
  const [helpPhone,       setHelpPhone]       = useState(activeTheme?.helpCta?.phone || "");
  const [helpButtonText,  setHelpButtonText]  = useState(activeTheme?.helpCta?.buttonText || "");

  function toggleEventType(key) {
    setEventTypeKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  const editingThemeName = themes.find((t) => t.id === editingThemeId)?.name || "wedding";

  async function openPexelsForSlot(slot) {
    setPexelsSlot(slot);
    const defaultQ = PEXELS_QUERIES[editingThemeName] || PEXELS_QUERIES.wedding;
    setPexelsQuery(defaultQ);
    setPexelsPhotos([]);
    setPexelsPage(1);
    await searchPexels(defaultQ, 1, true);
  }

  async function searchPexels(query, page = 1, replace = false) {
    if (!query?.trim()) return;
    setPexelsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/pexels/search?q=${encodeURIComponent(query.trim())}&page=${page}&per_page=15`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (res.ok) {
        setPexelsPhotos((prev) => (replace || page === 1 ? (data.photos || []) : [...prev, ...(data.photos || [])]));
        setPexelsTotalResults(data.total_results || 0);
        setPexelsPage(data.page || page);
      }
    } catch {
      setPexelsPhotos([]);
    } finally {
      setPexelsLoading(false);
    }
  }

  function pexelsCdnUrl(photoId) {
    return `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=800`;
  }

  function pickPexelsPhoto(photo) {
    const url = pexelsCdnUrl(photo.id);
    if (pexelsSlot === 0) setPhoto0(url);
    if (pexelsSlot === 1) setPhoto1(url);
    if (pexelsSlot === 2) setPhoto2(url);
    setPexelsSlot(null);
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
      intakeMode,
      helpCta: {
        enabled: helpEnabled,
        headline: helpHeadline,
        sub: helpSub,
        email: helpEmail,
        phone: helpPhone,
        buttonText: helpButtonText,
      },
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
              <div className={styles.heroPhotoRow}>
                <input className={styles.input} value={photo0} onChange={(e) => setPhoto0(e.target.value)} placeholder="Pexels URL or paste any image URL" />
                <button type="button" className={styles.pexelsPickBtn} onClick={() => openPexelsForSlot(0)} title="Search Pexels (filtered for this theme)">
                  🔍 Pick from Pexels
                </button>
              </div>
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Hero photo 2 (top-right) — URL</label>
                <div className={styles.heroPhotoRow}>
                  <input className={styles.input} value={photo1} onChange={(e) => setPhoto1(e.target.value)} placeholder="Pexels or image URL" />
                  <button type="button" className={styles.pexelsPickBtn} onClick={() => openPexelsForSlot(1)} title="Search Pexels (filtered for this theme)">
                    🔍 Pick from Pexels
                  </button>
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Hero photo 3 (bottom-left) — URL</label>
                <div className={styles.heroPhotoRow}>
                  <input className={styles.input} value={photo2} onChange={(e) => setPhoto2(e.target.value)} placeholder="Pexels or image URL" />
                  <button type="button" className={styles.pexelsPickBtn} onClick={() => openPexelsForSlot(2)} title="Search Pexels (filtered for this theme)">
                    🔍 Pick from Pexels
                  </button>
                </div>
              </div>
            </div>
            {pexelsSlot !== null && (
              <div className={styles.pexelsPanel}>
                <p className={styles.pexelsPanelTitle}>
                  Choose photo for Hero {pexelsSlot === 0 ? "1 (main)" : pexelsSlot === 1 ? "2 (top-right)" : "3 (bottom-left)"}
                </p>
                <div className={styles.pexelsSearchBar}>
                  <input
                    type="text"
                    className={styles.pexelsInput}
                    value={pexelsQuery}
                    onChange={(e) => setPexelsQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); searchPexels(pexelsQuery, 1, true); } }}
                    placeholder="Search Pexels…"
                  />
                  <button
                    type="button"
                    className={styles.pexelsSearchBtn}
                    onClick={() => searchPexels(pexelsQuery, 1, true)}
                    disabled={pexelsLoading || !pexelsQuery.trim()}
                  >
                    {pexelsLoading ? "…" : "Search"}
                  </button>
                  <button type="button" className={styles.pexelsCloseBtn} onClick={() => setPexelsSlot(null)}>Cancel</button>
                </div>
                {pexelsPhotos.length === 0 && !pexelsLoading && (
                  <p className={styles.pexelsLoading}>Enter a search term and click Search.</p>
                )}
                {pexelsLoading && pexelsPhotos.length === 0 && (
                  <p className={styles.pexelsLoading}>Searching…</p>
                )}
                {pexelsPhotos.length > 0 && (
                  <div className={styles.pexelsGrid}>
                    {pexelsPhotos.map((photo) => (
                      <button
                        key={photo.id}
                        type="button"
                        className={styles.pexelsThumb}
                        onClick={() => pickPexelsPhoto(photo)}
                        title={photo.alt || photo.photographer}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.src_medium} alt={photo.alt || ""} loading="lazy" />
                        <span className={styles.pexelsThumbCredit}>{photo.photographer}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className={styles.pexelsFooter}>
                  <span className={styles.pexelsAttribution}>
                    Photos by <a href="https://www.pexels.com" target="_blank" rel="noreferrer">Pexels</a>
                  </span>
                  {pexelsPhotos.length < pexelsTotalResults && (
                    <button
                      type="button"
                      className={styles.pexelsLoadMore}
                      onClick={() => searchPexels(pexelsQuery, pexelsPage + 1, false)}
                      disabled={pexelsLoading}
                    >
                      {pexelsLoading ? "Loading…" : "Load more"}
                    </button>
                  )}
                </div>
              </div>
            )}
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

          {/* Help CTA section */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Help CTA Section ("We&apos;re here for you")</legend>
            <div className={styles.field}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={helpEnabled}
                  onChange={(e) => setHelpEnabled(e.target.checked)}
                />
                Show "Need help?" section on landing page
              </label>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Intake mode for "Get Started" button</label>
              <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.25rem" }}>
                <label className={styles.checkLabel}>
                  <input type="radio" name="intakeMode" value="light" checked={intakeMode === "light"} onChange={() => setIntakeMode("light")} />
                  Light (single-page, ~5 fields)
                </label>
                <label className={styles.checkLabel}>
                  <input type="radio" name="intakeMode" value="full" checked={intakeMode === "full"} onChange={() => setIntakeMode("full")} />
                  Full (6-step questionnaire)
                </label>
              </div>
            </div>
            {helpEnabled && (
              <>
                <div className={styles.field}>
                  <label className={styles.label}>Headline</label>
                  <input className={styles.input} value={helpHeadline} onChange={(e) => setHelpHeadline(e.target.value)} placeholder="Want help planning your celebration?" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Sub-text</label>
                  <input className={styles.input} value={helpSub} onChange={(e) => setHelpSub(e.target.value)} placeholder="Let our team design, plan and execute your event — end to end." />
                </div>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.label}>Contact email</label>
                    <input className={styles.input} value={helpEmail} onChange={(e) => setHelpEmail(e.target.value)} placeholder="contact@utsav-events.com" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Contact phone</label>
                    <input className={styles.input} value={helpPhone} onChange={(e) => setHelpPhone(e.target.value)} placeholder="571-908-9101" />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Button text</label>
                  <input className={styles.input} value={helpButtonText} onChange={(e) => setHelpButtonText(e.target.value)} placeholder="Get Started →" />
                </div>
              </>
            )}
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
