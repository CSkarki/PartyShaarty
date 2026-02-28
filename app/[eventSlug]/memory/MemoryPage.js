"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./memory.module.css";

export default function MemoryPage({ event, coverUrl, eventSlug, initialPhotos }) {
  const [photos] = useState(initialPhotos || []);
  const [activeAlbum, setActiveAlbum] = useState("all");
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [coverImgError, setCoverImgError] = useState(false);

  // Unique albums (name + id) from photos
  const albumMap = photos.reduce((acc, p) => {
    if (p.albumName && p.albumId && !acc[p.albumName]) acc[p.albumName] = p.albumId;
    return acc;
  }, {});
  const albums = Object.keys(albumMap);

  // Filtered photos based on selected album chip
  const filtered =
    activeAlbum === "all"
      ? photos
      : photos.filter((p) => p.albumName === activeAlbum);

  // Reset lightbox if it becomes out-of-range after filter change
  useEffect(() => {
    if (lightboxIdx !== null && lightboxIdx >= filtered.length) {
      setLightboxIdx(filtered.length > 0 ? filtered.length - 1 : null);
    }
  }, [filtered.length, lightboxIdx]);

  // Keyboard navigation for lightbox
  const handleKeyDown = useCallback(
    (e) => {
      if (lightboxIdx === null) return;
      if (e.key === "ArrowLeft")
        setLightboxIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight")
        setLightboxIdx((i) => Math.min(filtered.length - 1, i + 1));
      if (e.key === "Escape") setLightboxIdx(null);
    },
    [lightboxIdx, filtered.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = lightboxIdx !== null ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxIdx]);

  const hasCover = coverUrl && !coverImgError;

  return (
    <div className={styles.page}>
      {/* ── Nav ─────────────────────────────────────── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <a href="/" className={styles.navBrand}>
            Utsavé
          </a>
          {event.event_name && (
            <span className={styles.navEventName}>{event.event_name}</span>
          )}
        </div>
      </nav>

      {/* ── Hero Banner ──────────────────────────────── */}
      <div className={styles.hero}>
        <div className={styles.heroOrnament}>✦ ❁ ✦</div>
        <div className={styles.heroLabel}>Cherishing the Memories</div>
        <h1 className={styles.heroTitle}>
          {event.event_name || "A Beautiful Celebration"}
        </h1>
        {event.event_date && (
          <p className={styles.heroDate}>{event.event_date}</p>
        )}
        <div className={styles.heroBorderBottom} />
      </div>

      {/* ── Main Content ─────────────────────────────── */}
      <main className={styles.main}>
        {/* ── Keepsake Invite Card ────────────────── */}
        <p className={styles.keepsakeLabel}>✦ &nbsp; A keepsake of your invite &nbsp; ✦</p>
        <div className={styles.inviteCard}>
          {/* Left: image */}
          <div className={styles.inviteCardImageWrap}>
            {hasCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt="Event cover"
                className={styles.inviteCardImage}
                onError={() => setCoverImgError(true)}
              />
            ) : (
              <div className={styles.inviteCardImagePlaceholder}>
                <span>✦</span>
                {event.display_name
                  ? `${event.display_name}'s Celebration`
                  : "A Beautiful Celebration"}
              </div>
            )}
          </div>

          {/* Right: event details */}
          <div className={styles.inviteCardContent}>
            <h2 className={styles.inviteCardTitle}>
              {event.event_name || "You're Invited"}
            </h2>
            <p className={styles.inviteCardSubtitle}>We celebrated with you</p>

            <div className={styles.inviteCardDetails}>
              {event.event_message && (
                <p className={styles.inviteCardMessage}>
                  &ldquo;{event.event_message}&rdquo;
                </p>
              )}

              <div className={styles.inviteCardMeta}>
                {event.event_date && (
                  <div className={styles.inviteCardMetaItem}>
                    <span className={styles.inviteCardMetaLabel}>Date</span>
                    <span>{event.event_date}</span>
                  </div>
                )}
                {event.event_location && (
                  <div className={styles.inviteCardMetaItem}>
                    <span className={styles.inviteCardMetaLabel}>Venue</span>
                    <span>{event.event_location}</span>
                  </div>
                )}
              </div>

              {event.display_name && (
                <p className={styles.inviteCardHost}>
                  Hosted by {event.display_name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Photo Memories ───────────────────────── */}
        <h2 className={styles.sectionHeading}>📸 Moments We&apos;ll Treasure</h2>

        {photos.length === 0 ? (
          /* ── Empty state ── */
          <>
            <p className={styles.sectionSubtitle}>
              The memories are being curated…
            </p>
            <div className={styles.placeholderGrid}>
              <div className={styles.placeholderCard}>
                <span className={styles.placeholderCardIcon}>📷</span>
              </div>
              <div className={styles.placeholderCard}>
                <span className={styles.placeholderCardIcon}>🌸</span>
              </div>
              <div className={styles.placeholderCard}>
                <span className={styles.placeholderCardIcon}>✨</span>
              </div>
            </div>
            <p className={styles.placeholderMessage}>
              Your host is still curating the memories.
              <br />
              Come back soon to relive every beautiful moment. 📷
            </p>
          </>
        ) : (
          /* ── Photo grid ── */
          <>
            <p className={styles.sectionSubtitle}>
              {photos.length} {photos.length === 1 ? "memory" : "memories"}
              {albums.length > 1 ? ` across ${albums.length} albums` : ""}
            </p>

            {albums.length > 1 && (
              <div className={styles.filterChips}>
                <button
                  className={`${styles.filterChip} ${
                    activeAlbum === "all" ? styles.filterChipActive : ""
                  }`}
                  onClick={() => setActiveAlbum("all")}
                >
                  All
                </button>
                {albums.map((album) => (
                  <a
                    key={album}
                    href={`/${eventSlug}/gallery?album=${albumMap[album]}`}
                    className={`${styles.filterChip} ${
                      activeAlbum === album ? styles.filterChipActive : ""
                    }`}
                  >
                    {album}
                  </a>
                ))}
              </div>
            )}

            <div className={styles.masonryGrid}>
              {filtered.map((photo, idx) => (
                <div
                  key={`${photo.url}-${idx}`}
                  className={styles.masonryItem}
                  onClick={() => setLightboxIdx(idx)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.albumName} />
                  <div className={styles.masonryOverlay}>{photo.albumName}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className={styles.footer}>
        <div>Created with ✦ Utsavé</div>
        <div className={styles.footerLinks}>
          <a href="/">Back to Utsavé</a>
          <a href={`/${eventSlug}/invite`}>View Original Invite</a>
        </div>
      </footer>

      {/* ── Lightbox ─────────────────────────────────── */}
      {lightboxIdx !== null && filtered[lightboxIdx] && (
        <div
          className={styles.lightbox}
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxIdx(null);
          }}
        >
          <button
            className={styles.lightboxClose}
            onClick={() => setLightboxIdx(null)}
            aria-label="Close"
          >
            ✕
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={filtered[lightboxIdx].url}
            alt={filtered[lightboxIdx].albumName}
            className={styles.lightboxImg}
          />

          {filtered.length > 1 && (
            <>
              <button
                className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                onClick={() => setLightboxIdx((i) => Math.max(0, i - 1))}
                disabled={lightboxIdx === 0}
                aria-label="Previous photo"
              >
                ‹
              </button>
              <button
                className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                onClick={() =>
                  setLightboxIdx((i) => Math.min(filtered.length - 1, i + 1))
                }
                disabled={lightboxIdx === filtered.length - 1}
                aria-label="Next photo"
              >
                ›
              </button>
            </>
          )}

          <div className={styles.lightboxInfo}>
            {filtered[lightboxIdx].albumName}&nbsp; · &nbsp;
            {lightboxIdx + 1} / {filtered.length}
          </div>
        </div>
      )}
    </div>
  );
}
