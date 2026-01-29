"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import styles from "./page.module.css";

export default function InvitePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
          attending,
          message: message.trim() || "",
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `RSVP failed (${res.status})`);
      }
      setStatus({ type: "success", text: "Thank you! Your RSVP has been recorded." });
      setName("");
      setEmail("");
      setAttending("");
      setMessage("");
    } catch (err) {
      clearTimeout(timeoutId);
      const isAbort = err.name === "AbortError";
      setStatus({
        type: "error",
        text: isAbort
          ? "Request timed out. Check your connection or try again later."
          : err.message || "Network error. Check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.invite}>
      <div className={styles.invite__layout}>
        
      <div className={styles.invite__imageWrap}>
          {!imageError ? (
            <Image
              src="/invite-image.jpg"
              alt="Event invitation"
              fill
              className={styles.invite__image}
              sizes="50vw"
              priority
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={styles.invite__imagePlaceholder}>
              Add your image as <code>public/invite-image.jpg</code>
            </div>
          )}
        </div>
        <div className={styles.invite__content}>
          <div className={styles.invite__contentInner}>
            <div className={styles.invite__titleWrap}>
              <h1 className={styles.invite__title}>You&apos;re Invited</h1>
              <p className={styles.invite__subtitle}>We&apos;d love to celebrate with you</p>
            </div>

            <section className={styles.invite__details}>
              <p className={styles.invite__copy}>
              With love and gratitude, please join us for a special occasion.
              </p>
              <div className={styles.invite__meta}>
                <span>Date & time — Feb-21-2026, 5:30 PM</span>
                <span>Location — 25930 lennox hale dr, Aldie, VA 20105</span>
              </div>
            </section>

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
                    <a href="/host">Host: view &amp; download RSVPs</a>
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
