"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import styles from "./slideshow.module.css";

export default function SlideshowPage() {
  const { eventSlug } = useParams();
  const [photos, setPhotos] = useState([]);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [current, setCurrent] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const intervalRef = useRef(null);
  const pollRef = useRef(null);

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch(`/api/slideshow/${eventSlug}`);
      if (!res.ok) { setError("Event not found"); return; }
      const data = await res.json();
      setEventName(data.eventName || "");
      setEventDate(data.eventDate || "");
      setPhotos(data.photos || []);
      setLoading(false);
    } catch {
      setError("Failed to load photos");
      setLoading(false);
    }
  }, [eventSlug]);

  // Initial load
  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  // Poll for new photos every 30 seconds
  useEffect(() => {
    pollRef.current = setInterval(fetchPhotos, 30_000);
    return () => clearInterval(pollRef.current);
  }, [fetchPhotos]);

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (photos.length < 2) return;
    intervalRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % photos.length);
      setFadeKey((k) => k + 1);
    }, 6_000);
    return () => clearInterval(intervalRef.current);
  }, [photos.length]);

  const goTo = useCallback((idx) => {
    clearInterval(intervalRef.current);
    setCurrent(idx);
    setFadeKey((k) => k + 1);
    // restart auto-advance
    intervalRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % photos.length);
      setFadeKey((k) => k + 1);
    }, 6_000);
  }, [photos.length]);

  const prev = useCallback(() => goTo((current - 1 + photos.length) % photos.length), [current, goTo, photos.length]);
  const next = useCallback(() => goTo((current + 1) % photos.length), [current, goTo, photos.length]);

  // Keyboard nav
  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") prev();
      if (e.key === "f" || e.key === "F") {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  if (loading) {
    return (
      <div className={styles.screen}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.screen}>
        <p className={styles.errorText}>{error}</p>
      </div>
    );
  }

  if (!photos.length) {
    return (
      <div className={styles.screen}>
        <div className={styles.emptyWrap}>
          <span className={styles.emptyIcon}>📷</span>
          <p className={styles.emptyTitle}>{eventName}</p>
          <p className={styles.emptyText}>No photos yet — check back soon.</p>
        </div>
      </div>
    );
  }

  const photo = photos[current];

  return (
    <div className={styles.screen}>
      {/* Background blur layer */}
      <div
        key={`bg-${fadeKey}`}
        className={styles.bgBlur}
        style={{ backgroundImage: `url(${photo.url})` }}
      />

      {/* Main photo */}
      <img
        key={`img-${fadeKey}`}
        src={photo.url}
        alt=""
        className={styles.photo}
      />

      {/* Top overlay — event name */}
      <div className={styles.topOverlay}>
        <span className={styles.brandMark}>✦</span>
        <span className={styles.eventTitle}>{eventName}</span>
        {eventDate && <span className={styles.eventDate}>{eventDate}</span>}
      </div>

      {/* Bottom overlay — counter + album name + keyboard hint */}
      <div className={styles.bottomOverlay}>
        <span className={styles.albumTag}>{photo.albumName}</span>
        <span className={styles.counter}>{current + 1} / {photos.length}</span>
      </div>

      {/* Nav arrows */}
      {photos.length > 1 && (
        <>
          <button type="button" className={`${styles.navBtn} ${styles.navPrev}`} onClick={prev} aria-label="Previous">‹</button>
          <button type="button" className={`${styles.navBtn} ${styles.navNext}`} onClick={next} aria-label="Next">›</button>
        </>
      )}

      {/* Fullscreen hint */}
      <button
        type="button"
        className={styles.fullscreenBtn}
        onClick={() => {
          if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
          else document.exitFullscreen?.();
        }}
        aria-label="Toggle fullscreen"
        title="Press F for fullscreen"
      >
        ⛶
      </button>
    </div>
  );
}
