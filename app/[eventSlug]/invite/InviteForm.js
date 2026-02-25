"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./invite.module.css";

export default function InviteForm({ profile, eventSlug, coverUrl }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [attending, setAttending] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const statusRef = useRef(null);

  useEffect(() => {
    if (status && statusRef.current) {
      statusRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [status]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !attending) {
      setStatus({ type: "error", text: "Please fill name, email, and RSVP." });
      return;
    }
    setLoading(true);
    setStatus(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          attending,
          message: message.trim() || "",
          eventSlug,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `RSVP failed (${res.status})`);
      setStatus({ type: "success", text: "Thank you! Your RSVP has been recorded." });
      setName("");
      setEmail("");
      setPhone("");
      setAttending("");
      setMessage("");
    } catch (err) {
      clearTimeout(timeoutId);
      setStatus({
        type: "error",
        text:
          err.name === "AbortError"
            ? "Request timed out. Check your connection or try again later."
            : err.message || "Network error. Check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  const hasImage = coverUrl && !imageError;

  return (
    <main className={styles.invite}>
      <div className={styles.invite__layout}>
        <div className={styles.invite__imageWrap}>
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt="Event invitation"
              className={styles.invite__image}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={styles.invite__imagePlaceholder}>
              {profile.display_name}&apos;s Event
            </div>
          )}
        </div>

        <div className={styles.invite__content}>
          <div className={styles.invite__contentInner}>
            <div className={styles.invite__titleWrap}>
              <h1 className={styles.invite__title}>
                {profile.event_name || "You're Invited"}
              </h1>
              <p className={styles.invite__subtitle}>We&apos;d love to celebrate with you</p>
            </div>

            {(profile.event_message || profile.event_date || profile.event_location) && (
              <section className={styles.invite__details}>
                {profile.event_message && (
                  <p className={styles.invite__copy}>{profile.event_message}</p>
                )}
                <div className={styles.invite__meta}>
                  {profile.event_date && <span>Date &amp; time — {profile.event_date}</span>}
                  {profile.event_location && <span>Location — {profile.event_location}</span>}
                </div>
              </section>
            )}

            <section className={styles.invite__rsvp} id="rsvp">
              <h2 className={styles.invite__rsvpTitle}>RSVP</h2>
              <form onSubmit={handleSubmit} className={styles.rsvpForm}>
                <label className={styles.rsvpForm__label}>
                  Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.rsvpForm__input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
                <label className={styles.rsvpForm__label}>
                  Email <span className={styles.required}>*</span>
                </label>
                <input
                  type="email"
                  className={styles.rsvpForm__input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
                <label className={styles.rsvpForm__label}>
                  Phone / WhatsApp <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  type="tel"
                  className={styles.rsvpForm__input}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 000 0000"
                />
                <label className={styles.rsvpForm__label}>
                  Will you attend? <span className={styles.required}>*</span>
                </label>
                <div className={styles.rsvpForm__radioGroup}>
                  <label className={styles.rsvpForm__radio}>
                    <input
                      type="radio"
                      name="attending"
                      value="Yes"
                      checked={attending === "Yes"}
                      onChange={(e) => setAttending(e.target.value)}
                    />
                    <span>Yes</span>
                  </label>
                  <label className={styles.rsvpForm__radio}>
                    <input
                      type="radio"
                      name="attending"
                      value="No"
                      checked={attending === "No"}
                      onChange={(e) => setAttending(e.target.value)}
                    />
                    <span>No</span>
                  </label>
                </div>
                <label className={styles.rsvpForm__label}>Message (optional)</label>
                <textarea
                  className={`${styles.rsvpForm__input} ${styles.rsvpForm__textarea}`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="A brief message..."
                  rows={2}
                />
                {status && (
                  <p
                    ref={statusRef}
                    role="alert"
                    className={
                      status.type === "success"
                        ? `${styles.rsvpForm__status} ${styles.rsvpForm__statusSuccess}`
                        : `${styles.rsvpForm__status} ${styles.rsvpForm__statusError}`
                    }
                  >
                    {status.text}
                  </p>
                )}
                <footer className={styles.invite__footer}>
                  <button
                    type="submit"
                    className={styles.rsvpForm__submit}
                    disabled={loading}
                  >
                    {loading ? "Sending…" : "Send RSVP"}
                  </button>
                  <p className={styles.invite__export}>
                    <a href={`/${eventSlug}/gallery`}>View Event Photos</a>
                  </p>
                </footer>
              </form>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
