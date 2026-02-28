"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "../../../page.module.css";
import formStyles from "../../../event/event.module.css";

const CATEGORY_LABELS = {
  wedding:          "Wedding",
  mehndi:           "Mehndi",
  sangeet:          "Sangeet",
  haldi:            "Haldi",
  diwali:           "Diwali",
  holi:             "Holi",
  navratri:         "Navratri",
  eid:              "Eid",
  puja:             "Puja",
  family:           "Family",
  birthday:         "Birthday",
  birthday_1st:     "1st Birthday",
  birthday_40th:    "40th Birthday",
  birthday_50th:    "50th Birthday",
  anniversary_10:   "10th Anniversary",
  anniversary_25:   "25th Anniversary",
  anniversary_50:   "50th Anniversary",
  uttarayani:       "Uttarayani",
  uttarakhand_fair: "Uttarakhand Fair",
  marathon:         "Marathon",
  community:        "Community",
  outdoor_run:      "Outdoor Run",
};

export default function EventSettingsPage() {
  const { eventId } = useParams();
  const router = useRouter();
  const fileRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [eventStatus, setEventStatus] = useState("draft");
  const [slug, setSlug] = useState("");

  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventMessage, setEventMessage] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState(null);

  // Library picker state
  const [showLibrary, setShowLibrary] = useState(false);
  const [libPhotos, setLibPhotos] = useState([]);
  const [libCategories, setLibCategories] = useState([]);
  const [libCategory, setLibCategory] = useState("all");
  const [libLoading, setLibLoading] = useState(false);
  const [libPicking, setLibPicking] = useState(null);

  async function loadEvent() {
    const res = await fetch(`/api/host/events/${eventId}`, { credentials: "include" });
    if (!res.ok) { router.push("/dashboard"); return null; }
    const data = await res.json();
    setSlug(data.slug || "");
    setEventStatus(data.status || "draft");
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

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target.result);
    reader.readAsDataURL(file);
    setShowLibrary(false);
  }

  async function openLibrary() {
    setShowLibrary(true);
    if (libPhotos.length) return;
    setLibLoading(true);
    try {
      const res = await fetch("/assets/celebrations/manifest.json");
      const manifest = await res.json();
      const photos = manifest.photos || [];
      setLibPhotos(photos);
      const cats = [...new Set(photos.map((p) => p.category))].sort((a, b) =>
        (CATEGORY_LABELS[a] || a).localeCompare(CATEGORY_LABELS[b] || b)
      );
      setLibCategories(cats);
    } catch {
      // silently fail
    } finally {
      setLibLoading(false);
    }
  }

  async function pickLibraryPhoto(photo) {
    setLibPicking(photo.id);
    try {
      const res = await fetch(photo.file);
      const blob = await res.blob();
      const filename = photo.file.split("/").pop();
      const file = new File([blob], filename, { type: blob.type || "image/jpeg" });
      setCoverFile(file);
      setCoverPreview(photo.file);
      setShowLibrary(false);
    } catch {
      setCoverPreview(photo.file);
      setShowLibrary(false);
    } finally {
      setLibPicking(null);
    }
  }

  function clearCover() {
    setCoverFile(null);
    setCoverPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const filteredPhotos = libCategory === "all"
    ? libPhotos
    : libPhotos.filter((p) => p.category === libCategory);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
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
                    className={`${formStyles.coverSourceBtn} ${showLibrary ? formStyles.coverSourceBtnActive : ""}`}
                    onClick={showLibrary ? () => setShowLibrary(false) : openLibrary}
                  >
                    🖼 App photo library {showLibrary ? "▲" : "▼"}
                  </button>
                </div>
              )}

              <p className={formStyles.hint}>
                {coverPreview || existingCoverUrl
                  ? "This image will be shown on your invite page."
                  : "Upload your own photo or pick one from the celebration library."}
              </p>

              {/* ── Library picker ── */}
              {showLibrary && (
                <div className={formStyles.libraryPanel}>
                  {libLoading ? (
                    <p className={formStyles.libraryLoading}>Loading photos…</p>
                  ) : (
                    <>
                      {/* Category chips */}
                      <div className={formStyles.libCategoryBar}>
                        <button
                          type="button"
                          className={`${formStyles.libCatChip} ${libCategory === "all" ? formStyles.libCatChipActive : ""}`}
                          onClick={() => setLibCategory("all")}
                        >
                          All ({libPhotos.length})
                        </button>
                        {libCategories.map((cat) => {
                          const count = libPhotos.filter((p) => p.category === cat).length;
                          return (
                            <button key={cat} type="button"
                              className={`${formStyles.libCatChip} ${libCategory === cat ? formStyles.libCatChipActive : ""}`}
                              onClick={() => setLibCategory(cat)}
                            >
                              {CATEGORY_LABELS[cat] || cat} ({count})
                            </button>
                          );
                        })}
                      </div>

                      {/* Photo grid */}
                      <div className={formStyles.libGrid}>
                        {filteredPhotos.map((photo) => (
                          <button key={photo.id} type="button"
                            className={`${formStyles.libThumb} ${coverPreview === photo.file ? formStyles.libThumbSelected : ""}`}
                            onClick={() => pickLibraryPhoto(photo)}
                            disabled={!!libPicking}
                            title={photo.alt || photo.category}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={photo.file} alt={photo.alt || ""} loading="lazy" />
                            {libPicking === photo.id && <span className={formStyles.libThumbOverlay}>…</span>}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
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
