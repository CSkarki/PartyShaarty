"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./memory.module.css";

export default function MemoryPage({ event, coverUrl, eventSlug, initialPhotos }) {
  const [photos] = useState(initialPhotos || []);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [coverImgError, setCoverImgError] = useState(false);

  // Derive album details from photos
  const albumMap = photos.reduce((acc, p) => {
    if (p.albumName && p.albumId && !acc[p.albumName]) acc[p.albumName] = p.albumId;
    return acc;
  }, {});

  const albumDetails = Object.entries(albumMap).map(([name, id]) => ({
    name,
    id,
    thumbnail: photos.find((p) => p.albumId === id)?.url,
    count: photos.filter((p) => p.albumId === id).length,
  }));

  // First 6 photos for the polaroid strip
  const stripPhotos = photos.slice(0, 6);

  // Keyboard navigation for lightbox
  const handleKeyDown = useCallback(
    (e) => {
      if (lightboxIdx === null) return;
      if (e.key === "ArrowLeft") setLightboxIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setLightboxIdx((i) => Math.min(photos.length - 1, i + 1));
      if (e.key === "Escape") setLightboxIdx(null);
    },
    [lightboxIdx, photos.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    document.body.style.overflow = lightboxIdx !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxIdx]);

  const hasCover = coverUrl && !coverImgError;

  return (
    <div className={styles.page}>

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <a href="/" className={styles.navBrand}>Utsavé</a>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <div className={styles.hero}>
        <div className={styles.heroOrnament}>✦ ❁ ✦</div>
        <p className={styles.heroLabel}>With Grateful Hearts</p>
        <h1 className={styles.heroTitle}>Thank You</h1>
        {event.event_name && (
          <p className={styles.heroEventName}>{event.event_name}</p>
        )}
        {event.event_date && (
          <p className={styles.heroDate}>{event.event_date}</p>
        )}
        <div className={styles.heroBorderBottom} />
      </div>

      {/* ── Main ────────────────────────────────────────── */}
      <main className={styles.main}>

        {/* ── 1. THANK YOU LETTER ─────────────────────── */}
        <section className={styles.letterSection}>
          <span className={styles.letterOpenQuote}>&ldquo;</span>
          <p className={styles.letterText}>
            {event.event_message ||
              "Every laugh shared, every blessing given, every warm presence you brought — we carry it all in our hearts. Thank you for making this day so beautifully unforgettable."}
          </p>
          {event.display_name && (
            <p className={styles.letterSig}>
              With love &amp; gratitude,
              <strong>{event.display_name}</strong>
            </p>
          )}
        </section>

        {/* ── 2. PHOTO POLAROID STRIP ─────────────────── */}
        {photos.length > 0 && (
          <section className={styles.stripSection}>
            <h2 className={styles.sectionHeading}>Glimpses of Joy</h2>
            <p className={styles.sectionSubtitle}>A few frames from that beautiful day</p>

            <div className={styles.stripScroll}>
              {stripPhotos.map((photo, idx) => (
                <div
                  key={`${photo.url}-${idx}`}
                  className={styles.polaroid}
                  onClick={() => setLightboxIdx(idx)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.albumName} />
                  <p className={styles.polaroidCaption}>{photo.albumName}</p>
                </div>
              ))}
            </div>

            <div className={styles.stripCta}>
              <a href={`/${eventSlug}/gallery`} className={styles.stripLink}>
                View all {photos.length} memories &rarr;
              </a>
            </div>
          </section>
        )}

        {/* ── 3. ALBUM CARDS ──────────────────────────── */}
        {albumDetails.length > 0 && (
          <section className={styles.albumSection}>
            <h2 className={styles.sectionHeading}>Browse the Albums</h2>
            <p className={styles.sectionSubtitle}>Curated collections from the celebration</p>

            <div className={styles.albumGrid}>
              {albumDetails.map((album) => (
                <a
                  key={album.id}
                  href={`/${eventSlug}/gallery?album=${album.id}`}
                  className={styles.albumCard}
                >
                  {album.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={album.thumbnail}
                      alt={album.name}
                      className={styles.albumThumb}
                    />
                  ) : (
                    <div className={styles.albumThumbEmpty}>📷</div>
                  )}
                  <div className={styles.albumInfo}>
                    <div className={styles.albumName}>
                      {album.name}
                      <span className={styles.albumArrow}>&rarr;</span>
                    </div>
                    <div className={styles.albumCount}>
                      {album.count} {album.count === 1 ? "photo" : "photos"}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── Empty state ─────────────────────────────── */}
        {photos.length === 0 && (
          <section className={styles.emptySection}>
            <h2 className={styles.sectionHeading}>Memories Coming Soon</h2>
            <div className={styles.placeholderGrid}>
              <div className={styles.placeholderCard}><span>📷</span></div>
              <div className={styles.placeholderCard}><span>🌸</span></div>
              <div className={styles.placeholderCard}><span>✨</span></div>
            </div>
            <p className={styles.placeholderMessage}>
              Every beautiful moment captured that day will be shared here.
              <br />Come back soon to relive the memories together.
            </p>
          </section>
        )}

        {/* ── 4. INVITE SNAPSHOT ──────────────────────── */}
        <section className={styles.snapSection}>
          <p className={styles.snapLabel}>✦ &nbsp; You Were There &nbsp; ✦</p>

          <div className={styles.snapCard}>
            {hasCover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt={event.event_name || "Event"}
                className={styles.snapCover}
                onError={() => setCoverImgError(true)}
              />
            )}
            <div className={styles.snapDetails}>
              {event.event_name && (
                <h3 className={styles.snapEventName}>{event.event_name}</h3>
              )}
              <div className={styles.snapMeta}>
                {event.event_date && (
                  <div>
                    <span className={styles.snapMetaIcon}>📅</span>
                    {event.event_date}
                  </div>
                )}
                {event.event_location && (
                  <div>
                    <span className={styles.snapMetaIcon}>📍</span>
                    {event.event_location}
                  </div>
                )}
              </div>
              {event.display_name && (
                <p className={styles.snapHost}>Hosted by {event.display_name}</p>
              )}
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerHeart}>♥</div>
        <p className={styles.footerText}>A memory preserved with love, on Utsavé</p>
        <div className={styles.footerLinks}>
          <a href="/">Back to Utsavé</a>
        </div>
      </footer>

      {/* ── Lightbox ────────────────────────────────────── */}
      {lightboxIdx !== null && photos[lightboxIdx] && (
        <div
          className={styles.lightbox}
          onClick={(e) => { if (e.target === e.currentTarget) setLightboxIdx(null); }}
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
            src={photos[lightboxIdx].url}
            alt={photos[lightboxIdx].albumName}
            className={styles.lightboxImg}
          />

          {photos.length > 1 && (
            <>
              <button
                className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                onClick={() => setLightboxIdx((i) => Math.max(0, i - 1))}
                disabled={lightboxIdx === 0}
                aria-label="Previous"
              >‹</button>
              <button
                className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                onClick={() => setLightboxIdx((i) => Math.min(photos.length - 1, i + 1))}
                disabled={lightboxIdx === photos.length - 1}
                aria-label="Next"
              >›</button>
            </>
          )}

          <div className={styles.lightboxInfo}>
            {photos[lightboxIdx].albumName}&nbsp;·&nbsp;
            {lightboxIdx + 1} / {photos.length}
          </div>
        </div>
      )}

    </div>
  );
}
