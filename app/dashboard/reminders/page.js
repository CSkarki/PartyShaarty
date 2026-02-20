"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";

export default function RemindersPage() {
  const [loggedIn, setLoggedIn] = useState(null);
  const [hostSlug, setHostSlug] = useState("");
  const [guests, setGuests] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [channel, setChannel] = useState("email");
  const [subject, setSubject] = useState(() => {
    try { return localStorage.getItem("reminder_subject") || ""; } catch { return ""; }
  });
  const [message, setMessage] = useState(() => {
    try { return localStorage.getItem("reminder_message") || ""; } catch { return ""; }
  });
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const textareaRef = useRef(null);

  const opts = { credentials: "include" };

  useEffect(() => {
    try { localStorage.setItem("reminder_subject", subject); } catch {}
  }, [subject]);

  useEffect(() => {
    try { localStorage.setItem("reminder_message", message); } catch {}
  }, [message]);

  useEffect(() => {
    setLoggedIn(true);
    fetch("/api/host/profile", opts)
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => { if (p?.slug) setHostSlug(p.slug); })
      .catch(() => {});
    fetch("/api/gallery/albums", opts)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setAlbums(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch("/api/rsvp/list", opts)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const attending = (Array.isArray(data) ? data : []).filter(
          (r) => r.attending?.toLowerCase() === "yes"
        );
        setGuests(attending);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function toggleGuest(email) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(guests.map((g) => g.email)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  function insertAlbumLink() {
    if (!selectedAlbumId) return;
    const album = albums.find((a) => a.id === selectedAlbumId);
    if (!album) return;
    const link = `${window.location.origin}/${hostSlug}/gallery?album=${album.id}`;
    const label = `View "${album.name}" photos: ${link}`;
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const before = message.slice(0, start);
      const after = message.slice(end);
      setMessage(before + label + after);
    } else {
      setMessage((prev) => prev + (prev ? "\n\n" : "") + label);
    }
    setSelectedAlbumId("");
  }

  const selectedGuests = guests.filter((g) => selected.has(g.email));
  const selectedWithPhone = selectedGuests.filter((g) => g.phone);
  const anyHavePhone = guests.some((g) => g.phone);

  async function handleSend(e) {
    e.preventDefault();
    if (selected.size === 0) {
      setFeedback({ type: "error", text: "Select at least one recipient." });
      return;
    }
    if (channel === "email" && !subject.trim()) {
      setFeedback({ type: "error", text: "Subject is required for email." });
      return;
    }
    if (!message.trim()) {
      setFeedback({ type: "error", text: "Message is required." });
      return;
    }
    if (channel === "whatsapp" && selectedWithPhone.length === 0) {
      setFeedback({ type: "error", text: "None of the selected guests have a phone number." });
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/reminders/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          channel,
          recipients: selectedGuests.map((g) => ({ name: g.name, email: g.email, phone: g.phone || "" })),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "Failed to send." });
        return;
      }

      const skippedNote = data.skipped > 0 ? ` (${data.skipped} skipped — no phone)` : "";
      if (data.failed > 0) {
        setFeedback({
          type: "error",
          text: `Sent ${data.sent} of ${data.sent + data.failed + (data.skipped || 0)}. ${data.failed} failed.${skippedNote}`,
        });
      } else {
        setFeedback({
          type: "success",
          text: `Reminder sent to ${data.sent} guest${data.sent !== 1 ? "s" : ""}.${skippedNote}`,
        });
        setSelected(new Set());
      }
    } catch {
      setFeedback({ type: "error", text: "Network error. Try again." });
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className={styles.host}>
        <p className={styles.loading}>Loading...</p>
      </main>
    );
  }

  if (loggedIn !== true) {
    return (
      <main className={styles.host}>
        <p className={styles.loading}>
          Please{" "}
          <a href="/dashboard" style={{ color: "var(--accent)" }}>
            log in
          </a>{" "}
          first.
        </p>
      </main>
    );
  }

  return (
    <main className={styles.host}>
      <div className={styles.header}>
        <h1 className={styles.title}>Send Reminders</h1>
        <a href="/dashboard" className={styles.backLink}>
          Back to Dashboard
        </a>
      </div>

      <div className={styles.grid}>
        {/* Recipients */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Recipients (Attending)</h2>

          {guests.length === 0 ? (
            <p className={styles.empty}>No guests have RSVP&apos;d Yes yet.</p>
          ) : (
            <>
              <div className={styles.selectActions}>
                <button type="button" className={styles.selectBtn} onClick={selectAll}>
                  Select All
                </button>
                <button type="button" className={styles.selectBtn} onClick={deselectAll}>
                  Deselect All
                </button>
              </div>

              <ul className={styles.guestList}>
                {guests.map((g, i) => (
                  <li key={i} className={styles.guestItem}>
                    <input
                      type="checkbox"
                      checked={selected.has(g.email)}
                      onChange={() => toggleGuest(g.email)}
                    />
                    <div>
                      <div className={styles.guestName}>
                        {g.name}
                        {g.phone && <span className={styles.phoneTag}>📱</span>}
                      </div>
                      <div className={styles.guestEmail}>{g.email}</div>
                    </div>
                  </li>
                ))}
              </ul>

              <p className={styles.selectedCount}>
                {selected.size} of {guests.length} selected
                {selected.size > 0 && channel === "whatsapp" && (
                  <> &mdash; {selectedWithPhone.length} with phone</>
                )}
              </p>
            </>
          )}
        </div>

        {/* Compose */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Compose Message</h2>

          {/* Channel selector */}
          <div className={styles.channelToggle}>
            <button
              type="button"
              className={`${styles.channelBtn} ${channel === "email" ? styles.channelBtnActive : ""}`}
              onClick={() => setChannel("email")}
            >
              Email
            </button>
            <button
              type="button"
              className={`${styles.channelBtn} ${channel === "whatsapp" ? styles.channelBtnActive : ""}`}
              onClick={() => setChannel("whatsapp")}
              disabled={!anyHavePhone}
              title={!anyHavePhone ? "No guests have a phone number" : ""}
            >
              WhatsApp
            </button>
          </div>

          {channel === "whatsapp" && (
            <p className={styles.channelNote}>
              Only guests with a phone number will receive this message.
              {!anyHavePhone && " Ask guests to include their phone when RSVPing."}
            </p>
          )}

          <form onSubmit={handleSend} className={styles.form}>
            {channel === "email" && (
              <>
                <label className={styles.label}>Subject</label>
                <input
                  type="text"
                  className={styles.input}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Event Reminder"
                />
              </>
            )}

            <label className={styles.label}>Message</label>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your reminder message here..."
            />

            {channel === "email" && albums.length > 0 && (
              <div className={styles.albumLinkRow}>
                <select
                  className={styles.albumSelect}
                  value={selectedAlbumId}
                  onChange={(e) => setSelectedAlbumId(e.target.value)}
                >
                  <option value="">Insert album link...</option>
                  {albums.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.albumInsertBtn}
                  onClick={insertAlbumLink}
                  disabled={!selectedAlbumId}
                >
                  Insert Link
                </button>
              </div>
            )}

            {feedback && (
              <p className={styles[feedback.type]}>{feedback.text}</p>
            )}

            <button
              type="submit"
              className={styles.sendBtn}
              disabled={sending}
            >
              {sending ? "Sending..." : `Send to ${selected.size} Guest${selected.size !== 1 ? "s" : ""}`}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
