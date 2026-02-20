"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "../page.module.css";
import formStyles from "./event.module.css";

export default function EventSettingsPage() {
  const router = useRouter();
  const fileRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventMessage, setEventMessage] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  useEffect(() => {
    fetch("/api/host/profile", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setEventName(data.event_name || "");
        setEventDate(data.event_date || "");
        setEventLocation(data.event_location || "");
        setEventMessage(data.event_message || "");
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

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
      const res = await fetch("/api/host/profile", {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setStatus({ type: "success", text: "Event settings saved!" });
    } catch (err) {
      setStatus({ type: "error", text: err.message || "Failed to save." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className={styles.host}><p className={styles.loading}>Loading…</p></main>;
  }

  return (
    <main className={styles.host}>
      <div className={styles.header}>
        <h1 className={styles.title}>Event Settings</h1>
        <div className={styles.actions}>
          <a href="/dashboard" className={styles.download}>← Dashboard</a>
          {profile?.slug && (
            <a href={`/${profile.slug}/invite`} target="_blank" rel="noreferrer" className={styles.download}>
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
            <label className={formStyles.label}>Date & Time</label>
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
                <button type="button" className={formStyles.clearBtn} onClick={() => { setCoverFile(null); setCoverPreview(null); if (fileRef.current) fileRef.current.value = ""; }}>
                  Remove
                </button>
              </div>
            ) : (
              <label className={formStyles.fileLabel}>
                Choose image
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileChange}
                />
              </label>
            )}
            <p className={formStyles.hint}>
              {profile?.event_image_path ? "A cover image is already set. Upload a new one to replace it." : "Upload a photo to display on your invite page."}
            </p>
          </div>

          {profile?.slug && (
            <div className={formStyles.field}>
              <label className={formStyles.label}>Your Invite URL</label>
              <div className={formStyles.urlBox}>
                <a href={`/${profile.slug}/invite`} target="_blank" rel="noreferrer" className={formStyles.urlLink}>
                  {typeof window !== "undefined" ? window.location.origin : ""}/{profile.slug}/invite
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
    </main>
  );
}
