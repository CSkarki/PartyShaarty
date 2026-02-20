"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [configMissing, setConfigMissing] = useState(false);

  const opts = { credentials: "include" };

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) { setConfigMissing(true); setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      // Load host profile for invite link
      const { data: hp } = await supabase
        .from("host_profiles")
        .select("slug, display_name")
        .eq("user_id", user.id)
        .single();
      setProfile(hp);

      // Load RSVPs
      const res = await fetch("/api/rsvp/list", opts);
      if (res.ok) {
        const data = await res.json();
        setRsvps(Array.isArray(data) ? data : []);
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

  if (loading) {
    return <main className={styles.host}><p className={styles.loading}>Loading…</p></main>;
  }
  if (configMissing) {
    return (
      <main className={styles.host}>
        <p className={styles.loading}>
          Supabase is not configured. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env.local</code>.
        </p>
      </main>
    );
  }

  const inviteUrl = profile ? `${window.location.origin}/${profile.slug}/invite` : "";

  return (
    <main className={styles.host}>
      <div className={styles.header}>
        <h1 className={styles.title}>RSVPs</h1>
        <div className={styles.actions}>
          <a href="/dashboard/event" className={styles.download}>Event Settings</a>
          <a href="/dashboard/reminders" className={styles.download}>Send Reminders</a>
          <a href="/dashboard/thankyou" className={styles.download}>Send Thank You</a>
          <a href="/dashboard/gallery" className={styles.download}>Manage Gallery</a>
          <a href="/api/export" download="rsvps.xlsx" className={styles.download}>Download Excel</a>
          <a href="/api/export/json" download="rsvps.json" className={styles.download}>Download JSON</a>
          {profile && (
            <a href={`/${profile.slug}/invite`} target="_blank" rel="noreferrer" className={styles.download}>
              Guest Invite ↗
            </a>
          )}
          <button type="button" onClick={handleLogout} className={styles.logout}>
            Log out
          </button>
        </div>
      </div>

      {profile?.slug && (
        <div style={{ marginBottom: "1.5rem", padding: "0.75rem 1rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "0.875rem", color: "var(--text-muted)" }}>
          Share your invite link:{" "}
          <a href={`/${profile.slug}/invite`} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
            {inviteUrl}
          </a>
        </div>
      )}

      <div className={styles.tableWrap}>
        {rsvps.length === 0 ? (
          <p className={styles.empty}>No RSVPs yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Name</th>
                <th>Email</th>
                <th>Attending</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {rsvps.map((r, i) => (
                <tr key={i}>
                  <td>{r.timestamp}</td>
                  <td>{r.name}</td>
                  <td>{r.email}</td>
                  <td>{r.attending}</td>
                  <td>{r.message || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
