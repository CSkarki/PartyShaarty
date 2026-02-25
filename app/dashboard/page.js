"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configMissing, setConfigMissing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newLocation, setNewLocation] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) { setConfigMissing(true); setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: hp } = await supabase
        .from("host_profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();
      setProfile(hp);

      const res = await fetch("/api/host/events", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/auth/login");
    router.refresh();
  }

  async function handleCreateEvent(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/host/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          event_name: newName.trim(),
          event_date: newDate.trim() || null,
          event_location: newLocation.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error || "Failed to create event"); return; }
      router.push(`/dashboard/events/${data.id}`);
    } catch {
      setCreateError("Network error. Try again.");
    } finally {
      setCreating(false);
    }
  }

  function getDaysUntil(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
  }

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p>Loading your dashboard…</p>
      </div>
    );
  }

  if (configMissing) {
    return (
      <main className={styles.page}>
        <p style={{ padding: "2rem", color: "var(--text-muted)" }}>
          Supabase is not configured. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env.local</code>.
        </p>
      </main>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <div className={styles.navBrand}>
          <span className={styles.navLogo}>✦</span>
          <span className={styles.navName}>PartyShaarty</span>
        </div>
        <div className={styles.navRight}>
          <button type="button" onClick={handleLogout} className={styles.navLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.welcomeBanner}>
          <div className={styles.welcomeText}>
            <h1 className={styles.welcomeTitle}>
              Welcome back, {profile?.display_name?.split(" ")[0] || "there"}
            </h1>
            <p className={styles.welcomeSub}>Manage your events and guest lists</p>
          </div>
          <button type="button" className={styles.btnPrimary} onClick={() => setShowCreate(true)}>
            + Create Event
          </button>
        </div>

        {showCreate && (
          <section className={styles.importPanel}>
            <div className={styles.importHeader}>
              <h3 className={styles.importTitle}>New Event</h3>
              <button
                type="button"
                onClick={() => { setShowCreate(false); setCreateError(""); setNewName(""); setNewDate(""); setNewLocation(""); }}
                className={styles.importClose}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className={styles.createForm}>
              <input
                type="text"
                placeholder="Event name *"
                className={styles.createInput}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                maxLength={100}
                autoFocus
              />
              <input
                type="text"
                placeholder="Date & time (optional, e.g. Feb 21, 2026, 5:30 PM)"
                className={styles.createInput}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                maxLength={100}
              />
              <input
                type="text"
                placeholder="Location (optional)"
                className={styles.createInput}
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                maxLength={200}
              />
              {createError && <p className={styles.resultError}>{createError}</p>}
              <div className={styles.createFormActions}>
                <button
                  type="button"
                  className={styles.btnOutline}
                  onClick={() => { setShowCreate(false); setCreateError(""); setNewName(""); setNewDate(""); setNewLocation(""); }}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={creating}>
                  {creating ? "Creating…" : "Create Event"}
                </button>
              </div>
            </form>
          </section>
        )}

        {events.length === 0 && !showCreate ? (
          <div className={styles.rsvpSection}>
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No events yet</p>
              <p className={styles.emptyText}>Create your first event to get started.</p>
              <button
                type="button"
                className={styles.btnPrimary}
                style={{ marginTop: "1.25rem" }}
                onClick={() => setShowCreate(true)}
              >
                + Create Event
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.eventsGrid}>
            {events.map((event) => {
              const daysUntil = getDaysUntil(event.event_date);
              const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${event.slug}/invite`;
              return (
                <div key={event.id} className={styles.eventCard}>
                  <div className={styles.eventCardTop}>
                    <h2 className={styles.eventCardName}>{event.event_name || "Untitled Event"}</h2>
                    {event.event_date && (
                      <span className={styles.eventCardDate}>{event.event_date}</span>
                    )}
                    {daysUntil !== null && (
                      <span className={
                        daysUntil > 0 ? styles.countdown :
                        daysUntil === 0 ? styles.countdownToday :
                        styles.countdownPast
                      }>
                        {daysUntil > 0 ? `${daysUntil} days to go` :
                         daysUntil === 0 ? "Today!" : "Completed"}
                      </span>
                    )}
                    {event.event_location && (
                      <span className={styles.eventCardMeta}>{event.event_location}</span>
                    )}
                  </div>
                  <div className={styles.eventCardLink}>
                    <a href={inviteUrl} target="_blank" rel="noreferrer" className={styles.inviteShareLink}>
                      {inviteUrl.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                  <div className={styles.eventCardActions}>
                    <a href={`/dashboard/events/${event.id}`} className={styles.btnPrimary}>
                      Manage →
                    </a>
                    <a href={`/${event.slug}/invite`} target="_blank" rel="noreferrer" className={styles.btnOutlineSmall}>
                      View Invite ↗
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
