"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "../../../page.module.css";
import formStyles from "../../../event/event.module.css";

export default function EventSettingsPage() {
  const { eventId } = useParams();
  const router = useRouter();
  const fileRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [slug, setSlug] = useState("");

  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventMessage, setEventMessage] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState(null);

  async function loadEvent() {
    const res = await fetch(`/api/host/events/${eventId}`, { credentials: "include" });
    if (!res.ok) { router.push("/dashboard"); return null; }
    const data = await res.json();
    setSlug(data.slug || "");
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
  }

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

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem" }}>
        <div className={styles.rsvpHeader} style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.6rem", fontWeight: 600, margin: 0 }}>
            Event Settings
          </h1>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <a href={`/dashboard/events/${eventId}`} className={styles.btnOutlineSmall}>← Back</a>
            {slug && (
              <a href={`/${slug}/invite`} target="_blank" rel="noreferrer" className={styles.btnOutlineSmall}>
                Preview Invite ↗
              </a>
            )}
          </div>
        </div>

        <div className={formStyles.formCard}>
          <form onSubmit={handleSave} className={formStyles.form}>
            <div className={formStyles.field}>
              <label className={formStyles.label}>Event Name</label>
              <input
                type="text"
                className={formStyles.input}
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="You're Invited"
                maxLength={100}
              />
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label}>Date &amp; Time</label>
              <input
                type="text"
                className={formStyles.input}
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                placeholder="e.g. Feb 21, 2026, 5:30 PM"
                maxLength={100}
              />
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label}>Location</label>
              <input
                type="text"
                className={formStyles.input}
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="e.g. 123 Main St, City, State"
                maxLength={200}
              />
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label}>Personal Message</label>
              <textarea
                className={`${formStyles.input} ${formStyles.textarea}`}
                value={eventMessage}
                onChange={(e) => setEventMessage(e.target.value)}
                placeholder="With love and gratitude, please join us for a special occasion."
                rows={3}
                maxLength={500}
              />
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label}>Cover Image</label>
              {coverPreview ? (
                <div className={formStyles.preview}>
                  <img src={coverPreview} alt="Cover preview" />
                  <button
                    type="button"
                    className={formStyles.clearBtn}
                    onClick={() => { setCoverFile(null); setCoverPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                  >
                    Remove
                  </button>
                </div>
              ) : existingCoverUrl ? (
                <div className={formStyles.preview}>
                  <img src={existingCoverUrl} alt="Current cover" />
                  <label className={formStyles.clearBtn} style={{ cursor: "pointer" }}>
                    Replace
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
                  </label>
                </div>
              ) : (
                <label className={formStyles.fileLabel}>
                  Choose image
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
                </label>
              )}
              <p className={formStyles.hint}>
                {existingCoverUrl
                  ? "This image is shown on your invite page."
                  : "Upload a photo to display on your invite page."}
              </p>
            </div>

            {inviteUrl && (
              <div className={formStyles.field}>
                <label className={formStyles.label}>Invite URL</label>
                <div className={formStyles.urlBox}>
                  <a href={inviteUrl} target="_blank" rel="noreferrer" className={formStyles.urlLink}>
                    {inviteUrl}
                  </a>
                </div>
              </div>
            )}

            {status && (
              <p className={status.type === "success" ? formStyles.success : formStyles.error}>
                {status.text}
              </p>
            )}

            <button type="submit" className={formStyles.submit} disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
