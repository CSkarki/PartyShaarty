"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "../../../page.module.css";
import formStyles from "../../../event/event.module.css";

const PEXELS_QUERIES = {
  wedding:       "Indian wedding ceremony celebration",
  wedding_suite: "Indian wedding ceremony celebration",
  diwali:        "Diwali festival diyas lights",
  holi:          "Holi colors festival India",
  navratri:      "Navratri garba dance traditional",
  puja:          "Hindu puja ceremony family",
  birthday:      "birthday party celebration",
  namkaran:      "Indian baby naming ceremony",
  anniversary:   "wedding anniversary couple celebration",
  graduation:    "graduation celebration family",
  other:         "celebration party gathering",
};


export default function EventSettingsPage() {
  const { eventId } = useParams();
  const router = useRouter();
  const fileRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [eventStatus, setEventStatus] = useState("draft");
  const [eventType, setEventType] = useState("other");
  const [slug, setSlug] = useState("");

  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventMessage, setEventMessage] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState(null);

  // Pexels live search state
  const [pexelsOpen, setPexelsOpen] = useState(false);
  const [pexelsQuery, setPexelsQuery] = useState("");
  const [pexelsPhotos, setPexelsPhotos] = useState([]);
  const [pexelsLoading, setPexelsLoading] = useState(false);
  const [pexelsPage, setPexelsPage] = useState(1);
  const [pexelsTotalResults, setPexelsTotalResults] = useState(0);
  const [pexelsPicking, setPexelsPicking] = useState(null);

  async function loadEvent() {
    const res = await fetch(`/api/host/events/${eventId}`, { credentials: "include" });
    if (!res.ok) { router.push("/dashboard"); return null; }
    const data = await res.json();
    setSlug(data.slug || "");
    setEventStatus(data.status || "draft");
    setEventType(data.event_type || "other");
    setEventName(data.event_name || "");
    setEventDate(data.event_date || "");
    setEventLocation(data.event_location || "");
    setEventMessage(data.event_message || "");
    setExistingCoverUrl(data.event_image_url || null);
    return data;
  }

  useEffect(() => {
    loadEvent().catch(() => {}).finally(() => setLoading(false));
  }, [eventId]);

  const MAX_COVER_MB = 4;
  const MAX_COVER_BYTES = MAX_COVER_MB * 1024 * 1024;

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_COVER_BYTES) {
      setStatus({ type: "error", text: `Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Please use an image under ${MAX_COVER_MB} MB.` });
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target.result);
    reader.readAsDataURL(file);
    setPexelsOpen(false);
  }

  async function openPexels() {
    setPexelsOpen(true);
    if (pexelsPhotos.length === 0) {
      const q = PEXELS_QUERIES[eventType] || PEXELS_QUERIES.other;
      setPexelsQuery(q);
      await searchPexels(q, 1, true);
    }
  }

  async function searchPexels(query, page = 1, replace = false) {
    if (!query.trim()) return;
    setPexelsLoading(true);
    try {
      const res = await fetch(
        `/api/pexels/search?q=${encodeURIComponent(query.trim())}&page=${page}&per_page=15`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (res.ok) {
        setPexelsPhotos((prev) => replace || page === 1 ? data.photos : [...prev, ...data.photos]);
        setPexelsTotalResults(data.total_results || 0);
        setPexelsPage(page);
      }
    } catch {
      // silently fail
    } finally {
      setPexelsLoading(false);
    }
  }

  async function pickPexelsPhoto(photo) {
    setPexelsPicking(photo.id);
    try {
      const res = await fetch(photo.src_large);
      const blob = await res.blob();
      const file = new File([blob], `pexels-${photo.id}.jpg`, { type: "image/jpeg" });
      setCoverFile(file);
      setCoverPreview(photo.src_medium);
      setPexelsOpen(false);
    } catch {
      setCoverPreview(photo.src_medium);
      setPexelsOpen(false);
    } finally {
      setPexelsPicking(null);
    }
  }

  function clearCover() {
    setCoverFile(null);
    setCoverPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    // Client-side guard: re-check size in case state slipped through
    if (coverFile && coverFile.size > MAX_COVER_BYTES) {
      setStatus({ type: "error", text: `Image is too large (${(coverFile.size / 1024 / 1024).toFixed(1)} MB). Please use an image under ${MAX_COVER_MB} MB.` });
      setSaving(false);
      return;
    }

    const formData = new FormData();
    formData.append("event_name", eventName);
    formData.append("event_date", eventDate);
    formData.append("event_location", eventLocation);
    formData.append("event_message", eventMessage);
    if (coverFile) formData.append("cover_image", coverFile);

    try {
      const res = await fetch(`/api/host/events/${eventId}`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });
      // Safely parse JSON — non-JSON responses (e.g. 413 from infrastructure) won't crash
      let data = {};
      try { data = await res.json(); } catch {}
      if (!res.ok) {
        const msg = data.error || (res.status === 413 ? `Image too large for upload. Please use an image under ${MAX_COVER_MB} MB.` : "Save failed");
        throw new Error(msg);
      }
      setStatus({ type: "success", text: "Event settings saved!" });
      setCoverFile(null);
      setCoverPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      await loadEvent();
    } catch (err) {
      setStatus({ type: "error", text: err.message || "Failed to save." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className={styles.page}><p style={{ padding: "2rem", color: "var(--text-muted)" }}>Loading…</p></main>;
  }

  const inviteUrl = slug && typeof window !== "undefined" ? `${window.location.origin}/${slug}/invite` : "";
  const isLive = eventStatus === "active";

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem" }}>
        <div className={styles.rsvpHeader} style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.6rem", fontWeight: 600, margin: 0 }}>
              Event Settings
            </h1>
            {isLive
              ? <span className={styles.statusLive}>● Live</span>
              : <span className={styles.statusDraft}>Draft</span>
            }
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <a href={`/dashboard/events/${eventId}`} className={styles.btnOutlineSmall}>← Back</a>
            {slug && (
              <a href={`/${slug}/invite`} target="_blank" rel="noreferrer" className={styles.btnOutlineSmall}>
                Preview Invite ↗
              </a>
            )}
          </div>
        </div>

        {isLive && (
          <div className={styles.lockedBanner}>
            🔒 This event is <strong>live</strong> — settings are locked. Go back to the event dashboard to request a change.
          </div>
        )}

        <div className={formStyles.formCard}>
          <form onSubmit={handleSave} className={formStyles.form}>

            <div className={formStyles.field}>
              <label className={formStyles.label}>Event Name</label>
              <input type="text" className={formStyles.input} value={eventName} disabled={isLive}
                onChange={(e) => setEventName(e.target.value)} placeholder="You're Invited" maxLength={100} />
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label}>Date &amp; Time</label>
              <input type="text" className={formStyles.input} value={eventDate} disabled={isLive}
                onChange={(e) => setEventDate(e.target.value)} placeholder="e.g. Feb 21, 2026, 5:30 PM" maxLength={100} />
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label}>Location</label>
              <input type="text" className={formStyles.input} value={eventLocation} disabled={isLive}
                onChange={(e) => setEventLocation(e.target.value)} placeholder="e.g. 123 Main St, City, State" maxLength={200} />
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label}>Personal Message</label>
              <textarea className={`${formStyles.input} ${formStyles.textarea}`} value={eventMessage} disabled={isLive}
                onChange={(e) => setEventMessage(e.target.value)}
                placeholder="With love and gratitude, please join us for a special occasion."
                rows={3} maxLength={500} />
            </div>

            {/* ── Cover Image ── */}
            <div className={formStyles.field}>
              <label className={formStyles.label}>Cover Image</label>

              {/* Preview of selected / existing image */}
              {(coverPreview || existingCoverUrl) && (
                <div className={formStyles.preview}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverPreview || existingCoverUrl} alt="Cover preview" />
                  <button type="button" className={formStyles.clearBtn} onClick={clearCover}>
                    Remove
                  </button>
                </div>
              )}

              {/* Two source buttons — hidden when live */}
              {!isLive && (
                <div className={formStyles.coverSourceRow}>
                  <label className={formStyles.coverSourceBtn}>
                    📁 Upload from device
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
                  </label>
                  <button
                    type="button"
                    className={`${formStyles.coverSourceBtn} ${pexelsOpen ? formStyles.coverSourceBtnActive : ""}`}
                    onClick={pexelsOpen ? () => setPexelsOpen(false) : openPexels}
                  >
                    🔍 Search Pexels {pexelsOpen ? "▲" : "▼"}
                  </button>
                </div>
              )}

              <p className={formStyles.hint}>
                {coverPreview || existingCoverUrl
                  ? "This image will be shown on your invite page."
                  : "Upload your own photo or search Pexels for the perfect one."}
              </p>

              {/* ── Pexels live search ── */}
              {pexelsOpen && (
                <div className={formStyles.libraryPanel}>
                  <div className={formStyles.pexelsSearchBar}>
                    <input
                      type="text"
                      className={formStyles.pexelsInput}
                      value={pexelsQuery}
                      onChange={(e) => setPexelsQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); searchPexels(pexelsQuery, 1, true); } }}
                      placeholder="Search photos…"
                    />
                    <button
                      type="button"
                      className={formStyles.pexelsSearchBtn}
                      onClick={() => searchPexels(pexelsQuery, 1, true)}
                      disabled={pexelsLoading || !pexelsQuery.trim()}
                    >
                      {pexelsLoading ? "…" : "Search"}
                    </button>
                  </div>

                  {pexelsPhotos.length === 0 && !pexelsLoading && (
                    <p className={formStyles.libraryLoading}>No results.</p>
                  )}
                  {pexelsLoading && pexelsPhotos.length === 0 && (
                    <p className={formStyles.libraryLoading}>Searching…</p>
                  )}

                  {pexelsPhotos.length > 0 && (
                    <div className={formStyles.libGrid}>
                      {pexelsPhotos.map((photo) => (
                        <button
                          key={photo.id}
                          type="button"
                          className={`${formStyles.libThumb} ${coverPreview === photo.src_medium ? formStyles.libThumbSelected : ""}`}
                          onClick={() => pickPexelsPhoto(photo)}
                          disabled={!!pexelsPicking}
                          title={photo.alt || photo.photographer}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo.src_medium} alt={photo.alt || ""} loading="lazy" />
                          <span className={formStyles.libThumbCredit}>{photo.photographer}</span>
                          {pexelsPicking === photo.id && <span className={formStyles.libThumbOverlay}>…</span>}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className={formStyles.pexelsFooter}>
                    <span className={formStyles.pexelsAttribution}>
                      Photos by <a href="https://www.pexels.com" target="_blank" rel="noreferrer">Pexels</a>
                    </span>
                    {pexelsPhotos.length < pexelsTotalResults && (
                      <button
                        type="button"
                        className={formStyles.pexelsLoadMore}
                        onClick={() => searchPexels(pexelsQuery, pexelsPage + 1, false)}
                        disabled={pexelsLoading}
                      >
                        {pexelsLoading ? "Loading…" : "Load more"}
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>

            {inviteUrl && (
              <div className={formStyles.field}>
                <label className={formStyles.label}>Invite URL</label>
                <div className={formStyles.urlBox}>
                  <a href={inviteUrl} target="_blank" rel="noreferrer" className={formStyles.urlLink}>{inviteUrl}</a>
                </div>
              </div>
            )}

            {status && (
              <p className={status.type === "success" ? formStyles.success : formStyles.error}>{status.text}</p>
            )}

            {!isLive && (
              <button type="submit" className={formStyles.submit} disabled={saving}>
                {saving ? "Saving..." : "Save Settings"}
              </button>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
