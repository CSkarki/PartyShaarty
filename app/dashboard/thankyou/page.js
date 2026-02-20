"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";

const TEMPLATES = [
  {
    id: "heartfelt",
    name: "Heartfelt Thanks",
    emoji: "\u2764\uFE0F",
    desc: "Warm and emotional",
    subject: "Thank You for Making It Special",
    message:
      "Thank you so much for being part of our celebration! Your presence truly made the day unforgettable. We are so grateful to have you in our lives and can't wait to create more wonderful memories together.\n\nWith love and gratitude",
  },
  {
    id: "casual",
    name: "Fun & Casual",
    emoji: "\uD83C\uDF89",
    desc: "Upbeat party vibes",
    subject: "What a Party! Thanks for Coming",
    message:
      "That was one for the books! Thanks for showing up and bringing the good vibes. From the laughs to the dance floor moments, it wouldn't have been the same without you.\n\nLet's do it again soon!",
  },
  {
    id: "short",
    name: "Short & Sweet",
    emoji: "\uD83D\uDE4F",
    desc: "Brief and to the point",
    subject: "Thank You!",
    message:
      "Just a quick note to say thank you for joining us. We truly appreciated your presence and it meant the world to us.\n\nWarmly",
  },
  {
    id: "custom",
    name: "Custom",
    emoji: "\u270F\uFE0F",
    desc: "Write your own",
    subject: "",
    message: "",
  },
];

export default function ThankYouPage() {
  const [loggedIn, setLoggedIn] = useState(null);
  const [hostSlug, setHostSlug] = useState("");
  const [guests, setGuests] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [channel, setChannel] = useState("email");
  const [activeTemplate, setActiveTemplate] = useState(() => {
    try { return localStorage.getItem("thankyou_template") || null; } catch { return null; }
  });
  const [subject, setSubject] = useState(() => {
    try { return localStorage.getItem("thankyou_subject") || ""; } catch { return ""; }
  });
  const [message, setMessage] = useState(() => {
    try { return localStorage.getItem("thankyou_message") || ""; } catch { return ""; }
  });
  const [images, setImages] = useState(() => {
    try { return JSON.parse(localStorage.getItem("thankyou_images") || "[]"); } catch { return []; }
  });
  const [imageInput, setImageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const textareaRef = useRef(null);

  const opts = { credentials: "include" };

  useEffect(() => {
    try { localStorage.setItem("thankyou_template", activeTemplate || ""); } catch {}
  }, [activeTemplate]);

  useEffect(() => {
    try { localStorage.setItem("thankyou_subject", subject); } catch {}
  }, [subject]);

  useEffect(() => {
    try { localStorage.setItem("thankyou_message", message); } catch {}
  }, [message]);

  useEffect(() => {
    const urlOnly = images.filter((img) => img.type === "url");
    try { localStorage.setItem("thankyou_images", JSON.stringify(urlOnly)); } catch {}
  }, [images]);

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

  function pickTemplate(tpl) {
    setActiveTemplate(tpl.id);
    setSubject(tpl.subject);
    setMessage(tpl.message);
    setFeedback(null);
  }

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

  function addImageUrl() {
    const url = imageInput.trim();
    if (!url) return;
    try { new URL(url); } catch { return; }
    if (!images.some((img) => img.type === "url" && img.src === url)) {
      setImages((prev) => [...prev, { type: "url", src: url, id: `url-${Date.now()}` }]);
    }
    setImageInput("");
  }

  function handleFileUpload(e) {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [
          ...prev,
          {
            type: "file",
            src: reader.result,
            name: file.name,
            id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function removeImage(id) {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }

  const selectedGuests = guests.filter((g) => selected.has(g.email));
  const selectedWithPhone = selectedGuests.filter((g) => g.phone);
  const anyHavePhone = guests.some((g) => g.phone);

  async function handleSend(e) {
    e.preventDefault();
    if (!activeTemplate) {
      setFeedback({ type: "error", text: "Choose a template first." });
      return;
    }
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
      const res = await fetch("/api/thankyou/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          channel,
          recipients: selectedGuests.map((g) => ({ name: g.name, email: g.email, phone: g.phone || "" })),
          subject: subject.trim(),
          message: message.trim(),
          imageUrls: channel === "email" ? images.filter((img) => img.type === "url").map((img) => img.src) : [],
          uploadedImages: channel === "email"
            ? images.filter((img) => img.type === "file").map((img) => ({ name: img.name, dataUrl: img.src }))
            : [],
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
          text: `Thank you sent to ${data.sent} guest${data.sent !== 1 ? "s" : ""}!${skippedNote}`,
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
        <h1 className={styles.title}>Send Thank You</h1>
        <a href="/dashboard" className={styles.backLink}>
          Back to Dashboard
        </a>
      </div>

      {/* Template Picker */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Choose a Template</h2>
        <div className={styles.templateGrid}>
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              className={`${styles.templateCard} ${
                activeTemplate === tpl.id ? styles.templateActive : ""
              }`}
              onClick={() => pickTemplate(tpl)}
            >
              <span className={styles.templateEmoji}>{tpl.emoji}</span>
              <span className={styles.templateName}>{tpl.name}</span>
              <span className={styles.templateDesc}>{tpl.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Compose + Recipients */}
      {activeTemplate && (
        <div className={styles.grid}>
          {/* Compose */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>2. Compose Your Message</h2>

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
                    placeholder="Thank You!"
                  />
                </>
              )}

              <label className={styles.label}>Message</label>
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your thank you message..."
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

              {/* Images — email only */}
              {channel === "email" && (
                <>
                  <label className={styles.label}>Add Photos</label>
                  <div className={styles.uploadRow}>
                    <label className={styles.fileBtn}>
                      Browse / Gallery
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        hidden
                      />
                    </label>
                    <span className={styles.orText}>or paste URL</span>
                    <div className={styles.imageInputRow}>
                      <input
                        type="text"
                        className={styles.input}
                        value={imageInput}
                        onChange={(e) => setImageInput(e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addImageUrl();
                          }
                        }}
                      />
                      <button type="button" className={styles.addBtn} onClick={addImageUrl}>
                        Add
                      </button>
                    </div>
                  </div>

                  {images.length > 0 && (
                    <div className={styles.imagePreviews}>
                      {images.map((img) => (
                        <div key={img.id} className={styles.imageThumb}>
                          <img src={img.src} alt="Preview" />
                          <button
                            type="button"
                            className={styles.removeImg}
                            onClick={() => removeImage(img.id)}
                            title="Remove"
                          >
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {feedback && (
                <p className={styles[feedback.type]}>{feedback.text}</p>
              )}

              <button type="submit" className={styles.sendBtn} disabled={sending}>
                {sending
                  ? "Sending..."
                  : `Send to ${selected.size} Guest${selected.size !== 1 ? "s" : ""}`}
              </button>
            </form>
          </div>

          {/* Recipients */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>3. Select Recipients</h2>

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
        </div>
      )}
    </main>
  );
}
