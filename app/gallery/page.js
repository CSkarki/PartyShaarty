"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";

export default function GalleryPage() {
  return (
    <Suspense fallback={<main className={styles.gallery}><p className={styles.loading}>Loading...</p></main>}>
      <GalleryContent />
    </Suspense>
  );
}

function GalleryContent() {
  const searchParams = useSearchParams();
  const albumParam = searchParams.get("album"); // ?album=<albumId> deep link

  const [verified, setVerified] = useState(null); // null = checking, true/false
  const [step, setStep] = useState("email"); // "email" | "code"
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Albums & photos
  const [view, setView] = useState("albums"); // "albums" | "photos"
  const [albums, setAlbums] = useState([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [deepLinkHandled, setDeepLinkHandled] = useState(false);

  const opts = { credentials: "include" };

  // Check if already verified (existing cookie)
  useEffect(() => {
    fetch("/api/gallery/albums/guest", opts)
      .then((r) => {
        if (r.ok) {
          setVerified(true);
          return r.json();
        }
        setVerified(false);
        return [];
      })
      .then((data) => {
        const albumList = Array.isArray(data) ? data : [];
        setAlbums(albumList);
        // Auto-open album from ?album= deep link
        if (albumParam && albumList.length > 0) {
          const target = albumList.find((a) => a.id === albumParam);
          if (target && !deepLinkHandled) {
            setDeepLinkHandled(true);
            openAlbum(target);
          }
        }
      })
      .catch(() => setVerified(false));
  }, []);

  // Step 1: Send OTP to email
  async function handleSendCode(e) {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/gallery/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed.");
        return;
      }

      if (data.codeSent) {
        setStep("code");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Step 2: Verify OTP code
  async function handleVerifyCode(e) {
    e.preventDefault();
    if (!code.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/gallery/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid code.");
        return;
      }

      if (data.verified) {
        setVerified(true);
        loadAlbums();
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Resend code
  async function handleResend() {
    setCode("");
    setError("");
    setStep("email");
    setSubmitting(true);
    try {
      const res = await fetch("/api/gallery/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resend code.");
        return;
      }
      if (data.codeSent) {
        setStep("code");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function loadAlbums() {
    setLoadingAlbums(true);
    try {
      const res = await fetch("/api/gallery/albums/guest", opts);
      if (res.ok) {
        const data = await res.json();
        const albumList = Array.isArray(data) ? data : [];
        setAlbums(albumList);
        // Auto-open album from ?album= deep link after OTP verification
        if (albumParam && !deepLinkHandled) {
          const target = albumList.find((a) => a.id === albumParam);
          if (target) {
            setDeepLinkHandled(true);
            openAlbum(target);
          }
        }
      }
    } catch {}
    setLoadingAlbums(false);
  }

  async function openAlbum(album) {
    setSelectedAlbum(album);
    setView("photos");
    setLoadingPhotos(true);
    try {
      const res = await fetch(`/api/gallery/albums/${album.id}/photos`, opts);
      if (res.ok) {
        const data = await res.json();
        setPhotos(Array.isArray(data) ? data : []);
      }
    } catch {}
    setLoadingPhotos(false);
  }

  function goBackToAlbums() {
    setView("albums");
    setSelectedAlbum(null);
    setPhotos([]);
    setLightboxIndex(null);
  }

  const handleKeyDown = useCallback(
    (e) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight" && lightboxIndex < photos.length - 1) {
        setLightboxIndex(lightboxIndex + 1);
      }
      if (e.key === "ArrowLeft" && lightboxIndex > 0) {
        setLightboxIndex(lightboxIndex - 1);
      }
    },
    [lightboxIndex, photos.length]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Loading state
  if (verified === null) {
    return (
      <main className={styles.gallery}>
        <p className={styles.loading}>Loading...</p>
      </main>
    );
  }

  // Verification flow
  if (!verified) {
    return (
      <main className={styles.gallery}>
        <div className={styles.verifyCard}>
          <h1 className={styles.verifyTitle}>Event Gallery</h1>

          {step === "email" ? (
            <>
              <p className={styles.verifySubtitle}>
                Enter your RSVP email to receive a verification code
              </p>
              <form onSubmit={handleSendCode} className={styles.verifyForm}>
                <input
                  type="email"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
                {error && <p className={styles.error}>{error}</p>}
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={submitting}
                >
                  {submitting ? "Sending code..." : "Send Verification Code"}
                </button>
              </form>
            </>
          ) : (
            <>
              <p className={styles.verifySubtitle}>
                We sent a 6-digit code to <strong>{email}</strong>
              </p>
              <form onSubmit={handleVerifyCode} className={styles.verifyForm}>
                <input
                  type="text"
                  className={`${styles.input} ${styles.codeInput}`}
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCode(val);
                  }}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  required
                />
                {error && <p className={styles.error}>{error}</p>}
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={submitting || code.length < 6}
                >
                  {submitting ? "Verifying..." : "Verify & View Photos"}
                </button>
                <div className={styles.resendRow}>
                  <button
                    type="button"
                    className={styles.resendBtn}
                    onClick={handleResend}
                    disabled={submitting}
                  >
                    Resend code
                  </button>
                  <button
                    type="button"
                    className={styles.resendBtn}
                    onClick={() => {
                      setStep("email");
                      setCode("");
                      setError("");
                    }}
                  >
                    Change email
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    );
  }

  // Photos within an album
  if (view === "photos" && selectedAlbum) {
    return (
      <main className={styles.gallery}>
        <div className={styles.header}>
          <div className={styles.albumBreadcrumb}>
            <button className={styles.albumBackBtn} onClick={goBackToAlbums}>
              Albums
            </button>
            <span className={styles.breadcrumbSep}>/</span>
            <h1 className={styles.title}>{selectedAlbum.name}</h1>
          </div>
          <a href="/" className={styles.backLink}>
            Back to Invite
          </a>
        </div>

        {loadingPhotos ? (
          <p className={styles.loading}>Loading photos...</p>
        ) : photos.length === 0 ? (
          <p className={styles.empty}>No photos in this album yet.</p>
        ) : (
          <div className={styles.photoGrid}>
            {photos.map((photo, i) => (
              <div
                key={photo.path}
                className={styles.photoItem}
                onClick={() => setLightboxIndex(i)}
              >
                <img src={photo.url} alt={photo.name} loading="lazy" />
              </div>
            ))}
          </div>
        )}

        {lightboxIndex !== null && photos[lightboxIndex] && (
          <div
            className={styles.lightbox}
            onClick={() => setLightboxIndex(null)}
          >
            <button
              className={styles.lightboxClose}
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(null);
              }}
            >
              x
            </button>
            {lightboxIndex > 0 && (
              <button
                className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(lightboxIndex - 1);
                }}
              >
                &#8249;
              </button>
            )}
            <img
              src={photos[lightboxIndex].url}
              alt="Full size"
              onClick={(e) => e.stopPropagation()}
            />
            {lightboxIndex < photos.length - 1 && (
              <button
                className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(lightboxIndex + 1);
                }}
              >
                &#8250;
              </button>
            )}
          </div>
        )}
      </main>
    );
  }

  // Albums view (default after verification)
  return (
    <main className={styles.gallery}>
      <div className={styles.header}>
        <h1 className={styles.title}>Event Gallery</h1>
        <a href="/" className={styles.backLink}>
          Back to Invite
        </a>
      </div>

      {loadingAlbums ? (
        <p className={styles.loading}>Loading albums...</p>
      ) : albums.length === 0 ? (
        <p className={styles.empty}>No albums have been shared with you yet.</p>
      ) : (
        <div className={styles.albumGrid}>
          {albums.map((album) => (
            <div
              key={album.id}
              className={styles.albumCard}
              onClick={() => openAlbum(album)}
            >
              <h3 className={styles.albumName}>{album.name}</h3>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
